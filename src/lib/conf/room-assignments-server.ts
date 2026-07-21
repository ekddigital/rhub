import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
  companionGuest: {
    select: {
      id: true,
      name: true,
      sortOrder: true,
    },
  },
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
  const assignments = await prisma.confRoomAssignment.findMany({
    where: { confId },
    select: { roomCode: true },
  });

  const roomPattern = /^RM-(\d+)$/i;
  const existing = new Set<string>();
  let maxNumber = 0;

  for (const assignment of assignments) {
    const normalized = assignment.roomCode.trim().toUpperCase();
    existing.add(normalized);

    const match = normalized.match(roomPattern);
    if (!match) continue;

    const value = Number.parseInt(match[1], 10);
    if (Number.isFinite(value)) {
      maxNumber = Math.max(maxNumber, value);
    }
  }

  let next = maxNumber + 1;
  while (true) {
    const candidate = `RM-${String(next).padStart(3, "0")}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    next += 1;
  }
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

export function buildRoomAssignmentWriteData(args: {
  occupantAId: string;
  occupantBId: string | null;
  companionGuestId?: string | null;
  overrideReason?: string | null;
  status?: "PENDING" | "ASSIGNED" | "CANCELLED";
  isManual?: boolean;
}) {
  return {
    occupantAId: args.occupantAId,
    occupantBId: args.occupantBId,
    companionGuestId: args.occupantBId
      ? null
      : args.companionGuestId || null,
    status: args.status ?? ("ASSIGNED" as const),
    isManual: args.isManual ?? true,
    overrideReason: args.overrideReason ?? null,
  };
}

export async function findCancelledRoomAssignmentSlot(
  confId: string,
  roomCode: string,
) {
  return prisma.confRoomAssignment.findFirst({
    where: {
      confId,
      roomCode,
      status: "CANCELLED",
    },
    select: { id: true },
  });
}

export function formatRoomAssignmentWriteError(error: unknown): string | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return null;
  if (error.code !== "P2002") return null;

  const target = error.meta?.target;
  const fields = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];

  if (
    fields.some(
      (field) =>
        field.includes("roomCode") ||
        field === "ConfRoomAssignment_confId_roomCode_key",
    )
  ) {
    return "Room code is already reserved by another assignment (including a cancelled one). Choose a different code or edit the existing assignment.";
  }

  if (
    fields.some(
      (field) =>
        field.includes("occupantAId") ||
        field === "ConfRoomAssignment_occupantAId_key",
    )
  ) {
    return "Primary delegate already has a room assignment record.";
  }

  if (
    fields.some(
      (field) =>
        field.includes("occupantBId") ||
        field === "ConfRoomAssignment_occupantBId_key",
    )
  ) {
    return "Second delegate already has a room assignment record.";
  }

  return "Room assignment conflicts with an existing record.";
}

export { isDelegateAccommodationPairEligible, isDelegateEligibleForRoomPairing };
