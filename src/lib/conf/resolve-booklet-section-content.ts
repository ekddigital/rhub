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

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

export const DEFAULT_CONFERENCE_INTRO = [
  "Welcome to the LSUIC 20th Annual Conference & Anniversary — Jinan 2026: Legacy and Influence.",
  "As delegates of the Liberian Student Union in China, we gather in Jinan for our twentieth annual conference — a milestone that celebrates unity, leadership, academic excellence, and the enduring legacy of our community across China. Under this year's theme, we honor our past, engage our present, and inspire our future as one Liberian student family in the diaspora.",
  "The conference takes place from Friday, 24 July through Monday, 27 July 2026 at the Arcadia Spa Golf International Hotel in Qihe County, Shandong. This booklet contains the conference program, leadership profiles, committee roster, navigation guide, and essential information to help you navigate the days ahead.",
  "We ask every delegate to arrive on time for each scheduled activity, to participate actively in plenary sessions, elections, resolutions, and fellowship events, and to conduct themselves with respect toward fellow delegates, conference officials, and hotel staff. Please review the daily program outline in this booklet and plan your day accordingly — punctuality and full engagement ensure that business sessions, recreation, and celebrations run smoothly for everyone.",
  "Travel to and from Jinan, and local transport other than conference-arranged transfers for sporting activities, is the responsibility of each delegate. Step-by-step directions from Jinan's major railway stations to the hotel — including subway, Bus K904, and taxi options — are provided in the Navigation Guide section of this booklet. Please note that Bus K904 operates only until 7:20 PM; delegates arriving after that hour must use a taxi or ride-hail service to reach the hotel.",
  "Dress appropriately for each occasion: formal or business attire is expected for conference room sessions, reports, elections, and other official business; casual dress is welcome for the meet and greet, pool party, football, and evening celebrations — and we encourage wearing Liberia's national colors (red, white, and blue) during sporting and social events.",
  "We extend our deepest gratitude to the Liberian and Chinese governments for their continued support of Liberian students in China, and to the National Executive Committee, Conference Committee, and all volunteers whose dedication makes this gathering possible.",
  "The detailed daily program follows in the Program Outline section of this booklet. We look forward to welcoming you to Jinan and to four days of fellowship, purpose, and lasting memories.",
].join("\n\n");

export function isConferenceIntroductionSection(section: BookletSection): boolean {
  const title = normalizeLabel(section.title);
  return (
    section.type === "TEXT" &&
    (title.includes("conference introduction") ||
      title.includes("conference intro") ||
      title === "introduction")
  );
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

/** True when a LEADER section has a stored profile (photo/name render without bio). */
export function shouldRenderLeaderSection(
  section: BookletSection,
  data: BookletData,
): boolean {
  const rosterLeaders = resolveLeadersForBookletSection(
    section.title,
    data.leaders,
    data.event.id,
  );
  return rosterLeaders.length > 0;
}

export function leaderSectionPageCount(
  section: BookletSection,
  data: BookletData,
): number {
  if (!shouldRenderLeaderSection(section, data)) return 0;
  return resolveLeadersForBookletSection(
    section.title,
    data.leaders,
    data.event.id,
  ).length;
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

export function resolveTextSectionBody(section: BookletSection): string {
  const trimmed = trimContent(section.bodyText);
  if (trimmed) return trimmed;
  if (isConferenceIntroductionSection(section)) return DEFAULT_CONFERENCE_INTRO;
  return "";
}

export function shouldRenderTextSection(section: BookletSection): boolean {
  if (isConferenceIntroductionSection(section)) return true;
  return hasAddressContent(section.bodyText);
}
