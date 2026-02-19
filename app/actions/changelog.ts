"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { lookupPlayer } from "@/app/lib/wos-api";
import { wosApiLimiter } from "@/app/lib/rate-limiter";
import { revalidatePath } from "next/cache";

export async function getRecentChanges(limit: number = 50) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const changes = await prisma.playerChangeLog.findMany({
    take: limit,
    orderBy: { detectedAt: "desc" },
    include: {
      playerFid: { select: { nickname: true, fid: true, user: { select: { username: true } } } },
    },
  });

  return { success: true, changes };
}

export async function pollAllianceChanges() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || (user.role !== "R4" && user.role !== "R5"))
    return { error: "R4/R5 required to poll alliance changes" };

  const allFids = await prisma.playerFID.findMany({
    select: { id: true, fid: true, nickname: true, furnaceLv: true },
  });

  let checked = 0;
  let changesFound = 0;
  const changeSummary: Array<{ fid: string; type: string; old: string; new: string }> = [];

  for (const record of allFids) {
    await wosApiLimiter.acquire();

    const player = await lookupPlayer(record.fid);
    if (!player) continue;

    checked++;

    // Check for nickname change
    if (record.nickname && record.nickname !== player.nickname) {
      await prisma.playerChangeLog.create({
        data: {
          playerFidId: record.id,
          changeType: "NICKNAME",
          oldValue: record.nickname,
          newValue: player.nickname,
        },
      });
      changeSummary.push({
        fid: record.fid,
        type: "NICKNAME",
        old: record.nickname,
        new: player.nickname,
      });
      changesFound++;
    }

    // Check for furnace level change
    if (record.furnaceLv !== null && record.furnaceLv !== player.furnaceLv) {
      await prisma.playerChangeLog.create({
        data: {
          playerFidId: record.id,
          changeType: "FURNACE",
          oldValue: String(record.furnaceLv),
          newValue: String(player.furnaceLv),
        },
      });
      changeSummary.push({
        fid: record.fid,
        type: "FURNACE",
        old: String(record.furnaceLv),
        new: String(player.furnaceLv),
      });
      changesFound++;
    }

    // Update stored data
    await prisma.playerFID.update({
      where: { id: record.id },
      data: {
        nickname: player.nickname,
        furnaceLv: player.furnaceLv,
        kid: player.kid,
        avatarUrl: player.avatarUrl,
        lastChecked: new Date(),
      },
    });
  }

  revalidatePath("/dashboard/tools/activity-tracker");
  return {
    success: true,
    checked,
    changesFound,
    total: allFids.length,
    changes: changeSummary,
  };
}
