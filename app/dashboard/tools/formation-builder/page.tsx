"use client";

import { useState, useMemo, useCallback } from "react";
import { Swords, Plus, Trash2, Save, Upload, Download, RotateCcw, Copy, Check } from "lucide-react";

interface Formation {
    infantry: number;
    lancer: number;
    marksman: number;
}

interface SavedFormation {
    name: string;
    marchSize: number;
    marchCount: number;
    percentages: { infantry: number; lancer: number; marksman: number };
    t11Troops: { infantry: number; lancer: number; marksman: number };
    t10Troops: { infantry: number; lancer: number; marksman: number };
}

export default function FormationBuilderPage() {
    const [marchCount, setMarchCount] = useState(3);
    const [marchSize, setMarchSize] = useState(200000);
    const [percentages, setPercentages] = useState({ infantry: 40, lancer: 30, marksman: 30 });
    const [t11Troops, setT11Troops] = useState({ infantry: 0, lancer: 0, marksman: 0 });
    const [t10Troops, setT10Troops] = useState({ infantry: 0, lancer: 0, marksman: 0 });
    const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
    const [saveName, setSaveName] = useState("");
    const [copied, setCopied] = useState(false);

    const totalPct = percentages.infantry + percentages.lancer + percentages.marksman;
    const pctValid = totalPct === 100;

    const updatePct = (key: keyof typeof percentages, value: number) => {
        setPercentages((prev) => ({ ...prev, [key]: Math.max(0, Math.min(100, value)) }));
    };

    const formation = useMemo((): Formation[] => {
        if (!pctValid) return [];
        const totalTroopsNeeded = marchSize * marchCount;

        const targetPerType = {
            infantry: Math.floor(totalTroopsNeeded * (percentages.infantry / 100)),
            lancer: Math.floor(totalTroopsNeeded * (percentages.lancer / 100)),
            marksman: Math.floor(totalTroopsNeeded * (percentages.marksman / 100)),
        };

        // Distribute across marches
        const marches: Formation[] = [];
        for (let i = 0; i < marchCount; i++) {
            marches.push({
                infantry: Math.floor(targetPerType.infantry / marchCount),
                lancer: Math.floor(targetPerType.lancer / marchCount),
                marksman: Math.floor(targetPerType.marksman / marchCount),
            });
        }

        // Handle remainder into first march
        const remainder = {
            infantry: targetPerType.infantry - marches.reduce((s, m) => s + m.infantry, 0),
            lancer: targetPerType.lancer - marches.reduce((s, m) => s + m.lancer, 0),
            marksman: targetPerType.marksman - marches.reduce((s, m) => s + m.marksman, 0),
        };
        if (marches[0]) {
            marches[0].infantry += remainder.infantry;
            marches[0].lancer += remainder.lancer;
            marches[0].marksman += remainder.marksman;
        }

        return marches;
    }, [marchCount, marchSize, percentages, pctValid]);

    const troopShortage = useMemo(() => {
        const totalNeeded = {
            infantry: formation.reduce((s, m) => s + m.infantry, 0),
            lancer: formation.reduce((s, m) => s + m.lancer, 0),
            marksman: formation.reduce((s, m) => s + m.marksman, 0),
        };
        const totalAvailable = {
            infantry: t11Troops.infantry + t10Troops.infantry,
            lancer: t11Troops.lancer + t10Troops.lancer,
            marksman: t11Troops.marksman + t10Troops.marksman,
        };
        return {
            infantry: totalAvailable.infantry - totalNeeded.infantry,
            lancer: totalAvailable.lancer - totalNeeded.lancer,
            marksman: totalAvailable.marksman - totalNeeded.marksman,
        };
    }, [formation, t11Troops, t10Troops]);

    const saveFormation = () => {
        if (!saveName.trim()) return;
        setSavedFormations((prev) => [
            ...prev.filter((f) => f.name !== saveName.trim()),
            { name: saveName.trim(), marchSize, marchCount, percentages: { ...percentages }, t11Troops: { ...t11Troops }, t10Troops: { ...t10Troops } },
        ]);
        setSaveName("");
    };

    const loadFormation = (f: SavedFormation) => {
        setMarchSize(f.marchSize);
        setMarchCount(f.marchCount);
        setPercentages({ ...f.percentages });
        setT11Troops({ ...f.t11Troops });
        setT10Troops({ ...f.t10Troops });
    };

    const copyFormation = () => {
        const lines = formation.map((m, i) =>
            `March ${i + 1}: Infantry ${m.infantry.toLocaleString()} | Lancer ${m.lancer.toLocaleString()} | Marksman ${m.marksman.toLocaleString()}`
        );
        navigator.clipboard.writeText(lines.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const exportData = () => {
        const blob = new Blob([JSON.stringify(savedFormations, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "formations.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const importData = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const text = await file.text();
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) setSavedFormations(data);
            } catch { /* invalid json */ }
        };
        input.click();
    };

    const formatNum = (n: number) => n.toLocaleString();

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Swords className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Formation Builder</h1>
                        <p className="text-zinc-400 text-sm">Build and optimize troop formations for battle</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Configuration */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">March Settings</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                    Number of Marches
                                </label>
                                <select
                                    value={marchCount}
                                    onChange={(e) => setMarchCount(parseInt(e.target.value))}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]/50"
                                >
                                    {[1, 2, 3, 4, 5].map((v) => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                    Max March Size
                                </label>
                                <input
                                    type="number"
                                    value={marchSize}
                                    onChange={(e) => setMarchSize(parseInt(e.target.value) || 0)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]/50 font-mono"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Troop Percentages */}
                    <div className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-white">Troop Mix</h2>
                            <span className={`text-xs font-mono ${pctValid ? "text-green-400" : "text-red-400"}`}>
                                {totalPct}% {pctValid ? "" : "(must equal 100%)"}
                            </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {([
                                { key: "infantry" as const, label: "Infantry", color: "text-blue-400" },
                                { key: "lancer" as const, label: "Lancer", color: "text-emerald-400" },
                                { key: "marksman" as const, label: "Marksman", color: "text-amber-400" },
                            ]).map(({ key, label, color }) => (
                                <div key={key}>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${color}`}>
                                        {label} %
                                    </label>
                                    <input
                                        type="number"
                                        value={percentages[key]}
                                        onChange={(e) => updatePct(key, parseInt(e.target.value) || 0)}
                                        min={0}
                                        max={100}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#38bdf8]/50 font-mono text-center"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Visual bar */}
                        {pctValid && (
                            <div className="flex h-3 rounded-full overflow-hidden mt-4 border border-white/10">
                                <div className="bg-blue-500 transition-all" style={{ width: `${percentages.infantry}%` }} />
                                <div className="bg-emerald-500 transition-all" style={{ width: `${percentages.lancer}%` }} />
                                <div className="bg-amber-500 transition-all" style={{ width: `${percentages.marksman}%` }} />
                            </div>
                        )}
                    </div>

                    {/* Available Troops */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Available Troops (optional)</h2>
                        <div className="grid grid-cols-3 gap-4">
                            {([
                                { key: "infantry" as const, label: "Infantry", color: "text-blue-400" },
                                { key: "lancer" as const, label: "Lancer", color: "text-emerald-400" },
                                { key: "marksman" as const, label: "Marksman", color: "text-amber-400" },
                            ]).map(({ key, label, color }) => (
                                <div key={key} className="space-y-2">
                                    <p className={`text-xs font-bold uppercase tracking-wider ${color}`}>{label}</p>
                                    <input
                                        type="number"
                                        value={t11Troops[key] || ""}
                                        onChange={(e) => setT11Troops((p) => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                                        placeholder="T11"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 font-mono"
                                    />
                                    <input
                                        type="number"
                                        value={t10Troops[key] || ""}
                                        onChange={(e) => setT10Troops((p) => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                                        placeholder="T10"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 font-mono"
                                    />
                                    {(t11Troops[key] > 0 || t10Troops[key] > 0) && (
                                        <p className={`text-xs font-mono ${troopShortage[key] >= 0 ? "text-green-400" : "text-red-400"}`}>
                                            {troopShortage[key] >= 0 ? `+${formatNum(troopShortage[key])} surplus` : `${formatNum(troopShortage[key])} deficit`}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Generated Formations */}
                    {formation.length > 0 && (
                        <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Swords className="h-5 w-5 text-indigo-400" /> Formation Output
                                </h2>
                                <button
                                    onClick={copyFormation}
                                    className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
                                >
                                    {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formation.map((march, i) => {
                                    const total = march.infantry + march.lancer + march.marksman;
                                    return (
                                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="font-bold text-white">March {i + 1}</h3>
                                                <span className="text-xs font-mono text-zinc-400">{formatNum(total)} troops</span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-center">
                                                <div className="p-2 rounded-lg bg-blue-500/10">
                                                    <p className="text-lg font-mono font-bold text-blue-400">{formatNum(march.infantry)}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Infantry</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-emerald-500/10">
                                                    <p className="text-lg font-mono font-bold text-emerald-400">{formatNum(march.lancer)}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Lancer</p>
                                                </div>
                                                <div className="p-2 rounded-lg bg-amber-500/10">
                                                    <p className="text-lg font-mono font-bold text-amber-400">{formatNum(march.marksman)}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Marksman</p>
                                                </div>
                                            </div>
                                            <div className="flex h-2 rounded-full overflow-hidden mt-3 border border-white/10">
                                                <div className="bg-blue-500" style={{ width: `${(march.infantry / total) * 100}%` }} />
                                                <div className="bg-emerald-500" style={{ width: `${(march.lancer / total) * 100}%` }} />
                                                <div className="bg-amber-500" style={{ width: `${(march.marksman / total) * 100}%` }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-4 p-3 rounded-lg bg-white/5 text-center">
                                <p className="text-xs text-zinc-500">Total across all marches</p>
                                <p className="text-xl font-bold font-mono text-white">
                                    {formatNum(formation.reduce((s, m) => s + m.infantry + m.lancer + m.marksman, 0))} troops
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Saved Formations Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Save className="h-5 w-5 text-[#38bdf8]" /> Saved Formations
                        </h2>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="Formation name"
                                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50"
                                onKeyDown={(e) => e.key === "Enter" && saveFormation()}
                            />
                            <button onClick={saveFormation} className="btn-frost px-3 py-2 rounded-lg text-sm font-bold">
                                Save
                            </button>
                        </div>

                        {savedFormations.length === 0 ? (
                            <p className="text-zinc-600 text-sm italic">No saved formations</p>
                        ) : (
                            <div className="space-y-2">
                                {savedFormations.map((f) => (
                                    <div
                                        key={f.name}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <button
                                            onClick={() => loadFormation(f)}
                                            className="text-left text-sm text-white hover:text-[#38bdf8] transition-colors font-medium"
                                        >
                                            <p>{f.name}</p>
                                            <p className="text-[10px] text-zinc-500">{f.marchCount}x {formatNum(f.marchSize)}</p>
                                        </button>
                                        <button
                                            onClick={() => setSavedFormations((p) => p.filter((s) => s.name !== f.name))}
                                            className="text-zinc-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {savedFormations.length > 0 && (
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={exportData}
                                    className="flex-1 text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1 py-2 border border-white/5 rounded-lg hover:bg-white/5"
                                >
                                    <Download className="h-3 w-3" /> Export
                                </button>
                                <button
                                    onClick={importData}
                                    className="flex-1 text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1 py-2 border border-white/5 rounded-lg hover:bg-white/5"
                                >
                                    <Upload className="h-3 w-3" /> Import
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Quick Presets */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Quick Presets</h2>
                        <div className="space-y-2">
                            {[
                                { label: "Balanced (33/33/34)", pct: { infantry: 33, lancer: 33, marksman: 34 } },
                                { label: "Infantry Heavy (50/25/25)", pct: { infantry: 50, lancer: 25, marksman: 25 } },
                                { label: "Ranged Focus (20/20/60)", pct: { infantry: 20, lancer: 20, marksman: 60 } },
                                { label: "Tank & Charge (45/45/10)", pct: { infantry: 45, lancer: 45, marksman: 10 } },
                            ].map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => setPercentages(preset.pct)}
                                    className="w-full text-left text-sm p-3 rounded-lg bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:border-white/10 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
