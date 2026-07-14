import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { canGrantBudgetEditUnlock } from "@/lib/conf/budget-access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/budgets/[budgetId]/unlock-edit
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ confId: string; budgetId: string }> },
) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

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

    if (!canGrantBudgetEditUnlock(budget, auth.access)) {
      return NextResponse.json(
        { error: "This budget cannot be unlocked for editing" },
        { status: 409 },
      );
    }

    const updated = await prisma.confBudget.update({
      where: { id: budgetId },
      data: {
        editUnlockStatus: "GRANTED",
        editUnlockedAt: new Date(),
        editUnlockedBy: auth.access.user?.id ?? null,
        isLocked: false,
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
      action: "BUDGET_EDIT_UNLOCK_GRANTED",
      entityType: "budget",
      entityId: budgetId,
      details: {
        title: budget.title,
        status: budget.status,
        requestNote: budget.editUnlockRequestNote,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to grant budget edit access:", error);
    return NextResponse.json(
      { error: "Failed to grant edit access" },
      { status: 500 },
    );
  }
}
