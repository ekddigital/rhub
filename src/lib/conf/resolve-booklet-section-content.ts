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

/** Default National President Address (Olano Teah Bloh, FY 2025-2026). */
export const DEFAULT_PRESIDENT_ADDRESS = [
  "PRESIDENTIAL ADDRESS",
  "A Message from National President Olano Teah Bloh",
  "Building on Tradition, Creating a Legacy through Influence",
  "",
  "Fellow Liberian Scholars, Liberia's Ambassador Extraordinary and Plenipotentiary accredited to the People's Republic of China, His Excellency Dudley McKinley Thomas, and Diplomats of the Liberian Embassy in China, distinguished Veterans, esteemed Partners, and cherished friends of the Liberian Student Union in China:",
  "When I reflect on this past year, I am reminded of a profound truth: institutions only survive if they document themselves. A union that builds and conducts programs but leaves no record of them must start over every year. A union that changes lives but tells no one is a union that cannot build the partnerships, alliances, and national credibility that its members deserve.",
  "Today, as we stand at the threshold of our 20th Annual General Conference here in Jinan City, I am overwhelmed with gratitude, not just for what we have accomplished, but for who we have become. We inherited a Union with nineteen years of history, tradition, and institutional complexity. We built on that inheritance in ways that previous administrations, for whatever combination of reasons, had not been able to fully achieve. And we did so not for recognition, not for applause, but because we believed deeply and unshakably that our members deserved nothing less than excellence.",
  "We initiated the nationwide pickup for new students. For many years, Liberian students have arrived in China without a leader to help them arrive safely and navigate their way around properly. With the help of the City Presidents, Coordinators, and many members, we were able to help many students arrange their travels and provided pickup services for them. Flyers were done for Cities with direct contact, and we later organized a virtual orientation for the 2025 intake. Hon. Esther Williams Kpogba from the Liberian Embassy graced the occasion and spoke.",
  "We built the architecture of a transformed Union. We built a professional website (www.lsuic.org) and later developed the first online membership verification and registration system from scratch, creating a digital home where every scholar could find information, register their membership, and connect with the Union. We designed a 'Chat with the Constitution' system, making our governing document accessible to every member. We launched the LSUIC Echo with the Press and Public Affairs Committee, giving voice to our stories. We initiated the first analytical membership statistics in our quarterly reports, transforming untrustworthy understanding into data-driven insight.",
  "We took leadership to the people. We visited over 13 cities: Beijing, Nantong, Yichang, Wuhan, Zhuzhou, Xuzhou, Ningbo, Hangzhou, Shanghai, Nanjing, Wuxi, Suzhou, Mianyang, and more, using our personal funds, not a single renminbi from the union's treasury. We did this not because we were required to, but because we believed that leadership must be seen, felt, and experienced. We did this while serving without pay, driven only by our commitment to the scholars we were elected to represent.",
  "We built systems that will outlast us. We initiated the Live Dues and Financial Record System, ensuring that every member could see exactly how their contributions were being managed. We developed and had approved a comprehensive financial policy, establishing standards of accountability that will guide future administrations for years to come. We documented the Union's presidential history through eleven editions of the Legacy Hour series, capturing the wisdom of every living former president. We established a centralized digital archival system, ensuring that when this administration's tenure ends, the next will inherit a complete, organized digital record of everything that was done.",
  "We expanded our reach. We expanded governance to over 35 cities and 20 provinces, bringing formal representation to cities that had previously been invisible within our structure. We signed international and national partnership agreements with Ghana, Cameroon, LINSU at home, and with the African Students' Confederation in China (ASCC), where we secured two leadership positions at the continental table. We branded the Union more powerfully than ever before, attracting over 1,600 new followers to our Facebook page, and a YouTube channel with over 115 high-quality and professional videos. Across the reporting periods, the Secretariat oversaw publication of twenty editions of the LSUIC Chronicle, each capturing committee activity, member features, and national announcements for a membership scattered across dozens of cities.",
  "We invested in academic excellence. We trained 100 scholars in digital literacy through the Online Winter Computer Concepts workshop by Teah Innovative Tech (TIT). We conducted the most attended and well-organized presidential intercity winter debate, spanning 10 cities, with cash prizes, a customized judges' scoring system, and a real-time dashboard. We initiated the first Academic Excellence Awards (AEA-2026), creating a formal mechanism for recognizing scholarly achievement.",
  "We honored our history and built for the future. We initiated the Homecoming program, bridging the gap between current students and distinguished Veterans. We conducted a comprehensive constitutional revision, produced an amended document worthy of an institution entering its third decade, initiated the first online voting system, and conducted an audit for the last two leaderships (2023-2025).",
  "We celebrated our community. We wrote a book titled 'How Far We Have Come,' a 20-year chronicle of leadership, service, legacy, influence, and solidarity. We initiated the Miss LSUIC pageant, celebrated talent across our membership, and uploaded over 95 durable, high-quality videos of programs and meetings held under this leadership.",
  "And we did all of this while managing the daily reality of serving a diverse, dispersed, and demanding membership, with limited resources and unlimited care.",
  "Every visa processed, every student welcomed at the airport, every welfare disbursement, every prayer shared, and every cultural festival celebrated are moments that define who we are. LSUIC is not just an organization. It is a family. It is a home away from home.",
  "To our members: you are the reason we exist. You are the ones who wake up each morning in cities far from home, studying in a language you are still mastering, carrying the dreams of your families on your shoulders. You are the ones who demonstrate, every day, that excellence is not a destination but a practice.",
  "To our veterans and alumni: you built this Union. You laid the foundation upon which we stand today. The sacrifices you made, the risks you took, and the sleepless nights you endured were not in vain. Your legacy lives on in every program we run and every scholar we serve.",
  "To our partners, the Liberian Embassy near Beijing, our Chinese host institutions, and all who have supported us along the way: thank you. Your trust in us has been invaluable, and your belief in the potential of Liberian students has not gone unnoticed.",
  "To my fellow members of the National Executive Committee: it has been the honor of a lifetime to serve alongside you. To National Vice President Hon. Ruphine M. Harmon and all officers, committee members, city presidents, and provincial coordinators, I am forever grateful.",
  "As we look to the future, let us not forget the lessons of the past. Let us remember that LSUIC was born not out of comfort but out of necessity, out of the recognition that Liberian students in China needed each other, needed to be organized, and needed to be heard.",
  "How far have we come? We have come farther than those first students gathering in each other's rooms could have imagined. But we have farther still to go.",
  "I leave you with this call to action: invest in your education, invest in your family, invest in yourself, invest in your community, and invest in your country.",
  "If we do not write our history, someone else will do that for us, and the narratives will not reflect our reality. We have written our history. We have built our legacy. And we have shown what is possible when leaders choose to serve rather than to be served.",
  "Twenty years ago, someone had a dream. Today, that dream is alive, thriving, and stronger than ever.",
  "Long live the Liberian Student Union in China. Long live the spirit of excellence through hard work. And may God continue to bless the Republic of Liberia and the People's Republic of China.",
  "",
  "Olano Teah Bloh",
  "National President",
  "Liberian Student Union in China",
  "Fiscal Year 2025-2026",
  "",
  "July 26, 2026",
  "Jinan, Shandong Province",
  "People's Republic of China",
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
        name: "Olano Teah Bloh",
        role: "CHAIR",
        title: "National President",
        city: null,
        photoPath: "/conf/national-president-olano.jpg",
        committeeScope: "NEC",
      },
      content,
    };
  }

  return {
    speaker: {
      ...rosterMemberToSpeaker(president),
      photoPath:
        rosterMemberToSpeaker(president).photoPath ??
        "/conf/national-president-olano.jpg",
    },
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
