"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

const EVENT_TYPES = [
  "FOUNDRY", "CANYON_CLASH", "CRAZY_JOE", "BEAR_TRAP",
  "FORTRESS", "CASTLE", "SVS", "FROSTFIRE", "MERCENARY", "OTHER",
];

export async function createAttendanceSession(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || user.role === "R1" || user.role === "R2")
    return { error: "R3+ required to create attendance sessions" };

  const eventName = formData.get("eventName") as string;
  const eventType = formData.get("eventType") as string;
  const legion = formData.get("legion") as string | null;

  if (!eventName || !eventType) return { error: "Missing required fields" };
  if (!EVENT_TYPES.includes(eventType)) return { error: "Invalid event type" };

  try {
    const created = await prisma.attendanceSession.create({
      data: {
        eventName,
        eventType,
        legion: legion || null,
        createdById: user.id,
      },
    });

    revalidatePath("/dashboard/tools/attendance");
    return { success: true, sessionId: created.id };
  } catch (error) {
    console.error("Create attendance session error:", error);
    return { error: "Failed to create session" };
  }
}

export async function recordAttendance(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || user.role === "R1" || user.role === "R2")
    return { error: "R3+ required to record attendance" };

  const sessionId = formData.get("sessionId") as string;
  const playerFidId = formData.get("playerFidId") as string;
  const pointsStr = formData.get("points") as string;
  const note = formData.get("note") as string;

  if (!sessionId || !playerFidId || !pointsStr) return { error: "Missing required fields" };

  // Parse points (support K/M suffix)
  let points = 0;
  const cleaned = pointsStr.trim().toUpperCase();
  if (cleaned.endsWith("M")) {
    points = Math.round(parseFloat(cleaned.slice(0, -1)) * 1000000);
  } else if (cleaned.endsWith("K")) {
    points = Math.round(parseFloat(cleaned.slice(0, -1)) * 1000);
  } else {
    points = parseInt(cleaned, 10);
  }
  if (isNaN(points)) return { error: "Invalid points value" };

  const attSession = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!attSession) return { error: "Session not found" };
  if (attSession.status !== "OPEN") return { error: "Session is closed" };

  try {
    await prisma.attendanceRecord.upsert({
      where: { sessionId_playerFidId: { sessionId, playerFidId } },
      create: { sessionId, playerFidId, points: BigInt(points), note: note || null },
      update: { points: BigInt(points), note: note || null },
    });

    revalidatePath(`/dashboard/tools/attendance/${sessionId}`);
    revalidatePath("/dashboard/tools/attendance");
    return { success: true };
  } catch (error) {
    console.error("Record attendance error:", error);
    return { error: "Failed to record attendance" };
  }
}

export async function closeAttendanceSession(sessionId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return { error: "User not found" };

  const attSession = await prisma.attendanceSession.findUnique({ where: { id: sessionId } });
  if (!attSession) return { error: "Session not found" };

  if (attSession.createdById !== user.id && user.role !== "R4" && user.role !== "R5")
    return { error: "Permission denied" };

  try {
    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    revalidatePath("/dashboard/tools/attendance");
    return { success: true };
  } catch (error) {
    console.error("Close session error:", error);
    return { error: "Failed to close session" };
  }
}

export async function getAttendanceSessions() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const sessions = await prisma.attendanceSession.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      createdBy: { select: { username: true } },
      _count: { select: { records: true } },
    },
  });

  return { success: true, sessions };
}

export async function getSessionReport(sessionId: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const attSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    include: {
      createdBy: { select: { username: true } },
      records: {
        include: {
          playerFid: { select: { nickname: true, fid: true, furnaceLv: true } },
        },
        orderBy: { points: "desc" },
      },
    },
  });

  if (!attSession) return { error: "Session not found" };
  return { success: true, session: attSession };
}
