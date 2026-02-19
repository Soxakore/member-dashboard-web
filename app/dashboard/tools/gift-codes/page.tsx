import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { Gift } from "lucide-react";
import { GiftCodeManager } from "./gift-code-manager";

export default async function GiftCodesPage() {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { loginId: session.user.email },
    include: { playerFids: true },
  });
  if (!user) return null;

  const codes = await prisma.giftCode.findMany({
    orderBy: { discoveredAt: "desc" },
    include: {
      redemptions: {
        where: {
          playerFidId: { in: user.playerFids.map((f) => f.id) },
        },
      },
    },
  });

  const isAdmin = user.role === "R4" || user.role === "R5";

  // Serialize BigInt and Date fields for client component
  const serializedCodes = codes.map((c) => ({
    id: c.id,
    code: c.code,
    source: c.source,
    status: c.status,
    discoveredAt: c.discoveredAt.toISOString(),
    redemptions: c.redemptions.map((r) => ({
      id: r.id,
      status: r.status,
      message: r.message,
      playerFidId: r.playerFidId,
      redeemedAt: r.redeemedAt.toISOString(),
    })),
  }));

  const serializedFids = user.playerFids.map((f) => ({
    id: f.id,
    fid: f.fid,
    nickname: f.nickname,
  }));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Gift className="h-5 w-5 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Gift Codes</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Auto-sync &amp; redeem WOS gift codes for all alliance members
        </p>
      </header>

      <GiftCodeManager
        codes={serializedCodes}
        userFids={serializedFids}
        isAdmin={isAdmin}
      />
    </div>
  );
}

export const dynamic = "force-dynamic";
