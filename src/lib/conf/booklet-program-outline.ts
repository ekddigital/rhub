import type { BookletSection } from "@/components/tools/conf/booklet/types";
import { BOOKLET_CONTENT_HEIGHT } from "@/components/tools/conf/booklet/constants";
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

// ─────────────────────────────────────────────────────────────────────────────
// Pixel-based pagination
//
// All estimates below are in CSS pixels calibrated against the actual inline
// styles used in ProgramOutlineSection.tsx. The page budget is derived from
// BOOKLET_CONTENT_HEIGHT (usable A4 content area) with a safety buffer to
// account for cumulative rounding of font metrics and native line-height
// variation.
// ─────────────────────────────────────────────────────────────────────────────

const SAFETY_BUFFER_PX = 24;
const PAGE_BUDGET_PX = BOOKLET_CONTENT_HEIGHT - SAFETY_BUFFER_PX;

// ── Intro block (only on the first program-outline page) ────────────────────
// Static chrome: "PROGRAM OUTLINE" pill (29px) + welcome title (34px) +
// divider (16px) + wrapper marginBottom (16px) ≈ 96px.
const INTRO_STATIC_PX = 96;
const INTRO_LINE_HEIGHT_PX = 26.7; // fontSize 15.5 × lineHeight 1.72
// Intro paragraphs render at 15.5px inside a 700px column → ~105 chars/line.
const INTRO_CHARS_PER_LINE = 105;
const INTRO_PARAGRAPH_MARGIN_PX = 12;
const INTRO_TRAILING_MARGIN_PX = 18;

// ── Per-day static blocks ───────────────────────────────────────────────────
const DAY_HEADER_PX = 46; // day label + date label + their margins
const DAY_TRAILING_MARGIN_PX = 16; // marginBottom on outer day wrapper

const DRESS_CARD_CHROME_PX = 45; // padding, border, label, card marginBottom
const DRESS_CARD_ROW_PX = 22; // fontSize 11.6 × lineHeight 1.4 (+small gap)

const SUMMARY_HEADING_PX = 18.5; // "Daily Activities (Summary)" heading + margin
const SUMMARY_THEAD_PX = 34.6; // header row padding + text
const SUMMARY_ROW_PADDING_PX = 16; // 8px top + 8px bottom
const SUMMARY_ROW_LINE_PX = 18.6; // fontSize 12.4 × lineHeight 1.5
const SUMMARY_TABLE_TRAILING_PX = 10; // marginBottom on the table

const DETAILED_HEADING_PX = 18.5; // "Detailed Flow" heading + margin
const DETAILED_ROW_PADDING_PX = 14; // 7px top + 7px bottom
const DETAILED_ROW_GAP_PX = 5; // marginBottom between rows
const DETAILED_ACTIVITY_LINE_PX = 17.7; // fontSize 12.2 × lineHeight 1.45
const DETAILED_META_LINE_PX = 15.5; // responsible / meal — fontSize 11.1 × ~1.4
const DETAILED_META_GAP_PX = 1; // marginTop between activity and meta lines
const DETAILED_SUB_LINE_PX = 14.9; // fontSize 11 × lineHeight 1.35
const DETAILED_SUBS_STATIC_PX = 3; // ul marginTop + item marginBottom cluster

// Approximate wrapping widths for each cell/column (chars per rendered line).
const SUMMARY_ACTIVITY_CHARS = 34; // ~45% of 700px inner width, fontSize 12.4
const SUMMARY_LOCATION_CHARS = 26; // ~35% of 700px inner width
const DETAILED_ACTIVITY_CHARS = 82; // wide activity column in detailed grid
const DETAILED_META_CHARS = 82;
const DETAILED_SUB_CHARS = 82;

function wrappedLines(text: string, charsPerLine: number): number {
  const normalized = text.trim();
  if (!normalized) return 0;
  return Math.max(1, Math.ceil(normalized.length / charsPerLine));
}

function estimateIntroPx(intro: string): number {
  const normalized = intro.trim();
  if (!normalized) return INTRO_STATIC_PX + INTRO_TRAILING_MARGIN_PX;

  const paragraphs = normalized
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const paragraphsPx = paragraphs.reduce((sum, paragraph) => {
    const lines = wrappedLines(paragraph, INTRO_CHARS_PER_LINE);
    return sum + lines * INTRO_LINE_HEIGHT_PX + INTRO_PARAGRAPH_MARGIN_PX;
  }, 0);

  return INTRO_STATIC_PX + paragraphsPx + INTRO_TRAILING_MARGIN_PX;
}

