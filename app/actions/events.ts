"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createEvent(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    // Verify Role
    const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
    if (!user || (user.role !== "R4" && user.role !== "R5")) {
        return { error: "Insufficient permissions" };
    }

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const startTime = formData.get("startTime") as string;
    const type = formData.get("type") as string;
    const location = formData.get("location") as string;

    if (!title || !startTime || !type) {
        return { error: "Missing required fields" };
    }

    try {
        await prisma.event.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                type,
                location,
                userId: user.id,
            },
        });

        revalidatePath("/dashboard/events");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Create event error:", error);
        return { error: "Failed to create event" };
    }
}

export async function toggleAttendance(eventId: string) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
    if (!user) return { error: "User not found" };

    try {
        const existing = await prisma.eventAttendee.findUnique({
            where: {
                userId_eventId: {
                    userId: user.id,
                    eventId,
                },
            },
        });

        if (existing) {
            // Unsubscribe
            await prisma.eventAttendee.delete({
                where: { id: existing.id },
            });
            revalidatePath("/dashboard/events");
            return { status: "removed" };
        } else {
            // Subscribe
            await prisma.eventAttendee.create({
                data: {
                    userId: user.id,
                    eventId,
                },
            });
            revalidatePath("/dashboard/events");
            return { status: "added" };
        }
    } catch (error) {
        console.error("Attendance error:", error);
        return { error: "Failed to update attendance" };
    }
}
