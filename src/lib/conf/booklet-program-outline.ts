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

export function programOutlinePageCount(section: BookletSection): number {
  const resolved = resolveProgramOutline(section);
  if (!resolved) return 0;
  return paginateProgramOutlineDays(resolved.days).length;
}
