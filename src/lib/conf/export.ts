import type { ConfBudgetItem } from "./types";
import { calcItemTotal, fmtRmb, fmtUsd, toUsd } from "./currency";

/** Generate CSV string from budget items */
export function budgetToCsv(
  title: string,
  items: ConfBudgetItem[],
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
