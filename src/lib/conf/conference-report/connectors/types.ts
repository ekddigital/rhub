import type { ReceiptPhotoEntry } from "@/lib/conf/document-receipt-photos";
import type { KeynoteCertificateData } from "@/lib/conf/keynote-certificate-data";
import type { ReportBookletContent } from "./booklet";

export type ReportDataSource = "live" | "snapshot" | "static";

export type ReportAttendanceRow = {
  no: string;
  name: string;
  city: string;
  room: string;
  fee: string;
  paid: string;
  balance: string;
};

export type ReportRoomPairingRow = {
  roomCode: string;
  type: "Pair" | "Single";
  occupants: string;
  cities: string;
};

export type ReportApprovedBudget = {
  id: string;
  title: string;
  category: string;
  status: string;
  grandTotal: number;
  approvedAt: string | null;
  itemCount: number;
};

export type ReportFinanceSummary = {
  delegateFeesCollected: number;
  cookingFundsDisbursed: number;
  cookingExpenditure: number;
  cookingBalance: number;
  iecRevenue: number;
  iecExpenditure: number;
  iecBalanceTurnover: number;
};

export type ReportAttendanceStats = {
  totalRegistered: number;
  uniqueCities: number;
  fullyPaid: number;
  totalFeesRmb: number;
  vipGuests: number;
  veteranPlacements: number;
};

export type ConferenceReportConnectorData = {
  attendanceRows: ReportAttendanceRow[];
  attendanceSource: ReportDataSource;
  roomPairings: ReportRoomPairingRow[];
  roomPairingsSource: ReportDataSource;
  approvedBudgets: ReportApprovedBudget[];
  budgetsSource: ReportDataSource;
  cookingReceiptEntries: ReceiptPhotoEntry[];
  receiptsSource: ReportDataSource;
  keynoteCertificate: KeynoteCertificateData;
  certificateSource: ReportDataSource;
  booklet: ReportBookletContent;
  bookletSource: ReportDataSource;
  financeSummary: ReportFinanceSummary;
  attendanceStats: ReportAttendanceStats;
};

export type ReportPageCounts = {
  roomPairingPages: number;
  receiptAppendixPages: number;
};
