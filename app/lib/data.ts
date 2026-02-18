import { auth } from "@/auth";
import { prisma } from "./prisma";

export async function getDashboardData() {
    const session = await auth();
    if (!session?.user?.email) return null; // Email maps to loginId

    const user = await prisma.user.findUnique({
        where: { loginId: session.user.email },
        include: {
            attending: {
                include: {
                    event: true,
                },
            },
            createdEvents: true,
        },
    });

    if (!user) return null;

    // Fetch upcoming events (all)
    const upcomingEvents = await prisma.event.findMany({
        where: {
            startTime: {
                gte: new Date(),
            },
        },
        orderBy: {
            startTime: "asc",
        },
        take: 5,
        include: {
            _count: {
                select: { attendees: true },
            },
        },
    });

    // Fetch recent posts
    const recentPosts = await prisma.post.findMany({
        orderBy: {
            createdAt: "desc",
        },
        take: 3,
        include: {
            author: {
                select: { username: true, role: true }
            }
        }
    });

    // Member stats
    const totalMembers = await prisma.user.count();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const newMembersToday = await prisma.user.count({
        where: { createdAt: { gte: todayStart } },
    });

    // Next event countdown
    const nextEvent = upcomingEvents[0] || null;

    // Active war (most recent WAR event happening now or in near future)
    const activeWar = await prisma.event.findFirst({
        where: {
            type: "WAR",
            startTime: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // within last 24h
            },
        },
        orderBy: { startTime: "asc" },
        include: {
            _count: { select: { attendees: true } },
        },
    });

    return {
        user,
        upcomingEvents,
        recentPosts,
        totalMembers,
        newMembersToday,
        nextEvent,
        activeWar,
    };
}
