import type { ProgramSlot } from "@/components/tools/conf/detailed-program/program-data";
import {
  REPORT_CONTENT_HEIGHT,
  REPORT_CONTENT_WIDTH,
  REPORT_CONTINUATION_BLOCK,
  REPORT_SECTION_TITLE_BLOCK,
} from "@/components/tools/conf/conference-report/report-layout";
import { REPORT_PROGRAM } from "@/components/tools/conf/conference-report/report-typography";

/** Usable A4 content height for conference report interior pages. */
const REPORT_PAGE_CONTENT_PX = REPORT_CONTENT_HEIGHT;
const REPORT_SECTION_TITLE_PX = REPORT_SECTION_TITLE_BLOCK;
const REPORT_CONTINUATION_PX = REPORT_CONTINUATION_BLOCK;
/** Tighter than general layout margin — program rows are measured directly. */
const REPORT_PROGRAM_SAFETY_PX = 48;

const REPORT_PROGRAM_TABLE_HEADER_PX = 30;
const REPORT_PROGRAM_DAY_TITLE_PX = 22;
const REPORT_PROGRAM_DAY_META_PX = 19;
const REPORT_PROGRAM_DRESS_LINE_PX = 16;
const REPORT_PROGRAM_CELL_PAD_Y = 10;
const REPORT_PROGRAM_ROW_BORDER_PX = 1;
const REPORT_PROGRAM_SUB_MARGIN_PX = 2;

const REPORT_PROGRAM_ACTIVITY_COL_WIDTH = REPORT_CONTENT_WIDTH * 0.54;
const REPORT_PROGRAM_BY_COL_WIDTH = REPORT_CONTENT_WIDTH * 0.28;

const REPORT_PROGRAM_ACTIVITY_LINE_PX = Math.ceil(
  REPORT_PROGRAM.activity.fontSize * REPORT_PROGRAM.activity.lineHeight,
);
const REPORT_PROGRAM_BY_LINE_PX = Math.ceil(
  REPORT_PROGRAM.responsible.fontSize * 1.35,
);
const REPORT_PROGRAM_SUB_LINE_PX = Math.ceil(
  REPORT_PROGRAM.subItem.fontSize * 1.35,
);

function reportProgramCharsPerLine(colWidth: number, fontSize: number): number {
  return Math.max(16, Math.floor(colWidth / (fontSize * 0.55)));
}

const REPORT_PROGRAM_ACTIVITY_CHARS = reportProgramCharsPerLine(
  REPORT_PROGRAM_ACTIVITY_COL_WIDTH,
  REPORT_PROGRAM.activity.fontSize,
);
const REPORT_PROGRAM_BY_CHARS = reportProgramCharsPerLine(
  REPORT_PROGRAM_BY_COL_WIDTH,
  REPORT_PROGRAM.responsible.fontSize,
);

export type ProgramPaginationOptions = {
  firstPageCapacity: number;
  continuedPageCapacity: number;
  estimateSlotUnits: (slot: ProgramSlot) => number;
};

/** Booklet detailed-program slot estimator (program-document.tsx). */
export function estimateBookletProgramSlotUnits(slot: ProgramSlot): number {
  const activityUnits = Math.ceil(slot.activity.length / 68) * 1.6;
  const byUnits = slot.by ? Math.ceil(slot.by.length / 80) * 1.1 : 0;
  const mealUnits = slot.meal ? Math.ceil(slot.meal.length / 66) * 1.1 : 0;
  const subsUnits =
    slot.subs?.reduce((sum, sub) => {
      const subLabelUnits = Math.ceil(sub.label.length / 76) * 1.05;
      const subByUnits = sub.by ? Math.ceil(sub.by.length / 76) * 0.7 : 0;
      return sum + subLabelUnits + subByUnits;
    }, 0) ?? 0;

  return 5.2 + activityUnits + byUnits + mealUnits + subsUnits;
}

/** Conference report program slot estimator (report typography / table layout). */
export function estimateReportProgramSlotUnits(slot: ProgramSlot): number {
  const activityUnits = Math.ceil(slot.activity.length / 88) * 1.15;
  const byUnits = slot.by ? Math.ceil(slot.by.length / 96) * 0.85 : 0;
  const mealUnits = slot.meal ? Math.ceil(slot.meal.length / 72) * 0.85 : 0;
  const subsUnits =
    slot.subs?.reduce((sum, sub) => {
      const subLabelUnits = Math.ceil(sub.label.length / 84) * 0.95;
      const subByUnits = sub.by ? Math.ceil(sub.by.length / 84) * 0.65 : 0;
      return sum + subLabelUnits + subByUnits;
    }, 0) ?? 0;

  return 3.2 + activityUnits + byUnits + mealUnits + subsUnits;
};

export const BOOKLET_PROGRAM_PAGINATION: ProgramPaginationOptions = {
  firstPageCapacity: 96,
  continuedPageCapacity: 108,
  estimateSlotUnits: estimateBookletProgramSlotUnits,
};

export const REPORT_PROGRAM_PAGINATION: ProgramPaginationOptions = {
  firstPageCapacity: 96,
  continuedPageCapacity: 108,
  estimateSlotUnits: estimateReportProgramSlotUnits,
};

function wrappedLines(text: string, charsPerLine: number): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / charsPerLine));
}

