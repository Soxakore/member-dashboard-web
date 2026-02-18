"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

function generateRandomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString(); // 4 digit PIN
}

async function generateUniqueId() {
    // Simple ID generation logic: P + random 4 digits
    // In prod, check fo collisions
    let id = "P" + Math.floor(1000 + Math.random() * 9000).toString();
    let exists = await prisma.user.findUnique({ where: { loginId: id } });
    while (exists) {
        id = "P" + Math.floor(1000 + Math.random() * 9000).toString();
        exists = await prisma.user.findUnique({ where: { loginId: id } });
    }
    return id;
}

export async function generateInvite(role: string = "R1") {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    // Verify Admin Role
    const currentUser = await prisma.user.findUnique({ where: { loginId: session.user.email } });
    if (!currentUser || (currentUser.role !== "R4" && currentUser.role !== "R5")) {
        return { error: "Insufficient permissions" };
    }

    const loginId = await generateUniqueId();
    const pin = generateRandomPin();
    const pinHash = await bcrypt.hash(pin, 10);

    try {
        await prisma.user.create({
            data: {
                loginId,
                pinHash,
                username: "Recruit", // Placeholder
                role: role,
                furnaceLevel: 1,
                power: 0,
            },
        });

        revalidatePath("/dashboard/admin");
        return { success: true, loginId, pin };
    } catch (error) {
        console.error("Invite generation error:", error);
        return { error: "Failed to generate invite" };
    }
}
