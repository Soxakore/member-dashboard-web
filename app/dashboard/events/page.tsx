import { Calendar, Filter, Plus } from "lucide-react";

export default function EventsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Events Calendar</h1>
                    <p className="text-zinc-400">Manage and coordinate alliance activities.</p>
                </div>
                <button className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Create Event
                </button>
            </header>

            {/* Calendar Grid Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 bg-zinc-900/50 border border-white/5 rounded-xl p-6 min-h-[600px]">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">February 2026</h2>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/5 rounded-lg"><Filter className="h-4 w-4" /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-zinc-800 rounded-lg overflow-hidden border border-zinc-800">
                        {/* Days Header */}
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="bg-zinc-900 p-2 text-center text-sm font-medium text-zinc-400">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Days (Mockup) */}
                        {Array.from({ length: 35 }).map((_, i) => {
                            const day = i - 2; // Offset for visually pleasing start
                            const isToday = day === 17;
                            return (
                                <div key={i} className={`bg-zinc-900/80 p-2 h-32 hover:bg-zinc-900 transition-colors ${day <= 0 || day > 28 ? 'text-zinc-700 bg-zinc-950/50' : 'text-zinc-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-sm ${isToday ? 'bg-[#2b8cee] text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                                            {day > 0 && day <= 28 ? day : ''}
                                        </span>
                                    </div>
                                    {day === 18 && (
                                        <div className="mt-2 text-xs bg-red-500/20 text-red-300 p-1 rounded border-l-2 border-red-500 truncate">
                                            War vs Crimson
                                        </div>
                                    )}
                                    {day === 20 && (
                                        <div className="mt-2 text-xs bg-blue-500/20 text-blue-300 p-1 rounded border-l-2 border-blue-500 truncate">
                                            Defense Drill
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-6">
                        <h3 className="font-bold mb-4">Upcoming</h3>
                        {/* Similar list to dashboard */}
                        <div className="space-y-4">
                            <div className="border-l-2 border-[#2b8cee] pl-3 py-1">
                                <p className="text-sm font-bold text-white">Alliance Stream</p>
                                <p className="text-xs text-zinc-500">Today, 20:00 UTC</p>
                            </div>
                            <div className="border-l-2 border-red-500 pl-3 py-1">
                                <p className="text-sm font-bold text-white">WAR vs Crimson</p>
                                <p className="text-xs text-zinc-500">Tomorrow, 18:00 UTC</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
