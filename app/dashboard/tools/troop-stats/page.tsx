"use client";

import { useState, useMemo } from "react";
import { BarChart3, Shield, Swords, Target, ArrowUpDown, ChevronDown } from "lucide-react";

type TroopType = "infantry" | "lancer" | "marksman";
type SortField = "level" | "power" | "attack" | "defense" | "health" | "lethality" | "speed" | "load";
type SortDir = "asc" | "desc";

interface TroopData {
    level: number;
    power: number;
    attack: number;
    defense: number;
    health: number;
    lethality: number;
    speed: number;
    load: number;
}

// Whiteout Survival troop stat data (representative values per tier)
const TROOP_DATA: Record<TroopType, TroopData[]> = {
    infantry: [
        { level: 1, power: 2, attack: 10, defense: 15, health: 120, lethality: 5, speed: 80, load: 10 },
        { level: 2, power: 4, attack: 15, defense: 22, health: 170, lethality: 8, speed: 80, load: 12 },
        { level: 3, power: 8, attack: 24, defense: 36, health: 270, lethality: 12, speed: 80, load: 15 },
        { level: 4, power: 14, attack: 38, defense: 56, health: 420, lethality: 19, speed: 85, load: 18 },
        { level: 5, power: 22, attack: 55, defense: 82, health: 610, lethality: 28, speed: 85, load: 22 },
        { level: 6, power: 34, attack: 80, defense: 118, health: 880, lethality: 40, speed: 85, load: 26 },
        { level: 7, power: 50, attack: 115, defense: 170, health: 1260, lethality: 58, speed: 90, load: 30 },
        { level: 8, power: 72, attack: 162, defense: 240, health: 1780, lethality: 82, speed: 90, load: 35 },
        { level: 9, power: 100, attack: 225, defense: 335, health: 2480, lethality: 113, speed: 90, load: 40 },
        { level: 10, power: 140, attack: 310, defense: 460, health: 3400, lethality: 155, speed: 95, load: 46 },
        { level: 11, power: 190, attack: 420, defense: 625, health: 4620, lethality: 210, speed: 95, load: 52 },
    ],
    lancer: [
        { level: 1, power: 2, attack: 12, defense: 10, health: 100, lethality: 8, speed: 100, load: 8 },
        { level: 2, power: 4, attack: 18, defense: 15, health: 140, lethality: 12, speed: 100, load: 10 },
        { level: 3, power: 8, attack: 28, defense: 24, health: 220, lethality: 20, speed: 100, load: 12 },
        { level: 4, power: 14, attack: 44, defense: 38, health: 345, lethality: 31, speed: 105, load: 15 },
        { level: 5, power: 22, attack: 65, defense: 55, health: 500, lethality: 45, speed: 105, load: 18 },
        { level: 6, power: 34, attack: 94, defense: 80, health: 720, lethality: 65, speed: 105, load: 22 },
        { level: 7, power: 50, attack: 135, defense: 115, health: 1030, lethality: 94, speed: 110, load: 25 },
        { level: 8, power: 72, attack: 190, defense: 162, health: 1460, lethality: 132, speed: 110, load: 29 },
        { level: 9, power: 100, attack: 265, defense: 225, health: 2030, lethality: 184, speed: 110, load: 33 },
        { level: 10, power: 140, attack: 365, defense: 310, health: 2780, lethality: 252, speed: 115, load: 38 },
        { level: 11, power: 190, attack: 495, defense: 420, health: 3780, lethality: 342, speed: 115, load: 43 },
    ],
    marksman: [
        { level: 1, power: 2, attack: 14, defense: 8, health: 90, lethality: 10, speed: 70, load: 6 },
        { level: 2, power: 4, attack: 21, defense: 12, health: 125, lethality: 15, speed: 70, load: 8 },
        { level: 3, power: 8, attack: 34, defense: 20, health: 200, lethality: 24, speed: 70, load: 10 },
        { level: 4, power: 14, attack: 52, defense: 30, health: 310, lethality: 38, speed: 75, load: 12 },
        { level: 5, power: 22, attack: 76, defense: 44, health: 450, lethality: 55, speed: 75, load: 15 },
        { level: 6, power: 34, attack: 110, defense: 64, health: 650, lethality: 80, speed: 75, load: 18 },
        { level: 7, power: 50, attack: 158, defense: 92, health: 930, lethality: 115, speed: 80, load: 21 },
        { level: 8, power: 72, attack: 224, defense: 130, health: 1320, lethality: 162, speed: 80, load: 24 },
        { level: 9, power: 100, attack: 310, defense: 180, health: 1830, lethality: 225, speed: 80, load: 28 },
        { level: 10, power: 140, attack: 428, defense: 248, health: 2520, lethality: 310, speed: 85, load: 32 },
        { level: 11, power: 190, attack: 580, defense: 336, health: 3420, lethality: 420, speed: 85, load: 36 },
    ],
};

const TROOP_COLORS: Record<TroopType, string> = {
    infantry: "text-blue-400",
    lancer: "text-emerald-400",
    marksman: "text-amber-400",
};

const TROOP_BG: Record<TroopType, string> = {
    infantry: "bg-blue-500/10 border-blue-500/20",
    lancer: "bg-emerald-500/10 border-emerald-500/20",
    marksman: "bg-amber-500/10 border-amber-500/20",
};

