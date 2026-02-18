"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const username = formData.get("username") as string;
    const avatarUrl = formData.get("avatarUrl") as string;

    if (!username) return { error: "Username is required" };

    try {
        await prisma.user.update({
            where: { loginId: session.user.email },
            data: {
                username,
                avatarUrl: avatarUrl || null,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/profile");
        return { success: "Profile updated successfully" };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Failed to update profile" };
    }
}
