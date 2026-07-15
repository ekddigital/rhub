import {
  bookletScopeForLsuicRow,
  digitsOnlyPhone,
  inferLsuicMemberRole,
  loadLsuicLeadersRoster,
  lsuicLeaderRosterKey,
  normalizeLeaderName,
  shouldExcludeFromWelfareRoster,
  stripHonorificDisplayName,
  type LsuicLeaderRosterRow,
} from "@/lib/conf/lsuic-leaders-roster";
import { resolveBookletMemberPhotoPath } from "@/lib/conf/resolve-booklet-member-photo";

export type BookletRosterMember = {
  id: string;
  rosterKey: string;
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  phone?: string | null;
  province?: string | null;
  university?: string | null;
  delegateCode?: string | null;
  conferencePosition?: string | null;
  committeeScope: string | null;
  photoPath: string | null;
  bookletBio: string | null;
  userId: string | null;
  hasRegistered?: boolean;
};

type DelegateLike = {
  id: string;
  name: string;
  userId: string | null;
  email?: string | null;
  phone?: string | null;
  city: string;
  province?: string | null;
  university?: string | null;
  delegateCode?: string | null;
  conferencePosition?: string | null;
  bookletPhotoPath: string | null;
};

type DbMemberLike = {
  id: string;
  name: string;
  role: string;
  city: string | null;
  phone: string | null;
  title: string | null;
  committeeScope: string | null;
  photoPath: string | null;
  bookletBio: string | null;
  userId: string | null;
};

type LeaderLinkLike = {
  rosterKey: string;
  delegateId: string | null;
  userId: string | null;
  linkSource: string | null;
  confirmed?: boolean;
  includeAddressPage?: boolean;
  addressText?: string | null;
};

function normalizeName(value: string | null | undefined): string {
  return normalizeLeaderName(value);
}

function parseCityArea(cityArea: string): { city: string; province: string | null } {
  const raw = (cityArea ?? "").trim();
  if (!raw) return { city: "", province: null };
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { city: parts[0], province: parts[1] };
  }
  return { city: raw, province: null };
}

function buildDelegateIndexes(delegates: DelegateLike[]) {
  const byUserId = new Map<string, DelegateLike>();
  const byName = new Map<string, DelegateLike>();
  const byPhone = new Map<string, DelegateLike>();
  const byId = new Map<string, DelegateLike>();

  for (const d of delegates) {
    byId.set(d.id, d);
    byName.set(normalizeName(d.name), d);
    if (d.userId) byUserId.set(d.userId, d);
    const phone = digitsOnlyPhone(d.phone);
    if (phone) byPhone.set(phone, d);
  }

  return { byUserId, byName, byPhone, byId };
}

export function autoMatchDelegateForRosterRow(
  row: LsuicLeaderRosterRow,
  indexes: ReturnType<typeof buildDelegateIndexes>,
): DelegateLike | null {
  const byName = indexes.byName.get(normalizeName(row.leader_name));
  if (byName) return byName;

  const phone = digitsOnlyPhone(row.leader_phone);
  if (phone) {
    const byPhone = indexes.byPhone.get(phone);
    if (byPhone) return byPhone;
  }

  return null;
}

function resolveLinkedDelegate(
  row: LsuicLeaderRosterRow,
  link: LeaderLinkLike | undefined,
  indexes: ReturnType<typeof buildDelegateIndexes>,
): DelegateLike | null {
  if (link) {
    if (!link.confirmed) return null;
    if (link.delegateId) {
      return indexes.byId.get(link.delegateId) ?? null;
    }
    if (link.userId) {
      return indexes.byUserId.get(link.userId) ?? null;
    }
    return null;
  }
  return autoMatchDelegateForRosterRow(row, indexes);
}

/** Delegate match used for platform booklet photos (includes pending manual links). */
function resolveDelegateForBookletPhoto(
  row: LsuicLeaderRosterRow,
  link: LeaderLinkLike | undefined,
  indexes: ReturnType<typeof buildDelegateIndexes>,
): DelegateLike | null {
  if (link?.delegateId) {
    return indexes.byId.get(link.delegateId) ?? null;
  }
  if (link?.confirmed && link.userId) {
    return indexes.byUserId.get(link.userId) ?? null;
  }
  return autoMatchDelegateForRosterRow(row, indexes);
}

