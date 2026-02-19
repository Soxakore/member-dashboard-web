"use client";

import { useState, useTransition } from "react";
import { Crown, Plus, X, Loader2, User } from "lucide-react";
import { initializeWeekSlots, assignMinisterSlot, clearMinisterSlot } from "@/app/actions/minister";

interface SlotData {
  id: string;
  position: string;
  dayOfWeek: number;
  timeSlot: string;
  playerNickname: string | null;
  playerFid: string | null;
  assignedBy: string | null;
}

interface FidData {
  id: string;
  fid: string;
  nickname: string | null;
}

const POSITIONS = ["CONSTRUCTION", "RESEARCH", "TRAINING"];
const POSITION_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  CONSTRUCTION: { label: "Construction", color: "text-amber-400", emoji: "🔨" },
  RESEARCH: { label: "Research", color: "text-blue-400", emoji: "🔬" },
  TRAINING: { label: "Training", color: "text-green-400", emoji: "⚔️" },
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = ["00:00-04:00", "04:00-08:00", "08:00-12:00", "12:00-16:00", "16:00-20:00", "20:00-00:00"];

export function MinisterScheduleView({
  slots,
  userFids,
  isAdmin,
  canAssign,
  weekStartStr,
}: {
  slots: SlotData[];
  userFids: FidData[];
  isAdmin: boolean;
  canAssign: boolean;
  weekStartStr: string;
}) {
  const [activePosition, setActivePosition] = useState("CONSTRUCTION");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [selectedFid, setSelectedFid] = useState(userFids[0]?.id || "");

  const handleInit = () => {
    startTransition(async () => {
      setMessage("");
      const result = await initializeWeekSlots(0);
      if (result.error) setMessage(`Error: ${result.error}`);
      else setMessage(`Created ${result.created} slots!`);
    });
  };

  const handleAssign = (slotId: string) => {
    if (!selectedFid) { setMessage("Link a FID first in Player Lookup"); return; }
    startTransition(async () => {
      setMessage("");
      const result = await assignMinisterSlot(slotId, selectedFid);
      if (result.error) setMessage(`Error: ${result.error}`);
    });
  };

  const handleClear = (slotId: string) => {
    startTransition(async () => {
      setMessage("");
      const result = await clearMinisterSlot(slotId);
      if (result.error) setMessage(`Error: ${result.error}`);
    });
  };

  const positionSlots = slots.filter((s) => s.position === activePosition);
  const hasSlots = slots.length > 0;

  return (
    <div className="space-y-6">
      {/* Position Tabs */}
      <div className="flex gap-2">
        {POSITIONS.map((pos) => {
          const info = POSITION_LABELS[pos];
          return (
            <button
              key={pos}
              onClick={() => setActivePosition(pos)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activePosition === pos
                  ? `${info.color} bg-white/10 border border-white/20`
                  : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <span>{info.emoji}</span>
              {info.label}
            </button>
          );
        })}
      </div>

      {/* FID selector */}
      {userFids.length > 0 && canAssign && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500">Assign as:</span>
          <select
            value={selectedFid}
            onChange={(e) => setSelectedFid(e.target.value)}
            className="bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-yellow-500/50"
          >
            {userFids.map((f) => (
              <option key={f.id} value={f.id}>{f.nickname || f.fid}</option>
            ))}
          </select>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>
      )}

      {!hasSlots ? (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Crown className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-bold mb-2">No schedule created for this week</p>
          {isAdmin ? (
            <button
              onClick={handleInit}
              disabled={isPending}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-xl font-bold hover:from-yellow-400 hover:to-amber-500 transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Initialize Week Schedule
            </button>
          ) : (
            <p className="text-zinc-500 text-sm">Ask an R4/R5 admin to initialize the schedule.</p>
          )}
        </div>
      ) : (
        /* Schedule Grid */
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-widest w-24">Time</th>
                  {DAY_NAMES.map((d) => (
                    <th key={d} className="text-center px-2 py-3 text-xs text-zinc-500 uppercase tracking-widest">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((slot) => (
                  <tr key={slot} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="px-4 py-2 font-mono text-xs text-zinc-400 whitespace-nowrap">{slot}</td>
                    {Array.from({ length: 7 }, (_, dayIdx) => {
                      const cellSlot = positionSlots.find(
                        (s) => s.dayOfWeek === dayIdx && s.timeSlot === slot
                      );
                      if (!cellSlot) {
                        return <td key={dayIdx} className="px-2 py-2 text-center text-zinc-700">—</td>;
                      }
                      if (cellSlot.playerNickname) {
                        return (
                          <td key={dayIdx} className="px-2 py-2">
                            <div className="flex items-center justify-center gap-1 bg-yellow-500/10 rounded-lg px-2 py-1.5 group">
                              <User className="h-3 w-3 text-yellow-400" />
                              <span className="text-xs font-bold text-yellow-400 truncate max-w-[60px]">
                                {cellSlot.playerNickname}
                              </span>
                              {(canAssign || isAdmin) && (
                                <button
                                  onClick={() => handleClear(cellSlot.id)}
                                  className="opacity-0 group-hover:opacity-100 ml-1 text-zinc-500 hover:text-red-400 transition-all"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }
                      return (
                        <td key={dayIdx} className="px-2 py-2">
                          {canAssign && selectedFid ? (
                            <button
                              onClick={() => handleAssign(cellSlot.id)}
                              disabled={isPending}
                              className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-zinc-600 hover:border-yellow-500/30 hover:text-yellow-400 hover:bg-yellow-500/5 transition-all text-xs"
                            >
                              +
                            </button>
                          ) : (
                            <span className="text-zinc-700 text-xs text-center block">Open</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
