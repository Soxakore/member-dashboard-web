import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { Calendar, Clock, MapPin, Users, Plus } from "lucide-react";
import Link from "next/link";
import { EventSignupButton } from "./signup-button";
import { EventFilters } from "./event-filters";

export default async function EventsPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string; time?: string }>;
}) {
    const session = await auth();
    if (!session?.user?.email) return null;

    const params = await searchParams;

    const user = await prisma.user.findUnique({
        where: { loginId: session.user.email },
    });

    const now = new Date();
    const timeFilter = params.time || "upcoming";
    const typeFilter = params.type || "ALL";

    const events = await prisma.event.findMany({
        where: {
            ...(typeFilter !== "ALL" ? { type: typeFilter } : {}),
            ...(timeFilter === "upcoming" ? { startTime: { gte: now } } : {}),
            ...(timeFilter === "past" ? { startTime: { lt: now } } : {}),
        },
        orderBy: { startTime: timeFilter === "past" ? "desc" : "asc" },
        include: {
            attendees: {
                where: { userId: user?.id },
            },
            _count: {
                select: { attendees: true },
            },
            creator: {
                select: { username: true },
            },
        },
    });

    const isAdmin = user?.role === "R4" || user?.role === "R5";

    // Get counts for filter badges
    const allCount = await prisma.event.count();
    const warCount = await prisma.event.count({ where: { type: "WAR" } });
    const gatheringCount = await prisma.event.count({ where: { type: "GATHERING" } });
    const socialCount = await prisma.event.count({ where: { type: "SOCIAL" } });
    const defenseCount = await prisma.event.count({ where: { type: "DEFENSE" } });

    return (
        <div className="max-w-6xl mx-auto p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Operation Calendar</h1>
                    <p className="text-zinc-400">Coordinate and conquer.</p>
                </div>
                {isAdmin && (
                    <Link href="/dashboard/events/create" className="btn-frost px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors">
                        <Plus className="h-5 w-5" /> Create Event
                    </Link>
                )}
            </div>

            {/* Filters */}
            <EventFilters
                activeType={typeFilter}
                activeTime={timeFilter}
                counts={{ all: allCount, war: warCount, gathering: gatheringCount, social: socialCount, defense: defenseCount }}
            />

            <div className="grid gap-6 mt-6">
                {events.length === 0 ? (
                    <div className="text-center py-12 glass-panel rounded-xl">
                        <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-zinc-400">No Operations Found</h3>
                        <p className="text-zinc-500">
                            {typeFilter !== "ALL"
                                ? `No ${typeFilter.toLowerCase()} events ${timeFilter === "past" ? "in the past" : "scheduled"}.`
                                : "Check back later or mobilize your team."}
                        </p>
                    </div>
                ) : (
                    events.map((event) => {
                        const isAttending = event.attendees.length > 0;
                        const isPast = new Date(event.startTime) < now;

                        return (
                            <div key={event.id} className={`glass-panel border ${isAttending ? "border-[#38bdf8]/30" : "border-white/5"} rounded-xl p-6 flex flex-col md:flex-row gap-6 transition-all hover:bg-white/5 relative overflow-hidden group ${isPast ? "opacity-60" : ""}`}>
                                {isAttending && (
                                    <div className="absolute top-0 right-0 bg-[#38bdf8] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                                        Registered
                                    </div>
                                )}

                                {/* Date Box */}
                                <div className="flex md:flex-col items-center justify-center bg-black/40 rounded-lg p-4 w-full md:w-24 shrink-0 text-center border border-white/5">
                                    <span className="text-red-500 font-bold uppercase text-xs md:mb-1">{new Date(event.startTime).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-3xl font-bold text-white">{new Date(event.startTime).getDate()}</span>
                                    <span className="text-zinc-500 text-xs md:mt-1">{new Date(event.startTime).toLocaleString('default', { weekday: 'short' })}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                            event.type === "WAR" ? "bg-red-500/20 text-red-400" :
                                            event.type === "GATHERING" ? "bg-green-500/20 text-green-400" :
                                            event.type === "DEFENSE" ? "bg-purple-500/20 text-purple-400" :
                                            "bg-blue-500/20 text-blue-400"
                                        }`}>
                                            {event.type}
                                        </span>
                                        <span className="text-zinc-500 text-xs flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                                        </span>
                                        {isPast && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400">
                                                Ended
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#38bdf8] transition-colors">{event.title}</h3>
                                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{event.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="h-4 w-4" />
                                            {event.location || "TBD"}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Users className="h-4 w-4" />
                                            {event._count.attendees} Operatives
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-zinc-600">By {event.creator.username}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center">
                                    <EventSignupButton eventId={event.id} isAttending={isAttending} isPast={isPast} />
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export const dynamic = 'force-dynamic';
