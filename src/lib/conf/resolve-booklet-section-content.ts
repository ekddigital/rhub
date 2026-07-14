import { resolveLeadersForBookletSection } from "@/lib/conf/resolve-booklet-leader";
import type {
  BookletData,
  BookletSection,
  LeaderProfile,
  NecMember,
} from "@/components/tools/conf/booklet/types";

export type BookletAddressSpeaker = Pick<
  NecMember,
  "id" | "name" | "role" | "title" | "city" | "photoPath" | "committeeScope"
>;

export type RosterAddressLink = {
  rosterKey: string;
  includeAddressPage: boolean;
  addressText: string | null;
};

export type ResolvedLeaderAddress = {
  speaker: BookletAddressSpeaker;
  content: string;
};

export type ResolvedRosterAddressPage = {
  kind: "roster_address";
  rosterKey: string;
  title: string;
  speaker: BookletAddressSpeaker;
  content: string;
};

function trimContent(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function hasAddressContent(value: string | null | undefined): boolean {
  return trimContent(value).length > 0;
}

export function leaderProfileToSpeaker(leader: LeaderProfile): BookletAddressSpeaker {
  return {
    id: leader.id,
    name: leader.name,
    role: leader.role,
    title: leader.title,
    city: leader.country,
    photoPath: leader.photoPath,
    committeeScope: null,
  };
}

export function rosterMemberToSpeaker(
  member: BookletData["necMembers"][number],
): BookletAddressSpeaker {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    title: member.title,
    city: member.city,
    photoPath: member.photoPath,
    committeeScope: member.committeeScope,
  };
}

export function isNationalPresidentRole(role: string | null | undefined): boolean {
  return (role ?? "").toLowerCase().includes("national president");
}

export function resolveNationalPresidentMember(
  data: BookletData,
): BookletData["necMembers"][number] | null {
  return (
    data.necMembers.find((m) => isNationalPresidentRole(m.title)) ??
    data.necMembers.find((m) => m.role === "CHAIR") ??
    null
  );
}

function linkForRosterKey(
  links: RosterAddressLink[] | undefined,
  rosterKey: string | null | undefined,
): RosterAddressLink | undefined {
  if (!rosterKey || !links) return undefined;
  return links.find((l) => l.rosterKey === rosterKey);
}

export function resolveMemberAddressContent(
  member: BookletData["necMembers"][number] | null,
  link: RosterAddressLink | undefined,
  sectionBodyText?: string | null,
): string {
  return (
    trimContent(link?.addressText) ||
    trimContent(member?.bookletBio) ||
    trimContent(sectionBodyText)
  );
}

export function resolveLeaderSectionAddress(
  section: BookletSection,
  data: BookletData,
): ResolvedLeaderAddress | null {
  const rosterLeaders = resolveLeadersForBookletSection(
    section.title,
    data.leaders,
    data.event.id,
  );
  const leader = rosterLeaders[0];
  if (!leader) return null;

  const content = trimContent(leader.bio);
  if (!content) return null;

  return {
    speaker: leaderProfileToSpeaker(leader),
    content,
  };
}

export function resolvePresidentAddress(
  section: BookletSection,
  data: BookletData,
  rosterLinks?: RosterAddressLink[],
): ResolvedLeaderAddress | null {
  const president = resolveNationalPresidentMember(data);
  const link = linkForRosterKey(rosterLinks, president?.rosterKey);

  // Prefer legacy bookletBio / section body (Overview + Section Manager).
  // Roster "Include in booklet" addressText is used when that toggle is on.
  let content =
    trimContent(president?.bookletBio) || trimContent(section.bodyText);
  if (!content && link?.includeAddressPage) {
    content = trimContent(link.addressText);
  }
  if (!content) return null;

  if (!president) {
    return {
      speaker: {
        id: "national-president",
        name: "National President",
        role: "CHAIR",
        title: "National President",
        city: null,
        photoPath: null,
        committeeScope: "NEC",
      },
      content,
    };
  }

  return {
    speaker: rosterMemberToSpeaker(president),
    content,
  };
}

export function resolveChairmanAddress(
  section: BookletSection,
  data: BookletData,
): ResolvedLeaderAddress | null {
  const chair = data.conferenceChair;
  const content =
    trimContent(chair?.bookletBio) || trimContent(section.bodyText);
  if (!content || !chair) return null;

  return {
    speaker: rosterMemberToSpeaker(chair),
    content,
  };
}

export function resolveGuestBioAddress(
  section: BookletSection,
): ResolvedLeaderAddress | null {
  const content = trimContent(section.bodyText);
  if (!content) return null;
  return {
    speaker: {
      id: "guest-speaker",
      name: "Guest Speaker",
      role: "COMMITTEE",
      title: section.subtitle ?? "Guest Speaker",
      city: null,
      photoPath: null,
      committeeScope: null,
    },
    content,
  };
}

export function resolveRosterAddressPages(
  data: BookletData,
  rosterLinks: RosterAddressLink[],
): ResolvedRosterAddressPage[] {
  const president = resolveNationalPresidentMember(data);
  const presidentKey = president?.rosterKey ?? null;
  const allMembers = [...data.necMembers, ...data.committeeMembers];
  const memberByKey = new Map(
    allMembers
      .filter((m) => m.rosterKey)
      .map((m) => [m.rosterKey as string, m]),
  );

  const pages: ResolvedRosterAddressPage[] = [];

  for (const link of rosterLinks) {
    if (!link.includeAddressPage) continue;
    if (link.rosterKey === presidentKey) continue;

    const content = trimContent(link.addressText);
    if (!content) continue;

    const member = memberByKey.get(link.rosterKey);
    if (!member) continue;

    pages.push({
      kind: "roster_address",
      rosterKey: link.rosterKey,
      title: `${member.title ?? member.conferencePosition ?? "Leader"} Address`,
      speaker: rosterMemberToSpeaker(member),
      content,
    });
  }

  return pages;
}

export function shouldRenderTextSection(section: BookletSection): boolean {
  return hasAddressContent(section.bodyText);
}
