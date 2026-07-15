import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { ensureDefaultGlobalLeaders } from "@/lib/conf/default-global-leaders";

// POST /api/conf/[confId]/booklet/leaders/seed
// Idempotently seed / upgrade global president + ambassador profiles.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "super-admin");
    if (!auth.ok) return auth.response;

    await ensureDefaultGlobalLeaders();

    const leaders = await prisma.confLeaderProfile.findMany({
      where: {
        OR: [{ confId }, { confId: null }],
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ leaders, seeded: true });
  } catch (error) {
    console.error("POST /booklet/leaders/seed error:", error);
    return NextResponse.json(
      { error: "Failed to seed leader profiles" },
      { status: 500 },
    );
  }
}
