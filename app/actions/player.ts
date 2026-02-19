"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { lookupPlayer } from "@/app/lib/wos-api";
import { wosApiLimiter } from "@/app/lib/rate-limiter";
import { revalidatePath } from "next/cache";

export async function lookupPlayerByFid(fid: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  if (!fid || fid.trim().length === 0) return { error: "Please enter a valid FID" };

  await wosApiLimiter.acquire();

  const player = await lookupPlayer(fid.trim());
  if (!player) return { error: "Player not found. Check the FID and try again." };

  return { success: true, player };
}

export async function linkPlayerFid(fid: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };

  // Check if already linked
  const existing = await prisma.playerFID.findUnique({ where: { fid } });
  if (existing) {
    if (existing.userId === user.id) return { error: "This FID is already linked to your account" };
    return { error: "This FID is already linked to another account" };
  }

  // Validate FID via API
  await wosApiLimiter.acquire();
  const player = await lookupPlayer(fid);
  if (!player) return { error: "Could not verify this FID. Check and try again." };

  try {
    await prisma.playerFID.create({
      data: {
        fid,
        nickname: player.nickname,
        furnaceLv: player.furnaceLv,
        kid: player.kid,
        avatarUrl: player.avatarUrl,
        lastChecked: new Date(),
        userId: user.id,
      },
    });

    revalidatePath("/dashboard/profile");
    revalidatePath("/dashboard/tools/player-lookup");
    return { success: true, player };
  } catch (error) {
    console.error("Link FID error:", error);
    return { error: "Failed to link FID" };
  }
}

export async function unlinkPlayerFid(fidId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };

  const fid = await prisma.playerFID.findUnique({ where: { id: fidId } });
  if (!fid) return { error: "FID not found" };
  if (fid.userId !== user.id) return { error: "You can only unlink your own FIDs" };

  try {
    await prisma.playerFID.delete({ where: { id: fidId } });
    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error) {
    console.error("Unlink FID error:", error);
    return { error: "Failed to unlink FID" };
  }
}

export async function getLinkedFids() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { loginId: session.user.email },
    include: { playerFids: true },
  });
  if (!user) return { error: "User not found" };

  return { success: true, fids: user.playerFids };
}
