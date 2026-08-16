import { BUDGET_CATEGORIES } from "@/lib/conf/config";
import {
  CONFERENCE_BUDGET_VS_ACTUAL,
  computeConferenceBudgetTotals,
} from "@/lib/conf/conference-budget-data";
import { calcItemTotal } from "@/lib/conf/currency";
import { prisma } from "@/lib/prisma";
import type {
  ReportApprovedBudget,
  ReportBudgetVsActualLine,
  ReportBudgetVsActualTotals,
  ReportDataSource,
} from "./types";

export async function loadReportApprovedBudgets(
  confId: string,
): Promise<{ budgets: ReportApprovedBudget[]; source: ReportDataSource }> {
  const budgets = await prisma.confBudget.findMany({
    where: { confId, status: "APPROVED" },
    include: {
      items: { orderBy: { no: "asc" } },
    },
    orderBy: { approvedAt: "desc" },
  });

  if (budgets.length === 0) {
    return { budgets: [], source: "static" };
  }

  return {
    budgets: budgets.map((budget) => ({
      id: budget.id,
      title: budget.title,
      category: BUDGET_CATEGORIES[budget.category]?.label ?? budget.category,
      status: budget.status,
      grandTotal: budget.items.reduce(
        (sum, item) => sum + calcItemTotal(item.qty, item.unitPrice),
        0,
      ),
      approvedAt: budget.approvedAt?.toISOString() ?? null,
      itemCount: budget.items.length,
    })),
    source: "live",
  };
}

/** Prefer Cooking Committee approved budget when present. */
export function selectCookingApprovedBudget(
  budgets: readonly ReportApprovedBudget[],
): ReportApprovedBudget | null {
  const cookingBudget = budgets.find((budget) =>
    /cooking/i.test(budget.title),
  );
  return cookingBudget ?? budgets[0] ?? null;
}

/** Certified post-conference budget vs actual reconciliation (static source of truth). */
export function loadReportConferenceBudgetVsActual(): {
  lines: ReportBudgetVsActualLine[];
  totals: ReportBudgetVsActualTotals;
  source: ReportDataSource;
} {
  return {
    lines: CONFERENCE_BUDGET_VS_ACTUAL.map((line) => ({ ...line })),
    totals: computeConferenceBudgetTotals(),
    source: "static",
  };
}
