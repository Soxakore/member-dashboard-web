import { Shield, Trophy, Users, Clock, ArrowUpRight, Calendar } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Command Center</h1>
                    <p className="text-zinc-400">Welcome back, Commander. Alliance status is <span className="text-green-500 font-bold">OPTIMAL</span>.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-zinc-400">Next War</p>
                        <p className="font-bold text-[#2b8cee]">04:23:51</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                        <Shield className="h-5 w-5 text-[#2b8cee]" />
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                    { icon: Trophy, label: "Alliance Rank", value: "#4", change: "+2", color: "text-amber-400" },
                    { icon: Users, label: "Members", value: "98/100", change: "Full soon", color: "text-blue-400" },
                    { icon: Shield, label: "War Wins", value: "142", change: "+12 streak", color: "text-green-400" },
                    { icon: Clock, label: "Activity Score", value: "94%", change: "Top 5%", color: "text-purple-400" },
                ].map((stat, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:bg-zinc-900 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-white/5 ${stat.color}`}>{stat.change}</span>
                        </div>
                        <p className="text-zinc-400 text-sm mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Operations */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Active Operations <span className="text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">LIVE</span>
                    </h2>

                    <div className="bg-gradient-to-r from-[#2b8cee]/20 to-transparent border-l-4 border-[#2b8cee] rounded-r-xl p-6 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="h-4 w-4 text-[#2b8cee]" />
                                    <span className="text-[#2b8cee] font-bold text-sm tracking-wider uppercase">War Declaration</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-1">VS. Crimson Legion</h3>
                                <p className="text-zinc-400 text-sm">Target: Fortress Alpha • Sector 7</p>
                            </div>
                            <button className="bg-[#2b8cee] hover:bg-[#2b8cee]/90 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-[#2b8cee]/20 flex items-center gap-2">
                                Join Operation <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                        <h3 className="font-bold mb-4">Training Tasks</h3>
                        <div className="space-y-4">
                            {[
                                { label: "Train 5,000 T5 Troops", progress: "80%", width: "w-4/5" },
                                { label: "Donate to Alliance Tech", progress: "4/10", width: "w-2/5" },
                                { label: "Gather 2M Resources", progress: "Completed", width: "w-full", color: "bg-green-500" },
                            ].map((task, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-zinc-300">{task.label}</span>
                                        <span className="text-zinc-500">{task.progress}</span>
                                    </div>
                                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${task.color || 'bg-[#2b8cee]'} ${task.width}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar Widgets */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
                        <div className="space-y-4">
                            {[
                                { title: "Fortress Defense", time: "Tomorrow, 18:00", type: "Defense", color: "text-blue-400" },
                                { title: "Weekly Raid", time: "Sat, 15:00 UTC", type: "Raid", color: "text-purple-400" },
                                { title: "Member Meeting", time: "Sun, 20:00 UTC", type: "Social", color: "text-green-400" },
                            ].map((event, i) => (
                                <div key={i} className="flex gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="bg-zinc-800 h-10 w-10 rounded-lg flex items-center justify-center shrink-0">
                                        <Calendar className="h-5 w-5 text-zinc-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">{event.title}</h4>
                                        <p className="text-xs text-zinc-500 mt-0.5">{event.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
