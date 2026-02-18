"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
    Shield,
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    Map,
    Swords,
    BarChart3,
    Calculator,
    Crosshair,
    Newspaper,
    ShieldCheck,
    Menu,
    X,
} from "lucide-react";

const NAV_SECTIONS = [
    {
        label: "Operations",
        items: [
            { href: "/dashboard", icon: LayoutDashboard, label: "Command Center" },
            { href: "/dashboard/map", icon: Map, label: "Tactical Map" },
            { href: "/dashboard/events", icon: Calendar, label: "Events Calendar" },
            { href: "/dashboard/news", icon: Newspaper, label: "Intel Feed" },
        ],
    },
    {
        label: "Tools",
        items: [
            { href: "/dashboard/tools/rally-tracker", icon: Crosshair, label: "Rally Tracker", color: "text-rose-400" },
            { href: "/dashboard/tools/troop-stats", icon: BarChart3, label: "Troop Stats", color: "text-emerald-400" },
            { href: "/dashboard/tools/rss-calculator", icon: Calculator, label: "RSS Calculator", color: "text-amber-400" },
            { href: "/dashboard/tools/formation-builder", icon: Swords, label: "Formation Builder", color: "text-indigo-400" },
        ],
    },
    {
        label: "Personnel",
        items: [
            { href: "/dashboard/members", icon: Users, label: "Alliance Roster" },
            { href: "/dashboard/profile", icon: Settings, label: "My Profile" },
            { href: "/dashboard/admin", icon: ShieldCheck, label: "Admin Panel" },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    const sidebarContent = (
        <>
            <div className="p-6 flex items-center justify-between border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0284c7] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <span>WAR<span className="text-[#38bdf8]">RIORS</span></span>
                </div>
                <button
                    className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-zinc-400"
                    onClick={() => setMobileOpen(false)}
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {NAV_SECTIONS.map((section) => (
                    <div key={section.label}>
                        <p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 mt-4">
                            {section.label}
                        </p>
                        {section.items.map((item) => {
                            const active = isActive(item.href);
                            const iconColor = (item as any).color;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
                                        active
                                            ? "bg-[#38bdf8]/10 text-white border border-[#38bdf8]/20"
                                            : "text-zinc-400 hover:text-white hover:bg-white/5 hover:translate-x-1"
                                    }`}
                                >
                                    <item.icon
                                        className={`h-5 w-5 transition-colors ${
                                            active
                                                ? iconColor || "text-[#38bdf8]"
                                                : iconColor
                                                    ? `${iconColor} opacity-60 group-hover:opacity-100`
                                                    : "text-zinc-500 group-hover:text-[#38bdf8]"
                                        }`}
                                    />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="px-4 py-3 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-1">Alliance Status</p>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-400 font-bold">All Systems Online</span>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 font-bold text-lg tracking-tighter">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0284c7] flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                    </div>
                    <span>WAR<span className="text-[#38bdf8]">RIORS</span></span>
                </div>
                <button
                    className="p-2 rounded-lg hover:bg-white/10 text-zinc-400"
                    onClick={() => setMobileOpen(true)}
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>

            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`lg:hidden fixed top-0 left-0 bottom-0 w-72 glass-panel border-r border-white/10 z-50 flex flex-col transform transition-transform duration-300 ${
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {sidebarContent}
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-72 flex-col glass-panel border-r border-white/10 relative z-20">
                {sidebarContent}
            </aside>
        </>
    );
}
