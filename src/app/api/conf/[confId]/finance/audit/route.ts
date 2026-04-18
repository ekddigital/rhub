import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/finance/audit
// Full audit log with optional filters
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);

    const logs = await prisma.confFinanceAuditLog.findMany({
      where: {
        confId,
        ...(entityType ? { entityType } : {}),
        ...(entityId ? { entityId } : {}),
        ...(action ? { action } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch audit log:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit log" },
      { status: 500 },
    );
  }
}
