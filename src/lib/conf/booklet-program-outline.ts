import type { BookletSection } from "@/components/tools/conf/booklet/types";
import { DEFAULT_PROGRAM_OUTLINE_INTRO } from "@/lib/conf/booklet-conference-copy";
import { DETAILED_PROGRAM_DAYS } from "@/components/tools/conf/detailed-program/program-data";

export type ProgramOutlineActivity = {
  time: string;
  activity: string;
  location: string;
};

export type ProgramOutlineDetailedActivity = {
  time: string;
  activity: string;
  responsible?: string;
  subs?: string[];
  meal?: string;
  highlight?: boolean;
};

export type ProgramOutlineDay = {
  dayNumber: number;
  label: string;
  dateLabel: string;
  dressCodes: { session: string; code: string }[];
  activities: ProgramOutlineActivity[];
  detailedActivities: ProgramOutlineDetailedActivity[];
  isContinuation?: boolean;
  showDressCodes?: boolean;
  showSummaryTable?: boolean;
};

export type ResolvedProgramOutline = {
  welcomeTitle: string;
  intro: string;
  days: ProgramOutlineDay[];
};

export type ProgramOutlinePageChunk = {
  showIntro: boolean;
  days: ProgramOutlineDay[];
};

const DEFAULT_WELCOME_TITLE = "Welcome to Jinan";

const DEFAULT_INTRO = DEFAULT_PROGRAM_OUTLINE_INTRO;

/**
 * Keep booklet summary tables while enriching each day with detailed flow rows
 * sourced from the separate detailed program document.
 */
const SUMMARY_PROGRAM_DAYS: Array<
  Pick<ProgramOutlineDay, "dayNumber" | "label" | "dateLabel" | "activities">
> = [
  {
    dayNumber: 1,
    label: "Day 1 — Arrival & Meet and Greet",
    dateLabel: "Friday, 24 July 2026",
    activities: [
      {
        time: "All Day",
        activity: "Delegates arrive and travel to the conference venue",
        location: "In transit / venue arrival",
      },
      {
        time: "11:00 AM - 8:00 PM",
        activity: "Arrival, check-in, room assignment, and welfare support",
        location: "Arcadia Spa Golf International Hotel",
      },
      {
        time: "2:00 PM - 4:00 PM",
        activity:
          "Rest window — delegates settle into rooms and explore hotel grounds",
        location: "Hotel / logistics desk",
      },
      {
        time: "4:10 PM - 6:30 PM",
        activity:
          "Opening prayer, welcome remarks, introductions, orientation, and housekeeping",
        location: "Hotel yard (near the golf course)",
      },
      {
        time: "7:00 PM - 9:10 PM",
        activity: "Games, fellowship, and closing prayer",
        location: "Hotel dining area",
      },
    ],
  },
  {
    dayNumber: 2,
    label: "Day 2 — Conference Business & Pool Party",
    dateLabel: "Saturday, 25 July 2026",
    activities: [
      {
        time: "8:00 AM - 10:55 AM",
        activity:
          "Opening prayer, call to order, agenda adoption, credentials, and annual reports",
        location: "Hotel conference room",
      },
      {
        time: "11:00 AM - 12:45 PM",
        activity: "Strategic resolutions and lunch break",
        location: "Hotel conference room",
      },
      {
        time: "12:47 PM - 2:15 PM",
        activity: "Constitution review and elections",
        location: "Hotel conference room",
      },
      {
        time: "2:20 PM - 3:20 PM",
        activity: "Rest — delegates relax at the hotel",
        location: "Hotel / personal time",
      },
      {
        time: "4:00 PM - 9:00 PM",
        activity: "Pool party, dinner, caucus check-ins, and closing prayer",
        location: "Hotel pool / spa area",
      },
    ],
  },
  {
    dayNumber: 3,
    label: "Day 3 — Conference, Sports & Evening Party",
    dateLabel: "Sunday, 26 July 2026",
    activities: [
      {
        time: "8:00 AM - 12:30 PM",
        activity:
          "Independence Day morning session, oration, inductions, rally, and anthem",
        location: "Hotel conference room",
      },
      {
        time: "12:30 PM - 1:30 PM",
        activity: "Lunch and group photos",
        location: "Hotel / designated photo point",
      },
      {
        time: "2:00 PM - 5:30 PM",
        activity: "Football",
        location: "Hotel sports grounds",
      },
      {
        time: "5:30 PM - 6:30 PM",
        activity: "Freshening up and preparation for awards night",
        location: "Hotel / room floors",
      },
      {
        time: "7:00 PM - 10:00 PM",
        activity: "Red carpet, welcome session, and special statements",
        location: "Hotel venue (to be announced)",
      },
      {
        time: "10:00 PM - 4:15 AM",
        activity: "Awards Night Program, vote of thanks, and closing",
        location: "Hotel venue (awards hall)",
      },
    ],
  },
  {
    dayNumber: 4,
    label: "Day 4 — Departure",
    dateLabel: "Monday, 27 July 2026",
    activities: [
      {
        time: "6:30 AM - 7:30 AM",
        activity: "Breakfast and room check-out preparation",
        location: "Hotel / room floors",
      },
      {
        time: "7:30 AM - 12:00 noon",
        activity:
          "Baggage coordination, welfare check, and official hotel check-out",
        location: "Hotel reception",
      },
      {
        time: "As needed",
        activity:
          "Conference-arranged group transfers to Jinan West Railway Station",
        location: "Hotel pickup point / transfer route",
      },
      {
        time: "After 12:00 noon",
        activity: "Delegates in transit and city follow-up confirmations",
        location: "Railway stations / travel routes",
      },
    ],
  },
];

