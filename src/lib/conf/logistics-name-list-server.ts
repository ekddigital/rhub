import type { ConfDelegate } from "@prisma/client";
import {
  hasStoredDelegateDocumentPath,
  isDelegateFullyPaid,
  resolveLogisticsProfilePhoto,
  type LogisticsNameListEntry,
  type LogisticsNameListResponse,
  type LogisticsNameListRoomSummary,
  type LogisticsRoomPairing,
  type LogisticsRoomPairingAssignmentType,
  type LogisticsRoomPairingGuest,
  type LogisticsRoomPairingOccupant,
} from "@/lib/conf/logistics-name-list";
import {
  resolveDelegateEntryStampForClient,
  resolveDelegatePassportPhotoForClient,
  resolveDelegateVisaForClient,
  resolveDelegateBookletPhotoForClient,
  resolveGuestEntryStampForClient,
  resolveGuestPassportPhotoForClient,
  resolveGuestVisaForClient,
  isStoredDelegateDocumentPdf,
  probeManyStoredDelegateDocumentsIsPdf,
} from "@/lib/conf/delegate-document-urls";
import { getCompanionGuestsForRoomDisplay } from "@/lib/conf/room-pairing-eligibility";
import { ROOM_ASSIGNMENT_OCCUPANT_SELECT } from "@/lib/conf/room-assignments-server";

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

type RoomPairingOccupantRow = {
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
  feePaid: boolean;
  amountPaid: number | null;
  feeAmount: number | null;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  passportPhotoPath: string | null;
  bookletPhotoPath: string | null;
  guests: Array<{
    id: string;
    name: string;
    sortOrder: number;
  }>;
};

type RoomPairingGuestRow = {
  id: string;
  name: string;
  sortOrder: number;
  passportPhotoPath: string | null;
  delegateId: string;
};

type RoomPairingAssignmentRow = {
  id: string;
  roomCode: string;
  status: "PENDING" | "ASSIGNED" | "CANCELLED";
  overrideReason: string | null;
  occupantA: RoomPairingOccupantRow;
  occupantB: RoomPairingOccupantRow | null;
  companionGuest: RoomPairingGuestRow | null;
};

export const LOGISTICS_ROOM_PAIRING_INCLUDE = {
  occupantA: {
    select: {
      ...ROOM_ASSIGNMENT_OCCUPANT_SELECT,
      passportNo: true,
      passportPhotoPath: true,
      bookletPhotoPath: true,
      feePaid: true,
      amountPaid: true,
      feeAmount: true,
      status: true,
    },
  },
  occupantB: {
    select: {
      ...ROOM_ASSIGNMENT_OCCUPANT_SELECT,
      passportNo: true,
      passportPhotoPath: true,
      bookletPhotoPath: true,
      feePaid: true,
      amountPaid: true,
      feeAmount: true,
      status: true,
    },
  },
  companionGuest: {
    select: {
      id: true,
      name: true,
      sortOrder: true,
      passportPhotoPath: true,
      delegateId: true,
    },
  },
} as const;

function mapRoomPairingOccupant(
  confId: string,
  occupant: RoomPairingOccupantRow,
  pdfByPath: Map<string, boolean>,
): LogisticsRoomPairingOccupant {
  const bookletPhotoPath = resolveDelegateBookletPhotoForClient(
    confId,
    occupant.id,
    occupant.bookletPhotoPath,
  );
  const passportPhotoPath = resolveDelegatePassportPhotoForClient(
    confId,
    occupant.id,
    occupant.passportPhotoPath,
  );
  const passportPhotoIsPdf = resolveDocIsPdf(
    occupant.passportPhotoPath,
    pdfByPath,
  );
  const profilePhoto = resolveLogisticsProfilePhoto({
    bookletPhotoPath,
    passportPhotoPath,
    passportPhotoIsPdf,
  });

  return {
    id: occupant.id,
    name: occupant.name,
    delegateCode: occupant.delegateCode,
    gender: occupant.gender,
    city: occupant.city,
    passportNo: occupant.passportNo,
    feePackageId: occupant.feePackageId,
    guestCount: occupant.guestCount,
    roomPref: occupant.roomPref,
    wantsSingleRoom: occupant.wantsSingleRoom,
    accommodationNeeded: occupant.accommodationNeeded,
    guests: occupant.guests,
    bookletPhotoPath,
    passportPhotoPath,
    passportPhotoIsPdf,
    profilePhotoUrl: profilePhoto.url,
    profilePhotoIsPdf: profilePhoto.isPdf,
    profileHref: occupant.passportNo
      ? `/tools/conf/delegates/p/${encodeURIComponent(occupant.passportNo)}`
      : `/tools/conf/delegates/${occupant.id}`,
  };
}

