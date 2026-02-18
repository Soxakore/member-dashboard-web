"use client";

import { useState, useCallback } from "react";
import { Crosshair, Plus, Trash2, Clock, Play, RotateCcw, Copy, Check } from "lucide-react";

interface MarchEntry {
    id: string;
    playerName: string;
    marchTimeSeconds: number;
}

export default function RallyTrackerPage() {
    const [entries, setEntries] = useState<MarchEntry[]>([]);
    const [playerName, setPlayerName] = useState("");
    const [minutes, setMinutes] = useState("");
    const [seconds, setSeconds] = useState("");
    const [rallyStarter, setRallyStarter] = useState("");
    const [rallyDurationMin, setRallyDurationMin] = useState(5);
    const [launchResult, setLaunchResult] = useState<{ time: string; instructions: string[] } | null>(null);
    const [copied, setCopied] = useState(false);

    const addEntry = useCallback(() => {
        if (!playerName.trim()) return;
        const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
        if (totalSeconds <= 0) return;

        setEntries((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                playerName: playerName.trim(),
                marchTimeSeconds: totalSeconds,
            },
        ]);
        setPlayerName("");
        setMinutes("");
        setSeconds("");
    }, [playerName, minutes, seconds]);

    const removeEntry = (id: string) => {
        setEntries((prev) => prev.filter((e) => e.id !== id));
    };

    const calculateLaunch = () => {
        if (entries.length === 0) return;

        const rallyDurationSeconds = rallyDurationMin * 60;
        const sorted = [...entries].sort((a, b) => b.marchTimeSeconds - a.marchTimeSeconds);
        const maxMarchTime = sorted[0].marchTimeSeconds;

        const instructions = sorted.map((entry) => {
            const delay = maxMarchTime - entry.marchTimeSeconds;
            const delayMin = Math.floor(delay / 60);
            const delaySec = delay % 60;
            const marchMin = Math.floor(entry.marchTimeSeconds / 60);
            const marchSec = entry.marchTimeSeconds % 60;

            if (delay === 0) {
                return `${entry.playerName}: March immediately (${marchMin}m ${marchSec}s march)`;
            }
            return `${entry.playerName}: Wait ${delayMin}m ${delaySec}s then march (${marchMin}m ${marchSec}s march)`;
        });

        const totalMin = Math.floor((maxMarchTime + rallyDurationSeconds) / 60);
        const totalSec = (maxMarchTime + rallyDurationSeconds) % 60;

        setLaunchResult({
            time: `${totalMin}m ${totalSec}s total (${rallyDurationMin}m rally + ${Math.floor(maxMarchTime / 60)}m ${maxMarchTime % 60}s longest march)`,
            instructions,
        });
    };

    const copyInstructions = () => {
        if (!launchResult) return;
        const text = [
            `Rally Timing (Starter: ${rallyStarter || "TBD"})`,
            `Total Time: ${launchResult.time}`,
            "",
            ...launchResult.instructions,
        ].join("\n");
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatTime = (totalSeconds: number) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}m ${s}s`;
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
                        <Crosshair className="h-6 w-6 text-rose-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Rally Tracker</h1>
                        <p className="text-zinc-400 text-sm">Coordinate march timing for synchronized rallies</p>
                    </div>
                </div>
            </header>

            {/* Rally Settings */}
            <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-rose-400" /> Rally Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Rally Starter
                        </label>
                        <input
                            type="text"
                            value={rallyStarter}
                            onChange={(e) => setRallyStarter(e.target.value)}
                            placeholder="Player name"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Rally Duration (minutes)
                        </label>
                        <select
                            value={rallyDurationMin}
                            onChange={(e) => setRallyDurationMin(parseInt(e.target.value))}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
                        >
                            {[1, 2, 3, 5, 10].map((v) => (
                                <option key={v} value={v}>{v} min</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Add March Entry */}
            <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-[#38bdf8]" /> Add March
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Player name"
                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
                        onKeyDown={(e) => e.key === "Enter" && addEntry()}
                    />
                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            placeholder="Min"
                            min={0}
                            className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 transition-colors text-center"
                        />
                        <span className="text-zinc-500 font-mono">:</span>
                        <input
                            type="number"
                            value={seconds}
                            onChange={(e) => setSeconds(e.target.value)}
                            placeholder="Sec"
                            min={0}
                            max={59}
                            className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 transition-colors text-center"
                        />
                    </div>
                    <button
                        onClick={addEntry}
                        className="btn-frost px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Add
                    </button>
                </div>
            </div>

            {/* March List */}
            {entries.length > 0 && (
                <div className="glass-panel rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">
                            Marches ({entries.length})
                        </h2>
                        <button
                            onClick={() => { setEntries([]); setLaunchResult(null); }}
                            className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                        >
                            <RotateCcw className="h-3 w-3" /> Clear All
                        </button>
                    </div>

                    <div className="space-y-2">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold text-sm">
                                        {entry.playerName[0]?.toUpperCase()}
                                    </div>
                                    <span className="font-medium text-white">{entry.playerName}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-mono text-[#38bdf8]">{formatTime(entry.marchTimeSeconds)}</span>
                                    <button
                                        onClick={() => removeEntry(entry.id)}
                                        className="text-zinc-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={calculateLaunch}
                        className="mt-6 w-full btn-frost px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                        <Play className="h-4 w-4" /> Calculate Launch Timing
                    </button>
                </div>
            )}

            {/* Results */}
            {launchResult && (
                <div className="glass-panel rounded-2xl p-6 border border-rose-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Crosshair className="h-5 w-5 text-rose-400" /> Launch Plan
                        </h2>
                        <button
                            onClick={copyInstructions}
                            className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
                        >
                            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                    </div>

                    <p className="text-sm text-zinc-400 mb-4 font-mono">{launchResult.time}</p>

                    <div className="space-y-2">
                        {launchResult.instructions.map((instruction, i) => (
                            <div
                                key={i}
                                className={`py-2 px-4 rounded-lg text-sm font-mono ${
                                    i === 0
                                        ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                                        : "bg-white/5 border border-white/5 text-zinc-300"
                                }`}
                            >
                                {instruction}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
