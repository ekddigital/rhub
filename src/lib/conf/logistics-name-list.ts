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
  lastEntryStampPath: string | null;
  currentVisaPath: string | null;
  passportDocUrl: string | null;
  entryStampDocUrl: string | null;
  visaDocUrl: string | null;
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

/** True when a delegate document column has a non-empty stored path. */
export function hasStoredDelegateDocumentPath(
  path: string | null | undefined,
): boolean {
  return typeof path === "string" && path.trim().length > 0;
}

function stripUrlHashQuery(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

/** Detect PDF uploads by filename extension on stored paths or proxy URLs. */
export function isStoredDelegateDocumentPdf(
  path: string | null | undefined,
): boolean {
  if (!hasStoredDelegateDocumentPath(path)) return false;
  const normalized = stripUrlHashQuery(path!.trim()).toLowerCase();
  return normalized.endsWith(".pdf");
}

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

export function secureDocumentUrl(
  confId: string,
  delegateId: string,
  kind: "passport" | "entry-stamp" | "visa",
): string {
  return `/api/conf/${confId}/delegates/${delegateId}/secure-document?kind=${kind}`;
}
