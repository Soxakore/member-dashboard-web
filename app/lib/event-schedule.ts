/**
 * WOS Event Schedule Calculator
 * Ported from whiteout-project/bot bear_event_types.py
 */

export interface EventConfig {
  name: string;
  emoji: string;
  durationMinutes: number;
  scheduleType: string;
  fixedDays: string;
  referenceDate?: string; // YYYY-MM-DD
  cycleWeeks?: number;
  availableTimes?: string[];
  fixedTime?: string;
  description: string;
  thumbnailUrl?: string;
}

export const EVENT_CONFIG: Record<string, EventConfig> = {
  "Bear Trap": {
    name: "Bear Trap",
    emoji: "🐻",
    durationMinutes: 30,
    scheduleType: "custom",
    fixedDays: "Alliance-defined schedule",
    description: "Get your buffs on and prepare your marches for the hunt!",
    thumbnailUrl: "https://i.imgur.com/tVExgj4.png",
  },
  "Crazy Joe": {
    name: "Crazy Joe",
    emoji: "🤪",
    durationMinutes: 30,
    scheduleType: "global_biweekly",
    fixedDays: "Tuesday & Thursday every 4 weeks",
    referenceDate: "2025-11-18",
    cycleWeeks: 4,
    description: "Crazy Joe is coming to town! Join the defense!",
    thumbnailUrl: "https://i.imgur.com/qwNM7Br.png",
  },
  "Foundry Battle": {
    name: "Foundry Battle",
    emoji: "🏭",
    durationMinutes: 60,
    scheduleType: "global_biweekly",
    fixedDays: "Every 2 weeks on Sunday",
    referenceDate: "2025-11-16",
    cycleWeeks: 2,
    availableTimes: ["02:00", "12:00", "14:00", "19:00"],
    description: "Buff up, heal up, recall marches and get ready to fight!",
    thumbnailUrl: "https://i.imgur.com/u3pmvW1.png",
  },
  "Canyon Clash": {
    name: "Canyon Clash",
    emoji: "⚔️",
    durationMinutes: 60,
    scheduleType: "global_monthly",
    fixedDays: "Monthly on Saturday (4-week cycle)",
    referenceDate: "2025-11-29",
    cycleWeeks: 4,
    availableTimes: ["02:00", "12:00", "14:00", "19:00", "21:00"],
    description: "Canyon Clash is starting! Buff up and get ready to fight!",
    thumbnailUrl: "https://i.imgur.com/eKiHavB.png",
  },
  "Fortress Battle": {
    name: "Fortress Battle",
    emoji: "🏰",
    durationMinutes: 120,
    scheduleType: "global_weekly",
    fixedDays: "Every Friday",
    availableTimes: ["03:00", "09:00", "13:00", "14:00", "17:00"],
    description: "Prepare to rally and fight for Strongholds and Forts!",
    thumbnailUrl: "https://i.imgur.com/ryZW1kF.png",
  },
  "Frostfire Mine": {
    name: "Frostfire Mine",
    emoji: "⛏️",
    durationMinutes: 30,
    scheduleType: "global_monthly",
    fixedDays: "Monthly on Tuesday (4-week cycle)",
    referenceDate: "2025-11-18",
    cycleWeeks: 4,
    availableTimes: ["03:00", "05:00", "11:00", "14:00", "16:00", "18:00", "21:00"],
    description: "Frostfire Mine is opening! Recall your troops if joining!",
    thumbnailUrl: "https://i.imgur.com/gC5S9Rt.png",
  },
  "Castle Battle": {
    name: "Castle Battle",
    emoji: "☀️",
    durationMinutes: 360,
    scheduleType: "global_4weekly",
    fixedDays: "Every 4 weeks on Saturday",
    referenceDate: "2025-11-22",
    cycleWeeks: 4,
    fixedTime: "12:00",
    description: "Castle Battle starts soon, get ready!",
    thumbnailUrl: "https://i.imgur.com/NPu9yFh.png",
  },
  "SvS": {
    name: "SvS (State vs State)",
    emoji: "⚡",
    durationMinutes: 360,
    scheduleType: "global_4weekly_alt",
    fixedDays: "Every 4 weeks on Saturday (alternating with Castle)",
    referenceDate: "2025-12-06",
    cycleWeeks: 4,
    fixedTime: "12:00",
    description: "State vs State starts soon! Shield up or get raided!",
    thumbnailUrl: "https://i.imgur.com/HUwpmTd.png",
  },
  "Mercenary Prestige": {
    name: "Mercenary Prestige",
    emoji: "🗡️",
    durationMinutes: 60,
    scheduleType: "global_3weekly",
    fixedDays: "Every 3 weeks, 3-day window",
    referenceDate: "2025-12-06",
    cycleWeeks: 3,
    description: "Mercenary boss spawning! Send one march as instructed!",
    thumbnailUrl: "https://i.imgur.com/zb6y3Dg.png",
  },
  "Daily Reset": {
    name: "Daily Reset",
    emoji: "🔄",
    durationMinutes: 0,
    scheduleType: "daily",
    fixedDays: "Daily at 00:00 UTC",
    fixedTime: "00:00",
    description: "Make sure you have done your dailies and arena battles!",
    thumbnailUrl: "https://i.imgur.com/1qeelNq.png",
  },
};

