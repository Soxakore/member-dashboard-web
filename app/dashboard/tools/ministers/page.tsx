import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { Crown } from "lucide-react";
import { MinisterScheduleView } from "./minister-grid";

export default async function MinistersPage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { loginId: session.user.email },
    include: { playerFids: true },
  });
  if (!user) return null;

  // Get current week's Monday
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(now);
  weekStart.setUTCDate(diff);
  weekStart.setUTCHours(0, 0, 0, 0);

  const slots = await prisma.ministerSlot.findMany({
    where: { weekStart },
    include: {
      playerFid: { select: { nickname: true, fid: true } },
      assignedBy: { select: { username: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { timeSlot: "asc" }],
  });

  const isAdmin = user.role === "R4" || user.role === "R5";
  const canAssign = user.role !== "R1" && user.role !== "R2";

  const serializedSlots = slots.map((s) => ({
    id: s.id,
    position: s.position,
    dayOfWeek: s.dayOfWeek,
    timeSlot: s.timeSlot,
    playerNickname: s.playerFid?.nickname || null,
    playerFid: s.playerFid?.fid || null,
    assignedBy: s.assignedBy?.username || null,
  }));

  const serializedFids = user.playerFids.map((f) => ({
    id: f.id,
    fid: f.fid,
    nickname: f.nickname,
  }));

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Crown className="h-5 w-5 text-yellow-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Minister Schedule</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Week of {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>
      </header>

      <MinisterScheduleView
        slots={serializedSlots}
        userFids={serializedFids}
        isAdmin={isAdmin}
        canAssign={canAssign}
        weekStartStr={weekStart.toISOString()}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
