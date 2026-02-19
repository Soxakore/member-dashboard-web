"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { recordAttendance } from "@/app/actions/attendance";

interface FidData {
  id: string;
  fid: string;
  nickname: string | null;
}

export function RecordPointsForm({
  sessionId,
  allFids,
}: {
  sessionId: string;
  allFids: FidData[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [points, setPoints] = useState("");
  const [note, setNote] = useState("");
  const [selectedFid, setSelectedFid] = useState(allFids[0]?.id || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFid || !points) return;

    const formData = new FormData();
    formData.set("sessionId", sessionId);
    formData.set("playerFidId", selectedFid);
    formData.set("points", points);
    formData.set("note", note);

    startTransition(async () => {
      setMessage("");
      const result = await recordAttendance(formData);
      if (result.error) setMessage(`Error: ${result.error}`);
      else {
        setMessage("Recorded!");
        setPoints("");
        setNote("");
      }
    });
  };

  if (allFids.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5 text-amber-400 text-sm">
        No linked FIDs found. Members need to link their FIDs in Player Lookup first.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6">
      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-4">Record Points</h3>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          value={selectedFid}
          onChange={(e) => setSelectedFid(e.target.value)}
          className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50"
        >
          {allFids.map((f) => (
            <option key={f.id} value={f.id}>{f.nickname || f.fid}</option>
          ))}
        </select>
        <input
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          placeholder="Points (e.g. 1.5M, 500K)"
          required
          className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Note (optional)"
          className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/50"
        />
        <button
          type="submit"
          disabled={isPending || !selectedFid || !points}
          className="px-4 py-2 bg-sky-500/20 border border-sky-500/30 rounded-lg text-sm font-bold text-sky-400 hover:bg-sky-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Record
        </button>
      </div>
      {message && (
        <p className={`text-sm mt-3 ${message.startsWith("Error") ? "text-red-400" : "text-green-400"}`}>{message}</p>
      )}
    </form>
  );
}
