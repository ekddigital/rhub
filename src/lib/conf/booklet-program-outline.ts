import type { BookletSection } from "@/components/tools/conf/booklet/types";

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

const DEFAULT_WELCOME_TITLE = "Welcome to Jinan";

const DEFAULT_INTRO = [
  "As delegates of the Liberian Student Union in China, we gather in Jinan for our 20th Annual Conference — a milestone that celebrates unity, leadership, and the enduring bonds of our community across China.",
  "From July 24–27, 2026, we will meet at the Arcadia Spa Golf International Hotel in Qihe County. The program below balances conference business, fellowship, recreation, and celebration. Please arrive on time for each activity and consult the Navigation Guide in this booklet for travel directions to the venue.",
].join("\n\n");

/** Jinan 2026 conference program — public booklet schedule. */
export const JINAN_2026_PROGRAM_DAYS: ProgramOutlineDay[] = [
  {
    dayNumber: 1,
    label: "Day 1 — Arrival & Meet and Greet",
    dateLabel: "Friday, 24 July 2026",
    activities: [
      {
        time: "Before 11:00",
        activity: "Arrival, hotel check-in, and rest",
        location: "Arcadia Spa Golf International Hotel",
      },
      {
        time: "5:00 PM",
        activity:
          "Meet and Greet — welcome remarks, self-introductions, and conference overview",
        location: "Hotel yard (near the golf course)",
      },
    ],
  },
  {
    dayNumber: 2,
    label: "Day 2 — Conference & Recreation",
    dateLabel: "Saturday, 25 July 2026",
    activities: [
      {
        time: "Morning",
        activity: "Conference room sessions",
        location: "Hotel conference room",
      },
      {
        time: "Afternoon",
        activity: "Swimming and leisure",
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
        time: "Morning",
        activity: "Conference room sessions",
        location: "Hotel conference room",
      },
      {
        time: "Afternoon",
        activity: "Football",
        location: "Hotel sports grounds",
      },
      {
        time: "Evening",
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
        time: "By 12:00 noon",
        activity: "Check-out and departure from the hotel",
        location: "Hotel reception",
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
  const welcomeTitle =
    trimContent(section.subtitle) || DEFAULT_WELCOME_TITLE;

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

export function programOutlinePageCount(section: BookletSection): number {
  const resolved = resolveProgramOutline(section);
  if (!resolved) return 0;
  return paginateProgramOutlineDays(resolved.days).length;
}
