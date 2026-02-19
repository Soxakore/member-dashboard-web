"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { fetchAvailableCodes, fetchCaptcha, redeemGiftCode } from "@/app/lib/wos-api";
import { solveCaptcha } from "@/app/lib/captcha-solver";
import { wosApiLimiter } from "@/app/lib/rate-limiter";
import { revalidatePath } from "next/cache";

export async function syncGiftCodes() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  try {
    const codes = await fetchAvailableCodes();
    let newCount = 0;

    for (const code of codes) {
      const existing = await prisma.giftCode.findUnique({ where: { code } });
      if (!existing) {
        await prisma.giftCode.create({
          data: { code, source: "api", status: "ACTIVE" },
        });
        newCount++;
      }
    }

    revalidatePath("/dashboard/tools/gift-codes");
    return { success: true, total: codes.length, newCodes: newCount };
  } catch (error) {
    console.error("Sync gift codes error:", error);
    return { error: "Failed to sync gift codes" };
  }
}

export async function getGiftCodes() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { loginId: session.user.email },
    include: { playerFids: true },
  });
  if (!user) return { error: "User not found" };

  const codes = await prisma.giftCode.findMany({
    orderBy: { discoveredAt: "desc" },
    include: {
      redemptions: {
        where: {
          playerFidId: { in: user.playerFids.map((f) => f.id) },
        },
      },
    },
  });

  return { success: true, codes, userFids: user.playerFids };
}

export async function addManualCode(code: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || (user.role !== "R4" && user.role !== "R5"))
    return { error: "Insufficient permissions (R4/R5 required)" };

  if (!code || code.trim().length < 3) return { error: "Invalid gift code" };

  const existing = await prisma.giftCode.findUnique({ where: { code: code.trim() } });
  if (existing) return { error: "This code already exists" };

  try {
    await prisma.giftCode.create({
      data: { code: code.trim(), source: "manual", status: "ACTIVE" },
    });
    revalidatePath("/dashboard/tools/gift-codes");
    return { success: true };
  } catch (error) {
    console.error("Add manual code error:", error);
    return { error: "Failed to add gift code" };
  }
}

export async function redeemCodeForPlayer(codeId: string, playerFidId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };

  const playerFid = await prisma.playerFID.findUnique({ where: { id: playerFidId } });
  if (!playerFid || playerFid.userId !== user.id)
    return { error: "Invalid player FID" };

  const giftCode = await prisma.giftCode.findUnique({ where: { id: codeId } });
  if (!giftCode) return { error: "Gift code not found" };
  if (giftCode.status !== "ACTIVE") return { error: `Gift code is ${giftCode.status}` };

  // Check if already redeemed
  const existing = await prisma.giftCodeRedemption.findUnique({
    where: { giftCodeId_playerFidId: { giftCodeId: codeId, playerFidId } },
  });
  if (existing) return { error: `Already redeemed (${existing.status})` };

  // Attempt redemption with up to 3 captcha retries
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await wosApiLimiter.acquire();

    // Fetch captcha
    const captchaData = await fetchCaptcha(playerFid.fid);
    if (!captchaData) {
      if (attempt === MAX_RETRIES - 1) {
        return { error: "Failed to fetch captcha after retries" };
      }
      continue;
    }

    // Solve captcha
    const solution = await solveCaptcha(captchaData.img);
    if (!solution) {
      if (attempt === MAX_RETRIES - 1) {
        return { error: "Failed to solve captcha" };
      }
      continue;
    }

    await wosApiLimiter.acquire();

    // Redeem
    const result = await redeemGiftCode(playerFid.fid, giftCode.code, solution.text);

    if (result.status === "CAPTCHA_WRONG" && attempt < MAX_RETRIES - 1) {
      continue; // Retry with new captcha
    }

    // Store result
    const finalStatus = result.success ? "SUCCESS" : result.status;
    await prisma.giftCodeRedemption.create({
      data: {
        giftCodeId: codeId,
        playerFidId,
        status: finalStatus,
        message: result.message,
      },
    });

    // Update code status if expired or invalid
    if (result.status === "EXPIRED") {
      await prisma.giftCode.update({ where: { id: codeId }, data: { status: "EXPIRED" } });
    } else if (result.status === "INVALID") {
      await prisma.giftCode.update({ where: { id: codeId }, data: { status: "INVALID" } });
    }

    revalidatePath("/dashboard/tools/gift-codes");
    return {
      success: result.success,
      status: finalStatus,
      message: result.message,
    };
  }

  return { error: "Failed after max retries" };
}

export async function redeemAllForPlayer(playerFidId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };

  const playerFid = await prisma.playerFID.findUnique({ where: { id: playerFidId } });
  if (!playerFid || playerFid.userId !== user.id)
    return { error: "Invalid player FID" };

  // Get all active codes not yet redeemed for this FID
  const codes = await prisma.giftCode.findMany({
    where: {
      status: "ACTIVE",
      redemptions: { none: { playerFidId } },
    },
  });

  let redeemed = 0;
  let failed = 0;
  let skipped = 0;
  const results: Array<{ code: string; status: string; message: string }> = [];

  for (const code of codes) {
    const result = await redeemCodeForPlayer(code.id, playerFidId);
    if (result.success) {
      redeemed++;
      results.push({ code: code.code, status: "SUCCESS", message: "Redeemed" });
    } else if (result.error?.includes("Already redeemed")) {
      skipped++;
      results.push({ code: code.code, status: "SKIPPED", message: result.error || "" });
    } else {
      failed++;
      results.push({ code: code.code, status: "FAILED", message: result.error || result.message || "" });
    }
  }

  revalidatePath("/dashboard/tools/gift-codes");
  return { success: true, redeemed, failed, skipped, total: codes.length, results };
}
