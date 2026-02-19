"use client";

import { useState, useTransition } from "react";
import { Plus, Users, Lock, Unlock, Loader2, ChevronRight, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { createAttendanceSession, closeAttendanceSession } from "@/app/actions/attendance";

interface SessionData {
  id: string;
  eventName: string;
  eventType: string;
  legion: string | null;
  status: string;
  startedAt: string;
  closedAt: string | null;
  createdBy: string;
  recordCount: number;
}

const EVENT_TYPES = [
  { value: "FOUNDRY", label: "Foundry Battle", emoji: "🏭" },
  { value: "CANYON_CLASH", label: "Canyon Clash", emoji: "⚔️" },
  { value: "CRAZY_JOE", label: "Crazy Joe", emoji: "🤪" },
  { value: "BEAR_TRAP", label: "Bear Trap", emoji: "🐻" },
  { value: "FORTRESS", label: "Fortress Battle", emoji: "🏰" },
  { value: "CASTLE", label: "Castle Battle", emoji: "☀️" },
  { value: "SVS", label: "SvS", emoji: "⚡" },
  { value: "FROSTFIRE", label: "Frostfire Mine", emoji: "⛏️" },
  { value: "MERCENARY", label: "Mercenary Prestige", emoji: "🗡️" },
  { value: "OTHER", label: "Other", emoji: "📋" },
];

export function AttendanceActions({
  sessions,
  canCreate,
}: {
  sessions: SessionData[];
  canCreate: boolean;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      setMessage("");
      const result = await createAttendanceSession(formData);
      if (result.error) setMessage(`Error: ${result.error}`);
      else { setMessage("Session created!"); setShowCreate(false); }
    });
  };

  const handleClose = (sessionId: string) => {
    startTransition(async () => {
      setMessage("");
      const result = await closeAttendanceSession(sessionId);
      if (result.error) setMessage(`Error: ${result.error}`);
    });
  };

  const openSessions = sessions.filter((s) => s.status === "OPEN");
  const closedSessions = sessions.filter((s) => s.status === "CLOSED");

  return (
    <div className="space-y-6">
      {/* Create Button */}
      {canCreate && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-bold text-sm hover:from-sky-400 hover:to-blue-500 transition-all flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Session
          </button>
          {message && (
            <p className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>
          )}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-1">Event Name</label>
              <input
                name="eventName"
                required
                placeholder="e.g. Foundry Battle - Feb 20"
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-1">Event Type</label>
              <select
                name="eventType"
                required
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
              >
                {EVENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-widest mb-1">Legion (optional)</label>
            <select
              name="legion"
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
            >
              <option value="">None</option>
              <option value="1">Legion 1</option>
              <option value="2">Legion 2</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-sky-500/20 border border-sky-500/30 rounded-lg text-sm font-bold text-sky-400 hover:bg-sky-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Session
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-zinc-400 text-sm hover:text-white transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Open Sessions */}
      {openSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Unlock className="h-3 w-3 text-green-400" />
            Open Sessions ({openSessions.length})
          </h3>
          {openSessions.map((s) => {
            const eventInfo = EVENT_TYPES.find((t) => t.value === s.eventType);
            return (
              <Link
                key={s.id}
                href={`/dashboard/tools/attendance/${s.id}`}
                className="glass-panel rounded-xl p-4 flex items-center gap-4 hover:bg-white/5 transition-all group block"
              >
                <span className="text-2xl">{eventInfo?.emoji || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{s.eventName}</h4>
                  <p className="text-xs text-zinc-500">
                    By {s.createdBy} • {new Date(s.startedAt).toLocaleDateString()}
                    {s.legion && ` • Legion ${s.legion}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Users className="h-3 w-3" />
                    {s.recordCount}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400">OPEN</span>
                  {canCreate && (
                    <button
                      onClick={(e) => { e.preventDefault(); handleClose(s.id); }}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 text-xs text-zinc-400 hover:text-red-400 transition-all"
                    >
                      <Lock className="h-3 w-3" />
                    </button>
                  )}
                  <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Closed Sessions */}
      {closedSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Lock className="h-3 w-3 text-zinc-500" />
            Closed Sessions ({closedSessions.length})
          </h3>
          {closedSessions.map((s) => {
            const eventInfo = EVENT_TYPES.find((t) => t.value === s.eventType);
            return (
              <Link
                key={s.id}
                href={`/dashboard/tools/attendance/${s.id}`}
                className="glass-panel rounded-xl p-4 flex items-center gap-4 opacity-60 hover:opacity-80 transition-all group block"
              >
                <span className="text-2xl">{eventInfo?.emoji || "📋"}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{s.eventName}</h4>
                  <p className="text-xs text-zinc-500">
                    By {s.createdBy} • {s.closedAt ? new Date(s.closedAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-zinc-400">
                    <Users className="h-3 w-3" />
                    {s.recordCount}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-zinc-500">CLOSED</span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <ClipboardCheck className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-bold mb-2">No attendance sessions yet</p>
          <p className="text-zinc-500 text-sm">Create a session to start tracking member participation.</p>
        </div>
      )}
    </div>
  );
}
