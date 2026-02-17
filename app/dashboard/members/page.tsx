import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Shield, User } from "lucide-react";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function MembersPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/dashboard");

    const users = await prisma.user.findMany({
        orderBy: { power: "desc" },
    });

    return (
        <div className="p-8 max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white">Alliance Roster</h1>
                    <p className="text-zinc-400">Personnel management and hierarchy.</p>
                </div>
            </div>

            <div className="grid gap-4">
                {users.map((member) => (
                    <div key={member.id} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-[#2b8cee]">
                                {member.username?.[0] || "U"}
                            </div>
                            <div>
                                <h3 className="font-bold text-white">{member.username || "Unknown Operative"}</h3>
                                <p className="text-xs text-zinc-500 font-mono">ID: {member.loginId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-zinc-500">Power</p>
                                <p className="font-mono text-[#2b8cee]">{member.power?.toString() || "0"}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold border ${member.role === "R5" ? "bg-amber-500/20 border-amber-500/50 text-amber-500" :
                                    member.role === "R4" ? "bg-purple-500/20 border-purple-500/50 text-purple-500" :
                                        "bg-blue-500/20 border-blue-500/50 text-blue-500"
                                }`}>
                                {member.role}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
