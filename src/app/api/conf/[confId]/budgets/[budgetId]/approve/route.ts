import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/budgets/[budgetId]/approve
// Level-1 committee chair approval for budgets.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ confId: string; budgetId: string }> },
) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    if (!auth.access.isSuperAdmin && !auth.access.canApprovePayments) {
      return NextResponse.json(
        { error: "Committee budget approval permission required" },
        { status: 403 },
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

    if (budget.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Budget is already in status: ${budget.status}` },
        { status: 409 },
      );
    }

    if (!auth.access.isSuperAdmin) {
      if (!auth.access.memberId || !auth.access.committeeScope) {
        return NextResponse.json(
          {
            error:
              "A scoped committee chair profile is required for committee approval",
          },
          { status: 403 },
        );
      }

      if (
        !budget.creator.committeeScope ||
        budget.creator.committeeScope !== auth.access.committeeScope
      ) {
        return NextResponse.json(
          {
            error:
              "You can only committee-approve budgets in your committee scope",
          },
          { status: 403 },
        );
      }
    }

    const updated = await prisma.confBudget.update({
      where: { id: budgetId },
      data: {
        status: "REVIEW",
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
      action: "BUDGET_APPROVED",
      entityType: "budget",
      entityId: budgetId,
      details: {
        title: budget.title,
        previousStatus: budget.status,
        nextStatus: "REVIEW",
        approvalLevel: "committee",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to committee-approve budget:", error);
    return NextResponse.json(
      { error: "Failed to committee-approve budget" },
      { status: 500 },
    );
  }
}

