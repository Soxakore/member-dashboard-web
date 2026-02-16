import Link from "next/link";
import { Shield, LayoutDashboard, Calendar, Users, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 flex flex-col">
                <div className="p-6 flex items-center gap-2 font-bold text-xl tracking-tighter border-b border-white/10">
                    <Shield className="h-6 w-6 text-[#2b8cee]" />
                    <span>WAR<span className="text-[#2b8cee]">RIORS</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 text-white border border-white/5 hover:bg-white/10 transition-colors">
                        <LayoutDashboard className="h-5 w-5 text-[#2b8cee]" />
                        <span className="font-medium">Command Center</span>
                    </Link>
                    <Link href="/dashboard/events" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Calendar className="h-5 w-5" />
                        <span className="font-medium">Events</span>
                    </Link>
                    <Link href="/dashboard/members" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Users className="h-5 w-5" />
                        <span className="font-medium">Members</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors mb-2">
                        <Settings className="h-5 w-5" />
                        <span className="font-medium">Settings</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                        <LogOut className="h-5 w-5" />
                        <span className="font-medium">Logout</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
