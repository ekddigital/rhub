import { BOOKLET_CONTENT_HEIGHT } from "./constants";
import { sortBookletMembersByName } from "./sort-booklet-members";
import type { BookletSection, NecMember } from "./types";

/** Vertical space available inside A4Page content area (px @ 96dpi). */
export { BOOKLET_CONTENT_HEIGHT };

/** Small headroom so rows are not clipped by A4 overflow. */
const PAGE_PACK_LIMIT = BOOKLET_CONTENT_HEIGHT - 16;

const KEY_ORDER = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "FINANCIAL_SECRETARY",
  "TREASURER",
] as const;

const KEY_ROLE_SET = new Set<string>(KEY_ORDER);

/** Officer / chair grids always use 3 columns. */
export const BOOKLET_OFFICER_GRID_COLS = 3;

/** Default member grid for committees with chair + officer cards. */
export const BOOKLET_GRID_COLS = 3;

/** Dense member grids (city presidents, province coordinators). */
export const BOOKLET_DENSE_GRID_COLS = 4;

const OFFICER_GRID_COLS = BOOKLET_OFFICER_GRID_COLS;
const GRID_ROW_GAP = 12;

// ─── Height estimates (px) — tuned to CommitteeSection / TableOfContentsPage ─

const SECTION_HEADING_BASE = 66;
const SECTION_SUBTITLE_EXTRA = 18;
const SECTION_BODY_LINE_H = 17;
const CHAIR_HERO_NON_NEC = 196;
const CHAIR_HERO_NEC = 250;
const CHAIR_HERO_BOTTOM_MARGIN = 18;
const CHAIR_BIO_LINE_H = 17;
/** Officer card: avatar row + contact block + delegate badge + padding. */
const OFFICER_CARD_H = 208;
/** Member card at 3 cols. */
const MEMBER_CARD_H_3COL = 188;
/** Member card at 4 cols — slightly wider than 5-col, shorter than 3-col. */
const MEMBER_CARD_H_4COL = 168;
const MEMBERS_SUBHEADING_H = 38;
const MEMBERS_SUBHEADING_TOP_GAP = 12;
const SUBSECTION_HEADING_H = 52;

export function getMemberGridCols(
  section: BookletSection,
  _generalMemberCount: number,
): number {
  if (section.type === "CITY_PRESIDENTS" || section.type === "COC_MEMBERS") {
    return BOOKLET_GRID_COLS;
  }
  return BOOKLET_GRID_COLS;
}

function memberCardHeight(cols: number): number {
  return cols >= BOOKLET_DENSE_GRID_COLS
    ? MEMBER_CARD_H_4COL
    : MEMBER_CARD_H_3COL;
}

export type CommitteeSectionContinuation = {
  section: BookletSection;
  members: NecMember[];
};

export type CommitteePageLayout = {
  showSectionHeading: boolean;
  chair: NecMember | null;
  showChairPlaceholder: boolean;
  /** Full grid rows — never split across pages. */
  officerRows: NecMember[][];
  showMembersHeading: boolean;
  showSubsectionHeading: boolean;
  subsectionTitle: string | null;
  /** Full grid rows — never split across pages. */
  memberRows: NecMember[][];
  memberGridCols: number;
};

type LayoutRow =
  | { kind: "heading"; h: number }
  | { kind: "chair"; member: NecMember; h: number }
  | { kind: "officers"; members: NecMember[]; h: number }
  | { kind: "members_heading"; h: number }
  | { kind: "subsection_heading"; title: string; h: number }
  | { kind: "members"; members: NecMember[]; h: number; cols: number };

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