const SUMMARY_DAY_MAP = new Map(
  SUMMARY_PROGRAM_DAYS.map((day) => [day.dayNumber, day]),
);

/** Jinan 2026 conference program — summary + detailed flow. */
export const JINAN_2026_PROGRAM_DAYS: ProgramOutlineDay[] =
  DETAILED_PROGRAM_DAYS.map((day) => {
    const summary = SUMMARY_DAY_MAP.get(day.day);
    return {
      dayNumber: day.day,
      label: summary?.label ?? `Day ${day.day} — ${day.label}`,
      dateLabel: summary?.dateLabel ?? `${day.dayOfWeek}, ${day.date}`,
      dressCodes: day.dressCodes,
      activities: summary?.activities ?? [],
      detailedActivities: day.slots.map((slot) => ({
        time: slot.time,
        activity: slot.activity,
        responsible: slot.by,
        subs: slot.subs?.map((sub) =>
          sub.by ? `${sub.label} — ${sub.by}` : sub.label,
        ),
        meal: slot.meal,
        highlight: slot.highlight,
      })),
      showDressCodes: true,
      showSummaryTable: true,
    };
  });

function trimContent(value: string | null | undefined): string {
  return (value ?? "").trim();
}

export function resolveProgramOutline(
  section: BookletSection,
): ResolvedProgramOutline | null {
  const days = JINAN_2026_PROGRAM_DAYS;
  if (days.length === 0) return null;

  const intro = trimContent(section.bodyText) || DEFAULT_INTRO;
  const welcomeTitle = trimContent(section.subtitle) || DEFAULT_WELCOME_TITLE;

  return {
    welcomeTitle,
    intro,
    days,
  };
}

/** Split days across booklet pages (intro + first half, then remainder). */
export function paginateProgramOutlineDays(
  days: ProgramOutlineDay[],
): ProgramOutlineDay[][] {
  if (days.length <= 2) return [days];
  const mid = Math.ceil(days.length / 2);
  return [days.slice(0, mid), days.slice(mid)];
}

const PAGE_UNIT_BUDGET = 98;
const INTRO_PAGE_UNIT_BUDGET = 90;
const FIRST_DAY_CHUNK_BASE_UNITS = 38;
const CONT_DAY_CHUNK_BASE_UNITS = 15;

function estimateIntroUnits(intro: string): number {
  const charsPerLine = 94;
  const lines = Math.max(3, Math.ceil(intro.length / charsPerLine));
  return Math.ceil(lines * 1.85 + 16);
}

function estimateDetailedRowUnits(row: ProgramOutlineDetailedActivity): number {
  const timeUnits = Math.max(1, Math.ceil(row.time.length / 20)) * 0.8;
  const activityUnits = Math.max(1, Math.ceil(row.activity.length / 68)) * 1.8;
  const responsibleUnits = row.responsible
    ? Math.max(1, Math.ceil(row.responsible.length / 66)) * 1.1
    : 0;
  const mealUnits = row.meal
    ? Math.max(1, Math.ceil(row.meal.length / 64)) * 1.0
    : 0;
  const subsUnits = (row.subs ?? []).reduce(
    (sum, sub) => sum + Math.max(1, Math.ceil(sub.length / 66)) * 0.9,
    0,
  );

  const baseEstimate =
    2.2 + timeUnits + activityUnits + responsibleUnits + mealUnits + subsUnits;

  // Keep a very small safety buffer so estimation is stable without forcing
  // tiny continuation pages.
  return baseEstimate * 1.02;
}

function estimateSummaryRowUnits(row: ProgramOutlineActivity): number {
  const timeUnits = Math.max(1, Math.ceil(row.time.length / 24)) * 0.6;
  const activityUnits = Math.max(1, Math.ceil(row.activity.length / 62)) * 1.2;
  const locationUnits = Math.max(1, Math.ceil(row.location.length / 44)) * 1.0;
  return 1.8 + timeUnits + activityUnits + locationUnits;
}

function estimateDressCodeUnits(day: ProgramOutlineDay): number {
  if (day.showDressCodes === false || day.dressCodes.length === 0) return 0;
  const rows = day.dressCodes.reduce(
    (sum, code) => sum + Math.max(1, Math.ceil(code.code.length / 46)) * 0.9,
    0,
  );
  // Card chrome + label + row content
  return 5.4 + rows;
}

