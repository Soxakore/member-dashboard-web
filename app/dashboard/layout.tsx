import Link from "next/link";
import { Shield, LayoutDashboard, Calendar, Users, Settings, LogOut, Map } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-transparent">
            {/* Sidebar */}
            <aside className="w-72 flex flex-col glass-panel border-r border-white/10 relative z-20">
                <div className="p-6 flex items-center gap-3 font-bold text-2xl tracking-tighter border-b border-white/10 bg-black/20">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0284c7] flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    <span>WAR<span className="text-[#38bdf8]">RIORS</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 mt-2">Operations</p>
                    <NavLink href="/dashboard" icon={LayoutDashboard} label="Command Center" />
                    <NavLink href="/dashboard/map" icon={Map} label="Tactical Map" />
                    <NavLink href="/dashboard/events" icon={Calendar} label="Events Calendar" />

                    <p className="px-4 text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 mt-6">Personnel</p>
                    <NavLink href="/dashboard/members" icon={Users} label="Alliance Roster" />
                    <NavLink href="/dashboard/profile" icon={Settings} label="My Profile" />
                </nav>


            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto relative z-10 scroll-smooth">
                {children}
            </main>
        </div>
    );
}

function NavLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    return (
        <Link href={href} className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all hover:translate-x-1 group">
            <Icon className="h-5 w-5 text-zinc-500 group-hover:text-[#38bdf8] transition-colors" />
            <span className="font-medium">{label}</span>
        </Link>
    );
}
