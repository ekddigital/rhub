/** Certified conference budget vs actual spend — shared by budget tool and report §12. */
export type ConferenceBudgetLine = {
  item: string;
  budgetRmb: number | null;
  actualRmb: number | null;
  notes?: string;
  /** Positive = over budget, negative = under budget, null when not applicable. */
  varianceRmb: number | null;
};

export const CONFERENCE_BUDGET_VS_ACTUAL: readonly ConferenceBudgetLine[] = [
  {
    item: "Hotel rooms (43 @ ¥250)",
    budgetRmb: 32_250,
    actualRmb: 38_606.99,
    notes: "58 rooms × ¥225",
    varianceRmb: 6_356.99,
  },
  {
    item: "Conference hall rental",
    budgetRmb: 4_000,
    actualRmb: null,
    notes: "Recorded down",
    varianceRmb: null,
  },
  {
    item: "Feeding — 2× daily, 4 days",
    budgetRmb: 16_400,
    actualRmb: 17_613.03,
    notes: "16 diplomats",
    varianceRmb: 1_213,
  },
  {
    item: "Stadium rental",
    budgetRmb: 2_000,
    actualRmb: 1_000,
    notes: "Football and basketball ground",
    varianceRmb: -1_000,
  },
  {
    item: "Transport — hotel to field",
    budgetRmb: 1_000,
    actualRmb: null,
    notes: "Converted to apartment rental",
    varianceRmb: null,
  },
  {
    item: "Photographer",
    budgetRmb: 1_000,
    actualRmb: 1_700,
    notes: "Workmanship, transport & accommodation",
    varianceRmb: 700,
  },
  {
    item: "Conference souvenir",
    budgetRmb: 2_000,
    actualRmb: 2_645,
    notes: "Additional diplomats & delegates",
    varianceRmb: 645,
  },
  {
    item: "Conference booklet",
    budgetRmb: 3_000,
    actualRmb: 2_625,
    notes: "100 pcs",
    varianceRmb: -375,
  },
  {
    item: "LSUIC Male & Female Award",
    budgetRmb: 150,
    actualRmb: 90,
    notes: "Two persons @ ¥45 each",
    varianceRmb: -60,
  },
  {
    item: "LSUIC Recognition / Award",
    budgetRmb: 3_000,
    actualRmb: 2_750,
    notes: "62 persons @ ¥45 each with ¥40 discount",
    varianceRmb: -250,
  },
  {
    item: "Meet & greet",
    budgetRmb: 1_000,
    actualRmb: null,
    notes: "Covered under feeding",
    varianceRmb: null,
  },
  {
    item: "Drinks",
    budgetRmb: null,
    actualRmb: 6_249.96,
    notes: "New budget line",
    varianceRmb: 6_249.96,
  },
  {
    item: "LSUIC Dinner Night",
    budgetRmb: 5_000,
    actualRmb: 5_000,
    notes: "Hall rental 25th and 26th",
    varianceRmb: 0,
  },
] as const;

export function sumConferenceBudgetLines(
  lines: readonly ConferenceBudgetLine[],
  field: "budgetRmb" | "actualRmb",
): number {
  return lines.reduce((sum, line) => sum + (line[field] ?? 0), 0);
}

export function sumConferenceBudgetVariance(
  lines: readonly ConferenceBudgetLine[],
): { overBudget: number; underBudget: number; netVariance: number } {
  let overBudget = 0;
  let underBudget = 0;

  for (const line of lines) {
    if (line.varianceRmb == null || line.varianceRmb === 0) continue;
    if (line.varianceRmb > 0) overBudget += line.varianceRmb;
    else underBudget += Math.abs(line.varianceRmb);
  }

  return {
    overBudget,
    underBudget,
    netVariance: overBudget - underBudget,
  };
}

export function computeConferenceBudgetTotals(
  lines: readonly ConferenceBudgetLine[] = CONFERENCE_BUDGET_VS_ACTUAL,
) {
  const budgetTotal = sumConferenceBudgetLines(lines, "budgetRmb");
  const actualTotal = sumConferenceBudgetLines(lines, "actualRmb");
  const variance = sumConferenceBudgetVariance(lines);

  return {
    budgetTotal,
    actualTotal,
    ...variance,
  };
}
