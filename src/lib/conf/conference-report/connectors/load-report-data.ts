import attendanceSnapshot from "@/components/tools/conf/conference-report/attendance.generated.json";
import {
  buildReportAttendanceStats,
  loadReportDelegateData,
} from "./delegates";
import {
  loadReportApprovedBudgets,
  selectCookingApprovedBudget,
} from "./budget";
import {
  buildStaticCookingFinanceSummary,
  loadReportCookingPayments,
} from "./payments";
import { loadReportKeynoteCertificate } from "./certificates";
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

function resolveAttendance(
  liveRows: ReportAttendanceRow[],
  liveSource: ReportDataSource,
): { rows: ReportAttendanceRow[]; source: ReportDataSource } {
  if (liveRows.length > 0) {
    return { rows: liveRows, source: liveSource };
  }
  return { rows: SNAPSHOT_ROWS, source: "snapshot" };
}

/** Aggregate live tool data for the conference report with certified static fallbacks. */
export async function loadConferenceReportConnectorData(
  confId: string,
): Promise<ConferenceReportConnectorData> {
  const [delegateData, budgetData, paymentData, certificateData] =
    await Promise.all([
      loadReportDelegateData(confId),
      loadReportApprovedBudgets(confId),
      loadReportCookingPayments(confId),
      Promise.resolve(loadReportKeynoteCertificate()),
    ]);

  const attendance = resolveAttendance(
    delegateData.attendanceRows,
    delegateData.source,
  );

  const cookingBudget = selectCookingApprovedBudget(budgetData.budgets);
  const cookingFinanceOverride =
    cookingBudget && cookingBudget.grandTotal > 0
      ? {
          cookingFundsDisbursed: cookingBudget.grandTotal,
        }
      : undefined;

  const financeSummary = buildFinanceSummary({
    attendanceRows: attendance.rows,
    cookingOverride: cookingFinanceOverride,
  });

  return {
    attendanceRows: attendance.rows,
    attendanceSource: attendance.source,
    roomPairings: delegateData.roomPairings,
    roomPairingsSource:
      delegateData.roomPairings.length > 0 ? delegateData.source : "static",
    approvedBudgets: budgetData.budgets,
    budgetsSource: budgetData.source,
    cookingReceiptEntries: paymentData.receiptEntries,
    receiptsSource: paymentData.source,
    keynoteCertificate: certificateData.certificate,
    certificateSource: certificateData.source,
    financeSummary,
    attendanceStats: buildReportAttendanceStats(attendance.rows),
  };
}

export { SNAPSHOT_ROWS as REPORT_ATTENDANCE_SNAPSHOT };