const STAT_LABELS: { key: SortField; label: string; icon?: any }[] = [
    { key: "level", label: "Tier" },
    { key: "power", label: "Power" },
    { key: "attack", label: "Attack" },
    { key: "defense", label: "Defense" },
    { key: "health", label: "Health" },
    { key: "lethality", label: "Lethality" },
    { key: "speed", label: "Speed" },
    { key: "load", label: "Load" },
];

export default function TroopStatsPage() {
    const [troopType, setTroopType] = useState<TroopType>("infantry");
    const [sortField, setSortField] = useState<SortField>("level");
    const [sortDir, setSortDir] = useState<SortDir>("asc");
    const [compareType, setCompareType] = useState<TroopType | null>(null);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortField(field);
            setSortDir("desc");
        }
    };

    const sortedData = useMemo(() => {
        const data = [...TROOP_DATA[troopType]];
        data.sort((a, b) => {
            const mul = sortDir === "asc" ? 1 : -1;
            return (a[sortField] - b[sortField]) * mul;
        });
        return data;
    }, [troopType, sortField, sortDir]);

    const compareData = compareType ? TROOP_DATA[compareType] : null;

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Troop Stats</h1>
                        <p className="text-zinc-400 text-sm">Compare troop statistics across types and tiers</p>
                    </div>
                </div>
            </header>

            {/* Troop Type Selector */}
            <div className="flex flex-wrap gap-3">
                {(["infantry", "lancer", "marksman"] as TroopType[]).map((type) => (
                    <button
                        key={type}
                        onClick={() => { setTroopType(type); if (compareType === type) setCompareType(null); }}
                        className={`px-5 py-2.5 rounded-lg font-bold text-sm capitalize transition-all border ${
                            troopType === type
                                ? TROOP_BG[type] + " " + TROOP_COLORS[type]
                                : "border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                        }`}
                    >
                        {type === "infantry" && <Shield className="h-4 w-4 inline mr-2" />}
                        {type === "lancer" && <Swords className="h-4 w-4 inline mr-2" />}
                        {type === "marksman" && <Target className="h-4 w-4 inline mr-2" />}
                        {type}
                    </button>
                ))}

                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Compare:</span>
                    <select
                        value={compareType || ""}
                        onChange={(e) => setCompareType(e.target.value ? (e.target.value as TroopType) : null)}
                        className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8]/50"
                    >
                        <option value="">None</option>
                        {(["infantry", "lancer", "marksman"] as TroopType[])
                            .filter((t) => t !== troopType)
                            .map((t) => (
                                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                            ))}
                    </select>
                </div>
            </div>

            {/* Stat Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Max Power", value: TROOP_DATA[troopType][10].power },
                    { label: "Max Attack", value: TROOP_DATA[troopType][10].attack },
                    { label: "Max Defense", value: TROOP_DATA[troopType][10].defense },
                    { label: "Max Health", value: TROOP_DATA[troopType][10].health },
                ].map((stat) => (
                    <div key={stat.label} className="glass-panel rounded-xl p-4">
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{stat.label}</p>
                        <p className={`text-2xl font-bold ${TROOP_COLORS[troopType]} font-mono`}>
                            {stat.value.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-zinc-600 uppercase">T11</p>
                    </div>
                ))}
            </div>

            {/* Data Table */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/10">
                                {STAT_LABELS.map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => toggleSort(col.key)}
                                        className="px-4 py-3 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                                    >
                                        <span className="flex items-center gap-1">
                                            {col.label}
                                            {sortField === col.key && (
                                                <ArrowUpDown className={`h-3 w-3 text-[#38bdf8] ${sortDir === "desc" ? "rotate-180" : ""}`} />
                                            )}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((row, i) => {
                                const compareRow = compareData?.find((c) => c.level === row.level);
                                return (
                                    <tr
                                        key={row.level}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        {STAT_LABELS.map((col) => {
                                            const val = row[col.key];
                                            const cmpVal = compareRow?.[col.key];
                                            const diff = cmpVal != null ? val - cmpVal : null;
                                            return (
                                                <td key={col.key} className="px-4 py-3 font-mono text-zinc-200">
                                                    <span>{col.key === "level" ? `T${val}` : val.toLocaleString()}</span>
                                                    {diff != null && diff !== 0 && col.key !== "level" && (
                                                        <span className={`ml-2 text-xs ${diff > 0 ? "text-green-400" : "text-red-400"}`}>
                                                            {diff > 0 ? "+" : ""}{diff}
                                                        </span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Type Comparison Summary */}
            {compareType && (
                <div className="glass-panel rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-bold text-white mb-3">
                        <span className={TROOP_COLORS[troopType]}>{troopType.charAt(0).toUpperCase() + troopType.slice(1)}</span>
                        {" vs "}
                        <span className={TROOP_COLORS[compareType]}>{compareType.charAt(0).toUpperCase() + compareType.slice(1)}</span>
                        {" (T11)"}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(["attack", "defense", "health", "lethality", "speed", "load"] as SortField[]).map((field) => {
                            const a = TROOP_DATA[troopType][10][field];
                            const b = TROOP_DATA[compareType][10][field];
                            const pct = ((a - b) / b * 100).toFixed(1);
                            return (
                                <div key={field} className="p-3 rounded-lg bg-white/5">
                                    <p className="text-xs text-zinc-500 uppercase font-bold">{field}</p>
                                    <p className="text-lg font-mono font-bold text-white">{a} vs {b}</p>
                                    <p className={`text-xs font-mono ${Number(pct) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {Number(pct) >= 0 ? "+" : ""}{pct}%
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
