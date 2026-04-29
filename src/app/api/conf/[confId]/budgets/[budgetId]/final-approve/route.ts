import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// POST /api/conf/[confId]/budgets/[budgetId]/final-approve
// Level-2 conference chair / super admin final approval.
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
          select: {
            id: true,
            committeeScope: true,
            canApprovePayments: true,
          },
        },
      },
    });

    if (!budget || budget.confId !== confId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (budget.status !== "DRAFT" && budget.status !== "REVIEW") {
      return NextResponse.json(
        { error: `Cannot final-approve budget with status: ${budget.status}` },
        { status: 409 },
      );
    }

    if (budget.status === "DRAFT" && budget.creator.committeeScope) {
      const creatorIsCommitteeChair = Boolean(budget.creator.canApprovePayments);
      if (!creatorIsCommitteeChair) {
        return NextResponse.json(
          {
            error:
              "Committee approval is required before final approval for committee-scoped budgets.",
          },
          { status: 409 },
        );
      }
    }

    const updated = await prisma.confBudget.update({
      where: { id: budgetId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        approvedBy: auth.access.memberId || auth.access.user?.id || null,
      },
      include: {
        items: { orderBy: { no: "asc" } },
        creator: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to final-approve budget:", error);
    return NextResponse.json(
      { error: "Failed to final-approve budget" },
      { status: 500 },
    );
  }
}

