import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { canRequestBudgetEditUnlock } from "@/lib/conf/budget-access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/budgets/[budgetId]/request-edit
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; budgetId: string }> },
) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const note =
      typeof body.note === "string" ? body.note.trim() : "";

    if (note.length < 3) {
      return NextResponse.json(
        { error: "Please provide a reason for your edit request (at least 3 characters)" },
        { status: 400 },
      );
    }

    const budget = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        creator: {
          select: { committeeScope: true },
        },
      },
    });

    if (!budget || budget.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (!canRequestBudgetEditUnlock(budget, auth.access)) {
      return NextResponse.json(
        { error: "You cannot request edit access for this budget" },
        { status: 403 },
      );
    }

    const updated = await prisma.confBudget.update({
      where: { id: budgetId },
      data: {
        editUnlockStatus: "PENDING",
        editUnlockRequestedAt: new Date(),
        editUnlockRequestNote: note,
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
      action: "BUDGET_EDIT_UNLOCK_REQUESTED",
      entityType: "budget",
      entityId: budgetId,
      details: {
        title: budget.title,
        status: budget.status,
      },
      note,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to request budget edit access:", error);
    return NextResponse.json(
      { error: "Failed to request edit access" },
      { status: 500 },
    );
  }
}
