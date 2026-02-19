"use client";

import { useState, useEffect, useMemo } from "react";
import { CalendarClock, Clock, ChevronRight, Globe, Users, Shield } from "lucide-react";

interface EventConfig {
  name: string;
  emoji: string;
  durationMinutes: number;
  scheduleType: string;
  fixedDays: string;
  referenceDate?: string;
  cycleWeeks?: number;
  availableTimes?: string[];
  fixedTime?: string;
  description: string;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  "Bear Trap": { name: "Bear Trap", emoji: "🐻", durationMinutes: 30, scheduleType: "custom", fixedDays: "Alliance-defined schedule", description: "Get your buffs on and prepare your marches!" },
  "Crazy Joe": { name: "Crazy Joe", emoji: "🤪", durationMinutes: 30, scheduleType: "global_biweekly", fixedDays: "Tue & Thu every 4 weeks", referenceDate: "2025-11-18", cycleWeeks: 4, description: "Crazy Joe is coming to town!" },
  "Foundry Battle": { name: "Foundry Battle", emoji: "🏭", durationMinutes: 60, scheduleType: "global_biweekly", fixedDays: "Every 2 weeks on Sunday", referenceDate: "2025-11-16", cycleWeeks: 2, availableTimes: ["02:00", "12:00", "14:00", "19:00"], description: "Buff up and get ready to fight!" },
  "Canyon Clash": { name: "Canyon Clash", emoji: "⚔️", durationMinutes: 60, scheduleType: "global_monthly", fixedDays: "Monthly on Saturday", referenceDate: "2025-11-29", cycleWeeks: 4, availableTimes: ["02:00", "12:00", "14:00", "19:00", "21:00"], description: "Canyon Clash is starting!" },
  "Fortress Battle": { name: "Fortress Battle", emoji: "🏰", durationMinutes: 120, scheduleType: "global_weekly", fixedDays: "Every Friday", availableTimes: ["03:00", "09:00", "13:00", "14:00", "17:00"], description: "Rally and fight for Strongholds!" },
  "Frostfire Mine": { name: "Frostfire Mine", emoji: "⛏️", durationMinutes: 30, scheduleType: "global_monthly", fixedDays: "Monthly on Tuesday", referenceDate: "2025-11-18", cycleWeeks: 4, availableTimes: ["03:00", "05:00", "11:00", "14:00", "16:00", "18:00", "21:00"], description: "Frostfire Mine is opening!" },
  "Castle Battle": { name: "Castle Battle", emoji: "☀️", durationMinutes: 360, scheduleType: "global_4weekly", fixedDays: "Every 4 weeks on Saturday", referenceDate: "2025-11-22", cycleWeeks: 4, fixedTime: "12:00 UTC", description: "Castle Battle starts soon!" },
  "SvS": { name: "SvS (State vs State)", emoji: "⚡", durationMinutes: 360, scheduleType: "global_4weekly_alt", fixedDays: "Every 4 weeks on Saturday", referenceDate: "2025-12-06", cycleWeeks: 4, fixedTime: "12:00 UTC", description: "Shield up or get raided!" },
  "Mercenary Prestige": { name: "Mercenary Prestige", emoji: "🗡️", durationMinutes: 60, scheduleType: "global_3weekly", fixedDays: "Every 3 weeks, 3-day window", referenceDate: "2025-12-06", cycleWeeks: 3, description: "Mercenary boss spawning!" },
  "Daily Reset": { name: "Daily Reset", emoji: "🔄", durationMinutes: 0, scheduleType: "daily", fixedDays: "Daily at 00:00 UTC", fixedTime: "00:00 UTC", description: "Do your dailies and arena!" },
};

