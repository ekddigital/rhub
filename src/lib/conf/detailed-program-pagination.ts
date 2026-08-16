import type { ProgramSlot } from "@/components/tools/conf/detailed-program/program-data";

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
