import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { budgetToCsv, csvResponse } from "@/lib/conf/export";

// GET /api/conf/[confId]/budgets/[budgetId]/export?format=csv
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string; budgetId: string }> },
) {
  try {
    const { confId, budgetId } = await params;
    const url = new URL(req.url);
    const format = url.searchParams.get("format") ?? "csv";

    const budget = await prisma.confBudget.findUnique({
      where: { id: budgetId },
      include: {
        items: { orderBy: { no: "asc" } },
        conf: true,
      },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const xrRate = budget.conf.xrRate;

    if (format === "csv") {
      const csv = budgetToCsv(budget.title, budget.items, xrRate);
      const filename = `${budget.title.replace(/\s+/g, "_")}_budget.csv`;
      return csvResponse(csv, filename);
    }

    // JSON format as fallback
    return NextResponse.json({
      title: budget.title,
      category: budget.category,
      status: budget.status,
      xrRate,
      items: budget.items,
    });
  } catch (error) {
    console.error("Failed to export budget:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
