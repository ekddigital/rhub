import { BOOKLET_A4 } from "./constants";
import type { BookletSection, NecMember } from "./types";

/** Vertical space available inside A4Page content area (px @ 96dpi). */
export const BOOKLET_CONTENT_HEIGHT =
  BOOKLET_A4.height - 61 - 33 - 48; // header, footer, content padding

/** Conservative pack limit — leaves headroom so rows are not clipped by A4 overflow. */
const PAGE_PACK_LIMIT = BOOKLET_CONTENT_HEIGHT - 24;

const KEY_ORDER = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "FINANCIAL_SECRETARY",
  "TREASURER",
] as const;

const KEY_ROLE_SET = new Set<string>(KEY_ORDER);

export const BOOKLET_GRID_COLS = 3;
const GRID_COLS = BOOKLET_GRID_COLS;
const GRID_ROW_GAP = 12;

// ─── Height estimates (px) — tuned to CommitteeSection / TableOfContentsPage ─

const SECTION_HEADING_BASE = 66;
const SECTION_SUBTITLE_EXTRA = 18;
const SECTION_BODY_LINE_H = 17;
const CHAIR_HERO_NON_NEC = 176;
const CHAIR_HERO_NEC = 224;
const CHAIR_BIO_LINE_H = 17;
/** Officer card: avatar row + contact block + delegate badge + padding. */
const OFFICER_CARD_H = 178;
/** Member card: slightly shorter avatar + contact block + delegate badge + padding. */
const MEMBER_CARD_H = 168;
const MEMBERS_SUBHEADING_H = 38;
const MEMBERS_SUBHEADING_TOP_GAP = 12;
const SUBSECTION_HEADING_H = 52;

export type CommitteeSectionContinuation = {
  section: BookletSection;
  members: NecMember[];
};

export type CommitteePageLayout = {
  showSectionHeading: boolean;
  chair: NecMember | null;
  showChairPlaceholder: boolean;
  /** Full grid rows (up to 3 cards each) — never split across pages. */
  officerRows: NecMember[][];
  showMembersHeading: boolean;
  showSubsectionHeading: boolean;
  subsectionTitle: string | null;
  /** Full grid rows (up to 3 cards each) — never split across pages. */
  memberRows: NecMember[][];
};

type LayoutRow =
  | { kind: "heading"; h: number }
  | { kind: "chair"; member: NecMember; h: number }
  | { kind: "officers"; members: NecMember[]; h: number }
  | { kind: "members_heading"; h: number }
  | { kind: "subsection_heading"; title: string; h: number }
  | { kind: "members"; members: NecMember[]; h: number };

const TOC_HEADING_BLOCK = 55;
const TOC_ENTRY_H = 40;
const TOC_ENTRY_WITH_SUBTITLE_H = 52;
const TOC_HIGHLIGHT_ENTRY_H = 44;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

function isPartialGridRow(row: LayoutRow): boolean {
  return (
    (row.kind === "officers" || row.kind === "members") &&
    row.members.length > 0 &&
    row.members.length < GRID_COLS
  );
}

function estimateSectionHeadingH(section: BookletSection): number {
  let h = SECTION_HEADING_BASE;
  if (section.subtitle?.trim()) h += SECTION_SUBTITLE_EXTRA;
  if (section.bodyText?.trim()) {
    const lines = Math.max(1, Math.ceil(section.bodyText.length / 90));
    h += 8 + lines * SECTION_BODY_LINE_H;
  }
  return h;
}

function estimateChairH(chair: NecMember, isNec: boolean): number {
  let h = isNec ? CHAIR_HERO_NEC : CHAIR_HERO_NON_NEC;
  if (chair.bookletBio?.trim()) {
    const lines = Math.max(1, Math.ceil(chair.bookletBio.length / 72));
    h += 8 + lines * CHAIR_BIO_LINE_H;
  }
  return h;
}

function estimateOfficerRowH(): number {
  return OFFICER_CARD_H + GRID_ROW_GAP;
}

function estimateMemberRowH(extraTopGap = false): number {
  return MEMBER_CARD_H + GRID_ROW_GAP + (extraTopGap ? MEMBERS_SUBHEADING_TOP_GAP : 0);
}

