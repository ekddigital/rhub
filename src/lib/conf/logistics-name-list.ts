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
