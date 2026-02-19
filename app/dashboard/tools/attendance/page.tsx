import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { ClipboardCheck, Plus, Users, Lock, Unlock } from "lucide-react";
import Link from "next/link";
import { AttendanceActions } from "./attendance-actions";

export default async function AttendancePage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({ where: { loginId: session.user.email } });
  if (!user) return null;

  const sessions = await prisma.attendanceSession.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      createdBy: { select: { username: true } },
      _count: { select: { records: true } },
    },
  });

  const canCreate = user.role !== "R1" && user.role !== "R2";

  const serialized = sessions.map((s) => ({
    id: s.id,
    eventName: s.eventName,
    eventType: s.eventType,
    legion: s.legion,
    status: s.status,
    startedAt: s.startedAt.toISOString(),
    closedAt: s.closedAt?.toISOString() || null,
    createdBy: s.createdBy.username || "Unknown",
    recordCount: s._count.records,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <ClipboardCheck className="h-5 w-5 text-sky-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
            </div>
            <p className="text-zinc-400 text-sm">Track member participation in alliance events</p>
          </div>
        </div>
      </header>

      <AttendanceActions sessions={serialized} canCreate={canCreate} />
    </div>
  );
}

export const dynamic = "force-dynamic";
