export type LogisticsRosterSource = "MANUAL" | "AUTO_PAID";

export type LogisticsNameListDelegate = {
  id: string;
  name: string;
  passportNo: string | null;
  city: string;
  feeAmount: number | null;
  amountPaid: number | null;
  feePaid: boolean;
  passportPhotoPath: string | null;
  passportPhotoIsPdf: boolean;
  lastEntryStampPath: string | null;
  lastEntryStampIsPdf: boolean;
  currentVisaPath: string | null;
  currentVisaIsPdf: boolean;
  passportDocUrl: string | null;
  entryStampDocUrl: string | null;
  visaDocUrl: string | null;
  /** True for companion guests (not LSUIC delegates). */
  isGuest?: boolean;
  /** Registrant who registered this guest. */
  hostDelegateId?: string | null;
  hostDelegateName?: string | null;
  guestNationality?: string | null;
};

export type LogisticsNameListEntry = LogisticsNameListDelegate & {
  rosterSource: LogisticsRosterSource;
  entryId: string | null;
  isAutoPaid: boolean;
  isManual: boolean;
  canRemove: boolean;
};

export type LogisticsNameListResponse = {
  conf: {
    id: string;
    name: string;
    city: string;
    venue: string | null;
    startsAt: string;
    endsAt: string;
  };
  entries: LogisticsNameListEntry[];
  availableDelegates: Array<{
    id: string;
    name: string;
    passportNo: string | null;
    city: string;
  }>;
};

/** Matches participants-data-table payment confirmation logic. */
export function isDelegateFullyPaid(input: {
  feePaid: boolean;
  amountPaid: number | null;
  feeAmount: number | null;
}): boolean {
  return (
    input.feePaid && (input.amountPaid ?? 0) >= (input.feeAmount ?? 0)
  );
}

export {
  buildDelegateSecureDocumentUrl as secureDocumentUrl,
  hasStoredDelegateDocumentPath,
  isStoredDelegateDocumentPdf,
  type DelegateSecureDocumentKind,
} from "@/lib/conf/delegate-document-urls";
