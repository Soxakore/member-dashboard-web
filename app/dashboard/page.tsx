import { Shield, Trophy, Users, ArrowUpRight, Calendar, Activity, Flame, Radio } from "lucide-react";
import { getDashboardData } from "../lib/data";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
    const data = await getDashboardData();
    if (!data) redirect("/login");

    const { user, upcomingEvents, recentPosts } = data;

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 uppercase tracking-wider">
                            Sector 72 • Command Node
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold text-green-500">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            ONLINE
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white mb-1">
                        Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] to-white">{user.username}</span>
                    </h1>
                    <p className="text-zinc-400 flex items-center gap-2">
                        Rank: <span className="text-white font-mono font-bold">[{user.role}]</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                        Status: <span className="text-emerald-400 shadow-emerald-500/50">Optimal</span>
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Next Event</p>
                        <p className="font-mono text-xl font-bold text-[#38bdf8]">04:23:51</p>
                    </div>
                    <Link href="/dashboard/events/create" className="btn-frost px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-transform active:scale-95">
                        <Radio className="h-4 w-4" /> Initiate Ops
                    </Link>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Flame}
                    label="Furnace Level"
                    value={`Lv. ${user.furnaceLevel || "N/A"}`}
                    color="text-orange-500"
                    bg="bg-orange-500/10"
                />
                <StatCard
                    icon={Activity}
                    label="Total Power"
                    value={(user.power || 0).toLocaleString()}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    icon={Trophy}
                    label="Alliance Rank"
                    value="#4"
                    subValue="Top 1%"
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
                <StatCard
                    icon={Users}
                    label="Active Members"
                    value="98/100"
                    subValue="+2 today"
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Ops & Intel */}
                <div className="xl:col-span-2 space-y-8">
                    {/* Active War Banner */}
                    <div className="relative group overflow-hidden rounded-2xl border border-[#38bdf8]/30">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0c4a6e] to-[#0f172a] opacity-90"></div>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547891654-e66ed7ebb968?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-40"></div>

                        <div className="relative p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded animate-pulse">
                                        Live Combat
                                    </span>
                                    <span className="text-[#38bdf8] text-xs font-mono">OP-ALPHA-7</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">Operation: Crimson Fall</h3>
                                <p className="text-blue-200 max-w-lg">
                                    Targeting high-value fortress assets in Sector 4. All R3+ members required to mobilize immediately.
                                </p>
                            </div>
                            <button className="whitespace-nowrap bg-white text-[#0c4a6e] hover:bg-blue-50 px-6 py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2">
                                Join Rally <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Intel Feed */}
                    <div className="glass-panel rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Radio className="h-5 w-5 text-[#38bdf8]" /> Latest Intel
                            </h3>
                            <Link href="/dashboard/news" className="text-sm text-zinc-400 hover:text-white transition-colors">View All</Link>
                        </div>

                        <div className="space-y-4">
                            {recentPosts.length === 0 ? (
                                <p className="text-zinc-500 italic">No recent communications.</p>
                            ) : (
                                recentPosts.map((post) => (
                                    <div key={post.id} className="group p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#38bdf8]/30 transition-all cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-lg group-hover:text-[#38bdf8] transition-colors">{post.title}</h4>
                                            <span className="text-xs font-mono text-zinc-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{post.content}</p>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <div className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold text-[10px]">
                                                {post.author.username?.[0]}
                                            </div>
                                            <span>{post.author.username}</span>
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{post.author.role}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Events & Status */}
                <div className="space-y-6">
                    <div className="glass-panel rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-[#38bdf8]" /> Schedule
                        </h3>
                        <div className="space-y-1">
                            {upcomingEvents.length === 0 ? (
                                <p className="text-zinc-500 text-sm">No scheduled ops.</p>
                            ) : (
                                upcomingEvents.map((event, i) => (
                                    <div key={event.id} className="relative pl-6 py-3 border-l-2 border-[#38bdf8]/20 last:pb-0 hover:border-[#38bdf8] transition-colors group">
                                        <div className="absolute -left-[5px] top-5 w-2.5 h-2.5 rounded-full bg-[#0b1120] border-2 border-[#38bdf8] group-hover:bg-[#38bdf8] transition-colors"></div>
                                        <p className="text-xs font-bold text-[#38bdf8] mb-0.5 uppercase tracking-wide">
                                            {event.type} • {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <h4 className="font-bold text-white leading-tight">{event.title}</h4>
                                        <p className="text-xs text-zinc-500 mt-1">Tomorrow</p>
                                    </div>
                                ))
                            )}
                        </div>
                        <Link href="/dashboard/events" className="block mt-6 text-center text-sm font-bold text-zinc-400 hover:text-white py-2 border border-white/5 rounded-lg hover:bg-white/5 transition-colors">
                            Full Calendar
                        </Link>
                    </div>

                    {/* Compact Profile/Resources */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold mb-4 text-zinc-400 text-sm uppercase tracking-wider">Resource stockpile</h3>
                        <div className="space-y-3">
                            <ResourceBar label="Meat" value="12.5M" progress={80} color="bg-orange-500" />
                            <ResourceBar label="Wood" value="8.2M" progress={65} color="bg-amber-600" />
                            <ResourceBar label="Coal" value="4.1M" progress={40} color="bg-zinc-500" />
                            <ResourceBar label="Iron" value="1.2M" progress={20} color="bg-slate-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, subValue, color, bg }: any) {
    return (
        <div className="glass-panel p-6 rounded-2xl hover:bg-white/5 transition-colors group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon className="w-16 h-16" />
            </div>
            <div className="relative">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${bg} ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <p className="text-zinc-400 text-sm font-medium">{label}</p>
                <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                    {subValue && <span className={`text-xs font-bold mb-1 ${color}`}>{subValue}</span>}
                </div>
            </div>
        </div>
    )
}

function ResourceBar({ label, value, progress, color }: any) {
    return (
        <div>
            <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-zinc-300">{label}</span>
                <span className="text-[#38bdf8] font-mono">{value}</span>
            </div>
            <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <div className={`h-full ${color}`} style={{ width: `${progress}%` }}></div>
            </div>
        </div>
    )
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
