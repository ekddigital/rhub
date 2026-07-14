import { prisma } from "@/lib/prisma";
import {
  isDelegateAccommodationPairEligible,
  isDelegateEligibleForGuestSelfRoom,
  isDelegateEligibleForRoomAssignment,
  isDelegateEligibleForRoomPairing,
  isGuestOccupantValue,
  type RoomPairingDelegate,
} from "@/lib/conf/room-pairing-eligibility";

export const ROOM_ASSIGNMENT_OCCUPANT_SELECT = {
  id: true,
  name: true,
  delegateCode: true,
  gender: true,
  city: true,
  feePackageId: true,
  guestCount: true,
  roomPref: true,
  wantsSingleRoom: true,
  accommodationNeeded: true,
  guests: {
    select: {
      id: true,
      name: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

export const ROOM_ASSIGNMENT_INCLUDE = {
  occupantA: { select: ROOM_ASSIGNMENT_OCCUPANT_SELECT },
  occupantB: { select: ROOM_ASSIGNMENT_OCCUPANT_SELECT },
} as const;

export const DELEGATE_PAIRING_SELECT = {
  id: true,
  confId: true,
  gender: true,
  roomPref: true,
  wantsSingleRoom: true,
  accommodationNeeded: true,
  feePackageId: true,
  feePaid: true,
  amountPaid: true,
  feeAmount: true,
  status: true,
  guestCount: true,
  partnerClaimNote: true,
  bringingForeignGuest: true,
} as const;

export type DelegatePairingRecord = RoomPairingDelegate & {
  id: string;
  confId: string;
  gender: "MALE" | "FEMALE" | null;
};

export async function generateRoomCode(confId: string) {
  const count = await prisma.confRoomAssignment.count({ where: { confId } });
  return `RM-${String(count + 1).padStart(3, "0")}`;
}

export async function hasActiveAssignment(
  delegateId: string,
  exceptAssignmentId?: string,
) {
  const assignment = await prisma.confRoomAssignment.findFirst({
    where: {
      status: { not: "CANCELLED" },
      OR: [{ occupantAId: delegateId }, { occupantBId: delegateId }],
      ...(exceptAssignmentId ? { id: { not: exceptAssignmentId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(assignment);
}

export async function fetchDelegateForPairing(delegateId: string) {
  return prisma.confDelegate.findUnique({
    where: { id: delegateId },
    select: DELEGATE_PAIRING_SELECT,
  });
}

export function parseRoomAssignmentOccupantBInput(body: {
  occupantBId?: unknown;
  companionGuestId?: unknown;
}): {
  occupantBId: string | null;
  companionGuestId: string | null;
} {
  const rawOccupantBId =
    typeof body.occupantBId === "string" ? body.occupantBId.trim() : "";
  const rawCompanionGuestId =
    typeof body.companionGuestId === "string"
      ? body.companionGuestId.trim()
      : "";

  if (rawOccupantBId && isGuestOccupantValue(rawOccupantBId)) {
    const guestId = rawOccupantBId.slice("guest:".length).trim();
    return {
      occupantBId: null,
      companionGuestId: rawCompanionGuestId || guestId || null,
    };
  }

  return {
    occupantBId: rawOccupantBId || null,
    companionGuestId: rawCompanionGuestId || null,
  };
}

export function validateOccupantPairing(
  occupantA: DelegatePairingRecord,
  occupantB: DelegatePairingRecord | null,
  overrideReason: string | null,
  options?: {
    allowExistingOccupants?: boolean;
    isPairedAssignment?: boolean;
    companionGuestId?: string | null;
  },
) {
  if (occupantB) {
    if (!isDelegateEligibleForRoomPairing(occupantA)) {
      return "Primary delegate is not eligible for pairing (payment, accommodation, or guest-package rules).";
    }
    if (!isDelegateEligibleForRoomPairing(occupantB)) {
      return "Second delegate is not eligible for pairing (payment, accommodation, or guest-package rules).";
    }
  } else if (
    !options?.allowExistingOccupants &&
    !isDelegateEligibleForRoomAssignment(occupantA)
  ) {
    return "Delegate is not eligible for room assignment (payment or accommodation rules).";
  }

  if (
    occupantB &&
    occupantA.gender &&
    occupantB.gender &&
    occupantA.gender !== occupantB.gender &&
    !overrideReason
  ) {
    return "Cross-gender room assignment requires an override reason (legal partner exception).";
  }

  if (
    !occupantB &&
    options?.companionGuestId &&
    !isDelegateEligibleForGuestSelfRoom(occupantA)
  ) {
    return "Delegate is not eligible for a single room with guest(s).";
  }

  return null;
}

export { isDelegateAccommodationPairEligible, isDelegateEligibleForRoomPairing };