function normalizePosition(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function memberPositionText(member: NecMember): string {
  return normalizePosition(
    member.conferencePosition?.trim() || member.title?.trim() || "",
  );
}

function isCocLeadCoordinator(member: NecMember): boolean {
  const pos = memberPositionText(member);
  return (
    pos.includes("coc-1") ||
    pos.includes("coordinator: coc-1") ||
    pos.includes("coc-2") ||
    pos.includes("coordinator: coc-2") ||
    pos.includes("coc-3") ||
    pos.includes("coordinator: coc-3")
  );
}

function isCocChairMember(member: NecMember): boolean {
  const pos = memberPositionText(member);
  return pos.includes("coc-1") || pos.includes("coordinator: coc-1");
}

function cocOfficerSortKey(member: NecMember): number {
  const pos = memberPositionText(member);
  if (pos.includes("coc-2") || pos.includes("coordinator: coc-2")) return 2;
  if (pos.includes("coc-3") || pos.includes("coordinator: coc-3")) return 3;
  return 99;
}

export function sectionExpectsChair(
  section: BookletSection,
  members: NecMember[],
): boolean {
  if (section.type === "CITY_PRESIDENTS" || section.type === "COC_MEMBERS") {
    return false;
  }
  if (section.type === "NEC" || section.type === "COC") {
    return true;
  }
  if (section.type === "COMMITTEE" && !section.committeeScope?.trim()) {
    return true;
  }
  return members.some((m) => m.role === "CHAIR" || isCocChairMember(m));
}

export function splitCommitteeMembers(
  section: BookletSection,
  members: NecMember[],
  isNec: boolean,
): {
  chair: NecMember | null;
  keyOfficers: NecMember[];
  generalMembers: NecMember[];
} {
  if (isNec || section.type === "NEC") {
    const chair = members.find((m) => m.role === "CHAIR") ?? null;
    const keyOfficers = members.filter((m) => m !== chair);
    return { chair, keyOfficers, generalMembers: [] };
  }

  if (section.type === "COC" || section.committeeScope === "CoC") {
    const leadership = members.filter(isCocLeadCoordinator);
    const chair =
      leadership.find(isCocChairMember) ??
      leadership.find((m) => m.role === "CHAIR") ??
      null;
    const keyOfficers = leadership
      .filter((m) => m !== chair)
      .sort((a, b) => cocOfficerSortKey(a) - cocOfficerSortKey(b));
    const generalMembers = members.filter((m) => !leadership.includes(m));
    return { chair, keyOfficers, generalMembers };
  }

  const chair = members.find((m) => m.role === "CHAIR") ?? null;
  const keyOfficers = KEY_ORDER.slice(1).flatMap((role) =>
    members.filter((m) => m.role === role),
  );
  const generalMembers = members.filter((m) => !KEY_ROLE_SET.has(m.role));
  return { chair, keyOfficers, generalMembers };
}

function buildCommitteeRows(
  section: BookletSection,
  chair: NecMember | null,
  keyOfficers: NecMember[],
  generalMembers: NecMember[],
  isNec: boolean,
  continuation?: CommitteeSectionContinuation,
): LayoutRow[] {
  const rows: LayoutRow[] = [
    { kind: "heading", h: estimateSectionHeadingH(section) },
  ];

  if (chair) {
    rows.push({ kind: "chair", member: chair, h: estimateChairH(chair, isNec) });
  }

  for (const officerRow of chunk(keyOfficers, GRID_COLS)) {
    rows.push({
      kind: "officers",
      members: officerRow,
      h: estimateOfficerRowH(),
    });
  }

  appendMemberRows(rows, generalMembers, chair != null || keyOfficers.length > 0);

  if (continuation && continuation.members.length > 0) {
    rows.push({
      kind: "subsection_heading",
      title: continuation.section.title,
      h: SUBSECTION_HEADING_H,
    });
    appendMemberRows(rows, continuation.members, true);
  }

  return rows;
}

function appendMemberRows(
  rows: LayoutRow[],
  generalMembers: NecMember[],
  hasLeadershipAbove: boolean,
) {
  let firstMemberRow = true;
  for (const memberRow of chunk(generalMembers, GRID_COLS)) {
    rows.push({
      kind: "members",
      members: memberRow,
      h: estimateMemberRowH(firstMemberRow && hasLeadershipAbove),
    });
    firstMemberRow = false;
  }
}

function heightPackRows(rows: LayoutRow[]): LayoutRow[][] {
  if (rows.length === 0) return [[]];

  const pages: LayoutRow[][] = [];
  let current: LayoutRow[] = [];
  let usedH = 0;
  let membersLabelPlaced = false;

  const startNewPage = () => {
    if (current.length > 0) pages.push(current);
    current = [];
    usedH = 0;
  };

  const appendRow = (row: LayoutRow) => {
    if (usedH + row.h > PAGE_PACK_LIMIT && current.length > 0) {
      startNewPage();
    }
    current.push(row);
    usedH += row.h;
  };

  for (const row of rows) {
    if (row.kind === "subsection_heading") {
      membersLabelPlaced = true;
    }

    if (row.kind === "members") {
      const needsHeading = !membersLabelPlaced && current.length === 0;
      if (needsHeading) {
        appendRow({ kind: "members_heading", h: MEMBERS_SUBHEADING_H });
        membersLabelPlaced = true;
      } else if (!membersLabelPlaced) {
        membersLabelPlaced = true;
      }
    }

    appendRow(row);
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

/**
 * Move trailing 1–2 card rows off a page so interior pages never end with a
 * partial grid row. Also splits pages that would show multiple partial rows
 * (e.g. 3+2+1) so each page has at most one partial row at the bottom.
 */
function rebalanceTrailingPartialRows(pages: LayoutRow[][]): LayoutRow[][] {
  if (pages.length === 0) return pages;

  let out = pages.map((page) => [...page]);

  for (let pass = 0; pass < 8; pass++) {
    let changed = false;

    for (let i = 0; i < out.length; i++) {
      const page = out[i];
      if (page.length === 0) continue;

      const partialIndexes = page
        .map((row, index) => (isPartialGridRow(row) ? index : -1))
        .filter((index) => index >= 0);

      if (partialIndexes.length === 0) continue;

      const lastPartialIndex = partialIndexes[partialIndexes.length - 1]!;
      const hasEarlierPartial = partialIndexes.length > 1;
      const isInteriorPage = i < out.length - 1;
      const shouldMoveLastPartial =
        isInteriorPage || hasEarlierPartial || partialIndexes.length > 1;

      if (!shouldMoveLastPartial) continue;

      const moved: LayoutRow[] = [];
      while (page.length > lastPartialIndex) {
        moved.unshift(page.pop()!);
      }

      if (moved[0]?.kind === "members") {
        while (page.length > 0) {
          const prev = page[page.length - 1];
          if (
            prev?.kind === "members_heading" ||
            prev?.kind === "subsection_heading"
          ) {
            moved.unshift(page.pop()!);
          } else {
            break;
          }
        }
      }

      if (i + 1 < out.length) {
        out[i + 1] = [...moved, ...out[i + 1]!];
      } else {
        out.push(moved);
      }
      changed = true;
    }

    out = out.filter((page) => page.length > 0);
    if (!changed) break;
  }

  return out;
}

/** Re-split any page that exceeds the pack limit after partial-row moves. */
function splitOverflowingPages(pages: LayoutRow[][]): LayoutRow[][] {
  const result: LayoutRow[][] = [];

  for (const page of pages) {
    let current: LayoutRow[] = [];
    let usedH = 0;

    for (const row of page) {
      if (usedH + row.h > PAGE_PACK_LIMIT && current.length > 0) {
        result.push(current);
        current = [];
        usedH = 0;
      }
      current.push(row);
      usedH += row.h;
    }

    if (current.length > 0) result.push(current);
  }

  return result.length > 0 ? result : [[]];
}

function packRowsIntoPages(rows: LayoutRow[]): LayoutRow[][] {
  if (rows.length === 0) return [[]];

  let pages = heightPackRows(rows);

  for (let pass = 0; pass < 4; pass++) {
    const next = rebalanceTrailingPartialRows(splitOverflowingPages(pages));
    if (next.length === pages.length && next.every((p, i) => p === pages[i])) {
      break;
    }
    pages = next;
  }

  return pages;
}

function pageLayoutFromRows(
  rows: LayoutRow[],
  expectsChair: boolean,
): CommitteePageLayout {
  const layout: CommitteePageLayout = {
    showSectionHeading: false,
    chair: null,
    showChairPlaceholder: false,
    officerRows: [],
    showMembersHeading: false,
    showSubsectionHeading: false,
    subsectionTitle: null,
    memberRows: [],
  };

  for (const row of rows) {
    switch (row.kind) {
      case "heading":
        layout.showSectionHeading = true;
        break;
      case "chair":
        layout.chair = row.member;
        break;
      case "officers":
        layout.officerRows.push(row.members);
        break;
      case "members_heading":
        layout.showMembersHeading = true;
        break;
      case "subsection_heading":
        layout.showSubsectionHeading = true;
        layout.subsectionTitle = row.title;
        break;
      case "members":
        layout.memberRows.push(row.members);
        break;
      default:
        break;
    }
  }

  layout.showChairPlaceholder =
    expectsChair && layout.showSectionHeading && !layout.chair;

  return layout;
}

function paginateCommitteeMembers(
  section: BookletSection,
  members: NecMember[],
  isNec: boolean,
  continuation?: CommitteeSectionContinuation,
): CommitteePageLayout[] {
  const expectsChair = sectionExpectsChair(section, members);
  const { chair, keyOfficers, generalMembers } = splitCommitteeMembers(
    section,
    members,
    isNec,
  );
  const rows = buildCommitteeRows(
    section,
    chair,
    keyOfficers,
    generalMembers,
    isNec,
    continuation,
  );
  return packRowsIntoPages(rows).map((pageRows, pageIndex) => {
    const layout = pageLayoutFromRows(pageRows, expectsChair);
    if (pageIndex > 0) {
      layout.showChairPlaceholder = false;
    }
    return layout;
  });
}

export function paginateCommitteeSection(
  section: BookletSection,
  members: NecMember[],
  isNec: boolean,
  options?: { continuation?: CommitteeSectionContinuation },
): CommitteePageLayout[] {
  if (members.length === 0 && !options?.continuation?.members.length) {
    return [
      {
        showSectionHeading: true,
        chair: null,
        showChairPlaceholder: sectionExpectsChair(section, members),
        officerRows: [],
        showMembersHeading: false,
        showSubsectionHeading: false,
        subsectionTitle: null,
        memberRows: [],
      },
    ];
  }

  return paginateCommitteeMembers(
    section,
    members,
    isNec,
    options?.continuation,
  );
}

export function committeeSectionPageCountFromMembers(
  section: BookletSection,
  members: NecMember[],
  isNec: boolean,
  options?: { continuation?: CommitteeSectionContinuation },
): number {
  return paginateCommitteeSection(section, members, isNec, options).length;
}

export function isCocMembersContinuation(
  leadershipSection: BookletSection,
  membersSection: BookletSection | undefined,
): boolean {
  return (
    leadershipSection.type === "COC" &&
    membersSection?.type === "COC_MEMBERS" &&
    leadershipSection.committeeScope === "CoC" &&
    membersSection.committeeScope === "CoC Province"
  );
}

// ─── Table of contents pagination ────────────────────────────────────────────

export type TocRenderableEntry =
  | { kind: "cover" }
  | { kind: "section"; sectionId: string; title: string; subtitle?: string | null; isKey: boolean; startPage: number; pageSpan: number }
  | { kind: "back_cover"; page: number };

function tocEntryHeight(entry: TocRenderableEntry): number {
  switch (entry.kind) {
    case "cover":
      return TOC_HIGHLIGHT_ENTRY_H;
    case "back_cover":
      return TOC_HIGHLIGHT_ENTRY_H;
    case "section":
      return entry.subtitle?.trim()
        ? TOC_ENTRY_WITH_SUBTITLE_H
        : TOC_ENTRY_H;
    default:
      return TOC_ENTRY_H;
  }
}

export function paginateTocEntries(
  entries: TocRenderableEntry[],
): TocRenderableEntry[][] {
  if (entries.length === 0) return [[]];

  const firstPageCapacity = BOOKLET_CONTENT_HEIGHT - TOC_HEADING_BLOCK;
  const pages: TocRenderableEntry[][] = [];
  let current: TocRenderableEntry[] = [];
  let usedH = 0;
  let isFirstPage = true;

  const startNewPage = () => {
    if (current.length > 0) pages.push(current);
    current = [];
    usedH = 0;
    isFirstPage = false;
  };

  for (const entry of entries) {
    const h = tocEntryHeight(entry);
    const limit = isFirstPage ? firstPageCapacity : BOOKLET_CONTENT_HEIGHT;

    if (h > limit && current.length === 0) {
      current.push(entry);
      pages.push(current);
      current = [];
      usedH = 0;
      isFirstPage = false;
      continue;
    }

    if (usedH + h > limit && current.length > 0) {
      startNewPage();
    }

    current.push(entry);
    usedH += h;
  }

  if (current.length > 0) pages.push(current);
  return pages;
}

export function tocPageCount(entries: TocRenderableEntry[]): number {
  return paginateTocEntries(entries).length;
}
