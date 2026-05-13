import { dedupeLeaderProfilesForConference } from "@/lib/conf/dedupe-leader-profiles";
import { DELEGATES_PER_BOOKLET_PAGE } from "./constants";
import type { BookletData, BookletSection } from "./types";

const KEY_ROLES = ["CHAIR", "VICE_CHAIR", "SECRETARY", "FINANCIAL_SECRETARY", "TREASURER"];

function bookletLeadersDeduped(data: BookletData) {
  return dedupeLeaderProfilesForConference(data.leaders, data.event.id);
}

function normalizeName(name: string): string {
  return (name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function isCommitteeBookletSection(type: BookletSection["type"]): boolean {
  return (
    type === "COMMITTEE" ||
    type === "COC" ||
    type === "COC_MEMBERS" ||
    type === "CITY_PRESIDENTS" ||
    type === "JUDICIAL"
  );
}

export function chunkDelegates<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

export function delegatesSectionPageCount(delegateCount: number): number {
  if (delegateCount <= 0) return 1;
  return Math.ceil(delegateCount / DELEGATES_PER_BOOKLET_PAGE);
}

function sectionMembersForPageCount(
  s: BookletSection,
  data: BookletData,
): BookletData["committeeMembers"] | BookletData["necMembers"] {
  if (s.type === "NEC") return data.necMembers;
  if (s.type === "CITY_PRESIDENTS") {
    const leaderNames = new Set(
      bookletLeadersDeduped(data).map((l) => normalizeName(l.name)),
    );
    return data.committeeMembers.filter(
      (m) => !leaderNames.has(normalizeName(m.name)),
    );
  }
  if (s.committeeScope) {
    return data.committeeMembers.filter(
      (m) => m.committeeScope === s.committeeScope,
    );
  }
  return data.committeeMembers;
}

function committeeSectionPageCount(
  s: BookletSection,
  data: BookletData,
): number {
  const relevant = sectionMembersForPageCount(s, data);
  const isMainConferenceCommittee =
    s.type === "COMMITTEE" && !s.committeeScope?.trim();
  if (s.type === "NEC" && relevant.length <= 10) return 1;
  if (isMainConferenceCommittee && relevant.length <= 7) return 1;
  const generalCount = relevant.filter(
    (m) => !KEY_ROLES.includes(m.role),
  ).length;
  return 1 + Math.ceil(generalCount / 9);
}

/** Pages consumed by one enabled booklet section (matches render order). */
export function sectionPageSpan(
  s: BookletSection,
  data: BookletData,
): number {
  if (s.type === "LEADER")
    return Math.max(1, bookletLeadersDeduped(data).length);
  if (s.type === "NEC") return committeeSectionPageCount(s, data);
  if (isCommitteeBookletSection(s.type)) {
    return committeeSectionPageCount(s, data);
  }
  if (s.type === "DELEGATES")
    return delegatesSectionPageCount(data.delegates.length);
  return 1;
}

export function bookletBodyPageCount(
  enabledSections: BookletSection[],
  data: BookletData,
): number {
  return enabledSections.reduce((sum, s) => sum + sectionPageSpan(s, data), 0);
}

/** TOC sits immediately after optional cover. */
export function getTocPageNum(hasCover: boolean): number {
  return (hasCover ? 1 : 0) + 1;
}

/** First interior content page after TOC. */
export function getFirstBodyPageNum(hasCover: boolean): number {
  return (hasCover ? 1 : 0) + 2;
}

export type BookletTocSectionRow = {
  section: BookletSection;
  startPage: number;
  pageSpan: number;
};

export function computeSectionTocRows(
  enabledSections: BookletSection[],
  data: BookletData,
  hasCover: boolean,
): BookletTocSectionRow[] {
  let rp = getFirstBodyPageNum(hasCover);
  return enabledSections.map((section) => {
    const pageSpan = sectionPageSpan(section, data);
    const row: BookletTocSectionRow = { section, startPage: rp, pageSpan };
    rp += pageSpan;
    return row;
  });
}
