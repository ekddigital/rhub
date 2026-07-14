import {
  conferencePackageIncludesGuest,
  getConferenceFeeAccommodationMode,
} from "@/lib/conf/fees";
import { isDelegateFullyPaid } from "@/lib/conf/logistics-name-list";

export type RoomPairingDelegate = {
  feePaid: boolean;
  amountPaid: number | null;
  feeAmount: number | null;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  roomPref: "PAIR" | "SINGLE";
  wantsSingleRoom: boolean;
  accommodationNeeded: "YES" | "NO" | "OTHER" | null;
  feePackageId: string | null;
  guestCount: number;
  partnerClaimNote?: string | null;
  bringingForeignGuest?: "YES" | "NO" | "OTHER" | null;
};

/** Matches conference finance board "fully confirmed" payment logic. */
export function isDelegatePaymentConfirmedForPairing(
  delegate: Pick<
    RoomPairingDelegate,
    "feePaid" | "amountPaid" | "feeAmount" | "status"
  >,
): boolean {
  if (delegate.status === "CANCELLED") return false;
  return isDelegateFullyPaid({
    feePaid: delegate.feePaid,
    amountPaid: delegate.amountPaid,
    feeAmount: delegate.feeAmount,
  });
}

/** Shared-room + guest package: delegate already rooms with their guest. */
export function isDelegateRoomingWithIncludedGuest(
  delegate: RoomPairingDelegate,
): boolean {
  if (!conferencePackageIncludesGuest(delegate.feePackageId)) return false;

  const accommodationMode = getConferenceFeeAccommodationMode(
    delegate.feePackageId,
  );
  if (accommodationMode !== "PAIR") return false;

  if (delegate.wantsSingleRoom || delegate.roomPref === "SINGLE") return false;

  if (delegate.guestCount > 1) return false;

  return true;
}

/** Accommodation + room-preference rules (no payment or guest checks). */
export function isDelegateAccommodationPairEligible(
  delegate: Pick<
    RoomPairingDelegate,
    | "roomPref"
    | "wantsSingleRoom"
    | "accommodationNeeded"
    | "feePackageId"
  >,
): boolean {
  const packageAccommodationMode = getConferenceFeeAccommodationMode(
    delegate.feePackageId,
  );
  if (
    packageAccommodationMode === "SINGLE" ||
    packageAccommodationMode === "NONE"
  ) {
    return false;
  }
  if (delegate.accommodationNeeded === "NO") return false;
  if (delegate.wantsSingleRoom) return false;
  return delegate.roomPref === "PAIR";
}

/** Full pairing pool eligibility: paid, accommodation, and guest-package rules. */
export function isDelegateEligibleForRoomPairing(
  delegate: RoomPairingDelegate,
): boolean {
  if (!isDelegatePaymentConfirmedForPairing(delegate)) return false;
  if (!isDelegateAccommodationPairEligible(delegate)) return false;
  if (isDelegateRoomingWithIncludedGuest(delegate)) return false;
  return true;
}

/** Primary occupant for a single-room or paired manual assignment. */
export function isDelegateEligibleForRoomAssignment(
  delegate: RoomPairingDelegate,
): boolean {
  if (!isDelegatePaymentConfirmedForPairing(delegate)) return false;
  if (delegate.accommodationNeeded === "NO") return false;

  const packageAccommodationMode = getConferenceFeeAccommodationMode(
    delegate.feePackageId,
  );
  if (packageAccommodationMode === "NONE") return false;

  return true;
}

export type RoomAssignmentGuest = {
  id: string;
  name: string;
  sortOrder: number;
};

/** Delegate chose not to share a room with their registered guest. */
export function delegateOptedOutOfGuestRooming(
  delegate: Pick<
    RoomPairingDelegate,
    | "roomPref"
    | "wantsSingleRoom"
    | "accommodationNeeded"
    | "feePackageId"
    | "guestCount"
  >,
): boolean {
  if (delegate.accommodationNeeded === "NO") return true;
  if ((delegate.guestCount ?? 0) < 1) return true;

  const packageMode = getConferenceFeeAccommodationMode(delegate.feePackageId);
  const hasGuestPackage = conferencePackageIncludesGuest(delegate.feePackageId);

  // Single-room packages: delegate rooms with their guest(s) in the same room.
  if (packageMode === "SINGLE") return false;

  // Guest packages without an explicit accommodation label (e.g. veteran guest).
  if (hasGuestPackage && packageMode === null) return false;

  // Shared-room + guest package: single-room request still rooms with registered guest(s).
  if (packageMode === "PAIR" && hasGuestPackage) {
    return false;
  }

  // Non-guest packages with single-room preference have no companion guests.
  if (delegate.wantsSingleRoom || delegate.roomPref === "SINGLE") return true;
  return false;
}

/** Delegate can be assigned a single room that includes their registered guest(s). */
export function isDelegateEligibleForGuestSelfRoom(
  delegate: RoomPairingDelegate,
): boolean {
  if (!isDelegateEligibleForRoomAssignment(delegate)) return false;
  if ((delegate.guestCount ?? 0) < 1) return false;
  if (delegateOptedOutOfGuestRooming(delegate)) return false;
  return true;
}

/**
 * Companion guests shown on a room assignment card for a delegate.
 * Only +guest packages with registered guests; hides when delegate opted out.
 * When guestCount > 1, only the first guest shares the delegate's room.
 */
export function getCompanionGuestsForRoomDisplay(
  delegate: RoomPairingDelegate & { guests?: RoomAssignmentGuest[] },
  options?: { hasPairPartner?: boolean },
): RoomAssignmentGuest[] {
  if (options?.hasPairPartner) return [];
  if (delegate.guestCount < 1) return [];
  if (!delegate.guests?.length) return [];
  if (delegateOptedOutOfGuestRooming(delegate)) return [];

  const sorted = [...delegate.guests].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  if (delegate.guestCount > 1) {
    return sorted.slice(0, 1);
  }

  return sorted.slice(0, delegate.guestCount);
}
