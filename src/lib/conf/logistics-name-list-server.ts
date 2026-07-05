import type { ConfDelegate } from "@prisma/client";
import {
  hasStoredDelegateDocumentPath,
  isDelegateFullyPaid,
  type LogisticsNameListEntry,
  type LogisticsNameListResponse,
} from "@/lib/conf/logistics-name-list";
import {
  resolveDelegateEntryStampForClient,
  resolveDelegatePassportPhotoForClient,
  resolveDelegateVisaForClient,
  resolveGuestEntryStampForClient,
  resolveGuestPassportPhotoForClient,
  resolveGuestVisaForClient,
  isStoredDelegateDocumentPdf,
  probeManyStoredDelegateDocumentsIsPdf,
} from "@/lib/conf/delegate-document-urls";

type GuestRow = {
  id: string;
  delegateId: string;
  sortOrder: number;
  name: string;
  passportNo: string | null;
  nationality: string | null;
  passportPhotoPath: string | null;
  lastEntryStampPath: string | null;
  currentVisaPath: string | null;
};

type DelegateRow = Pick<
  ConfDelegate,
  | "id"
  | "name"
  | "passportNo"
  | "city"
  | "feeAmount"
  | "amountPaid"
  | "feePaid"
  | "passportPhotoPath"
  | "lastEntryStampPath"
  | "currentVisaPath"
  | "status"
>;

type ManualEntryRow = {
  id: string;
  delegateId: string;
  source: "MANUAL" | "AUTO_PAID";
  delegate: DelegateRow;
};

type ConfRow = {
  id: string;
  name: string;
  city: string;
  venue: string | null;
  startsAt: Date;
  endsAt: Date;
};

function mapDelegateDocs(
  confId: string,
  delegate: DelegateRow,
  pdfByPath: Map<string, boolean>,
): Pick<
  LogisticsNameListEntry,
  | "passportPhotoPath"
  | "passportPhotoIsPdf"
  | "lastEntryStampPath"
  | "lastEntryStampIsPdf"
  | "currentVisaPath"
  | "currentVisaIsPdf"
  | "passportDocUrl"
  | "entryStampDocUrl"
  | "visaDocUrl"
> {
  const passportStored = delegate.passportPhotoPath;
  const entryStampStored = delegate.lastEntryStampPath;
  const visaStored = delegate.currentVisaPath;

  const passportPhotoPath = resolveDelegatePassportPhotoForClient(
    confId,
    delegate.id,
    passportStored,
  );
  const lastEntryStampPath = resolveDelegateEntryStampForClient(
    confId,
    delegate.id,
    entryStampStored,
  );
  const currentVisaPath = resolveDelegateVisaForClient(
    confId,
    delegate.id,
    visaStored,
  );

  return {
    passportPhotoPath,
    passportPhotoIsPdf: resolveDocIsPdf(passportStored, pdfByPath),
    lastEntryStampPath,
    lastEntryStampIsPdf: resolveDocIsPdf(entryStampStored, pdfByPath),
    currentVisaPath,
    currentVisaIsPdf: resolveDocIsPdf(visaStored, pdfByPath),
    passportDocUrl: passportPhotoPath,
    entryStampDocUrl: lastEntryStampPath,
    visaDocUrl: currentVisaPath,
  };
}

function resolveDocIsPdf(
  path: string | null | undefined,
  pdfByPath: Map<string, boolean>,
): boolean {
  if (!path?.trim()) return false;
  const cached = pdfByPath.get(path.trim());
  if (cached !== undefined) return cached;
  return isStoredDelegateDocumentPdf(path);
}

function toEntryBase(
  confId: string,
  delegate: DelegateRow,
  pdfByPath: Map<string, boolean>,
): Omit<
  LogisticsNameListEntry,
  "rosterSource" | "entryId" | "isAutoPaid" | "isManual" | "canRemove"
> {
  return {
    id: delegate.id,
    name: delegate.name,
    passportNo: delegate.passportNo,
    city: delegate.city,
    feeAmount: delegate.feeAmount,
    amountPaid: delegate.amountPaid,
    feePaid: delegate.feePaid,
    ...mapDelegateDocs(confId, delegate, pdfByPath),
  };
}

function mapGuestDocs(
  confId: string,
  delegateId: string,
  guest: GuestRow,
  pdfByPath: Map<string, boolean>,
): Pick<
  LogisticsNameListEntry,
  | "passportPhotoPath"
  | "passportPhotoIsPdf"
  | "lastEntryStampPath"
  | "lastEntryStampIsPdf"
  | "currentVisaPath"
  | "currentVisaIsPdf"
  | "passportDocUrl"
  | "entryStampDocUrl"
  | "visaDocUrl"
