"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

function getWeekStart(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

const TIME_SLOTS = [
  "00:00-04:00",
  "04:00-08:00",
  "08:00-12:00",
  "12:00-16:00",
  "16:00-20:00",
  "20:00-00:00",
];

const POSITIONS = ["CONSTRUCTION", "RESEARCH", "TRAINING"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export async function getMinisterSchedule(weekOffset: number = 0) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const weekStart = getWeekStart();
  weekStart.setUTCDate(weekStart.getUTCDate() + weekOffset * 7);

  const slots = await prisma.ministerSlot.findMany({
    where: { weekStart },
    include: {
      playerFid: { select: { nickname: true, fid: true } },
      assignedBy: { select: { username: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
  });

  return {
    success: true,
    slots,
    weekStart: weekStart.toISOString(),
    timeSlots: TIME_SLOTS,
    positions: POSITIONS,
    dayNames: DAY_NAMES,
  };
}

export async function initializeWeekSlots(weekOffset: number = 0) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || (user.role !== "R4" && user.role !== "R5"))
    return { error: "Insufficient permissions" };

  const weekStart = getWeekStart();
  weekStart.setUTCDate(weekStart.getUTCDate() + weekOffset * 7);

  // Check if slots already exist
  const existing = await prisma.ministerSlot.count({ where: { weekStart } });
  if (existing > 0) return { error: "Slots already initialized for this week" };

  const data: Array<{
    position: string;
    dayOfWeek: number;
    timeSlot: string;
    weekStart: Date;
  }> = [];

  for (const position of POSITIONS) {
    for (let day = 0; day < 7; day++) {
      for (const slot of TIME_SLOTS) {
        data.push({ position, dayOfWeek: day, timeSlot: slot, weekStart });
      }
    }
  }

  await prisma.ministerSlot.createMany({ data });
  revalidatePath("/dashboard/tools/ministers");
  return { success: true, created: data.length };
}

export async function assignMinisterSlot(slotId: string, playerFidId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };
  if (user.role === "R1" || user.role === "R2")
    return { error: "R3+ required to assign minister slots" };

  const slot = await prisma.ministerSlot.findUnique({ where: { id: slotId } });
  if (!slot) return { error: "Slot not found" };
  if (slot.playerFidId) return { error: "Slot already taken" };

  const playerFid = await prisma.playerFID.findUnique({ where: { id: playerFidId } });
  if (!playerFid) return { error: "Player FID not found" };

  try {
    await prisma.ministerSlot.update({
      where: { id: slotId },
      data: { playerFidId, assignedById: user.id },
    });
    revalidatePath("/dashboard/tools/ministers");
    return { success: true };
  } catch (error) {
    console.error("Assign slot error:", error);
    return { error: "Failed to assign slot" };
  }
}

export async function clearMinisterSlot(slotId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };

  const slot = await prisma.ministerSlot.findUnique({ where: { id: slotId } });
  if (!slot) return { error: "Slot not found" };

  // Allow owner (assignedBy) or R4/R5 to clear
  if (slot.assignedById !== user.id && user.role !== "R4" && user.role !== "R5")
    return { error: "Permission denied" };

  try {
    await prisma.ministerSlot.update({
      where: { id: slotId },
      data: { playerFidId: null, assignedById: null },
    });
    revalidatePath("/dashboard/tools/ministers");
    return { success: true };
  } catch (error) {
    console.error("Clear slot error:", error);
    return { error: "Failed to clear slot" };
  }
}