function calcNextOccurrence(config: EventConfig, now: Date): Date | null {
  if (config.scheduleType === "custom") return null;
  if (config.scheduleType === "daily") {
    const next = new Date(now);
    next.setUTCHours(0, 0, 0, 0);
    if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }
  if (config.scheduleType === "global_weekly") {
    const next = new Date(now);
    const dow = next.getUTCDay();
    let daysUntil = (5 - dow + 7) % 7;
    if (daysUntil === 0 && now.getUTCHours() >= 17) daysUntil = 7;
    next.setUTCDate(next.getUTCDate() + daysUntil);
    next.setUTCHours(0, 0, 0, 0);
    return next;
  }
  if (!config.referenceDate) return null;
  const ref = new Date(config.referenceDate + "T00:00:00Z");
  const cycle = (config.cycleWeeks || 4) * 7;
  const diffMs = now.getTime() - ref.getTime();
  const diffDays = diffMs / 86400000;
  if (diffDays < 0) return ref;
  const passed = Math.floor(diffDays / cycle);
  let next = new Date(ref.getTime() + passed * cycle * 86400000);
  if (next.getTime() <= now.getTime()) next = new Date(next.getTime() + cycle * 86400000);
  return next;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Now!";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

function getUrgencyColor(ms: number): string {
  if (ms < 3600000) return "text-red-400";
  if (ms < 86400000) return "text-amber-400";
  if (ms < 259200000) return "text-yellow-400";
  return "text-zinc-400";
}

function getUrgencyBorder(ms: number): string {
  if (ms < 3600000) return "border-red-500/30 bg-red-500/5";
  if (ms < 86400000) return "border-amber-500/20 bg-amber-500/5";
  return "border-white/5";
}

export default function EventSchedulePage() {
  const [now, setNow] = useState(new Date());
  const [allianceInfo, setAllianceInfo] = useState<{ kingdom: string; memberCount: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch("/api/alliance-info")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data) setAllianceInfo(data); })
      .catch(() => {});
  }, []);

  const events = useMemo(() => {
    const list: Array<{ config: EventConfig; nextDate: Date | null; ms: number }> = [];
    for (const [, cfg] of Object.entries(EVENT_CONFIG)) {
      const next = calcNextOccurrence(cfg, now);
      list.push({ config: cfg, nextDate: next, ms: next ? next.getTime() - now.getTime() : Infinity });
    }
    list.sort((a, b) => a.ms - b.ms);
    return list;
  }, [now]);

  const currentPhase = useMemo(() => {
    const svs = events.find((e) => e.config.name.includes("SvS"));
    const castle = events.find((e) => e.config.name === "Castle Battle");
    if (svs && svs.ms < 86400000 * 2) return { phase: "SvS Prep", color: "text-red-400", emoji: "🛡️", tip: "Shield up! Protect resources and troops." };
    if (castle && castle.ms < 86400000 * 2) return { phase: "Castle Prep", color: "text-amber-400", emoji: "⚔️", tip: "Rally your troops for Castle Battle!" };
    if (svs && svs.ms < 86400000 * 5) return { phase: "Pre-SvS", color: "text-yellow-400", emoji: "📦", tip: "Save speedups and resources for SvS scoring." };
    return { phase: "Peace Time", color: "text-green-400", emoji: "🌿", tip: "Build, research, and grow your strength." };
  }, [events]);

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
        </p>
      </header>

      {/* Alliance Status Bar */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{currentPhase.emoji}</span>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Current Phase</p>
            <p className={`text-lg font-bold ${currentPhase.color}`}>{currentPhase.phase}</p>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10 hidden sm:block" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Shield className="h-4 w-4 text-zinc-500 shrink-0" />
          <p className="text-sm text-zinc-400 truncate">{currentPhase.tip}</p>
        </div>

        {allianceInfo && (
          <>
            <div className="h-8 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">State</p>
                  <p className="text-sm font-bold text-blue-400">#{allianceInfo.kingdom}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Linked</p>
                  <p className="text-sm font-bold text-cyan-400">{allianceInfo.memberCount}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Next Event Highlight */}
      {events[0]?.nextDate && (
        <div className={`glass-panel rounded-2xl p-6 border ${getUrgencyBorder(events[0].ms)}`}>
          <p className="text-xs uppercase tracking-widest text-teal-400 font-bold mb-2">Next Event</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{events[0].config.emoji}</span>
              <div>
                <h2 className="text-xl font-bold">{events[0].config.name}</h2>
                <p className="text-zinc-400 text-sm">{events[0].config.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold font-mono ${getUrgencyColor(events[0].ms)}`}>
                {formatCountdown(events[0].ms)}
              </p>
              <p className="text-xs text-zinc-500">
                {events[0].nextDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Events Grid */}
      <div className="grid gap-3">
        {events.map(({ config, nextDate, ms }) => (
          <div
            key={config.name}
            className={`glass-panel rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all group border ${nextDate && ms < 86400000 ? getUrgencyBorder(ms) : "border-transparent"}`}
          >
            <span className="text-2xl w-10 text-center">{config.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">{config.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />
                <span>{config.fixedDays}</span>
                {config.durationMinutes > 0 && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span>{config.durationMinutes >= 60 ? `${config.durationMinutes / 60}h` : `${config.durationMinutes}m`}</span>
                  </>
                )}
              </div>
            </div>
            {nextDate ? (
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold font-mono ${getUrgencyColor(ms)}`}>
                  {formatCountdown(ms)}
                </p>
                <p className="text-[10px] text-zinc-500">
                  {nextDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
            ) : (
              <span className="text-xs text-zinc-600 italic">Custom schedule</span>
            )}
            {config.availableTimes && (
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                {config.availableTimes.slice(0, 3).map((t) => (
                  <span key={t} className="text-[10px] bg-white/5 rounded px-1.5 py-0.5 text-zinc-400 font-mono">{t}</span>
                ))}
                {config.availableTimes.length > 3 && (
                  <span className="text-[10px] text-zinc-500">+{config.availableTimes.length - 3}</span>
                )}
              </div>
            )}
            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Schedule Notes</h3>
        <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside">
          <li>All times are in UTC. Adjust for your local timezone.</li>
          <li>Bear Trap times are set by your alliance — check with leadership.</li>
          <li>Current phase updates automatically based on upcoming SvS/Castle events.</li>
          <li>Available time slots show possible start times for events with multiple sessions.</li>
          <li>Schedules are based on reference dates from the WOS community bot data.</li>
        </ul>
      </div>
    </div>
  );
}