/**
 * Calculate next occurrence of a global WOS event
 */
export function calculateNextOccurrence(eventType: string, fromDate?: Date): Date | null {
  const config = EVENT_CONFIG[eventType];
  if (!config) return null;

  const now = fromDate || new Date();
  const scheduleType = config.scheduleType;

  if (scheduleType === "custom") return null;

  if (scheduleType === "daily") {
    const next = new Date(now);
    next.setUTCHours(0, 0, 0, 0);
    if (next.getTime() <= now.getTime()) {
      next.setUTCDate(next.getUTCDate() + 1);
    }
    return next;
  }

  if (scheduleType === "global_weekly") {
    // Every Friday (day 5)
    const next = new Date(now);
    const dayOfWeek = next.getUTCDay();
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    if (daysUntilFriday === 0 && now.getUTCHours() >= 17) {
      daysUntilFriday = 7;
    }
    next.setUTCDate(next.getUTCDate() + daysUntilFriday);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }

  // Cycle-based events
  if (!config.referenceDate) return null;

  const reference = new Date(config.referenceDate + "T00:00:00Z");
  const cycleWeeks = config.cycleWeeks || 4;
  const cycleDays = cycleWeeks * 7;

  const diffMs = now.getTime() - reference.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return reference;

  const cyclesPassed = Math.floor(diffDays / cycleDays);
  let nextOccurrence = new Date(reference.getTime() + cyclesPassed * cycleDays * 24 * 60 * 60 * 1000);

  if (nextOccurrence.getTime() <= now.getTime()) {
    nextOccurrence = new Date(nextOccurrence.getTime() + cycleDays * 24 * 60 * 60 * 1000);
  }

  return nextOccurrence;
}

/**
 * Calculate next Crazy Joe dates (Tuesday + Thursday in same 4-week cycle)
 */
export function calculateCrazyJoeDates(fromDate?: Date): { tuesday: Date; thursday: Date } | null {
  const config = EVENT_CONFIG["Crazy Joe"];
  if (!config?.referenceDate) return null;

  const now = fromDate || new Date();
  const referenceTue = new Date(config.referenceDate + "T00:00:00Z");
  const cycleDays = (config.cycleWeeks || 4) * 7;

  const diffMs = now.getTime() - referenceTue.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let nextTuesday: Date;
  if (diffDays < 0) {
    nextTuesday = referenceTue;
  } else {
    const cyclesPassed = Math.floor(diffDays / cycleDays);
    nextTuesday = new Date(referenceTue.getTime() + cyclesPassed * cycleDays * 24 * 60 * 60 * 1000);
    if (nextTuesday.getTime() <= now.getTime()) {
      nextTuesday = new Date(nextTuesday.getTime() + cycleDays * 24 * 60 * 60 * 1000);
    }
  }

  const nextThursday = new Date(nextTuesday.getTime() + 2 * 24 * 60 * 60 * 1000);

  return { tuesday: nextTuesday, thursday: nextThursday };
}

/**
 * Get countdown string from now to a target date
 */
export function getCountdown(target: Date, from?: Date): string {
  const now = from || new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Now!";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Get all upcoming events sorted by date
 */
export function getUpcomingEvents(fromDate?: Date): Array<{ event: EventConfig; nextDate: Date; countdown: string }> {
  const now = fromDate || new Date();
  const events: Array<{ event: EventConfig; nextDate: Date; countdown: string }> = [];

  for (const [, config] of Object.entries(EVENT_CONFIG)) {
    if (config.scheduleType === "custom") continue;

    let nextDate: Date | null;

    if (config.name === "Crazy Joe") {
      const dates = calculateCrazyJoeDates(now);
      if (dates) {
        // Add whichever is next — Tuesday or Thursday
        const nextJoe = dates.tuesday.getTime() > now.getTime() ? dates.tuesday : dates.thursday;
        if (nextJoe.getTime() > now.getTime()) {
          events.push({ event: config, nextDate: nextJoe, countdown: getCountdown(nextJoe, now) });
        }
      }
      continue;
    }

    nextDate = calculateNextOccurrence(config.name, now);
    if (nextDate) {
      events.push({ event: config, nextDate, countdown: getCountdown(nextDate, now) });
    }
  }

  events.sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());
  return events;
}
