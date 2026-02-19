import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

/**
 * Returns alliance info derived from linked player FIDs.
 * - Kingdom: most common kingdom (kid) among linked members
 * - Member count: total linked FIDs
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allFids = await prisma.playerFID.findMany({
      select: { kid: true, nickname: true },
    });

    if (allFids.length === 0) {
      return NextResponse.json({ kingdom: "?", memberCount: 0 });
    }

    // Find most common kingdom
    const kidCounts: Record<string, number> = {};
    for (const f of allFids) {
      const kid = f.kid || "Unknown";
      kidCounts[kid] = (kidCounts[kid] || 0) + 1;
    }

    const topKingdom = Object.entries(kidCounts).sort((a, b) => b[1] - a[1])[0][0];

    return NextResponse.json({
      kingdom: topKingdom,
      memberCount: allFids.length,
    });
  } catch (error) {
    console.error("Alliance info error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