function estimateDressCodePx(day: ProgramOutlineDay): number {
  if (day.showDressCodes === false || day.dressCodes.length === 0) return 0;
  const rowsPx = day.dressCodes.reduce((sum, dc) => {
    // wrap the "Session: code" line; session label is short so use full width
    const text = `${dc.session}: ${dc.code}`;
    const lines = wrappedLines(text, 78);
    return sum + lines * DRESS_CARD_ROW_PX;
  }, 0);
  return DRESS_CARD_CHROME_PX + rowsPx;
}

function estimateSummaryTablePx(day: ProgramOutlineDay): number {
  if (day.showSummaryTable === false || day.activities.length === 0) return 0;
  const rowsPx = day.activities.reduce((sum, row) => {
    const activityLines = wrappedLines(row.activity, SUMMARY_ACTIVITY_CHARS);
    const locationLines = wrappedLines(row.location, SUMMARY_LOCATION_CHARS);
    const lines = Math.max(1, activityLines, locationLines);
    return sum + SUMMARY_ROW_PADDING_PX + lines * SUMMARY_ROW_LINE_PX;
  }, 0);
  return (
    SUMMARY_HEADING_PX + SUMMARY_THEAD_PX + rowsPx + SUMMARY_TABLE_TRAILING_PX
  );
}

function estimateDetailedRowPx(row: ProgramOutlineDetailedActivity): number {
  const activityLines = wrappedLines(row.activity, DETAILED_ACTIVITY_CHARS);
  let px = DETAILED_ROW_PADDING_PX + activityLines * DETAILED_ACTIVITY_LINE_PX;

  if (row.responsible) {
    const lines = wrappedLines(row.responsible, DETAILED_META_CHARS);
    px += DETAILED_META_GAP_PX + lines * DETAILED_META_LINE_PX;
  }
  if (row.meal) {
    const lines = wrappedLines(row.meal, DETAILED_META_CHARS);
    px += DETAILED_META_GAP_PX + lines * DETAILED_META_LINE_PX;
  }
  if (row.subs && row.subs.length > 0) {
    const subsPx = row.subs.reduce(
      (sum, sub) =>
        sum + wrappedLines(sub, DETAILED_SUB_CHARS) * DETAILED_SUB_LINE_PX,
      0,
    );
    px += DETAILED_SUBS_STATIC_PX + subsPx;
  }

  return px + DETAILED_ROW_GAP_PX;
}

function estimateStaticDayPx(day: ProgramOutlineDay): number {
  const detailedHeadingPx =
    day.detailedActivities.length > 0 ? DETAILED_HEADING_PX : 0;
  return (
    DAY_HEADER_PX +
    estimateDressCodePx(day) +
    estimateSummaryTablePx(day) +
    detailedHeadingPx
  );
}

function estimateDayChunkPx(day: ProgramOutlineDay): number {
  return (
    estimateStaticDayPx(day) +
    day.detailedActivities.reduce(
      (sum, row) => sum + estimateDetailedRowPx(row),
      0,
    ) +
    DAY_TRAILING_MARGIN_PX
  );
}

/**
 * Break a single day's detailed-flow rows across multiple page-chunks so no
 * row is ever clipped. The first chunk always carries the day header, dress
 * codes, and summary table; continuation chunks are labelled "(cont.)" and
 * only carry additional detailed-flow rows.
 */
