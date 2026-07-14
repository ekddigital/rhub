import type { ConferenceAccess } from "@/lib/conf/access";

/** Chair, committee, platform admins, and other conference managers. */
export function canViewAllPairingData(
  access: Pick<ConferenceAccess, "isManager" | "isChair">,
): boolean {
  return access.isManager || access.isChair;
}

export function canManagePairingData(
  access: Pick<ConferenceAccess, "isManager" | "isChair">,
): boolean {
  return canViewAllPairingData(access);
}

export function buildPairRequestVisibilityWhere(
  confId: string,
  access: ConferenceAccess,
) {
  if (canViewAllPairingData(access)) {
    return { confId };
  }

  if (!access.delegateId) {
    return { confId, id: "__no_delegate__" };
  }

  return {
    confId,
    OR: [
      { requesterId: access.delegateId },
      { targetId: access.delegateId },
    ],
  };
}

export function buildRoomAssignmentVisibilityWhere(
  confId: string,
  access: ConferenceAccess,
) {
  if (canViewAllPairingData(access)) {
    return { confId };
  }

  if (!access.delegateId) {
    return { confId, id: "__no_delegate__" };
  }

  return {
    confId,
    OR: [
      { occupantAId: access.delegateId },
      { occupantBId: access.delegateId },
    ],
  };
}

export function pairingParticipantCanActOnRequest(
  access: ConferenceAccess,
  request: { requesterId: string; targetId: string | null },
): boolean {
  if (canManagePairingData(access)) return true;
  if (!access.delegateId) return false;
  return (
    access.delegateId === request.requesterId ||
    access.delegateId === request.targetId
  );
}
