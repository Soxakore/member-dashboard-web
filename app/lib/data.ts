import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient(); // In prod, use a singleton pattern to avoid connection limits

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

    return {
        user,
        upcomingEvents,
        recentPosts,
    };
}