function pageHasMembersHeading(page: LayoutRow[]): boolean {
  return page.some(
    (row) => row.kind === "members_heading" || row.kind === "members",
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
  let h =
    (isNec ? CHAIR_HERO_NEC : CHAIR_HERO_NON_NEC) + CHAIR_HERO_BOTTOM_MARGIN;
  if (chair.bookletBio?.trim()) {
    const lines = Math.max(1, Math.ceil(chair.bookletBio.length / 72));
    h += 8 + lines * CHAIR_BIO_LINE_H;
  }
  return h;
}

function estimateOfficerRowH(): number {
  return OFFICER_CARD_H + GRID_ROW_GAP;
}

function estimateMemberRowH(cols: number, extraTopGap = false): number {
  return (
    memberCardHeight(cols) +
    GRID_ROW_GAP +
    (extraTopGap ? MEMBERS_SUBHEADING_TOP_GAP : 0)
  );
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
  if (section.type === "CITY_PRESIDENTS" || section.type === "COC_MEMBERS") {
    return {
      chair: null,
      keyOfficers: [],
      generalMembers: sortBookletMembersByName(members),
    };
  }

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
    const generalMembers = sortBookletMembersByName(
      members.filter((m) => !leadership.includes(m)),
    );
    return { chair, keyOfficers, generalMembers };
  }

  const chair = members.find((m) => m.role === "CHAIR") ?? null;
  const keyOfficers = KEY_ORDER.slice(1).flatMap((role) =>
    members.filter((m) => m.role === role),
  );
  const generalMembers = sortBookletMembersByName(
    members.filter((m) => !KEY_ROLE_SET.has(m.role)),
  );
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
  const memberCols = getMemberGridCols(section, generalMembers.length);
  const rows: LayoutRow[] = [
    { kind: "heading", h: estimateSectionHeadingH(section) },
  ];

  if (chair) {
    rows.push({
      kind: "chair",
      member: chair,
      h: estimateChairH(chair, isNec),
    });
  }

  const officerChunkSize =
    section.type === "COC" || section.type === "CITY_PRESIDENTS"
      ? 3
      : OFFICER_GRID_COLS;
  for (const officerRow of chunk(keyOfficers, officerChunkSize)) {
    rows.push({
      kind: "officers",
      members: officerRow,
      h: estimateOfficerRowH(),
    });
  }

  appendMemberRows(
    rows,
    generalMembers,
    chair != null || keyOfficers.length > 0,
    memberCols,
  );

  if (continuation && continuation.members.length > 0) {
    const continuationCols = getMemberGridCols(
      continuation.section,
      continuation.members.length,
    );
    rows.push({
      kind: "subsection_heading",
      title: continuation.section.title,
      h: SUBSECTION_HEADING_H,
    });
    appendMemberRows(
      rows,
      sortBookletMembersByName(continuation.members),
      true,
      continuationCols,
    );
  }

  return rows;
}

function appendMemberRows(
  rows: LayoutRow[],
  generalMembers: NecMember[],
  hasLeadershipAbove: boolean,
  cols: number,
) {
  let firstMemberRow = true;
  for (const memberRow of chunk(generalMembers, cols)) {
    rows.push({
      kind: "members",
      members: memberRow,
      cols,
      h: estimateMemberRowH(cols, firstMemberRow && hasLeadershipAbove),
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
    membersLabelPlaced = false;
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
      const needsHeading =
        !membersLabelPlaced && !pageHasMembersHeading(current);
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

function packRowsIntoPages(rows: LayoutRow[]): LayoutRow[][] {
  if (rows.length === 0) return [[]];
  return heightPackRows(rows);
}

function pageLayoutFromRows(
  rows: LayoutRow[],
  expectsChair: boolean,
  defaultMemberCols: number,
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
    memberGridCols: defaultMemberCols,
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
        layout.memberGridCols = row.cols;
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
  const memberCols = getMemberGridCols(section, generalMembers.length);
  const rows = buildCommitteeRows(
    section,
    chair,
    keyOfficers,
    generalMembers,
    isNec,
    continuation,
  );
  return packRowsIntoPages(rows).map((pageRows, pageIndex) => {
    const layout = pageLayoutFromRows(pageRows, expectsChair, memberCols);
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
        memberGridCols: getMemberGridCols(section, 0),
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
  | {
      kind: "section";
      sectionId: string;
      title: string;
      subtitle?: string | null;
      isKey: boolean;
      startPage: number;
      pageSpan: number;
    }
  | { kind: "back_cover"; page: number };

function tocEntryHeight(entry: TocRenderableEntry): number {
  switch (entry.kind) {
    case "cover":
      return TOC_HIGHLIGHT_ENTRY_H;
    case "back_cover":
      return TOC_HIGHLIGHT_ENTRY_H;
    case "section":
      return entry.subtitle?.trim() ? TOC_ENTRY_WITH_SUBTITLE_H : TOC_ENTRY_H;
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