function memberFromRosterRow(
  row: LsuicLeaderRosterRow,
  idx: number,
  linked: DelegateLike | null,
  photoDelegate: DelegateLike | null,
  dbMember: DbMemberLike | null,
  link: LeaderLinkLike | undefined,
): BookletRosterMember {
  const rosterKey = lsuicLeaderRosterKey(row);
  const { city, province } = parseCityArea(row.leader_city_area);
  const csvPhoto = row.leader_photo_url?.trim() || null;
  const delegateBookletPhoto = photoDelegate?.bookletPhotoPath ?? null;
  const confMemberPhoto = dbMember?.photoPath ?? null;

  return {
    id: dbMember?.id ?? `roster-${rosterKey}`,
    rosterKey,
    name: stripHonorificDisplayName(linked?.name ?? dbMember?.name ?? row.leader_name),
    role: dbMember?.role ?? inferLsuicMemberRole(row.leader_role),
    title: row.leader_role?.trim() || dbMember?.title || null,
    city: linked?.city ?? dbMember?.city ?? (city || null),
    phone:
      linked?.phone ?? dbMember?.phone ?? (row.leader_phone?.trim() || null),
    province: linked?.province ?? province,
    university:
      linked?.university ?? (row.leader_university?.trim() || null),
    delegateCode: linked?.delegateCode ?? null,
    conferencePosition:
      linked?.conferencePosition ?? (row.leader_role?.trim() || null),
    committeeScope: bookletScopeForLsuicRow(row),
    photoPath: resolveBookletMemberPhotoPath({
      csvPhoto,
      delegateBookletPhoto,
      confMemberPhoto,
      leaderLinkConfirmed: Boolean(link?.confirmed),
    }),
    bookletBio: dbMember?.bookletBio ?? null,
    userId: linked?.userId ?? dbMember?.userId ?? null,
    hasRegistered: Boolean(linked),
  };
}

export function buildBookletRosterMembers(input: {
  dbMembers: DbMemberLike[];
  delegates: DelegateLike[];
  leaderLinks: LeaderLinkLike[];
  signedUpUserIds: Set<string>;
}): { necMembers: BookletRosterMember[]; committeeMembers: BookletRosterMember[] } {
  const roster = loadLsuicLeadersRoster();
  const indexes = buildDelegateIndexes(input.delegates);
  const linkByKey = new Map(
    input.leaderLinks.map((link) => [link.rosterKey, link]),
  );

  const dbByName = new Map<string, DbMemberLike>();
  const dbByUserId = new Map<string, DbMemberLike>();
  for (const member of input.dbMembers) {
    dbByName.set(normalizeName(member.name), member);
    if (member.userId) {
      dbByUserId.set(member.userId, member);
    }
  }

  const necMembers: BookletRosterMember[] = [];
  const committeeMembers: BookletRosterMember[] = [];

  roster.forEach((row, idx) => {
    if (shouldExcludeFromWelfareRoster(row)) return;

    const rosterKey = lsuicLeaderRosterKey(row);
    const link = linkByKey.get(rosterKey);
    const linked = resolveLinkedDelegate(row, link, indexes);
    const linkedForPhoto = resolveDelegateForBookletPhoto(row, link, indexes);
    const dbMember =
      dbByName.get(normalizeName(row.leader_name)) ??
      (linkedForPhoto?.userId
        ? (dbByUserId.get(linkedForPhoto.userId) ?? null)
        : null) ??
      (link?.userId ? (dbByUserId.get(link.userId) ?? null) : null);
    const member = memberFromRosterRow(
      row,
      idx,
      linked,
      linkedForPhoto,
      dbMember,
      link,
    );

    if (member.userId && input.signedUpUserIds.has(member.userId)) {
      member.hasRegistered = true;
    }

    if (row.committee_short_name === "NEC") {
      necMembers.push(member);
    } else {
      committeeMembers.push(member);
    }
  });

  return { necMembers, committeeMembers };
}
