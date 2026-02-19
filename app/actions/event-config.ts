"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { EVENT_CONFIG } from "@/app/lib/event-schedule";
import { revalidatePath } from "next/cache";

export async function getEventConfigs() {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const configs = await prisma.allianceEventConfig.findMany({
    include: { updatedBy: { select: { username: true } } },
  });

  return {
    success: true,
    configs: configs.map((c) => ({
      id: c.id,
      eventName: c.eventName,
      selectedTime: c.selectedTime,
      customDays: c.customDays,
      updatedAt: c.updatedAt.toISOString(),
      updatedByName: c.updatedBy.username || "Unknown",
    })),
  };
}

export async function saveEventTimeConfig(eventName: string, selectedTime: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || (user.role !== "R4" && user.role !== "R5"))
    return { error: "Insufficient permissions (R4/R5 required)" };

  const config = EVENT_CONFIG[eventName];
  if (!config) return { error: "Unknown event type" };

  // Validate time is one of the available options
  if (config.availableTimes && !config.availableTimes.includes(selectedTime)) {
    return { error: `Invalid time. Must be one of: ${config.availableTimes.join(", ")}` };
  }

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(selectedTime)) {
    return { error: "Invalid time format. Use HH:MM" };
  }

  try {
    await prisma.allianceEventConfig.upsert({
      where: { eventName },
      create: { eventName, selectedTime, updatedById: user.id },
      update: { selectedTime, updatedById: user.id },
    });

    revalidatePath("/dashboard/tools/event-schedule");
    return { success: true };
  } catch (error) {
    console.error("Save event config error:", error);
    return { error: "Failed to save configuration" };
  }
}

export async function saveBearTrapConfig(selectedTime: string, customDays: string[]) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || (user.role !== "R4" && user.role !== "R5"))
    return { error: "Insufficient permissions (R4/R5 required)" };

  // Validate time format
  if (!/^\d{2}:\d{2}$/.test(selectedTime)) {
    return { error: "Invalid time format. Use HH:MM" };
  }
  const [h, m] = selectedTime.split(":").map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    return { error: "Invalid time values" };
  }

  // Validate days
  const validDays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (!customDays || customDays.length === 0) {
    return { error: "Select at least one day" };
  }
  for (const day of customDays) {
    if (!validDays.includes(day)) {
      return { error: `Invalid day: ${day}` };
    }
  }

  try {
    await prisma.allianceEventConfig.upsert({
      where: { eventName: "Bear Trap" },
      create: {
        eventName: "Bear Trap",
        selectedTime,
        customDays: JSON.stringify(customDays),
        updatedById: user.id,
      },
      update: {
        selectedTime,
        customDays: JSON.stringify(customDays),
        updatedById: user.id,
      },
    });

    revalidatePath("/dashboard/tools/event-schedule");
    return { success: true };
  } catch (error) {
    console.error("Save bear trap config error:", error);
    return { error: "Failed to save Bear Trap configuration" };
  }
}

export async function clearEventConfig(eventName: string) {
  const session = await auth();
  if (!session?.user?.email) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user || (user.role !== "R4" && user.role !== "R5"))
    return { error: "Insufficient permissions (R4/R5 required)" };

  if (!EVENT_CONFIG[eventName]) return { error: "Unknown event type" };

  try {
    await prisma.allianceEventConfig.deleteMany({ where: { eventName } });
    revalidatePath("/dashboard/tools/event-schedule");
    return { success: true };
  } catch (error) {
    console.error("Clear event config error:", error);
    return { error: "Failed to clear configuration" };
  }
}
