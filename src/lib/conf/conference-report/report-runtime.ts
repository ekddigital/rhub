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
  chunkReportRoomPairings,
  countReportReceiptAppendixPages,
  countReportRoomPairingPages,
} from "@/lib/conf/conference-report/connectors";
import type {
  ConferenceReportConnectorData,
  ReportApprovedBudget,
  ReportAttendanceStats,
  ReportDataSource,
  ReportFinanceSummary,
  ReportRoomPairingRow,
} from "@/lib/conf/conference-report/connectors/types";
import attendanceSnapshot from "@/components/tools/conf/conference-report/attendance.generated.json";

export type ReportRuntimeSources = {
  attendance: ReportDataSource;
  roomPairings: ReportDataSource;
  budgets: ReportDataSource;
  receipts: ReportDataSource;
  certificate: ReportDataSource;
};

export type ReportRuntimeContext = {
  attendanceRows: AttendanceRow[];
  attendanceStats: ReportAttendanceStats;
  financeSummary: ReportFinanceSummary;
  roomPairings: ReportRoomPairingRow[];
  approvedBudgets: ReportApprovedBudget[];
  cookingReceiptEntries: ReceiptPhotoEntry[];
  keynoteCertificate: KeynoteCertificateData;
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

  return {
    attendanceRows,
    attendanceStats,
    financeSummary,
    roomPairings: connector?.roomPairings ?? [],
    approvedBudgets: connector?.approvedBudgets ?? [],
    cookingReceiptEntries: connector?.cookingReceiptEntries ?? [],
    keynoteCertificate: connector?.keynoteCertificate ?? REPORT_KEYNOTE_CERTIFICATE,
    cookingBudgetCategories: buildCookingBudgetCategories(),
    sources: {
      attendance: connector?.attendanceSource ?? "snapshot",
      roomPairings: connector?.roomPairingsSource ?? "static",
      budgets: connector?.budgetsSource ?? "static",
      receipts: connector?.receiptsSource ?? "static",
      certificate: connector?.certificateSource ?? "static",
    },
  };
}

export { chunkReportRoomPairings };
