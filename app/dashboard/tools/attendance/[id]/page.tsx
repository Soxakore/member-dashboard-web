import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { ClipboardCheck, Trophy, Medal, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { RecordPointsForm } from "./record-form";

export default async function AttendanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { loginId: session.user.email },
    include: { playerFids: true },
  });
  if (!user) return null;

  const attSession = await prisma.attendanceSession.findUnique({
    where: { id },
    include: {
      createdBy: { select: { username: true } },
      records: {
        include: {
          playerFid: { select: { nickname: true, fid: true, furnaceLv: true } },
        },
        orderBy: { points: "desc" },
      },
    },
  });

  if (!attSession) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <p className="text-zinc-400">Session not found.</p>
      </div>
    );
  }

  const canRecord = attSession.status === "OPEN" && user.role !== "R1" && user.role !== "R2";

  // Get all linked FIDs for the record form
  const allFids = await prisma.playerFID.findMany({
    select: { id: true, fid: true, nickname: true },
    orderBy: { nickname: "asc" },
  });

  const serializedRecords = attSession.records.map((r, idx) => ({
    rank: idx + 1,
    nickname: r.playerFid.nickname || r.playerFid.fid,
    fid: r.playerFid.fid,
    furnaceLv: r.playerFid.furnaceLv,
    points: r.points.toString(),
    note: r.note,
  }));

  const serializedFids = allFids.map((f) => ({
    id: f.id,
    fid: f.fid,
    nickname: f.nickname,
  }));

  const totalPoints = attSession.records.reduce((sum, r) => sum + Number(r.points), 0);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link
        href="/dashboard/tools/attendance"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sessions
      </Link>

      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{attSession.eventName}</h1>
            <p className="text-zinc-400 text-sm">
              {attSession.status === "OPEN" ? "🟢 Open" : "🔒 Closed"} • By {attSession.createdBy.username}
              {attSession.legion && ` • Legion ${attSession.legion}`}
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-sky-400">{attSession.records.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Participants</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{totalPoints.toLocaleString()}</p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Total Points</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">
            {attSession.records.length > 0 ? Math.round(totalPoints / attSession.records.length).toLocaleString() : 0}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Avg Points</p>
        </div>
        <div className="glass-panel rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-400">
            {attSession.records.length > 0 ? Number(attSession.records[0].points).toLocaleString() : 0}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">Top Score</p>
        </div>
      </div>

      {/* Record Form */}
      {canRecord && (
        <RecordPointsForm sessionId={id} allFids={serializedFids} />
      )}

      {/* Leaderboard */}
      {serializedRecords.length > 0 ? (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-widest w-12">#</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-widest">Player</th>
                <th className="text-right px-4 py-3 text-xs text-zinc-500 uppercase tracking-widest">Points</th>
                <th className="text-left px-4 py-3 text-xs text-zinc-500 uppercase tracking-widest hidden sm:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {serializedRecords.map((r) => (
                <tr key={r.fid} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    {r.rank === 1 ? <Trophy className="h-4 w-4 text-yellow-400" /> :
                     r.rank === 2 ? <Medal className="h-4 w-4 text-zinc-300" /> :
                     r.rank === 3 ? <Medal className="h-4 w-4 text-amber-600" /> :
                     <span className="text-zinc-500">{r.rank}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{r.nickname}</p>
                    <p className="text-[10px] text-zinc-500">FID: {r.fid}</p>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-sky-400">
                    {Number(r.points).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs hidden sm:table-cell">
                    {r.note || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-8 text-center text-zinc-500">
          No records yet. Use the form above to add participant scores.
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";
