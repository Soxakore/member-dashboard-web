"use client";

import { useState, useTransition } from "react";
import { Flame, User, ArrowUpRight, RefreshCw, Loader2, Filter, Activity } from "lucide-react";
import { pollAllianceChanges } from "@/app/actions/changelog";

interface ChangeData {
  id: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
  playerNickname: string;
  playerFid: string;
  ownerUsername: string;
}

const CHANGE_TYPE_INFO: Record<string, { icon: any; color: string; label: string; bg: string }> = {
  FURNACE: { icon: Flame, color: "text-orange-400", label: "Furnace Level", bg: "bg-orange-500/10" },
  NICKNAME: { icon: User, color: "text-blue-400", label: "Nickname", bg: "bg-blue-500/10" },
  ALLIANCE_TRANSFER: { icon: ArrowUpRight, color: "text-purple-400", label: "Alliance Transfer", bg: "bg-purple-500/10" },
};

export function ActivityActions({
  changes,
  isAdmin,
  totalFids,
}: {
  changes: ChangeData[];
  isAdmin: boolean;
  totalFids: number;
}) {
  const [filter, setFilter] = useState<string>("ALL");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const handlePoll = () => {
    startTransition(async () => {
      setMessage("Scanning alliance members...");
      const result = await pollAllianceChanges();
      if (result.error) setMessage(`Error: ${result.error}`);
      else setMessage(`Scan complete! Checked ${result.checked}/${result.total} members, found ${result.changesFound} changes.`);
    });
  };

  const filtered = filter === "ALL" ? changes : changes.filter((c) => c.changeType === filter);

  const furnaceCount = changes.filter((c) => c.changeType === "FURNACE").length;
  const nicknameCount = changes.filter((c) => c.changeType === "NICKNAME").length;

  return (
    <div className="space-y-6">
      {/* Stats + Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="glass-panel rounded-xl px-4 py-2 flex items-center gap-2">
          <User className="h-4 w-4 text-zinc-400" />
          <span className="text-sm"><span className="font-bold text-white">{totalFids}</span> <span className="text-zinc-500">linked FIDs</span></span>
        </div>

        {isAdmin && (
          <button
            onClick={handlePoll}
            disabled={isPending}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl font-bold text-sm hover:from-orange-400 hover:to-red-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Scan Alliance
          </button>
        )}

        {message && (
          <p className={`text-sm ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {[
          { key: "ALL", label: "All", count: changes.length },
          { key: "FURNACE", label: "Furnace", count: furnaceCount },
          { key: "NICKNAME", label: "Nickname", count: nicknameCount },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              filter === f.key
                ? "bg-white/10 text-white border border-white/20"
                : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
            }`}
          >
            {f.label}
            <span className="text-[10px] bg-white/10 rounded px-1.5 py-0.5">{f.count}</span>
          </button>
        ))}
      </div>

      {/* Change Feed */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((change) => {
            const info = CHANGE_TYPE_INFO[change.changeType] || CHANGE_TYPE_INFO.FURNACE;
            const Icon = info.icon;
            return (
              <div key={change.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${info.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${info.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{change.playerNickname}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${info.bg} ${info.color} font-bold uppercase`}>
                      {info.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                    <span className="text-red-400/60 line-through">{change.oldValue || "—"}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-green-400 font-bold">{change.newValue || "—"}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-zinc-500">
                    {new Date(change.detectedAt).toLocaleDateString()}
                  </p>
                  <p className="text-[10px] text-zinc-600">
                    {new Date(change.detectedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-bold mb-2">No changes detected yet</p>
          <p className="text-zinc-500 text-sm">
            {isAdmin
              ? 'Click "Scan Alliance" to check all linked members for changes.'
              : "Ask an admin to scan the alliance for changes."}
          </p>
        </div>
      )}
    </div>
  );
}
