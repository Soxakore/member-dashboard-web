import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { CalendarClock } from "lucide-react";
import {
  EVENT_CONFIG,
  calculateNextOccurrence,
  calculateNextOccurrenceWithTime,
  calculateCrazyJoeDates,
  calculateBearTrapNext,
} from "@/app/lib/event-schedule";
import { EventScheduleClient } from "./event-schedule-client";
import type { EventData } from "./event-schedule-client";

export default async function EventSchedulePage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { loginId: session.user.email },
  });
  if (!user) return null;

  const isAdmin = user.role === "R4" || user.role === "R5";

  // Fetch alliance event configs from DB
  const eventConfigs = await prisma.allianceEventConfig.findMany({
    include: { updatedBy: { select: { username: true } } },
  });
  const configMap = new Map(
    eventConfigs.map((c) => [c.eventName, c])
  );

  // Fetch alliance info
  const allFids = await prisma.playerFID.findMany({
    select: { kid: true },
  });

  let allianceInfo: { kingdom: string; memberCount: number } | null = null;
  if (allFids.length > 0) {
    const kidCounts: Record<string, number> = {};
    for (const f of allFids) {
      const kid = f.kid || "Unknown";
      kidCounts[kid] = (kidCounts[kid] || 0) + 1;
    }
    const topKingdom = Object.entries(kidCounts).sort((a, b) => b[1] - a[1])[0][0];
    allianceInfo = { kingdom: topKingdom, memberCount: allFids.length };
  }

  // Build events array with time-aware calculations
  const now = new Date();
  const events: EventData[] = [];

  for (const [key, config] of Object.entries(EVENT_CONFIG)) {
    const dbConfig = configMap.get(key);
    const isConfigured = !!dbConfig;
    let nextDate: Date | null = null;

    if (config.scheduleType === "custom") {
      // Bear Trap — use admin config if available
      if (dbConfig) {
        const customDays: string[] = dbConfig.customDays
          ? JSON.parse(dbConfig.customDays)
          : [];
        nextDate = calculateBearTrapNext(dbConfig.selectedTime, customDays, now);
      }
    } else if (config.name === "Crazy Joe") {
      // Crazy Joe has special Tuesday+Thursday logic
      const dates = calculateCrazyJoeDates(now);
      if (dates) {
        nextDate =
          dates.tuesday.getTime() > now.getTime() ? dates.tuesday : dates.thursday;
        if (nextDate.getTime() <= now.getTime()) nextDate = null;
      }
    } else if (dbConfig && config.availableTimes) {
      // Event with admin-configured time slot
      nextDate = calculateNextOccurrenceWithTime(key, dbConfig.selectedTime, now);
    } else if (config.fixedTime) {
      // Events with globally fixed times (Castle, SvS, Daily)
      nextDate = calculateNextOccurrenceWithTime(key, config.fixedTime, now);
    } else {
      // Fallback: midnight-based calculation
      nextDate = calculateNextOccurrence(key, now);
    }

    events.push({
      name: config.name,
      emoji: config.emoji,
      durationMinutes: config.durationMinutes,
      fixedDays: config.fixedDays,
      description: config.description,
      scheduleType: config.scheduleType,
      availableTimes: config.availableTimes,
      fixedTime: config.fixedTime,
      selectedTime: dbConfig?.selectedTime || null,
      customDays: dbConfig?.customDays ? JSON.parse(dbConfig.customDays) : null,
      nextDate: nextDate ? nextDate.toISOString() : null,
      configuredBy: dbConfig?.updatedBy?.username || null,
      isConfigured,
    });
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
            <CalendarClock className="h-5 w-5 text-teal-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">WOS Event Schedule</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Live countdown to all Whiteout Survival global events
          {isAdmin && " • Click events to configure alliance time slots"}
        </p>
      </header>

      <EventScheduleClient
        events={events}
        isAdmin={isAdmin}
        allianceInfo={allianceInfo}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