function mapRoomPairingCompanionGuest(
  confId: string,
  host: RoomPairingOccupantRow,
  guest: RoomPairingGuestRow,
  pdfByPath: Map<string, boolean>,
): LogisticsRoomPairingGuest {
  const passportPhotoPath = resolveGuestPassportPhotoForClient(
    confId,
    host.id,
    guest.id,
    guest.passportPhotoPath,
  );
  const passportPhotoIsPdf = resolveDocIsPdf(guest.passportPhotoPath, pdfByPath);
  const profilePhoto = resolveLogisticsProfilePhoto({
    bookletPhotoPath: null,
    passportPhotoPath,
    passportPhotoIsPdf,
  });

  return {
    id: guest.id,
    name: guest.name,
    hostDelegateId: host.id,
    hostDelegateName: host.name,
    passportPhotoPath,
    passportPhotoIsPdf,
    profilePhotoUrl: profilePhoto.url,
    profileHref: `/tools/conf/delegates/${host.id}?guest=${encodeURIComponent(guest.id)}`,
  };
}

function resolveRoomPairingAssignmentType(
  assignment: RoomPairingAssignmentRow,
): LogisticsRoomPairingAssignmentType {
  if (assignment.occupantB) return "PAIR";
  if (assignment.companionGuest) return "SINGLE_WITH_GUEST";
  return "SINGLE";
}

function companionGuestsForOccupant(
  occupant: RoomPairingOccupantRow,
  hasPairPartner: boolean,
) {
  return getCompanionGuestsForRoomDisplay(
    {
      feePackageId: occupant.feePackageId,
      guestCount: occupant.guestCount,
      roomPref: occupant.roomPref,
      wantsSingleRoom: occupant.wantsSingleRoom,
      accommodationNeeded: occupant.accommodationNeeded,
      feePaid: occupant.feePaid,
      amountPaid: occupant.amountPaid,
      feeAmount: occupant.feeAmount,
      status: occupant.status,
      guests: occupant.guests,
    },
    { hasPairPartner },
  );
}

export async function buildLogisticsRoomPairings(input: {
  confId: string;
  assignments: RoomPairingAssignmentRow[];
  origin: string;
}): Promise<LogisticsRoomPairing[]> {
  const { confId, assignments, origin } = input;

  const allDocPaths = assignments.flatMap((assignment) => [
    assignment.occupantA.passportPhotoPath,
    assignment.occupantB?.passportPhotoPath ?? null,
    assignment.companionGuest?.passportPhotoPath ?? null,
  ]);
  const pdfByPath = await probeManyStoredDelegateDocumentsIsPdf(
    allDocPaths,
    origin,
  );

  return assignments
    .slice()
    .sort((a, b) => a.roomCode.localeCompare(b.roomCode))
    .map((assignment) => {
      const hasPairPartner = Boolean(assignment.occupantB);
      const occupantA = mapRoomPairingOccupant(
        confId,
        assignment.occupantA,
        pdfByPath,
      );
      const occupantB = assignment.occupantB
        ? mapRoomPairingOccupant(confId, assignment.occupantB, pdfByPath)
        : null;
      const companionGuest = assignment.companionGuest
        ? mapRoomPairingCompanionGuest(
            confId,
            assignment.occupantA,
            assignment.companionGuest,
            pdfByPath,
          )
        : null;

      const companionGuests = [
        ...companionGuestsForOccupant(assignment.occupantA, hasPairPartner),
        ...(assignment.occupantB
          ? companionGuestsForOccupant(assignment.occupantB, false)
          : []),
      ].map((guest) => ({ id: guest.id, name: guest.name }));

      return {
        id: assignment.id,
        roomCode: assignment.roomCode,
        status: assignment.status,
        assignmentType: resolveRoomPairingAssignmentType(assignment),
        occupantA,
        occupantB,
        companionGuest,
        companionGuests,
        overrideReason: assignment.overrideReason,
      };
    });
}

