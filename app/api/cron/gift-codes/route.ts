import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { fetchAvailableCodes, fetchCaptcha, redeemGiftCode } from "@/app/lib/wos-api";
import { solveCaptcha } from "@/app/lib/captcha-solver";
import { wosApiLimiter } from "@/app/lib/rate-limiter";

const CRON_SECRET = process.env.CRON_SECRET || "wos-auto-redeem-2026";

interface RedemptionLog {
  fid: string;
  nickname: string | null;
  code: string;
  status: string;
  message: string;
}

/**
 * Auto-sync gift codes from community API and redeem for ALL linked alliance members.
 *
 * Call via: GET /api/cron/gift-codes?secret=CRON_SECRET
 * Or set up a cron job / Fly.io scheduled machine to hit this endpoint.
 */
export async function GET(request: Request) {
  // Verify secret to prevent unauthorized access
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs: RedemptionLog[] = [];
  let newCodesFound = 0;
  let totalRedemptions = 0;
  let successfulRedemptions = 0;

  try {
    // ──── STEP 1: Sync codes from community API ────
    const codes = await fetchAvailableCodes();
    for (const code of codes) {
      const existing = await prisma.giftCode.findUnique({ where: { code } });
      if (!existing) {
        await prisma.giftCode.create({
          data: { code, source: "api", status: "ACTIVE" },
        });
        newCodesFound++;
      }
    }

    // ──── STEP 2: Get all active codes ────
    const activeCodes = await prisma.giftCode.findMany({
      where: { status: "ACTIVE" },
    });

    if (activeCodes.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active codes to redeem",
        newCodesFound,
        totalRedemptions: 0,
        successfulRedemptions: 0,
      });
    }

    // ──── STEP 3: Get ALL linked player FIDs ────
    const allPlayerFids = await prisma.playerFID.findMany({
      select: { id: true, fid: true, nickname: true },
    });

    if (allPlayerFids.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No linked FIDs to redeem for",
        newCodesFound,
        totalRedemptions: 0,
        successfulRedemptions: 0,
      });
    }

    // ──── STEP 4: Auto-redeem each active code for each player ────
    for (const giftCode of activeCodes) {
      for (const playerFid of allPlayerFids) {
        // Skip if already redeemed
        const existing = await prisma.giftCodeRedemption.findUnique({
          where: {
            giftCodeId_playerFidId: {
              giftCodeId: giftCode.id,
              playerFidId: playerFid.id,
            },
          },
        });
        if (existing) continue;

        totalRedemptions++;

        // Try up to 3 captcha attempts
        let redeemed = false;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            await wosApiLimiter.acquire();

            const captchaData = await fetchCaptcha(playerFid.fid);
            if (!captchaData) continue;

            const solution = await solveCaptcha(captchaData.img);
            if (!solution) continue;

            await wosApiLimiter.acquire();

            const result = await redeemGiftCode(playerFid.fid, giftCode.code, solution.text);

            if (result.status === "CAPTCHA_WRONG" && attempt < 2) continue;

            const finalStatus = result.success ? "SUCCESS" : result.status;

            await prisma.giftCodeRedemption.create({
              data: {
                giftCodeId: giftCode.id,
                playerFidId: playerFid.id,
                status: finalStatus,
                message: result.message,
              },
            });

            if (result.success) successfulRedemptions++;

            // Mark code as expired/invalid globally
            if (result.status === "EXPIRED") {
              await prisma.giftCode.update({ where: { id: giftCode.id }, data: { status: "EXPIRED" } });
            } else if (result.status === "INVALID") {
              await prisma.giftCode.update({ where: { id: giftCode.id }, data: { status: "INVALID" } });
            }

            logs.push({
              fid: playerFid.fid,
              nickname: playerFid.nickname,
              code: giftCode.code,
              status: finalStatus,
              message: result.message,
            });

            redeemed = true;
            break;
          } catch (error) {
            console.error(`Redeem error for FID ${playerFid.fid}, code ${giftCode.code}:`, error);
          }
        }

        if (!redeemed) {
          logs.push({
            fid: playerFid.fid,
            nickname: playerFid.nickname,
            code: giftCode.code,
            status: "FAILED",
            message: "Max retries exceeded",
          });
        }

        // Small delay between players to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // If code was marked expired/invalid, skip remaining players for this code
      const refreshed = await prisma.giftCode.findUnique({ where: { id: giftCode.id } });
      if (refreshed && refreshed.status !== "ACTIVE") continue;
    }

    // ──── STEP 5: Store notification log ────
    if (logs.length > 0) {
      // Store summary as a PlayerChangeLog entry for the notification feed
      const summary = `Auto-redeemed: ${successfulRedemptions}/${totalRedemptions} successful across ${allPlayerFids.length} members. ${newCodesFound} new codes synced.`;

      // Use first player FID as anchor for the log entry
      await prisma.playerChangeLog.create({
        data: {
          changeType: "GIFT_CODE_AUTO_REDEEM",
          oldValue: JSON.stringify({ newCodesFound, totalRedemptions }),
          newValue: JSON.stringify({ successfulRedemptions, logs: logs.slice(0, 50) }),
          playerFidId: allPlayerFids[0].id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      newCodesFound,
      totalRedemptions,
      successfulRedemptions,
      playerCount: allPlayerFids.length,
      activeCodesCount: activeCodes.length,
      logs,
    });
  } catch (error) {
    console.error("Cron gift code error:", error);
    return NextResponse.json(
      { error: "Internal error", details: String(error) },
      { status: 500 }
    );
  }
}
