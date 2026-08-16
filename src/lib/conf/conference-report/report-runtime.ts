import {
  buildCookingAppendixPages,
  buildCookingBudgetCategories,
} from "@/lib/conf/cooking-report-data";
import type { ReceiptPhotoEntry } from "@/lib/conf/document-receipt-photos";
import type { KeynoteCertificateData } from "@/lib/conf/keynote-certificate-data";
import { REPORT_KEYNOTE_CERTIFICATE } from "@/lib/conf/keynote-certificate-data";
import type { AttendanceRow } from "@/components/tools/conf/conference-report/content-data";
import {
  buildReportAttendanceStats,
  loadReportConferenceBudgetVsActual,
} from "@/lib/conf/conference-report/connectors";
import {
  buildStaticReportBookletContent,
  buildReportBookletPagePlans,
} from "@/lib/conf/conference-report/connectors/booklet";
import type { ReportBookletContent } from "@/lib/conf/conference-report/connectors/booklet";
import type {
  ConferenceReportConnectorData,
  ReportApprovedBudget,
  ReportAttendanceStats,
  ReportBudgetVsActualLine,
  ReportBudgetVsActualTotals,
  ReportDataSource,
  ReportFinanceSummary,
} from "@/lib/conf/conference-report/connectors/types";
import attendanceSnapshot from "@/components/tools/conf/conference-report/attendance.generated.json";

export type ReportRuntimeSources = {
  attendance: ReportDataSource;
  budgets: ReportDataSource;
  budgetVsActual: ReportDataSource;
  receipts: ReportDataSource;
  certificate: ReportDataSource;
  booklet: ReportDataSource;
};

export type ReportRuntimeContext = {
  attendanceRows: AttendanceRow[];
  attendanceStats: ReportAttendanceStats;
  financeSummary: ReportFinanceSummary;
  approvedBudgets: ReportApprovedBudget[];
  budgetVsActual: ReportBudgetVsActualLine[];
  budgetVsActualTotals: ReportBudgetVsActualTotals;
  cookingReceiptEntries: ReceiptPhotoEntry[];
  keynoteCertificate: KeynoteCertificateData;
  booklet: ReportBookletContent;
  bookletPages: ReturnType<typeof buildReportBookletPagePlans>;
  cookingBudgetCategories: ReturnType<typeof buildCookingBudgetCategories>;
  sources: ReportRuntimeSources;
};

const SNAPSHOT = attendanceSnapshot as AttendanceRow[];

const STATIC_IEC = {
  iecRevenue: 2_365.0,
  iecExpenditure: 948.69,
  iecBalanceTurnover: 1_416.31,
} as const;

export function createReportRuntimeContext(
  connector?: ConferenceReportConnectorData | null,
): ReportRuntimeContext {
  const attendanceRows =
    connector && connector.attendanceRows.length > 0
      ? (connector.attendanceRows as AttendanceRow[])
      : SNAPSHOT;

  const attendanceStats =
    connector?.attendanceStats ?? buildReportAttendanceStats(attendanceRows);

  const financeSummary: ReportFinanceSummary = connector?.financeSummary ?? {
    delegateFeesCollected: attendanceStats.totalFeesRmb,
    cookingFundsDisbursed: 18_113.03,
    cookingExpenditure: 17_538.08,
    cookingBalance: 574.95,
    ...STATIC_IEC,
  };

  const booklet = connector?.booklet ?? buildStaticReportBookletContent();
  const budgetVsActualData =
    connector?.budgetVsActual && connector.budgetVsActual.length > 0
      ? {
          lines: connector.budgetVsActual,
          totals: connector.budgetVsActualTotals,
          source: connector.budgetVsActualSource,
        }
      : loadReportConferenceBudgetVsActual();

  return {
    attendanceRows,
    attendanceStats,
    financeSummary,
    approvedBudgets: connector?.approvedBudgets ?? [],
    budgetVsActual: budgetVsActualData.lines,
    budgetVsActualTotals: budgetVsActualData.totals,
    cookingReceiptEntries: connector?.cookingReceiptEntries ?? [],
    keynoteCertificate: connector?.keynoteCertificate ?? REPORT_KEYNOTE_CERTIFICATE,
    booklet,
    bookletPages: buildReportBookletPagePlans(booklet),
    cookingBudgetCategories: buildCookingBudgetCategories(),
    sources: {
      attendance: connector?.attendanceSource ?? "snapshot",
      budgets: connector?.budgetsSource ?? "static",
      budgetVsActual: budgetVsActualData.source,
      receipts: connector?.receiptsSource ?? "static",
      certificate: connector?.certificateSource ?? "static",
      booklet: connector?.bookletSource ?? "static",
    },
  };
}

export { buildCookingAppendixPages };
