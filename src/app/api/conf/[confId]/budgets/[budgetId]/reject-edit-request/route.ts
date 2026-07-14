import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  canRejectBudgetEditUnlock,
  canReLockBudget,
  hasBudgetAdminRights,
} from "@/lib/conf/budget-access";
import { logFinanceAction } from "@/lib/conf/audit";

// POST /api/conf/[confId]/budgets/[budgetId]/reject-edit-request
// Reject a pending unlock request, or re-lock a granted unlock (admin only).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string; budgetId: string }> },
) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const body = await req.json().catch(() => ({}));
    const action =
      body.action === "relock" ? "relock" : "reject";

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

    if (!hasBudgetAdminRights(auth.access)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "relock") {
      if (!canReLockBudget(budget, auth.access)) {
        return NextResponse.json(
          { error: "This budget is not currently unlocked for editing" },
          { status: 409 },
        );
      }

      const updated = await prisma.confBudget.update({
        where: { id: budgetId },
        data: {
          editUnlockStatus: "NONE",
          editUnlockedAt: null,
          editUnlockedBy: null,
          isLocked: budget.status === "APPROVED",
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
        action: "BUDGET_EDIT_RELOCKED",
        entityType: "budget",
        entityId: budgetId,
        details: {
          title: budget.title,
          status: budget.status,
        },
      });

      return NextResponse.json(updated);
    }

    if (!canRejectBudgetEditUnlock(budget, auth.access)) {
      return NextResponse.json(
        { error: "No pending edit request to reject for this budget" },
        { status: 409 },
      );
    }

    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    const updated = await prisma.confBudget.update({
      where: { id: budgetId },
      data: {
        editUnlockStatus: "NONE",
        editUnlockRequestedAt: null,
        editUnlockRequestNote: null,
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
      action: "BUDGET_EDIT_UNLOCK_REJECTED",
      entityType: "budget",
      entityId: budgetId,
      details: {
        title: budget.title,
        status: budget.status,
        requestNote: budget.editUnlockRequestNote,
      },
      note: reason || null,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to reject budget edit request:", error);
    return NextResponse.json(
      { error: "Failed to reject edit request" },
      { status: 500 },
    );
  }
}
