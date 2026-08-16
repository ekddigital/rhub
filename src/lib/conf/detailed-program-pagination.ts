import type { ProgramSlot } from "@/components/tools/conf/detailed-program/program-data";

/** Usable A4 content height for conference report interior pages. */
const REPORT_PAGE_CONTENT_PX = 1123 - 61 - 33 - 28;
const REPORT_SECTION_TITLE_PX = 44;
const REPORT_CONTINUATION_PX = 26;
const REPORT_PROGRAM_SAFETY_PX = 24;

const REPORT_PROGRAM_TABLE_HEADER_PX = 30;
const REPORT_PROGRAM_DAY_TITLE_PX = 22;
const REPORT_PROGRAM_DAY_META_PX = 19;
const REPORT_PROGRAM_DRESS_LINE_PX = 16;
const REPORT_PROGRAM_ROW_BASE_PX = 28;
const REPORT_PROGRAM_ACTIVITY_LINE_PX = 16;
const REPORT_PROGRAM_SUB_PX = 16;
const REPORT_PROGRAM_MEAL_PX = 16;
const REPORT_PROGRAM_BY_LINE_PX = 14;
const REPORT_PROGRAM_ACTIVITY_CHARS = 72;
const REPORT_PROGRAM_BY_CHARS = 38;

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
  let px = REPORT_PROGRAM_ROW_BASE_PX;
  const activityLines = wrappedLines(slot.activity, REPORT_PROGRAM_ACTIVITY_CHARS);
  px += Math.max(0, activityLines - 1) * REPORT_PROGRAM_ACTIVITY_LINE_PX;

  if (slot.meal) {
    px +=
      wrappedLines(slot.meal, REPORT_PROGRAM_ACTIVITY_CHARS) *
      REPORT_PROGRAM_MEAL_PX;
  }
  if (slot.by) {
    px +=
      wrappedLines(slot.by, REPORT_PROGRAM_BY_CHARS) * REPORT_PROGRAM_BY_LINE_PX;
  }
  if (slot.subs) {
    px += slot.subs.reduce(
      (sum, sub) =>
        sum +
        wrappedLines(sub.label, REPORT_PROGRAM_ACTIVITY_CHARS) *
          REPORT_PROGRAM_SUB_PX,
      0,
    );
  }
  return px;
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
function mergeReportProgramOrphans(pages: ProgramSlot[][]): ProgramSlot[][] {
  if (pages.length < 2) return pages;

  const last = pages[pages.length - 1];
  if (last.length === 0) return pages.slice(0, -1);
  if (last.length > 2) return pages;

  const lastPx = last.reduce((sum, slot) => sum + estimateReportProgramSlotPx(slot), 0);
  if (lastPx > 120) return pages;

  const prev = pages[pages.length - 2];
  const prevPx = prev.reduce((sum, slot) => sum + estimateReportProgramSlotPx(slot), 0);
  const combinedPx = prevPx + lastPx;
  const budget = reportProgramPageBudgetPx(false) + 80;

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

  return mergeReportProgramOrphans(pages);
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
