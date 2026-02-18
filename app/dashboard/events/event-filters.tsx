"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";

interface EventFiltersProps {
    activeType: string;
    activeTime: string;
    counts: {
        all: number;
        war: number;
        gathering: number;
        social: number;
        defense: number;
    };
}

const TYPE_FILTERS = [
    { key: "ALL", label: "All", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
    { key: "WAR", label: "War", color: "bg-red-500/20 text-red-400 border-red-500/30" },
    { key: "GATHERING", label: "Gathering", color: "bg-green-500/20 text-green-400 border-green-500/30" },
    { key: "SOCIAL", label: "Social", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { key: "DEFENSE", label: "Defense", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

const TIME_FILTERS = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "all", label: "All Time" },
];

export function EventFilters({ activeType, activeTime, counts }: EventFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "ALL" && key === "type") {
            params.delete("type");
        } else if (value === "upcoming" && key === "time") {
            params.delete("time");
        } else {
            params.set(key, value);
        }
        router.push(`/dashboard/events?${params.toString()}`);
    };

    const countMap: Record<string, number> = {
        ALL: counts.all,
        WAR: counts.war,
        GATHERING: counts.gathering,
        SOCIAL: counts.social,
        DEFENSE: counts.defense,
    };

    return (
        <div className="space-y-3">
            {/* Time Filter */}
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-1">Show:</span>
                {TIME_FILTERS.map((filter) => (
                    <button
                        key={filter.key}
                        onClick={() => updateFilter("time", filter.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            activeTime === filter.key
                                ? "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30"
                                : "text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-4 w-4 text-zinc-500 mr-1" />
                {TYPE_FILTERS.map((filter) => (
                    <button
                        key={filter.key}
                        onClick={() => updateFilter("type", filter.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 ${
                            activeType === filter.key
                                ? filter.color + " border"
                                : "text-zinc-500 border-white/5 hover:text-white hover:border-white/10"
                        }`}
                    >
                        {filter.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            activeType === filter.key ? "bg-white/10" : "bg-white/5"
                        }`}>
                            {countMap[filter.key] || 0}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
