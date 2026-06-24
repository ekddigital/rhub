import { BOOKLET_A4 } from "./constants";
import type { BookletSection, NecMember } from "./types";

/** Vertical space available inside A4Page content area (px @ 96dpi). */
export const BOOKLET_CONTENT_HEIGHT =
  BOOKLET_A4.height - 61 - 33 - 48; // header, footer, content padding

const KEY_ORDER = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "FINANCIAL_SECRETARY",
  "TREASURER",
] as const;

const KEY_ROLE_SET = new Set<string>(KEY_ORDER);

const GRID_COLS = 3;

// ─── Height estimates (px) — tuned to CommitteeSection / TableOfContentsPage ─

const SECTION_HEADING_BASE = 66;
const SECTION_SUBTITLE_EXTRA = 18;
const SECTION_BODY_LINE_H = 17;
const CHAIR_HERO_NON_NEC = 176;
const CHAIR_HERO_NEC = 224;
const CHAIR_BIO_LINE_H = 17;
const OFFICER_ROW_H = 148;
const MEMBER_ROW_H = 136;
const MEMBERS_SUBHEADING_H = 38;

const TOC_HEADING_BLOCK = 55;
const TOC_ENTRY_H = 40;
const TOC_ENTRY_WITH_SUBTITLE_H = 52;
const TOC_HIGHLIGHT_ENTRY_H = 44;

export type CommitteePageLayout = {
  showSectionHeading: boolean;
  chair: NecMember | null;
  officers: NecMember[];
  showMembersHeading: boolean;
  members: NecMember[];
};

type LayoutRow =
  | { kind: "heading"; h: number }
  | { kind: "chair"; member: NecMember; h: number }
  | { kind: "officers"; members: NecMember[]; h: number }
  | { kind: "members_heading"; h: number }
  | { kind: "members"; members: NecMember[]; h: number };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
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

function estimateOfficerRowH(members: NecMember[]): number {
  if (members.length === 0) return 0;
  return OFFICER_ROW_H + (members.length < GRID_COLS ? 0 : 0);
}

function estimateMemberRowH(): number {
  return MEMBER_ROW_H;
}

export function splitCommitteeMembers(members: NecMember[]): {
  chair: NecMember | null;
  keyOfficers: NecMember[];
  generalMembers: NecMember[];
} {
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
      h: estimateOfficerRowH(officerRow),
    });
  }

  let firstMemberRow = true;
  for (const memberRow of chunk(generalMembers, GRID_COLS)) {
    let h = estimateMemberRowH();
    if (firstMemberRow && (chair != null || keyOfficers.length > 0)) {
      h += 12;
      firstMemberRow = false;
    }
    rows.push({
      kind: "members",
      members: memberRow,
      h,
    });
  }

  return rows;
}

function packRowsIntoPages(rows: LayoutRow[]): LayoutRow[][] {
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
    if (usedH + row.h > BOOKLET_CONTENT_HEIGHT && current.length > 0) {
      startNewPage();
    }
    current.push(row);
    usedH += row.h;
  };

  for (const row of rows) {
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

function pageLayoutFromRows(rows: LayoutRow[]): CommitteePageLayout {
  const layout: CommitteePageLayout = {
    showSectionHeading: false,
    chair: null,
    officers: [],
    showMembersHeading: false,
    members: [],
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
        layout.officers.push(...row.members);
        break;
      case "members_heading":
        layout.showMembersHeading = true;
        break;
      case "members":
        layout.members.push(...row.members);
        break;
      default:
        break;
    }
  }

  return layout;
}

export function paginateCommitteeSection(
  section: BookletSection,
  members: NecMember[],
  isNec: boolean,
): CommitteePageLayout[] {
  if (members.length === 0) {
    return [
      {
        showSectionHeading: true,
        chair: null,
        officers: [],
        showMembersHeading: false,
        members: [],
      },
    ];
  }

  const { chair, keyOfficers, generalMembers } = splitCommitteeMembers(members);
  const rows = buildCommitteeRows(
    section,
    chair,
    keyOfficers,
    generalMembers,
    isNec,
  );
  return packRowsIntoPages(rows).map(pageLayoutFromRows);
}

export function committeeSectionPageCountFromMembers(
  section: BookletSection,
  members: NecMember[],
  isNec: boolean,
): number {
  return paginateCommitteeSection(section, members, isNec).length;
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
