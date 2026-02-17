import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { ProfileForm } from "./profile-form"; // We'll create this client component

const prisma = new PrismaClient();

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/dashboard");

    const user = await prisma.user.findUnique({
        where: { loginId: session.user.email },
    });

    if (!user) redirect("/login");

    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Operative Profile</h1>

            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-8">
                <div className="mb-8 flex items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-zinc-800 border-2 border-[#2b8cee] flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.username || "User"} className="h-full w-full object-cover" />
                        ) : (
                            <span className="text-3xl font-bold text-[#2b8cee]">{user.username?.[0] || "U"}</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{user.username}</h2>
                        <p className="text-zinc-400 font-mono">ID: {user.loginId} • Role: {user.role}</p>
                    </div>
                </div>

                <ProfileForm user={user} />
            </div>
        </div>
    );
}
