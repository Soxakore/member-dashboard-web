"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import {
  CalendarClock,
  Clock,
  ChevronRight,
  ChevronDown,
  Globe,
  Users,
  Shield,
  Settings,
  X,
  Loader2,
  Check,
} from "lucide-react";
import {
  saveEventTimeConfig,
  saveBearTrapConfig,
  clearEventConfig,
} from "@/app/actions/event-config";

export interface EventData {
  name: string;
  emoji: string;
  durationMinutes: number;
  fixedDays: string;
  description: string;
  scheduleType: string;
  availableTimes?: string[];
  fixedTime?: string;
  selectedTime?: string | null;
  customDays?: string[] | null;
  nextDate: string | null;
  configuredBy?: string | null;
  isConfigured: boolean;
}

interface Props {
  events: EventData[];
  isAdmin: boolean;
  allianceInfo: { kingdom: string; memberCount: number } | null;
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

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function EventScheduleClient({ events: initialEvents, isAdmin, allianceInfo }: Props) {
  const [now, setNow] = useState(new Date());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  // Bear Trap config state
  const [bearDays, setBearDays] = useState<string[]>([]);
  const [bearTime, setBearTime] = useState("20:00");

  // Initialize Bear Trap state from existing config
  useEffect(() => {
    const bearTrap = initialEvents.find((e) => e.name === "Bear Trap");
    if (bearTrap?.customDays) setBearDays(bearTrap.customDays);
    if (bearTrap?.selectedTime) setBearTime(bearTrap.selectedTime);
  }, [initialEvents]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedEvents = useMemo(() => {
    return initialEvents
      .map((evt) => {
        const nextDate = evt.nextDate ? new Date(evt.nextDate) : null;
        const ms = nextDate ? nextDate.getTime() - now.getTime() : Infinity;
        return { ...evt, nextDateObj: nextDate, ms };
      })
      .sort((a, b) => a.ms - b.ms);
  }, [initialEvents, now]);

  const currentPhase = useMemo(() => {
    const svs = sortedEvents.find((e) => e.name.includes("SvS"));
    const castle = sortedEvents.find((e) => e.name === "Castle Battle");
    if (svs && svs.ms < 86400000 * 2)
      return { phase: "SvS Prep", color: "text-red-400", emoji: "🛡️", tip: "Shield up! Protect resources and troops." };
    if (castle && castle.ms < 86400000 * 2)
      return { phase: "Castle Prep", color: "text-amber-400", emoji: "⚔️", tip: "Rally your troops for Castle Battle!" };
    if (svs && svs.ms < 86400000 * 5)
      return { phase: "Pre-SvS", color: "text-yellow-400", emoji: "📦", tip: "Save speedups and resources for SvS scoring." };
    return { phase: "Peace Time", color: "text-green-400", emoji: "🌿", tip: "Build, research, and grow your strength." };
  }, [sortedEvents]);

  const handleSaveTime = (eventName: string, time: string) => {
    setMessage("");
    startTransition(async () => {
      const result = await saveEventTimeConfig(eventName, time);
      if (result.error) setMessage(`Error: ${result.error}`);
      else {
        setMessage(`${eventName} time set to ${time} UTC`);
        setExpandedEvent(null);
      }
    });
  };

  const handleSaveBearTrap = () => {
    setMessage("");
    startTransition(async () => {
      const result = await saveBearTrapConfig(bearTime, bearDays);
      if (result.error) setMessage(`Error: ${result.error}`);
      else {
        setMessage("Bear Trap schedule saved!");
        setExpandedEvent(null);
      }
    });
  };

  const handleClear = (eventName: string) => {
    setMessage("");
    startTransition(async () => {
      const result = await clearEventConfig(eventName);
      if (result.error) setMessage(`Error: ${result.error}`);
      else setMessage(`${eventName} config cleared`);
    });
  };

  const toggleDay = (day: string) => {
    setBearDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const canConfigure = (evt: EventData) => {
    return isAdmin && (evt.availableTimes || evt.scheduleType === "custom");
  };

  return (
    <div className="space-y-8">
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

      {/* Status Message */}
      {message && (
        <p
          className={`text-sm px-4 ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
        >
          {message}
        </p>
      )}

      {/* Next Event Highlight */}
      {sortedEvents[0]?.nextDateObj && (
        <div className={`glass-panel rounded-2xl p-6 border ${getUrgencyBorder(sortedEvents[0].ms)}`}>
          <p className="text-xs uppercase tracking-widest text-teal-400 font-bold mb-2">Next Event</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{sortedEvents[0].emoji}</span>
              <div>
                <h2 className="text-xl font-bold">{sortedEvents[0].name}</h2>
                <p className="text-zinc-400 text-sm">{sortedEvents[0].description}</p>
                {sortedEvents[0].isConfigured && sortedEvents[0].selectedTime && (
                  <p className="text-teal-400 text-xs font-mono mt-1">
                    ⏰ {sortedEvents[0].selectedTime} UTC
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold font-mono ${getUrgencyColor(sortedEvents[0].ms)}`}>
                {formatCountdown(sortedEvents[0].ms)}
              </p>
              <p className="text-xs text-zinc-500">
                {sortedEvents[0].nextDateObj.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* All Events Grid */}
      <div className="grid gap-3">
        {sortedEvents.map((evt) => {
          const isExpanded = expandedEvent === evt.name;
          const configurable = canConfigure(evt);

          return (
            <div key={evt.name} className="space-y-0">
              <div
                className={`glass-panel rounded-xl p-4 flex items-center gap-4 transition-all group border ${
                  evt.nextDateObj && evt.ms < 86400000
                    ? getUrgencyBorder(evt.ms)
                    : "border-transparent"
                } ${configurable ? "cursor-pointer hover:bg-white/5" : ""} ${
                  isExpanded ? "rounded-b-none border-b-0" : ""
                }`}
                onClick={() => configurable && setExpandedEvent(isExpanded ? null : evt.name)}
              >
                <span className="text-2xl w-10 text-center">{evt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm truncate">{evt.name}</h3>
                    {evt.isConfigured && (
                      <span className="text-[9px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded font-bold uppercase">
                        Set
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock className="h-3 w-3" />
                    <span>{evt.fixedDays}</span>
                    {evt.durationMinutes > 0 && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span>
                          {evt.durationMinutes >= 60
                            ? `${evt.durationMinutes / 60}h`
                            : `${evt.durationMinutes}m`}
                        </span>
                      </>
                    )}
                    {evt.isConfigured && evt.selectedTime && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-teal-400 font-mono">{evt.selectedTime} UTC</span>
                      </>
                    )}
                    {!evt.isConfigured && evt.fixedTime && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400 font-mono">{evt.fixedTime} UTC</span>
                      </>
                    )}
                  </div>
                </div>

                {evt.nextDateObj ? (
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold font-mono ${getUrgencyColor(evt.ms)}`}>
                      {formatCountdown(evt.ms)}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {evt.nextDateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-600 italic">
                    {evt.scheduleType === "custom" && !evt.isConfigured
                      ? "Not scheduled"
                      : "Custom schedule"}
                  </span>
                )}

                {/* Time slot tags (non-admin view) */}
                {!isAdmin && evt.availableTimes && !evt.isConfigured && (
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {evt.availableTimes.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[10px] bg-white/5 rounded px-1.5 py-0.5 text-zinc-400 font-mono"
                      >
                        {t}
                      </span>
                    ))}
                    {evt.availableTimes.length > 3 && (
                      <span className="text-[10px] text-zinc-500">+{evt.availableTimes.length - 3}</span>
                    )}
                  </div>
                )}

                {configurable ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-teal-400 shrink-0" />
                  ) : (
                    <Settings className="h-4 w-4 text-zinc-600 group-hover:text-teal-400 transition-colors shrink-0" />
                  )
                ) : (
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                )}
              </div>

              {/* Admin Config Panel */}
              {isExpanded && configurable && (
                <div className="glass-panel rounded-b-xl p-4 border border-t-0 border-white/5 space-y-3">
                  {/* Events with availableTimes (Foundry, Canyon, Fortress, Frostfire) */}
                  {evt.availableTimes && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                        Select your alliance&apos;s time slot (UTC)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {evt.availableTimes.map((time) => (
                          <button
                            key={time}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveTime(evt.name, time);
                            }}
                            disabled={isPending}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              evt.selectedTime === time
                                ? "bg-teal-500/30 text-teal-300 border border-teal-500/50"
                                : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white"
                            } disabled:opacity-50`}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : evt.selectedTime === time ? (
                              <span className="flex items-center gap-1.5">
                                <Check className="h-3 w-3" />
                                {time}
                              </span>
                            ) : (
                              time
                            )}
                          </button>
                        ))}
                      </div>
                      {evt.isConfigured && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClear(evt.name);
                          }}
                          disabled={isPending}
                          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors mt-1"
                        >
                          <X className="h-3 w-3" />
                          Clear selection
                        </button>
                      )}
                      {evt.configuredBy && (
                        <p className="text-[10px] text-zinc-600">
                          Last set by {evt.configuredBy}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Bear Trap custom config */}
                  {evt.scheduleType === "custom" && (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                        Set Bear Trap Schedule
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs text-zinc-400">Days:</p>
                        <div className="flex flex-wrap gap-2">
                          {ALL_DAYS.map((day) => (
                            <button
                              key={day}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDay(day);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                bearDays.includes(day)
                                  ? "bg-teal-500/30 text-teal-300 border border-teal-500/50"
                                  : "bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-zinc-400">Time (UTC):</label>
                        <input
                          type="time"
                          value={bearTime}
                          onChange={(e) => setBearTime(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-teal-500/50"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveBearTrap();
                          }}
                          disabled={isPending || bearDays.length === 0}
                          className="px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg text-sm font-bold hover:from-teal-400 hover:to-cyan-500 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                          Save Schedule
                        </button>
                        {evt.isConfigured && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClear("Bear Trap");
                            }}
                            disabled={isPending}
                            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <X className="h-3 w-3" />
                            Clear
                          </button>
                        )}
                      </div>
                      {evt.configuredBy && (
                        <p className="text-[10px] text-zinc-600">
                          Last set by {evt.configuredBy}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Schedule Notes</h3>
        <ul className="text-zinc-400 text-sm space-y-1 list-disc list-inside">
          <li>All times are in UTC. Adjust for your local timezone.</li>
          {isAdmin && <li>Click events with ⚙ to configure your alliance&apos;s time slot.</li>}
          <li>Bear Trap times are set by your alliance leadership.</li>
          <li>Current phase updates automatically based on upcoming SvS/Castle events.</li>
          <li>Events marked &quot;Set&quot; have been configured by your alliance admin.</li>
          <li>Schedules are based on global WOS event cycles with alliance-specific times.</li>
        </ul>
      </div>
    </div>
  );
}