function buildRoomSummaryByDelegateId(
  pairings: LogisticsRoomPairing[],
): Map<string, LogisticsNameListRoomSummary> {
  const byDelegateId = new Map<string, LogisticsNameListRoomSummary>();

  for (const pairing of pairings) {
    const summary: LogisticsNameListRoomSummary = {
      roomCode: pairing.roomCode,
      assignmentType: pairing.assignmentType,
      pairPartnerName: pairing.occupantB?.name ?? null,
    };

    byDelegateId.set(pairing.occupantA.id, {
      ...summary,
      pairPartnerName: pairing.occupantB?.name ?? null,
    });

    if (pairing.occupantB) {
      byDelegateId.set(pairing.occupantB.id, {
        ...summary,
        pairPartnerName: pairing.occupantA.name,
      });
    }
  }

  return byDelegateId;
}

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
  | "rosterSource"
  | "entryId"
  | "isAutoPaid"
  | "isManual"
  | "canRemove"
  | "roomAssignment"
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
    roomAssignment: null,
  };
}

export async function buildLogisticsNameListResponse(input: {
  conf: ConfRow;
  paidDelegates: DelegateRow[];
  manualEntries: ManualEntryRow[];
  allDelegates: DelegateRow[];
  paidDelegateGuests?: GuestRow[];
  roomAssignments?: RoomPairingAssignmentRow[];
  origin: string;
}): Promise<LogisticsNameListResponse> {
  const {
    conf,
    paidDelegates,
    manualEntries,
    allDelegates,
    paidDelegateGuests = [],
    roomAssignments = [],
    origin,
  } = input;
  const confId = conf.id;

  const roomPairings = await buildLogisticsRoomPairings({
    confId,
    assignments: roomAssignments,
    origin,
  });
  const roomSummaryByDelegateId = buildRoomSummaryByDelegateId(roomPairings);
  const roomSummaryByGuestId = new Map<string, LogisticsNameListRoomSummary>();
  for (const pairing of roomPairings) {
    if (pairing.companionGuest) {
      roomSummaryByGuestId.set(pairing.companionGuest.id, {
        roomCode: pairing.roomCode,
        assignmentType: pairing.assignmentType,
        pairPartnerName: pairing.occupantA.name,
      });
    }
  }

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
      roomAssignment: roomSummaryByDelegateId.get(delegate.id) ?? null,
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
        roomAssignment: roomSummaryByDelegateId.get(delegate.id) ?? null,
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
      roomAssignment: roomSummaryByDelegateId.get(delegate.id) ?? null,
    });
  }

  const rosterIds = new Set(merged.keys());
  const hostById = new Map(allDelegates.map((d) => [d.id, d]));

  for (const guest of paidDelegateGuests) {
    const host = hostById.get(guest.delegateId);
    if (!host || host.status === "CANCELLED") continue;
    if (!rosterIds.has(host.id)) continue;
    merged.set(`guest:${guest.id}`, {
      ...toGuestEntry(confId, host, guest, pdfByPath),
      roomAssignment: roomSummaryByGuestId.get(guest.id) ?? null,
    });
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
    roomPairings,
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