function estimateSummaryTableUnits(day: ProgramOutlineDay): number {
  if (day.showSummaryTable === false || day.activities.length === 0) return 0;
  const rows = day.activities.reduce(
    (sum, row) => sum + estimateSummaryRowUnits(row),
    0,
  );
  // Heading + table header + borders/padding overhead
  return 6.8 + rows;
}

function estimateStaticDayUnits(day: ProgramOutlineDay): number {
  const base = day.isContinuation
    ? CONT_DAY_CHUNK_BASE_UNITS
    : FIRST_DAY_CHUNK_BASE_UNITS;
  const detailedHeadingUnits = day.detailedActivities.length > 0 ? 3.2 : 0;
  return (
    base +
    estimateDressCodeUnits(day) +
    estimateSummaryTableUnits(day) +
    detailedHeadingUnits
  );
}

function estimateDayChunkUnits(day: ProgramOutlineDay): number {
  return (
    estimateStaticDayUnits(day) +
    day.detailedActivities.reduce(
      (sum, row) => sum + estimateDetailedRowUnits(row),
      0,
    )
  );
}

function chunkDayActivities(day: ProgramOutlineDay): ProgramOutlineDay[] {
  const FIRST_CHUNK_BUDGET = 88;
  const CONT_CHUNK_BUDGET = 94;
  const chunks: ProgramOutlineDay[] = [];
  let cursor = 0;
  let isContinuation = false;

  const details = day.detailedActivities;

  while (cursor < details.length) {
    const working: ProgramOutlineDay = {
      ...day,
      label: isContinuation ? `${day.label} (cont.)` : day.label,
      activities: !isContinuation ? day.activities : [],
      detailedActivities: [],
      showDressCodes: !isContinuation,
      showSummaryTable: !isContinuation,
      isContinuation,
    };

    let usedUnits = estimateStaticDayUnits(working);
    const chunkBudget = isContinuation ? CONT_CHUNK_BUDGET : FIRST_CHUNK_BUDGET;

    while (cursor < details.length) {
      const row = details[cursor];
      const rowUnits = estimateDetailedRowUnits(row);
      const fits = usedUnits + rowUnits <= chunkBudget;

      if (!fits && working.detailedActivities.length > 0) {
        break;
      }

      working.detailedActivities.push(row);
      usedUnits += rowUnits;
      cursor += 1;

      if (!fits && working.detailedActivities.length === 1) {
        break;
      }
    }

    chunks.push(working);
    isContinuation = true;
  }

  if (chunks.length === 0) {
    chunks.push({
      ...day,
      showDressCodes: true,
      showSummaryTable: true,
      isContinuation: false,
    });
  }

  // Avoid creating a trailing page for a tiny leftover row when it can safely
  // fit in the previous chunk.
  if (chunks.length >= 2) {
    const lastIdx = chunks.length - 1;
    const lastChunk = chunks[lastIdx];
    const prevChunk = chunks[lastIdx - 1];
    const isTinyTail =
      lastChunk.detailedActivities.length <= 1 ||
      estimateDayChunkUnits(lastChunk) <= CONT_DAY_CHUNK_BASE_UNITS + 10;

    if (isTinyTail) {
      const mergedPrev: ProgramOutlineDay = {
        ...prevChunk,
        detailedActivities: [
          ...prevChunk.detailedActivities,
          ...lastChunk.detailedActivities,
        ],
      };
      const prevBudget = prevChunk.isContinuation
        ? CONT_CHUNK_BUDGET
        : FIRST_CHUNK_BUDGET;
      if (estimateDayChunkUnits(mergedPrev) <= prevBudget + 16) {
        chunks[lastIdx - 1] = mergedPrev;
        chunks.pop();
      }
    }
  }

  return chunks;
}

/**
 * Program Outline pages are packed by estimated vertical height so rows do not
 * clip at the bottom of the page when day tables get longer.
 */
export function paginateProgramOutlinePages(
  resolved: ResolvedProgramOutline,
): ProgramOutlinePageChunk[] {
  const expandedDays = resolved.days.flatMap((day) => chunkDayActivities(day));

  const pages: ProgramOutlinePageChunk[] = [];
  let current: ProgramOutlinePageChunk = { showIntro: true, days: [] };
  let used = estimateIntroUnits(resolved.intro);
  let budget = INTRO_PAGE_UNIT_BUDGET;

  for (const day of expandedDays) {
    const dayUnits = estimateDayChunkUnits(day);
    if (current.days.length > 0 && used + dayUnits > budget) {
      pages.push(current);
      current = { showIntro: false, days: [] };
      used = 0;
      budget = PAGE_UNIT_BUDGET;
    }

    current.days.push(day);
    used += dayUnits;
  }

  if (current.days.length > 0 || current.showIntro) {
    pages.push(current);
  }

  return pages;
}

export function programOutlinePageCount(section: BookletSection): number {
  const resolved = resolveProgramOutline(section);
  if (!resolved) return 0;
  return paginateProgramOutlinePages(resolved).length;
}
