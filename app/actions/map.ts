"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createMapLocation(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
    // Allow all members to pin? Or just R4/R5? Let's say R3+ can pin for now.
    if (!user || user.role === "R1" || user.role === "R2") {
        // Actually, maybe R3+ is good. Let's restrict to R3+
        // But wait, user requirements didn't specify. Let's allow everyone to pin for now to encourage engagement, 
        // or maybe restrict deleting to creators/admins.
        // Let's stick to R3+ for creating to prevent spam.
        if (user?.role === "R1" || user?.role === "R2") {
            return { error: "Insufficient rank (R3+ required)" };
        }
    }

    const x = parseFloat(formData.get("x") as string);
    const y = parseFloat(formData.get("y") as string);
    const label = formData.get("label") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;

    if (isNaN(x) || isNaN(y) || !type) {
        return { error: "Invalid data" };
    }

    try {
        await prisma.mapLocation.create({
            data: {
                x,
                y,
                label,
                type,
                description,
                createdById: user!.id,
            },
        });

        revalidatePath("/dashboard/map");
        return { success: true };
    } catch (error) {
        console.error("Create map location error:", error);
        return { error: "Failed to create pin" };
    }
}

export async function deleteMapLocation(locationId: string) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
    if (!user) return { error: "User not found" };

    try {
        const location = await prisma.mapLocation.findUnique({ where: { id: locationId } });
        if (!location) return { error: "Location not found" };

        // Only Creator or R4/R5 can delete
        if (location.createdById !== user.id && user.role !== "R4" && user.role !== "R5") {
            return { error: "Permission denied" };
        }

        await prisma.mapLocation.delete({ where: { id: locationId } });
        revalidatePath("/dashboard/map");
        return { success: true };
    } catch (error) {
        console.error("Delete map location error:", error);
        return { error: "Failed to delete pin" };
    }
}
