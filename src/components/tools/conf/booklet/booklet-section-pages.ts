import { programOutlinePageCount } from "@/lib/conf/booklet-program-outline";
import {
  resolveChairmanAddress,
  resolveGuestBioAddress,
  resolveLeaderSectionAddress,
  resolvePresidentAddress,
  resolveRosterAddressPages,
  shouldRenderTextSection,
  type RosterAddressLink,
} from "@/lib/conf/resolve-booklet-section-content";
import {
  committeeSectionPageCountFromMembers,
  isCocMembersContinuation,
  paginateTocEntries,
  tocPageCount,
  type CommitteeSectionContinuation,
  type TocRenderableEntry,
} from "./booklet-pagination";
import { DELEGATES_PER_BOOKLET_PAGE } from "./constants";
import type { BookletData, BookletSection } from "./types";

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

  let members = data.committeeMembers;

  if (s.type === "CITY_PRESIDENTS") {
    const leaderNames = new Set(
      data.leaders.map((l) => normalizeName(l.name)),
    );
    members = members.filter(
      (m) => !leaderNames.has(normalizeName(m.name)),
    );
  }

  if (s.committeeScope) {
    return members.filter((m) => m.committeeScope === s.committeeScope);
  }

  if (s.type === "COMMITTEE") {
    return members.filter((m) => m.committeeScope === null);
  }

  return members;
}

function committeeSectionPageCount(
  s: BookletSection,
  data: BookletData,
  context?: { allSections: BookletSection[]; index: number },
): number {
  const relevant = sectionMembersForPageCount(s, data);
  const nextSection = context?.allSections[context.index + 1];
  let continuation: CommitteeSectionContinuation | undefined;

  if (isCocMembersContinuation(s, nextSection)) {
    const continuationMembers = sectionMembersForPageCount(nextSection!, data);
    if (continuationMembers.length > 0) {
      continuation = {
        section: nextSection!,
        members: continuationMembers,
      };
    }
  }

  return committeeSectionPageCountFromMembers(
    s,
    relevant,
    s.type === "NEC",
    continuation ? { continuation } : undefined,
  );
}

function rosterLinksFromData(data: BookletData): RosterAddressLink[] {
  return data.rosterAddressLinks ?? [];
}

/** Pages consumed by one enabled booklet section (matches render order). */
export function sectionPageSpan(
  s: BookletSection,
  data: BookletData,
  context?: { allSections: BookletSection[]; index: number },
): number {
  if (context) {
    const prev = context.allSections[context.index - 1];
    if (prev && isCocMembersContinuation(prev, s)) {
      return 0;
    }
  }

  if (s.type === "LEADER") {
    return resolveLeaderSectionAddress(s, data) ? 1 : 0;
  }

  if (s.type === "PRESIDENT_ADDRESS") {
    const links = rosterLinksFromData(data);
    const base = resolvePresidentAddress(s, data, links) ? 1 : 0;
    // Extra selected roster leaders with address text render after this section.
    return base + resolveRosterAddressPages(data, links).length;
  }

  if (s.type === "CHAIRMAN_ADDRESS") {
    return resolveChairmanAddress(s, data) ? 1 : 0;
  }

  if (s.type === "GUEST_BIO") {
    return resolveGuestBioAddress(s) ? 1 : 0;
  }

  if (s.type === "SPONSORS" || s.type === "ABBREVIATIONS") {
    return shouldRenderTextSection(s) ? 1 : 0;
  }

  if (s.type === "NEC") {
    return committeeSectionPageCount(s, data, context);
  }
  if (isCommitteeBookletSection(s.type)) {
    return committeeSectionPageCount(s, data, context);
  }
  if (s.type === "DELEGATES")
    return delegatesSectionPageCount(data.delegates.length);
  if (s.type === "PROGRAM_OUTLINE") return programOutlinePageCount(s);
  return shouldRenderTextSection(s) ? 1 : 0;
}

export function bookletBodyPageCount(
  enabledSections: BookletSection[],
  data: BookletData,
): number {
  return enabledSections.reduce(
    (sum, s, index) =>
      sum + sectionPageSpan(s, data, { allSections: enabledSections, index }),
    0,
  );
}

/** First TOC page number (immediately after optional cover). */
export function getTocPageNum(hasCover: boolean): number {
  return (hasCover ? 1 : 0) + 1;
}

/** First interior content page after all TOC pages. */
export function getFirstBodyPageNum(
  hasCover: boolean,
  tocPages: number,
): number {
  return getTocPageNum(hasCover) + tocPages;
}

export type BookletTocSectionRow = {
  section: BookletSection;
  startPage: number;
  pageSpan: number;
};

export function buildTocRenderableEntries(
  sectionRows: BookletTocSectionRow[],
  hasCover: boolean,
  hasBackCover: boolean,
  totalPages: number,
): TocRenderableEntry[] {
  const entries: TocRenderableEntry[] = [];
  if (hasCover) entries.push({ kind: "cover" });

  for (const { section, startPage, pageSpan } of sectionRows) {
    if (pageSpan <= 0) continue;

    const isKey =
      section.type === "LEADER" ||
      section.type === "NEC" ||
      section.type === "CHAIRMAN_ADDRESS" ||
      section.type === "PRESIDENT_ADDRESS";

    entries.push({
      kind: "section",
      sectionId: section.id,
      title: section.title,
      subtitle: section.subtitle,
      isKey,
      startPage,
      pageSpan,
    });
  }

  if (hasBackCover) {
    entries.push({ kind: "back_cover", page: totalPages });
  }

  return entries;
}

export function computeSectionTocRows(
  enabledSections: BookletSection[],
  data: BookletData,
  hasCover: boolean,
  tocPages: number,
): BookletTocSectionRow[] {
  let rp = getFirstBodyPageNum(hasCover, tocPages);
  return enabledSections.map((section, index) => {
    const pageSpan = sectionPageSpan(section, data, {
      allSections: enabledSections,
      index,
    });
    const row: BookletTocSectionRow = { section, startPage: rp, pageSpan };
    rp += pageSpan;
    return row;
  });
}

/** Resolve TOC page count (iterates once — body start pages depend on TOC length). */
export function resolveBookletTocPages(
  enabledSections: BookletSection[],
  data: BookletData,
  hasCover: boolean,
  hasBackCover: boolean,
  bodyPageCount: number,
): number {
  const provisionalTotal =
    (hasCover ? 1 : 0) + 1 + bodyPageCount + (hasBackCover ? 1 : 0);

  let sectionRows = computeSectionTocRows(
    enabledSections,
    data,
    hasCover,
    1,
  );
  let entries = buildTocRenderableEntries(
    sectionRows,
    hasCover,
    hasBackCover,
    provisionalTotal,
  );
  let pages = tocPageCount(entries);

  if (pages <= 1) return pages;

  const finalTotal =
    (hasCover ? 1 : 0) + pages + bodyPageCount + (hasBackCover ? 1 : 0);
  sectionRows = computeSectionTocRows(
    enabledSections,
    data,
    hasCover,
    pages,
  );
  entries = buildTocRenderableEntries(
    sectionRows,
    hasCover,
    hasBackCover,
    finalTotal,
  );
  const adjusted = tocPageCount(entries);
  return adjusted;
}

export { paginateTocEntries, type TocRenderableEntry };
