"use client";

import { useState, useMemo } from "react";
import { Calculator, Save, Trash2, Download, Upload } from "lucide-react";

interface ResourceRates {
    meat: number;
    wood: number;
    coal: number;
    iron: number;
}

interface SavedProfile {
    name: string;
    rates: ResourceRates;
}

const BANNER_COSTS: ResourceRates = {
    meat: 1500000,
    wood: 1500000,
    coal: 750000,
    iron: 375000,
};

const RESOURCE_COLORS: Record<keyof ResourceRates, { text: string; bg: string; bar: string }> = {
    meat: { text: "text-orange-400", bg: "bg-orange-500/10", bar: "bg-orange-500" },
    wood: { text: "text-amber-400", bg: "bg-amber-600/10", bar: "bg-amber-600" },
    coal: { text: "text-zinc-300", bg: "bg-zinc-500/10", bar: "bg-zinc-500" },
    iron: { text: "text-slate-300", bg: "bg-slate-400/10", bar: "bg-slate-400" },
};

function formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
    return n.toString();
}

export default function RSSCalculatorPage() {
    const [rates, setRates] = useState<ResourceRates>({ meat: 0, wood: 0, coal: 0, iron: 0 });
    const [profiles, setProfiles] = useState<SavedProfile[]>([]);
    const [profileName, setProfileName] = useState("");
    const [hoursPerDay, setHoursPerDay] = useState(8);

    const updateRate = (key: keyof ResourceRates, value: string) => {
        setRates((prev) => ({ ...prev, [key]: parseInt(value) || 0 }));
    };

    const dailyProduction = useMemo(() => ({
        meat: rates.meat * hoursPerDay,
        wood: rates.wood * hoursPerDay,
        coal: rates.coal * hoursPerDay,
        iron: rates.iron * hoursPerDay,
    }), [rates, hoursPerDay]);

    const bannersPerDay = useMemo(() => {
        const perResource = {
            meat: dailyProduction.meat > 0 ? dailyProduction.meat / BANNER_COSTS.meat : 0,
            wood: dailyProduction.wood > 0 ? dailyProduction.wood / BANNER_COSTS.wood : 0,
            coal: dailyProduction.coal > 0 ? dailyProduction.coal / BANNER_COSTS.coal : 0,
            iron: dailyProduction.iron > 0 ? dailyProduction.iron / BANNER_COSTS.iron : 0,
        };

        const values = Object.values(perResource).filter((v) => v > 0);
        const bottleneck = values.length > 0 ? Math.min(...values) : 0;

        return { perResource, bottleneck };
    }, [dailyProduction]);

    const bottleneckResource = useMemo(() => {
        if (bannersPerDay.bottleneck === 0) return null;
        const entries = Object.entries(bannersPerDay.perResource);
        const min = entries.reduce((a, b) => (a[1] < b[1] && a[1] > 0 ? a : b[1] > 0 ? b : a));
        return min[0] as keyof ResourceRates;
    }, [bannersPerDay]);

    const saveProfile = () => {
        if (!profileName.trim()) return;
        setProfiles((prev) => [...prev.filter((p) => p.name !== profileName.trim()), { name: profileName.trim(), rates: { ...rates } }]);
        setProfileName("");
    };

    const loadProfile = (profile: SavedProfile) => {
        setRates({ ...profile.rates });
    };

    const deleteProfile = (name: string) => {
        setProfiles((prev) => prev.filter((p) => p.name !== name));
    };

    const exportProfiles = () => {
        const blob = new Blob([JSON.stringify(profiles, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "rss-profiles.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Calculator className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">RSS Calculator</h1>
                        <p className="text-zinc-400 text-sm">Calculate banner production from alliance resource farming</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Hourly Rates */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Hourly Resource Rates</h2>
                        <div className="grid grid-cols-2 gap-4">
                            {(Object.keys(rates) as (keyof ResourceRates)[]).map((key) => (
                                <div key={key}>
                                    <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${RESOURCE_COLORS[key].text}`}>
                                        {key}
                                    </label>
                                    <input
                                        type="number"
                                        value={rates[key] || ""}
                                        onChange={(e) => updateRate(key, e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50 transition-colors font-mono"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="mt-4">
                            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                                Farming Hours / Day
                            </label>
                            <input
                                type="range"
                                min={1}
                                max={24}
                                value={hoursPerDay}
                                onChange={(e) => setHoursPerDay(parseInt(e.target.value))}
                                className="w-full accent-[#38bdf8]"
                            />
                            <div className="flex justify-between text-xs text-zinc-500 mt-1">
                                <span>1h</span>
                                <span className="text-[#38bdf8] font-bold">{hoursPerDay}h</span>
                                <span>24h</span>
                            </div>
                        </div>
                    </div>

                    {/* Daily Production */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4">Daily Production</h2>
                        <div className="space-y-3">
                            {(Object.keys(dailyProduction) as (keyof ResourceRates)[]).map((key) => {
                                const value = dailyProduction[key];
                                const maxValue = Math.max(...Object.values(dailyProduction), 1);
                                const pct = (value / maxValue) * 100;
                                const isBottleneck = key === bottleneckResource;

                                return (
                                    <div key={key}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className={`font-bold capitalize ${isBottleneck ? "text-red-400" : RESOURCE_COLORS[key].text}`}>
                                                {key} {isBottleneck && "(bottleneck)"}
                                            </span>
                                            <span className="font-mono text-zinc-300">{formatNumber(value)}</span>
                                        </div>
                                        <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className={`h-full transition-all duration-500 ${isBottleneck ? "bg-red-500" : RESOURCE_COLORS[key].bar}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="glass-panel rounded-2xl p-6 border border-amber-500/20">
                        <h2 className="text-lg font-bold text-white mb-4">Banner Output</h2>
                        <div className="text-center py-6">
                            <p className="text-5xl font-bold text-amber-400 font-mono">
                                {bannersPerDay.bottleneck.toFixed(2)}
                            </p>
                            <p className="text-zinc-400 text-sm mt-2">banners per day</p>
                            <p className="text-zinc-500 text-xs mt-1">
                                ~{(bannersPerDay.bottleneck * 7).toFixed(1)} per week
                                / ~{(bannersPerDay.bottleneck * 30).toFixed(0)} per month
                            </p>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-4">
                            {(Object.keys(bannersPerDay.perResource) as (keyof ResourceRates)[]).map((key) => (
                                <div key={key} className={`rounded-lg p-3 text-center ${RESOURCE_COLORS[key].bg}`}>
                                    <p className={`text-lg font-bold font-mono ${RESOURCE_COLORS[key].text}`}>
                                        {bannersPerDay.perResource[key].toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold">{key}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Profiles Sidebar */}
                <div className="space-y-6">
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Save className="h-5 w-5 text-[#38bdf8]" /> Saved Profiles
                        </h2>

                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                placeholder="Profile name"
                                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#38bdf8]/50"
                                onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                            />
                            <button onClick={saveProfile} className="btn-frost px-3 py-2 rounded-lg text-sm font-bold">
                                Save
                            </button>
                        </div>

                        {profiles.length === 0 ? (
                            <p className="text-zinc-600 text-sm italic">No saved profiles</p>
                        ) : (
                            <div className="space-y-2">
                                {profiles.map((profile) => (
                                    <div
                                        key={profile.name}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                                    >
                                        <button
                                            onClick={() => loadProfile(profile)}
                                            className="text-left text-sm text-white hover:text-[#38bdf8] transition-colors font-medium"
                                        >
                                            {profile.name}
                                        </button>
                                        <button
                                            onClick={() => deleteProfile(profile.name)}
                                            className="text-zinc-600 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={exportProfiles}
                                    className="w-full mt-2 text-xs text-zinc-500 hover:text-white transition-colors flex items-center justify-center gap-1 py-2 border border-white/5 rounded-lg hover:bg-white/5"
                                >
                                    <Download className="h-3 w-3" /> Export Profiles
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Banner Cost Reference */}
                    <div className="glass-panel rounded-2xl p-6">
                        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Banner Cost</h2>
                        <div className="space-y-2">
                            {(Object.keys(BANNER_COSTS) as (keyof ResourceRates)[]).map((key) => (
                                <div key={key} className="flex justify-between text-sm">
                                    <span className={`capitalize ${RESOURCE_COLORS[key].text}`}>{key}</span>
                                    <span className="font-mono text-zinc-300">{formatNumber(BANNER_COSTS[key])}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
