import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/budgets/[budgetId]/reject
// Reject at committee or chair level (must provide a reason)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; budgetId: string }> },
) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "A rejection reason is required (at least 3 characters)" },
        { status: 400 },
      );
    }

    const budget = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        creator: {
          select: {
            id: true,
            committeeScope: true,
          },
        },
      },
    });

    if (!budget || budget.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (budget.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot reject a finally approved budget" },
        { status: 409 },
      );
    }

    if (budget.status === "REJECTED") {
      return NextResponse.json(
        { error: "Budget is already rejected" },
        { status: 409 },
      );
    }

    const hasGlobalRejectionRights =
      auth.access.isChair || auth.access.isSuperAdmin;
    if (!hasGlobalRejectionRights) {
      if (!auth.access.canApprovePayments || !auth.access.committeeScope) {
        return NextResponse.json(
          { error: "Budget approval/rejection permission required" },
          { status: 403 },
        );
      }

      if (
        budget.creator.committeeScope &&
        budget.creator.committeeScope !== auth.access.committeeScope
      ) {
        return NextResponse.json(
          {
            error: "You can only reject budgets for your committee scope",
          },
          { status: 403 },
        );
      }
    }

    const updated = await prisma.confBudget.update({
      where: { id: budgetId },
      data: {
        status: "REJECTED",
      },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
      },
    });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "BUDGET_REJECTED",
      entityType: "budget",
      entityId: budgetId,
      details: {
        previousStatus: budget.status,
        title: budget.title,
        category: budget.category,
      },
      note: reason.trim(),
    });

    return NextResponse.json({
      ...updated,
      rejectionNote: reason.trim(),
    });
  } catch (error) {
    console.error("Failed to reject budget:", error);
    return NextResponse.json(
      { error: "Failed to reject budget" },
      { status: 500 },
    );
  }
}
