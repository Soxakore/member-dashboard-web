import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { InteractiveMap } from "./interactive-map"; // Client component
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function MapPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { loginId: session.user.email },
    });

    if (!user) redirect("/login");

    const locations = await prisma.mapLocation.findMany({
        include: {
            createdBy: {
                select: { username: true, role: true }
            }
        }
    });

    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/10 bg-black z-10 flex justify-between items-center shadow-md">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        Tactical Map <span className="bg-[#2b8cee] text-white text-xs px-2 py-0.5 rounded">LIVE</span>
                    </h1>
                    <p className="text-zinc-400 text-xs">Sector 72 • Icefield Plateau</p>
                </div>
                <div className="flex gap-4 text-xs font-mono text-zinc-500">
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Enemy</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Resource</div>
                    <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Ally</div>
                </div>
            </div>

            <div className="flex-1 relative bg-[#0f1115] overflow-hidden">
                <InteractiveMap locations={locations} currentUser={user} />
            </div>
        </div>
    );
}
