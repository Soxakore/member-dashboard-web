import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { Activity, Flame, User, ArrowUpRight, RefreshCw } from "lucide-react";
import { ActivityActions } from "./activity-actions";

export default async function ActivityTrackerPage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return null;

  const changes = await prisma.playerChangeLog.findMany({
    take: 100,
    orderBy: { detectedAt: "desc" },
    include: {
      playerFid: {
        select: {
          nickname: true,
          fid: true,
          user: { select: { username: true } },
        },
      },
    },
  });

  const totalFids = await prisma.playerFID.count();
  const isAdmin = user.role === "R4" || user.role === "R5";

  const serializedChanges = changes.map((c) => ({
    id: c.id,
    changeType: c.changeType,
    oldValue: c.oldValue,
    newValue: c.newValue,
    detectedAt: c.detectedAt.toISOString(),
    playerNickname: c.playerFid.nickname || c.playerFid.fid,
    playerFid: c.playerFid.fid,
    ownerUsername: c.playerFid.user.username || "Unknown",
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Tracker</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Track furnace level changes and nickname updates across alliance members
        </p>
      </header>

      <ActivityActions
        changes={serializedChanges}
        isAdmin={isAdmin}
        totalFids={totalFids}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
