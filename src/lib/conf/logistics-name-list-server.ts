import type { ConfDelegate } from "@prisma/client";
import {
  isDelegateFullyPaid,
  secureDocumentUrl,
  type LogisticsNameListEntry,
  type LogisticsNameListResponse,
} from "@/lib/conf/logistics-name-list";

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
): Pick<
  LogisticsNameListEntry,
  | "passportPhotoPath"
  | "lastEntryStampPath"
  | "currentVisaPath"
  | "passportDocUrl"
  | "entryStampDocUrl"
  | "visaDocUrl"
> {
  return {
    passportPhotoPath: delegate.passportPhotoPath,
    lastEntryStampPath: delegate.lastEntryStampPath,
    currentVisaPath: delegate.currentVisaPath,
    passportDocUrl: delegate.passportPhotoPath
      ? secureDocumentUrl(confId, delegate.id, "passport")
      : null,
    entryStampDocUrl: delegate.lastEntryStampPath
      ? secureDocumentUrl(confId, delegate.id, "entry-stamp")
      : null,
    visaDocUrl: delegate.currentVisaPath
      ? secureDocumentUrl(confId, delegate.id, "visa")
      : null,
  };
}

function toEntryBase(
  confId: string,
  delegate: DelegateRow,
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
    ...mapDelegateDocs(confId, delegate),
  };
}

export function buildLogisticsNameListResponse(input: {
  conf: ConfRow;
  paidDelegates: DelegateRow[];
  manualEntries: ManualEntryRow[];
  allDelegates: DelegateRow[];
}): LogisticsNameListResponse {
  const { conf, paidDelegates, manualEntries, allDelegates } = input;
  const confId = conf.id;

  const merged = new Map<string, LogisticsNameListEntry>();

  for (const delegate of paidDelegates) {
    if (delegate.status === "CANCELLED") continue;
    merged.set(delegate.id, {
      ...toEntryBase(confId, delegate),
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
        ...toEntryBase(confId, delegate),
        entryId: entry.id,
        isManual: true,
        rosterSource: existing.isAutoPaid ? "AUTO_PAID" : "MANUAL",
        canRemove: !existing.isAutoPaid,
      });
      continue;
    }

    merged.set(delegate.id, {
      ...toEntryBase(confId, delegate),
      rosterSource: "MANUAL",
      entryId: entry.id,
      isAutoPaid: false,
      isManual: true,
      canRemove: true,
    });
  }

  const rosterIds = new Set(merged.keys());
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
