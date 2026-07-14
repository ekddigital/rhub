import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// GET /api/conf/[confId]/budgets — list all budgets for a conference
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const budgets = await prisma.confBudget.findMany({
      where: { confId },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const rejectedIds = budgets
      .filter((budget) => budget.status === "REJECTED")
      .map((budget) => budget.id);
    const rejectionNotesByBudgetId: Record<string, string> = {};

    if (rejectedIds.length > 0) {
      const rejectionLogs = await prisma.confFinanceAuditLog.findMany({
        where: {
          confId,
          entityType: "budget",
          entityId: { in: rejectedIds },
          action: "BUDGET_REJECTED",
        },
        orderBy: { createdAt: "desc" },
        select: { entityId: true, note: true },
      });

      for (const log of rejectionLogs) {
        if (!rejectionNotesByBudgetId[log.entityId] && log.note) {
          rejectionNotesByBudgetId[log.entityId] = log.note;
        }
      }
    }

    const canSeeRejectionNote = (budget: (typeof budgets)[number]) => {
      if (auth.access.isChair || auth.access.isSuperAdmin) return true;
      if (auth.access.memberId === budget.createdBy) return true;
      if (
        auth.access.canApprovePayments &&
        budget.creator.committeeScope &&
        budget.creator.committeeScope === auth.access.committeeScope
      ) {
        return true;
      }
      return false;
    };

    return NextResponse.json(
      budgets.map((budget) => ({
        ...budget,
        rejectionNote:
          budget.status === "REJECTED" && canSeeRejectionNote(budget)
            ? (rejectionNotesByBudgetId[budget.id] ?? null)
            : null,
      })),
    );
  } catch (error) {
    console.error("Failed to fetch budgets:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/budgets — create a new budget with line items
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { title, category, createdBy, notes, items } = body;

    if (!title || !category || !createdBy) {
      return NextResponse.json(
        { error: "title, category, and createdBy are required" },
        { status: 400 },
      );
    }

    const creatorMember = await prisma.confMember.findFirst({
      where: {
        id: String(createdBy),
        confId,
        isActive: true,
      },
      select: { id: true, committeeScope: true },
    });

    if (!creatorMember) {
      return NextResponse.json(
        { error: "Budget creator member not found" },
        { status: 404 },
      );
    }

    const isScopedMemberActor =
      !auth.access.isSuperAdmin &&
      !auth.access.isChair &&
      Boolean(auth.access.memberId);
    if (isScopedMemberActor) {
      if (creatorMember.id !== auth.access.memberId) {
        return NextResponse.json(
          {
            error:
              "You can only create budgets with your own committee profile",
          },
          { status: 403 },
        );
      }

      if (creatorMember.committeeScope !== auth.access.committeeScope) {
        return NextResponse.json(
          {
            error: "You can only create budgets within your committee scope",
          },
          { status: 403 },
        );
      }
    }

    // Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one budget item is required" },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (
        !item.name ||
        item.qty === undefined ||
        item.unitPrice === undefined ||
        !item.unit
      ) {
        return NextResponse.json(
          { error: "Each item needs name, qty, unitPrice, and unit" },
          { status: 400 },
        );
      }
    }

    const budget = await prisma.confBudget.create({
      data: {
        confId,
        title,
        category,
        createdBy: creatorMember.id,
        notes: notes || null,
        items: {
          create: items.map(
            (
              item: {
                name: string;
                desc?: string;
                qty: number;
                unit: string;
                unitPrice: number;
                notes?: string;
              },
              idx: number,
            ) => ({
              no: idx + 1,
              name: item.name,
              desc: item.desc || null,
              qty: Number(item.qty),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
              notes: item.notes || null,
            }),
          ),
        },
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
      action: "BUDGET_CREATED",
      entityType: "budget",
      entityId: budget.id,
      details: {
        title: budget.title,
        category: budget.category,
        createdBy: creatorMember.id,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error("Failed to create budget:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 },
    );
  }
}
