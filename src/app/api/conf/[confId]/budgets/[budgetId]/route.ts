import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  canEditBudgetContent,
  canDeleteBudget,
  hasBudgetAdminRights,
  isBudgetOwner,
  resolveBudgetStatusAfterOwnerEdit,
} from "@/lib/conf/budget-access";
import { logFinanceAction } from "@/lib/conf/audit";
import type { BudgetStatus } from "@prisma/client";

type Params = { params: Promise<{ confId: string; budgetId: string }> };

const budgetInclude = {
  items: { orderBy: { no: "asc" as const } },
  creator: true,
};

// GET /api/conf/[confId]/budgets/[budgetId] — single budget with items
export async function GET(_req: Request, { params }: Params) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const budget = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        ...budgetInclude,
        payments: {
          include: { proofs: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!budget || budget.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Failed to fetch budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 },
    );
  }
}

// PUT /api/conf/[confId]/budgets/[budgetId] — update budget and items
export async function PUT(req: Request, { params }: Params) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        creator: {
          select: { committeeScope: true, canApprovePayments: true },
        },
      },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, status, notes, items } = body;

    if (!canEditBudgetContent(existing, auth.access)) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to edit this budget. Request edit access from the Conference Chair or Super Admin.",
        },
        { status: 403 },
      );
    }

    const isAdmin = hasBudgetAdminRights(auth.access);
    const isOwner = isBudgetOwner(existing, auth.access);

    if (
      status !== undefined &&
      (status === "APPROVED" || status === "REJECTED") &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          error:
            "Chair or Super Admin access required to approve/reject budgets",
        },
        { status: 403 },
      );
    }

    if (
      status === "APPROVED" &&
      existing.status === "DRAFT" &&
      existing.creator.committeeScope
    ) {
      if (!existing.creator.canApprovePayments) {
        return NextResponse.json(
          {
            error:
              "Committee approval is required before final approval for committee-scoped budgets.",
          },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (notes !== undefined) updateData.notes = notes;

    if (status !== undefined) {
      updateData.status = status;
    } else if (
      isOwner &&
      !isAdmin &&
      (existing.status === "REJECTED" ||
        existing.status === "APPROVED" ||
        existing.editUnlockStatus === "GRANTED")
    ) {
      updateData.status = resolveBudgetStatusAfterOwnerEdit(existing.status);
    }

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
      updateData.approvedBy =
        auth.access.memberId || auth.access.user?.id || null;
      updateData.isLocked = true;
      updateData.editUnlockStatus = "NONE";
      updateData.editUnlockRequestedAt = null;
      updateData.editUnlockRequestNote = null;
      updateData.editUnlockedAt = null;
      updateData.editUnlockedBy = null;
    }

    if (isOwner && !isAdmin && existing.editUnlockStatus === "GRANTED") {
      updateData.editUnlockStatus = "NONE";
      updateData.editUnlockedAt = null;
      updateData.editUnlockedBy = null;
    }

    if (
      isOwner &&
      !isAdmin &&
      resolveBudgetStatusAfterOwnerEdit(existing.status) === "DRAFT" &&
      (existing.status === "REJECTED" || existing.status === "APPROVED")
    ) {
      updateData.isLocked = false;
      updateData.approvedAt = null;
      updateData.approvedBy = null;
    }

    const contentChanged =
      title !== undefined ||
      category !== undefined ||
      notes !== undefined ||
      Array.isArray(items);

    if (Array.isArray(items)) {
      await prisma.$transaction(async (tx) => {
        await tx.confBudget.update({
          where: { id: budgetId },
          data: updateData,
        });

        await tx.confBudgetItem.deleteMany({ where: { budgetId } });
        await tx.confBudgetItem.createMany({
          data: items.map(
            (
              item: {
                name: string;
                desc?: string;
                qty: number;
                unit: string;
                unitPrice: number;
                notes?: string;
                isPaid?: boolean;
              },
              idx: number,
            ) => ({
              budgetId,
              no: idx + 1,
              name: item.name,
              desc: item.desc || null,
              qty: Number(item.qty),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
              notes: item.notes || null,
              isPaid: item.isPaid ?? false,
            }),
          ),
        });
      });
    } else if (Object.keys(updateData).length > 0) {
      await prisma.confBudget.update({
        where: { id: budgetId },
        data: updateData,
      });
    }

    if (contentChanged) {
      await logFinanceAction({
        confId,
        actorUserId: auth.access.user?.id,
        actorName: auth.access.user?.name ?? "System",
        action: "BUDGET_UPDATED",
        entityType: "budget",
        entityId: budgetId,
        details: {
          previousStatus: existing.status,
          nextStatus: (updateData.status as BudgetStatus | undefined) ?? existing.status,
          title: title ?? existing.title,
        },
      });
    }

    const updated = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: budgetInclude,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/budgets/[budgetId]
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        creator: {
          select: { committeeScope: true },
        },
      },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (!canDeleteBudget(existing, auth.access)) {
      return NextResponse.json(
        { error: "You do not have permission to delete this budget" },
        { status: 403 },
      );
    }

    await prisma.confBudget.delete({ where: { id: budgetId } });

    await logFinanceAction({
      confId,
      actorUserId: auth.access.user?.id,
      actorName: auth.access.user?.name ?? "System",
      action: "BUDGET_DELETED",
      entityType: "budget",
      entityId: budgetId,
      details: {
        title: existing.title,
        status: existing.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 },
    );
  }
}