/** Pixel height of one rendered program row in the conference report. */
export function estimateReportProgramSlotPx(slot: ProgramSlot): number {
  let activityBlock =
    wrappedLines(slot.activity, REPORT_PROGRAM_ACTIVITY_CHARS) *
    REPORT_PROGRAM_ACTIVITY_LINE_PX;

  if (slot.meal) {
    activityBlock +=
      wrappedLines(slot.meal, REPORT_PROGRAM_ACTIVITY_CHARS) *
      REPORT_PROGRAM_ACTIVITY_LINE_PX;
  }
  if (slot.subs) {
    activityBlock += slot.subs.reduce(
      (sum, sub) =>
        sum +
        REPORT_PROGRAM_SUB_MARGIN_PX +
        wrappedLines(sub.label, REPORT_PROGRAM_ACTIVITY_CHARS) *
          REPORT_PROGRAM_SUB_LINE_PX,
      0,
    );
  }

  const byBlock = slot.by
    ? wrappedLines(slot.by, REPORT_PROGRAM_BY_CHARS) * REPORT_PROGRAM_BY_LINE_PX
    : 0;

  return (
    REPORT_PROGRAM_CELL_PAD_Y +
    Math.max(activityBlock, byBlock) +
    REPORT_PROGRAM_ROW_BORDER_PX
  );
}

function estimateReportProgramDayHeaderPx(
  dressCodeCount: number,
  dressCodeChars = 0,
): number {
  const dressLines = dressCodeCount
    ? Math.max(1, Math.ceil(Math.max(dressCodeChars, 40) / 78))
    : 0;
  return (
    REPORT_PROGRAM_DAY_TITLE_PX +
    REPORT_PROGRAM_DAY_META_PX +
    dressLines * REPORT_PROGRAM_DRESS_LINE_PX +
    5
  );
}

function reportProgramPageBudgetPx(
  isFirstPage: boolean,
  dressCodeCount = 0,
  dressCodeChars = 0,
): number {
  const chrome = isFirstPage ? REPORT_SECTION_TITLE_PX : REPORT_CONTINUATION_PX;
  const dayHeader = isFirstPage
    ? estimateReportProgramDayHeaderPx(dressCodeCount, dressCodeChars)
    : 0;
  return (
    REPORT_PAGE_CONTENT_PX -
    REPORT_PROGRAM_SAFETY_PX -
    chrome -
    dayHeader -
    REPORT_PROGRAM_TABLE_HEADER_PX
  );
}

/** Merge a trailing orphan page (1–2 small rows) back onto the previous page. */
function mergeReportProgramOrphans(
  pages: ProgramSlot[][],
  dressCodeCount = 0,
  dressCodeChars = 0,
): ProgramSlot[][] {
  if (pages.length < 2) return pages;

  const last = pages[pages.length - 1];
  if (last.length === 0) return pages.slice(0, -1);
  if (last.length > 2) return pages;

  const lastPx = last.reduce((sum, slot) => sum + estimateReportProgramSlotPx(slot), 0);
  if (lastPx > 120) return pages;

  const prev = pages[pages.length - 2];
  const prevPx = prev.reduce((sum, slot) => sum + estimateReportProgramSlotPx(slot), 0);
  const combinedPx = prevPx + lastPx;
  const prevIsFirstPage = pages.length === 2;
  const budget = reportProgramPageBudgetPx(
    prevIsFirstPage,
    dressCodeCount,
    dressCodeChars,
  );

  if (combinedPx <= budget) {
    return [...pages.slice(0, -2), [...prev, ...last]];
  }

  return pages;
}

/** Pixel-based pagination for conference report §7–§10 program tables. */
export function splitReportProgramDaySlots(
  slots: readonly ProgramSlot[],
  dressCodeCount = 0,
  dressCodeChars = 0,
): ProgramSlot[][] {
  if (slots.length === 0) return [];

  const pages: ProgramSlot[][] = [];
  let currentPage: ProgramSlot[] = [];
  let usedPx = 0;
  let isFirst = true;

  for (const slot of slots) {
    const budget = reportProgramPageBudgetPx(isFirst, dressCodeCount, dressCodeChars);
    const slotPx = estimateReportProgramSlotPx(slot);
    const wouldOverflow = usedPx + slotPx > budget;

    if (wouldOverflow && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [slot];
      usedPx = slotPx;
      isFirst = false;
      continue;
    }

    if (wouldOverflow && currentPage.length === 0) {
      currentPage.push(slot);
      usedPx = slotPx;
      pages.push(currentPage);
      currentPage = [];
      usedPx = 0;
      isFirst = false;
      continue;
    }

    currentPage.push(slot);
    usedPx += slotPx;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return mergeReportProgramOrphans(pages, dressCodeCount, dressCodeChars);
}

/** Split one day's slots across pages — shared by detailed-program and conference report. */
export function splitProgramDaySlots(
  slots: readonly ProgramSlot[],
  options: ProgramPaginationOptions,
): ProgramSlot[][] {
  const pages: ProgramSlot[][] = [];
  let currentPage: ProgramSlot[] = [];
  let usedUnits = 0;

  for (const slot of slots) {
    const capacity =
      pages.length === 0
        ? options.firstPageCapacity
        : options.continuedPageCapacity;
    const slotUnits = options.estimateSlotUnits(slot);
    const wouldOverflow = usedUnits + slotUnits > capacity;

    if (wouldOverflow && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [slot];
      usedUnits = slotUnits;
      continue;
    }

    currentPage.push(slot);
    usedUnits += slotUnits;
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}
