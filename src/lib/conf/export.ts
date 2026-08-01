import type { ConfBudgetItem } from "./types";
import { calcItemTotal, fmtRmb, fmtUsd, toUsd } from "./currency";

type BudgetCsvItem = Pick<
  ConfBudgetItem,
  "no" | "name" | "desc" | "qty" | "unit" | "unitPrice" | "notes"
>;

/** Generate CSV string from budget items */
export function budgetToCsv(
  title: string,
  items: BudgetCsvItem[],
  xrRate: number = 7.2,
): string {
  const header = "No.,Item,Description,Qty,Unit,Unit Price (¥),Total (¥),Notes";
  const rows = items.map((item) => {
    const total = calcItemTotal(item.qty, item.unitPrice);
    return [
      item.no,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.desc ?? "").replace(/"/g, '""')}"`,
      item.qty,
      item.unit,
      item.unitPrice,
      total,
      `"${(item.notes ?? "").replace(/"/g, '""')}"`,
    ].join(",");
  });

  const grandTotal = items.reduce(
    (sum, i) => sum + calcItemTotal(i.qty, i.unitPrice),
    0,
  );

  rows.push("");
  rows.push(
    `,,,,,GRAND TOTAL,${fmtRmb(grandTotal)},${fmtUsd(toUsd(grandTotal, xrRate))}`,
  );

  return `${title}\n${header}\n${rows.join("\n")}\n`;
}

type BudgetCsvSection = {
  title: string;
  items: BudgetCsvItem[];
};

/** Generate CSV for multiple budgets with a combined grand total */
export function multiBudgetToCsv(
  budgets: BudgetCsvSection[],
  xrRate: number = 7.2,
  exportComment?: string | null,
): string {
  const sections = budgets.map((budget) =>
    budgetToCsv(budget.title, budget.items, xrRate).trimEnd(),
  );

  const combinedGrandTotal = budgets.reduce(
    (sum, budget) =>
      sum +
      budget.items.reduce(
        (itemSum, item) => itemSum + calcItemTotal(item.qty, item.unitPrice),
        0,
      ),
    0,
  );

  const lines = [...sections, ""];
  if (exportComment?.trim()) {
    lines.push(`Export Comment,"${exportComment.trim().replace(/"/g, '""')}"`, "");
  }
  lines.push(
    `,,,,,COMBINED GRAND TOTAL,${fmtRmb(combinedGrandTotal)},${fmtUsd(toUsd(combinedGrandTotal, xrRate))}`,
  );

  return `${lines.join("\n")}\n`;
}

export type PaymentCsvRecord = {
  paidAt: string;
  paymentType: "EXPENSE" | "INCOME" | string | null;
  paidBy: string;
  paidTo: string | null;
  method: string;
  amount: number;
  status: string;
  committeeScope: string | null;
  ref: string | null;
  note: string | null;
  itemDetails?: string | null;
};

/** Generate CSV string from payment records */
export function paymentsToCsv(
  payments: PaymentCsvRecord[],
  title = "Payment Records",
): string {
  const header =
    "Date,Type,Paid/Received By,To/Received By,Method,Amount (¥),Status,Committee,Ref,Notes,Item Details";
  const rows = payments.map((payment) =>
    [
      new Date(payment.paidAt).toLocaleDateString(),
      payment.paymentType === "INCOME" ? "Income" : "Expense",
      `"${payment.paidBy.replace(/"/g, '""')}"`,
      `"${(payment.paidTo ?? "").replace(/"/g, '""')}"`,
      payment.method,
      payment.amount,
      payment.status,
      `"${(payment.committeeScope ?? "").replace(/"/g, '""')}"`,
      `"${(payment.ref ?? "").replace(/"/g, '""')}"`,
      `"${(payment.note ?? "").replace(/"/g, '""')}"`,
      `"${(payment.itemDetails ?? "").replace(/"/g, '""')}"`,
    ].join(","),
  );

  const totalExpense = payments
    .filter((payment) => payment.paymentType !== "INCOME")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalIncome = payments
    .filter((payment) => payment.paymentType === "INCOME")
    .reduce((sum, payment) => sum + payment.amount, 0);

  rows.push("");
  rows.push(`,,,,Total Expense,${totalExpense},,,,,`);
  rows.push(`,,,,Total Income,${totalIncome},,,,,`);

  return `${title}\n${header}\n${rows.join("\n")}\n`;
}

/** Convert budget data to a downloadable Response */
export function csvResponse(csv: string, filename: string): Response {
  // BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
