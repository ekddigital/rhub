import { resolveLeadersForBookletSection } from "@/lib/conf/resolve-booklet-leader";
import {
  resolveConferenceIntroBody,
} from "@/lib/conf/booklet-conference-copy";
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

export {
  DEFAULT_CONFERENCE_INTRO,
  isStaleConferenceIntroBody,
  resolveConferenceIntroBody,
} from "@/lib/conf/booklet-conference-copy";

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

/** Default Message from the Conference Chair (Enoch Kwateh Dongbo). */
export const DEFAULT_CHAIRMAN_ADDRESS = [
  "It is with deep gratitude and sincere humility that I welcome you to the LSUIC 20th Annual Conference & Anniversary — Jinan 2026: Legacy and Influence. To serve as Conference Chair for an assembly that represents the entire Liberian student body in China is both an honor and a sacred trust, and I thank you for the confidence placed in this Conference Committee.",
  "I extend my highest esteem and warmest welcome to His Excellency the Ambassador of the Republic of Liberia to the People's Republic of China, to our distinguished guests, and to every delegate who has traveled to Jinan. Your presence affirms the unity of our union and the dignity of the occasion we share.",
  "Our theme, Jinan 2026: Legacy and Influence, and our sub-theme — Honoring Our Past, Engaging Our Present, and Inspiring Our Future — call us to remember the founders and leaders who built LSUIC, to engage fully in the work before us this week, and to leave Jinan determined to strengthen the years ahead. As a student of Computer Science from Jinan, I love the craft of building systems that make complex work simpler. I envision conference management that is clearer, faster, and more reliable through thoughtful technology and automation, applying the skills of our generation so that service to the union is lighter and more effective.",
  "In an age of rapid technological change, it is necessary that we apply technology thoughtfully to all we do — in how we organize, communicate, elect, and remember. Yet technology serves a deeper purpose: each year we gather to celebrate our independence, to vote new leadership into office, and to create shared memories that bind Liberian students across China. May this conference deepen those bonds, renew our willingness to serve, and inspire influence worthy of our legacy.",
  "Welcome to Jinan. May peace, togetherness, and purpose guide every session of LSUIC 2026.",
].join("\n\n");

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

export function leaderBioWarrantsMessagePage(
  bio: string | null | undefined,
): boolean {
  const trimmed = trimContent(bio);
  if (!trimmed) return false;
  if (trimmed.includes("\n\n")) return true;
  if ((trimmed.match(/\.\s+/g) ?? []).length >= 2) return true;
  return trimmed.length >= 320;
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
  ).reduce(
    (sum, leader) =>
      sum + (leaderBioWarrantsMessagePage(leader.bio) ? 2 : 1),
    0,
  );
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
  if (isConferenceIntroductionSection(section)) {
    return resolveConferenceIntroBody(section.bodyText);
  }
  return trimContent(section.bodyText);
}

export function shouldRenderTextSection(section: BookletSection): boolean {
  if (isConferenceIntroductionSection(section)) return true;
  return hasAddressContent(section.bodyText);
}