> {
  const passportStored = guest.passportPhotoPath;
  const entryStampStored = guest.lastEntryStampPath;
  const visaStored = guest.currentVisaPath;

  const passportPhotoPath = resolveGuestPassportPhotoForClient(
    confId,
    delegateId,
    guest.id,
    passportStored,
  );
  const lastEntryStampPath = resolveGuestEntryStampForClient(
    confId,
    delegateId,
    guest.id,
    entryStampStored,
  );
  const currentVisaPath = resolveGuestVisaForClient(
    confId,
    delegateId,
    guest.id,
    visaStored,
  );

  return {
    passportPhotoPath,
    passportPhotoIsPdf: resolveDocIsPdf(passportStored, pdfByPath),
    lastEntryStampPath,
    lastEntryStampIsPdf: resolveDocIsPdf(entryStampStored, pdfByPath),
    currentVisaPath,
    currentVisaIsPdf: resolveDocIsPdf(visaStored, pdfByPath),
    passportDocUrl: passportPhotoPath,
    entryStampDocUrl: lastEntryStampPath,
    visaDocUrl: currentVisaPath,
  };
}

function toGuestEntry(
  confId: string,
  host: DelegateRow,
  guest: GuestRow,
  pdfByPath: Map<string, boolean>,
): LogisticsNameListEntry {
  return {
    id: `guest:${guest.id}`,
    name: guest.name,
    passportNo: guest.passportNo,
    city: host.city,
    feeAmount: null,
    amountPaid: null,
    feePaid: true,
    guestNationality: guest.nationality,
    isGuest: true,
    hostDelegateId: host.id,
    hostDelegateName: host.name,
    ...mapGuestDocs(confId, host.id, guest, pdfByPath),
    rosterSource: "AUTO_PAID",
    entryId: null,
    isAutoPaid: true,
    isManual: false,
    canRemove: false,
  };
}

export async function buildLogisticsNameListResponse(input: {
  conf: ConfRow;
  paidDelegates: DelegateRow[];
  manualEntries: ManualEntryRow[];
  allDelegates: DelegateRow[];
  paidDelegateGuests?: GuestRow[];
  origin: string;
}): Promise<LogisticsNameListResponse> {
  const {
    conf,
    paidDelegates,
    manualEntries,
    allDelegates,
    paidDelegateGuests = [],
    origin,
  } = input;
  const confId = conf.id;

  const allDocPaths = [
    ...paidDelegates.flatMap((d) => [
      d.passportPhotoPath,
      d.lastEntryStampPath,
      d.currentVisaPath,
    ]),
    ...manualEntries.flatMap((e) => [
      e.delegate.passportPhotoPath,
      e.delegate.lastEntryStampPath,
      e.delegate.currentVisaPath,
    ]),
    ...paidDelegateGuests.flatMap((g) => [
      g.passportPhotoPath,
      g.lastEntryStampPath,
      g.currentVisaPath,
    ]),
  ];
  const pdfByPath = await probeManyStoredDelegateDocumentsIsPdf(
    allDocPaths,
    origin,
  );

  const merged = new Map<string, LogisticsNameListEntry>();

  for (const delegate of paidDelegates) {
    if (delegate.status === "CANCELLED") continue;
    merged.set(delegate.id, {
      ...toEntryBase(confId, delegate, pdfByPath),
      rosterSource: "AUTO_PAID",
      entryId: null,
      isAutoPaid: true,
      isManual: false,
      canRemove: false,
    });
  }

  for (const entry of manualEntries) {
    const delegate = entry.delegate;
    if (delegate.status === "CANCELLED") continue;

    const existing = merged.get(delegate.id);
    if (existing) {
      merged.set(delegate.id, {
        ...existing,
        ...toEntryBase(confId, delegate, pdfByPath),
        entryId: entry.id,
        isManual: true,
        rosterSource: existing.isAutoPaid ? "AUTO_PAID" : "MANUAL",
        canRemove: !existing.isAutoPaid,
      });
      continue;
    }

    merged.set(delegate.id, {
      ...toEntryBase(confId, delegate, pdfByPath),
      rosterSource: "MANUAL",
      entryId: entry.id,
      isAutoPaid: false,
      isManual: true,
      canRemove: true,
    });
  }

  const rosterIds = new Set(merged.keys());
  const hostById = new Map(allDelegates.map((d) => [d.id, d]));

  for (const guest of paidDelegateGuests) {
    const host = hostById.get(guest.delegateId);
    if (!host || host.status === "CANCELLED") continue;
    if (!rosterIds.has(host.id)) continue;
    merged.set(`guest:${guest.id}`, toGuestEntry(confId, host, guest, pdfByPath));
  }

  const entries = Array.from(merged.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );

  const availableDelegates = allDelegates
    .filter(
      (d) => d.status !== "CANCELLED" && !rosterIds.has(d.id),
    )
    .map((d) => ({
      id: d.id,
      name: d.name,
      passportNo: d.passportNo,
      city: d.city,
    }))
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    );

  return {
    conf: {
      id: conf.id,
      name: conf.name,
      city: conf.city,
      venue: conf.venue,
      startsAt: conf.startsAt.toISOString(),
      endsAt: conf.endsAt.toISOString(),
    },
    entries,
    availableDelegates,
  };
}

export function filterFullyPaidDelegates(delegates: DelegateRow[]): DelegateRow[] {
  return delegates.filter((d) =>
    isDelegateFullyPaid({
      feePaid: d.feePaid,
      amountPaid: d.amountPaid,
      feeAmount: d.feeAmount,
    }),
  );
}

// Kept for callers that gate on stored paths before mapping to proxy URLs.
export { hasStoredDelegateDocumentPath };
