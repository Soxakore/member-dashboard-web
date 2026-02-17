import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { GenerateInviteForm } from "./invite-form"; // Client component

const prisma = new PrismaClient();

export default async function AdminPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    // Fetch full user to check role
    const user = await prisma.user.findUnique({
        where: { loginId: session.user.email },
    });

    if (!user || (user.role !== "R5" && user.role !== "R4")) {
        return (
            <div className="p-8 text-center text-red-500">
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="mt-2">You do not have clearance level R4 or R5.</p>
            </div>
        );
    }

    // Fetch recent members to display
    const recentMembers = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
    });

    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8 text-[#2b8cee]">Administration Deck</h1>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Invite Generator */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Generate New Operative ID</h2>
                    <p className="text-sm text-zinc-400 mb-6">
                        Create a new member credentials. The generated PIN will only be shown once.
                    </p>
                    <GenerateInviteForm />
                </div>

                {/* Recent Joins */}
                <div className="bg-zinc-900 border border-white/10 rounded-xl p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Recruits</h2>
                    <div className="space-y-4">
                        {recentMembers.map((member) => (
                            <div key={member.id} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0">
                                <div>
                                    <p className="font-bold text-white">{member.username || "Unknown"}</p>
                                    <p className="text-xs text-zinc-500 font-mono">{member.loginId}</p>
                                </div>
                                <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">{member.role}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
