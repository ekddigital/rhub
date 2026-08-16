"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CONFERENCE_BUDGET_VS_ACTUAL,
  computeConferenceBudgetTotals,
} from "@/lib/conf/conference-budget-data";
import { fmtRmb } from "@/lib/conf/currency";

export function ConferenceBudgetReconciliationCard() {
  const totals = computeConferenceBudgetTotals();

  return (
    <Card className="border-[#002868]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Conference Budget vs Actual (Jinan 2026)
        </CardTitle>
        <CardDescription>
          Certified post-conference reconciliation — synced with the conference
          report (§12) and budget connector.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 font-semibold text-right">Budget</th>
                <th className="px-3 py-2 font-semibold text-right">Actual</th>
                <th className="px-3 py-2 font-semibold text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {CONFERENCE_BUDGET_VS_ACTUAL.map((row) => {
                const varianceLabel =
                  row.varianceRmb == null
                    ? "—"
                    : row.varianceRmb === 0
                      ? "0.00"
                      : row.varianceRmb > 0
                        ? `+${fmtRmb(row.varianceRmb)}`
                        : `−${fmtRmb(Math.abs(row.varianceRmb))}`;
                const varianceClass =
                  row.varianceRmb == null || row.varianceRmb === 0
                    ? "text-muted-foreground"
                    : row.varianceRmb > 0
                      ? "text-red-600"
                      : "text-emerald-700";

                return (
                  <tr key={row.item} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <div className="font-medium">{row.item}</div>
                      {row.notes && (
                        <div className="text-[10px] text-muted-foreground">
                          {row.notes}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {row.budgetRmb != null ? fmtRmb(row.budgetRmb) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {row.actualRmb != null ? fmtRmb(row.actualRmb) : "—"}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums font-semibold ${varianceClass}`}
                    >
                      {varianceLabel}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#002868] text-white">
                <td className="px-3 py-2 font-semibold">Totals</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {fmtRmb(totals.budgetTotal)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {fmtRmb(totals.actualTotal)}
                </td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">
                  {totals.netVariance >= 0 ? "+" : "−"}
                  {fmtRmb(Math.abs(totals.netVariance))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Over budget: {fmtRmb(totals.overBudget)} · Under budget:{" "}
          {fmtRmb(totals.underBudget)}
        </p>
      </CardContent>
    </Card>
  );
}
