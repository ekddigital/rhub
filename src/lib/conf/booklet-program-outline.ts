import type { BookletSection } from "@/components/tools/conf/booklet/types";
import { DEFAULT_PROGRAM_OUTLINE_INTRO } from "@/lib/conf/booklet-conference-copy";

export type ProgramOutlineActivity = {
  time: string;
  activity: string;
  location: string;
};

export type ProgramOutlineDay = {
  dayNumber: number;
  label: string;
  dateLabel: string;
  activities: ProgramOutlineActivity[];
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

/** Jinan 2026 conference program — public booklet schedule. */
export const JINAN_2026_PROGRAM_DAYS: ProgramOutlineDay[] = [
  {
    dayNumber: 1,
    label: "Day 1 — Arrival & Meet and Greet",
    dateLabel: "Friday, 24 July 2026",
    activities: [
      {
        time: "8:00 AM - 2:00 PM",
        activity:
          "Arrival, registration desk check-in, room assignment, and welfare support",
        location: "Arcadia Spa Golf International Hotel",
      },
      {
        time: "2:00 PM - 4:30 PM",
        activity:
          "Rest window, city arrivals follow-up, and late delegate reception",
        location: "Hotel / logistics desk",
      },
      {
        time: "5:00 PM - 6:30 PM",
        activity:
          "Meet and Greet — welcome remarks, self-introductions, and conference overview",
        location: "Hotel yard (near the golf course)",
      },
      {
        time: "7:00 PM - 9:00 PM",
        activity:
          "Welcome dinner and fellowship briefing for Day 2 business sessions",
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
        time: "8:30 AM - 9:00 AM",
        activity: "Opening prayer, call to order, and adoption of conference agenda",
        location: "Hotel conference room",
      },
      {
        time: "9:00 AM - 12:00 PM",
        activity:
          "Committee and NEC reports, floor interventions, and strategic resolutions",
        location: "Hotel conference room",
      },
      {
        time: "12:00 PM - 1:00 PM",
        activity: "Lunch break",
        location: "Hotel restaurant",
      },
      {
        time: "1:00 PM - 2:00 PM",
        activity:
          "Elections, constitutional business, motions, and formal conference decisions",
        location: "Hotel conference room",
      },
      {
        time: "2:00 PM - 4:00 PM",
        activity: "Rest — delegates may relax at the hotel",
        location: "Hotel / personal time",
      },
      {
        time: "4:00 PM - 6:00 PM",
        activity: "Pool party and swimming",
        location: "Hotel pool / spa area",
      },
      {
        time: "7:00 PM - 9:00 PM",
        activity: "Evening fellowship and city/province caucus check-ins",
        location: "Hotel open space",
      },
    ],
  },
  {
    dayNumber: 3,
    label: "Day 3 — Conference, Sports & Evening Party",
    dateLabel: "Sunday, 26 July 2026",
    activities: [
      {
        time: "8:30 AM - 10:30 AM",
        activity:
          "Conference continuation, invited remarks, and credentialing / certification segments",
        location: "Hotel conference room",
      },
      {
        time: "10:30 AM - 12:00 PM",
        activity:
          "Independence Day oration, inaugural address segment, and formal acknowledgments",
        location: "Hotel conference room",
      },
      {
        time: "12:00 PM - 1:30 PM",
        activity: "Lunch and group photos",
        location: "Hotel / designated photo point",
      },
      {
        time: "2:00 PM - 5:30 PM",
        activity: "Football",
        location: "Hotel sports grounds",
      },
      {
        time: "7:00 PM - 10:00 PM",
        activity: "Conference evening party",
        location: "Hotel venue (to be announced)",
      },
    ],
  },
  {
    dayNumber: 4,
    label: "Day 4 — Departure",
    dateLabel: "Monday, 27 July 2026",
    activities: [
      {
        time: "6:30 AM - 8:30 AM",
        activity: "Breakfast, room checks, and baggage coordination",
        location: "Hotel / room floors",
      },
      {
        time: "8:30 AM - 12:00 noon",
        activity: "Check-out and departure from the hotel",
        location: "Hotel reception",
      },
      {
        time: "After 12:00 noon",
        activity: "Delegates in transit and city follow-up confirmations",
        location: "Railway stations / travel routes",
      },
    ],
  },
];

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

function estimateIntroHeight(intro: string): number {
  const charsPerLine = 102;
  const lineHeight = 26;
  const lines = Math.max(2, Math.ceil(intro.length / charsPerLine));
  return lines * lineHeight + 170;
}

function estimateDayTableHeight(day: ProgramOutlineDay): number {
  const heading = 62;
  const tableHeader = 40;
  const lineHeight = 18;

  const rowHeight = day.activities.reduce((sum, row) => {
    const timeLines = Math.max(1, Math.ceil(row.time.length / 20));
    const activityLines = Math.max(1, Math.ceil(row.activity.length / 52));
    const locationLines = Math.max(1, Math.ceil(row.location.length / 34));
    const lines = Math.max(timeLines, activityLines, locationLines);
    return sum + lines * lineHeight + 16;
  }, 0);

  return heading + tableHeader + rowHeight + 14;
}

/**
 * Program Outline pages are packed by estimated vertical height so rows do not
 * clip at the bottom of the page when day tables get longer.
 */
export function paginateProgramOutlinePages(
  resolved: ResolvedProgramOutline,
): ProgramOutlinePageChunk[] {
  const MAX_PAGE_HEIGHT = 920;

  const pages: ProgramOutlinePageChunk[] = [];
  let current: ProgramOutlinePageChunk = { showIntro: true, days: [] };
  let used = estimateIntroHeight(resolved.intro);

  for (const day of resolved.days) {
    const dayHeight = estimateDayTableHeight(day);
    if (current.days.length > 0 && used + dayHeight > MAX_PAGE_HEIGHT) {
      pages.push(current);
      current = { showIntro: false, days: [] };
      used = 0;
    }

    current.days.push(day);
    used += dayHeight;
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
