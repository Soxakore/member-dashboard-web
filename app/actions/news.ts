"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function createPost(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) return { error: "Unauthorized" };

    const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
    if (!user || user.role === "R1") { // R2+ can post? Or just R4/R5? Let's say R4+ for News, maybe R3 for Guides.
        if (user?.role !== "R4" && user?.role !== "R5") {
            return { error: "Insufficient rank (R4+ required)" };
        }
    }

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const type = formData.get("type") as string; // NEWS or GUIDE

    if (!title || !content || !type) {
        return { error: "Missing required fields" };
    }

    try {
        await prisma.post.create({
            data: {
                title,
                content,
                type,
                minRole: "R1", // Default visible to all
                authorId: user!.id,
            },
        });

        revalidatePath("/dashboard/news");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Create post error:", error);
        return { error: "Failed to create post" };
    }
}