function chunkDayActivities(
  day: ProgramOutlineDay,
  firstChunkBudget: number = PAGE_BUDGET_PX,
): ProgramOutlineDay[] {
  const chunks: ProgramOutlineDay[] = [];
  const details = day.detailedActivities;
  let cursor = 0;
  let isContinuation = false;

  do {
    const working: ProgramOutlineDay = {
      ...day,
      label: isContinuation ? `${day.label} (cont.)` : day.label,
      activities: isContinuation ? [] : day.activities,
      dressCodes: isContinuation ? [] : day.dressCodes,
      detailedActivities: [],
      showDressCodes: !isContinuation,
      showSummaryTable: !isContinuation,
      isContinuation,
    };

    // Available budget for this chunk. First chunk of the first day may be
    // shrunk by the intro block; subsequent chunks use the full page.
    const budget = isContinuation ? PAGE_BUDGET_PX : firstChunkBudget;
    let usedPx = estimateStaticDayPx(working) + DAY_TRAILING_MARGIN_PX;

    while (cursor < details.length) {
      const rowPx = estimateDetailedRowPx(details[cursor]);
      if (usedPx + rowPx > budget) {
        // Continuation chunks must always accept at least one row so a single
        // oversized row still renders rather than looping forever. The first
        // chunk of a day may legitimately carry zero detail rows if the day
        // header + summary already fills the remaining page space (e.g. Day 1
        // sharing the intro page).
        if (isContinuation && working.detailedActivities.length === 0) {
          working.detailedActivities.push(details[cursor]);
          usedPx += rowPx;
          cursor += 1;
        }
        break;
      }
      working.detailedActivities.push(details[cursor]);
      usedPx += rowPx;
      cursor += 1;
    }

    chunks.push(working);
    isContinuation = true;
    // Reset firstChunkBudget after first iteration so a shrunken first chunk
    // does not cascade into subsequent continuation chunks.
    firstChunkBudget = PAGE_BUDGET_PX;
  } while (cursor < details.length);

  if (chunks.length === 0) {
    // Day has no detailed rows — still emit the header/summary/dress code.
    chunks.push({
      ...day,
      showDressCodes: true,
      showSummaryTable: true,
      isContinuation: false,
    });
  }

  return chunks;
}

/**
 * Program Outline pages are packed by estimated vertical pixel height so rows
 * cannot clip at the bottom of a page, and so smaller day chunks share a page
 * whenever they fit.
 */
export function paginateProgramOutlinePages(
  resolved: ResolvedProgramOutline,
): ProgramOutlinePageChunk[] {
  const introPx = estimateIntroPx(resolved.intro);
  const introRemainingPx = PAGE_BUDGET_PX - introPx;

  // Decide whether Day 1's first chunk can share a page with the intro. The
  // check requires enough room for the day header + dress code + summary
  // table + at least one detailed-flow row. If not, the intro renders alone
  // on page 1 and Day 1 starts on page 2 with a full page budget — this is
  // the "fall down to next page" behaviour the user expects.
  const firstDay = resolved.days[0];
  let canShareIntroPage = false;
  if (firstDay) {
    const firstDayMinPx =
      estimateStaticDayPx({
        ...firstDay,
        isContinuation: false,
        showDressCodes: true,
        showSummaryTable: true,
      }) +
      DAY_TRAILING_MARGIN_PX +
      (firstDay.detailedActivities[0]
        ? estimateDetailedRowPx(firstDay.detailedActivities[0])
        : 0);
    canShareIntroPage =
      introRemainingPx > 0 && firstDayMinPx <= introRemainingPx;
  }

  // Chunk each day using the correct budget for its very first chunk. When
  // Day 1 shares the intro page, its first chunk gets the remaining space;
  // otherwise every day uses the full page budget for chunking.
  const expandedDays: ProgramOutlineDay[] = [];
  resolved.days.forEach((day, index) => {
    const budget =
      index === 0 && canShareIntroPage ? introRemainingPx : PAGE_BUDGET_PX;
    expandedDays.push(...chunkDayActivities(day, budget));
  });

  const pages: ProgramOutlinePageChunk[] = [];
  let current: ProgramOutlinePageChunk = { showIntro: true, days: [] };
  let usedPx = introPx;

  for (let i = 0; i < expandedDays.length; i++) {
    const day = expandedDays[i];
    const dayPx = estimateDayChunkPx(day);

    // Special case: Day 1's first chunk cannot share the intro page → emit
    // the intro on its own page before any day content.
    if (i === 0 && !canShareIntroPage && current.showIntro) {
      pages.push(current);
      current = { showIntro: false, days: [] };
      usedPx = 0;
    } else if (current.days.length > 0 && usedPx + dayPx > PAGE_BUDGET_PX) {
      pages.push(current);
      current = { showIntro: false, days: [] };
      usedPx = 0;
    }

    current.days.push(day);
    usedPx += dayPx;
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
