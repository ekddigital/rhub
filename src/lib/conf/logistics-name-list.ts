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

export type LogisticsNameListRoomSummary = {
  roomCode: string;
  assignmentType: "PAIR" | "SINGLE" | "SINGLE_WITH_GUEST";
  pairPartnerName: string | null;
};

export type LogisticsNameListEntry = LogisticsNameListDelegate & {
  rosterSource: LogisticsRosterSource;
  entryId: string | null;
  isAutoPaid: boolean;
  isManual: boolean;
  canRemove: boolean;
  roomAssignment: LogisticsNameListRoomSummary | null;
};

export type LogisticsRoomPairingOccupant = {
  id: string;
  name: string;
  delegateCode: string | null;
  gender: "MALE" | "FEMALE" | null;
  city: string;
  passportNo: string | null;
  feePackageId: string | null;
  guestCount: number;
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  guests: Array<{ id: string; name: string; sortOrder: number }>;
  bookletPhotoPath: string | null;
  passportPhotoPath: string | null;
  passportPhotoIsPdf: boolean;
  profilePhotoUrl: string | null;
  profilePhotoIsPdf: boolean;
  profileHref: string;
};

export type LogisticsRoomPairingGuest = {
  id: string;
  name: string;
  hostDelegateId: string;
  hostDelegateName: string;
  passportPhotoPath: string | null;
  passportPhotoIsPdf: boolean;
  profilePhotoUrl: string | null;
  profileHref: string;
};

export type LogisticsRoomPairingAssignmentType =
  | "PAIR"
  | "SINGLE"
  | "SINGLE_WITH_GUEST";

export type LogisticsRoomPairing = {
  id: string;
  roomCode: string;
  status: "PENDING" | "ASSIGNED" | "CANCELLED";
  assignmentType: LogisticsRoomPairingAssignmentType;
  occupantA: LogisticsRoomPairingOccupant;
  occupantB: LogisticsRoomPairingOccupant | null;
  companionGuest: LogisticsRoomPairingGuest | null;
  companionGuests: Array<{ id: string; name: string }>;
  overrideReason: string | null;
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
  roomPairings: LogisticsRoomPairing[];
  availableDelegates: Array<{
    id: string;
    name: string;
    passportNo: string | null;
    city: string;
  }>;
};

/** Prefer booklet headshot; fall back to passport image when booklet is missing. */
export function resolveLogisticsProfilePhoto(input: {
  bookletPhotoPath: string | null;
  passportPhotoPath: string | null;
  passportPhotoIsPdf: boolean;
}): { url: string | null; isPdf: boolean } {
  if (input.bookletPhotoPath) {
    return { url: input.bookletPhotoPath, isPdf: false };
  }
  if (input.passportPhotoPath && !input.passportPhotoIsPdf) {
    return { url: input.passportPhotoPath, isPdf: false };
  }
  if (input.passportPhotoPath) {
    return { url: input.passportPhotoPath, isPdf: input.passportPhotoIsPdf };
  }
  return { url: null, isPdf: false };
}

/** Extract ConfDelegateGuest id from logistics roster row id (`guest:<id>`). */
export function parseLogisticsGuestId(rowId: string): string | null {
  if (rowId.startsWith("guest:")) return rowId.slice("guest:".length);
  return null;
}

/** Profile link for logistics roster rows (delegates and companion guests). */
export function logisticsProfileHref(row: LogisticsNameListEntry): string {
  if (row.isGuest && row.hostDelegateId) {
    const guestId = parseLogisticsGuestId(row.id);
    if (guestId) {
      return `/tools/conf/delegates/${row.hostDelegateId}?guest=${encodeURIComponent(guestId)}`;
    }
    return `/tools/conf/delegates/${row.hostDelegateId}`;
  }
  if (row.passportNo) {
    return `/tools/conf/delegates/p/${encodeURIComponent(row.passportNo)}`;
  }
  return `/tools/conf/delegates/${row.id}`;
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

export {
  buildDelegateSecureDocumentUrl as secureDocumentUrl,
  hasStoredDelegateDocumentPath,
  isStoredDelegateDocumentPdf,
  type DelegateSecureDocumentKind,
} from "@/lib/conf/delegate-document-urls";
