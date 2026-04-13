import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

type Params = { params: Promise<{ confId: string; budgetId: string }> };

// GET /api/conf/[confId]/budgets/[budgetId] — single budget with items
export async function GET(_req: Request, { params }: Params) {
  try {
    const { confId, budgetId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const budget = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
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
      select: { confId: true },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, category, status, notes, items } = body;

    // Update the budget
    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    if (status === "APPROVED") {
      updateData.approvedAt = new Date();
      if (body.approvedBy) updateData.approvedBy = body.approvedBy;
    }

    // If items are provided, replace all items
    if (Array.isArray(items)) {
      await prisma.$transaction(async (tx) => {
        await tx.confBudget.update({
          where: { id: budgetId },
          data: updateData,
        });

        // Delete existing items and recreate
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
    } else {
      await prisma.confBudget.update({
        where: { id: budgetId },
        data: updateData,
      });
    }

    const updated = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
      },
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
      select: { confId: true },
    });

    if (!existing || existing.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    await prisma.confBudget.delete({ where: { id: budgetId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete budget:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 },
    );
  }
}
