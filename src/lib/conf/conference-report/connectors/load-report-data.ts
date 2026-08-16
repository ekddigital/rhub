import attendanceSnapshot from "@/components/tools/conf/conference-report/attendance.generated.json";
import { loadReportAttendanceRegisterFromFile } from "./attendance-register";
import { buildReportAttendanceStats } from "./delegates";
import {
  loadReportApprovedBudgets,
  loadReportConferenceBudgetVsActual,
  selectCookingApprovedBudget,
} from "./budget";
import {
  buildStaticCookingFinanceSummary,
  loadReportCookingPayments,
} from "./payments";
import { loadReportKeynoteCertificate } from "./certificates";
import {
  buildStaticReportBookletContent,
  loadReportBookletContent,
} from "./booklet";
import type {
  ConferenceReportConnectorData,
  ReportAttendanceRow,
  ReportDataSource,
  ReportFinanceSummary,
} from "./types";

const SNAPSHOT_ROWS = attendanceSnapshot as ReportAttendanceRow[];

const STATIC_IEC_FINANCE = {
  iecRevenue: 2_365.0,
  iecExpenditure: 948.69,
  iecBalanceTurnover: 1_416.31,
} as const;

function buildFinanceSummary(args: {
  attendanceRows: readonly ReportAttendanceRow[];
  cookingOverride?: Partial<
    Pick<
      ReportFinanceSummary,
      "cookingFundsDisbursed" | "cookingExpenditure" | "cookingBalance"
    >
  >;
}): ReportFinanceSummary {
  const stats = buildReportAttendanceStats(args.attendanceRows);
  const cooking = buildStaticCookingFinanceSummary();

  return {
    delegateFeesCollected: stats.totalFeesRmb,
    cookingFundsDisbursed:
      args.cookingOverride?.cookingFundsDisbursed ?? cooking.cookingFundsDisbursed,
    cookingExpenditure:
      args.cookingOverride?.cookingExpenditure ?? cooking.cookingExpenditure,
    cookingBalance:
      args.cookingOverride?.cookingBalance ?? cooking.cookingBalance,
    ...STATIC_IEC_FINANCE,
  };
}

function resolveAttendance(): {
  rows: ReportAttendanceRow[];
  source: ReportDataSource;
} {
  const fromExcel = loadReportAttendanceRegisterFromFile();
  if (fromExcel.attendanceRows.length > 0) {
    return { rows: fromExcel.attendanceRows, source: "static" };
  }
  if (SNAPSHOT_ROWS.length > 0) {
    return { rows: SNAPSHOT_ROWS, source: "snapshot" };
  }
  return { rows: [], source: "static" };
}

/** Aggregate live tool data for the conference report with certified static fallbacks. */
export async function loadConferenceReportConnectorData(
  confId: string,
): Promise<ConferenceReportConnectorData> {
  const [budgetData, paymentData, certificateData, bookletData] =
    await Promise.all([
      loadReportApprovedBudgets(confId),
      loadReportCookingPayments(confId),
      Promise.resolve(loadReportKeynoteCertificate()),
      loadReportBookletContent(confId),
    ]);

  const attendance = resolveAttendance();

  const cookingBudget = selectCookingApprovedBudget(budgetData.budgets);
  const cookingFinanceOverride =
    cookingBudget && cookingBudget.grandTotal > 0
      ? {
          cookingFundsDisbursed: cookingBudget.grandTotal,
        }
      : undefined;

  const budgetVsActual = loadReportConferenceBudgetVsActual();
  const financeSummary = buildFinanceSummary({
    attendanceRows: attendance.rows,
    cookingOverride: cookingFinanceOverride,
  });

  return {
    attendanceRows: attendance.rows,
    attendanceSource: attendance.source,
    approvedBudgets: budgetData.budgets,
    budgetsSource: budgetData.source,
    budgetVsActual: budgetVsActual.lines,
    budgetVsActualTotals: budgetVsActual.totals,
    budgetVsActualSource: budgetVsActual.source,
    cookingReceiptEntries: paymentData.receiptEntries,
    receiptsSource: paymentData.source,
    keynoteCertificate: certificateData.certificate,
    certificateSource: certificateData.source,
    booklet: bookletData,
    bookletSource: bookletData.source,
    financeSummary,
    attendanceStats: buildReportAttendanceStats(attendance.rows),
  };
}

export { SNAPSHOT_ROWS as REPORT_ATTENDANCE_SNAPSHOT };
