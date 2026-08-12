import { CONF_2026 } from "@/lib/conf/config";
import attendanceRows from "./attendance.generated.json";

export const REPORT_META = {
  title: "Conference Report",
  bookletTitle: "20th Annual Conference & Anniversary",
  confName: CONF_2026.name,
  confYear: CONF_2026.year,
  theme: CONF_2026.theme,
  subTheme: CONF_2026.subTheme,
  dates: "July 24–27, 2026",
  venueEn: CONF_2026.venue,
  venueZh: CONF_2026.venueCn,
  city: `${CONF_2026.city}, ${CONF_2026.province}`,
  coverPhoto:
    "/conf/assets/before-after-conf/photos/group-photo-day3-cover.jpg",
  coverPhotoCredit:
    "Cover photo: K-VISUALS / Pixieset gallery — official delegate group photograph",
  pixiesetUrl:
    "https://k-visualsstudio.pixieset.com/lsuicjinan2026legacyandinfluenceday3/",
  markdownPath: "/conf/reports/jinan-2026-conference-report.md",
} as const;

export type AttendanceRow = {
  no: string;
  name: string;
  city: string;
  room: string;
  fee: string;
  paid: string;
  balance: string;
};

export const ATTENDANCE_ROWS = attendanceRows as AttendanceRow[];

export const ATTENDANCE_STATS = {
  totalRegistered: ATTENDANCE_ROWS.length,
  uniqueCities: new Set(
    ATTENDANCE_ROWS.map((r) => r.city).filter(Boolean),
  ).size,
  fullyPaid: ATTENDANCE_ROWS.filter((r) => r.balance === "0").length,
  vipGuests: ATTENDANCE_ROWS.filter((r) => r.room.includes("VIP")).length,
  veteranPlacements: ATTENDANCE_ROWS.filter((r) =>
    r.room.includes("Veteran"),
  ).length,
} as const;

export const EXECUTIVE_SUMMARY = [
  "The Liberian Student Union in China (LSUIC) successfully convened its 20th Annual Conference & Anniversary at the Arcadia Spa Golf International Hotel in Jinan, Shandong Province, from 24 to 27 July 2026, under the theme Jinan 2026: Legacy and Influence.",
  "Delegates, national officers, conference committee members, veterans, guests, and distinguished representatives gathered for four days of fellowship, plenary business, elections, constitution review, Independence Day observance, sporting activities, and awards recognition.",
  "This report records conference attendance, summarizes the program and outcomes, and documents the legacy and influence theme that guided the assembly. Attendance figures are drawn from the official conference registration and fee records maintained by the Conference Committee.",
] as const;

export const PROGRAM_NARRATIVE = [
  {
    heading: "Opening and Fellowship — 24 July",
    body: "Delegates arrived at the Arcadia Spa Golf International Hotel, completed check-in, and assembled for the Meet and Greet in the hotel yard. Welcome remarks from the Conference Committee, self-introductions, and an overview of the conference set a tone of unity and expectation. Fellowship activities, shared meals, and the expectation tree encouraged delegates to articulate and track their hopes for the week.",
  },
  {
    heading: "Plenary Business and Elections — 25 July",
    body: "The conference room hosted the formal opening prayer, call to order, annual reports, elections, resolutions, and constitution review from morning through early afternoon. Delegates engaged in the core governance work of the union before an afternoon rest period and evening pool party that balanced business with community fellowship.",
  },
  {
    heading: "Independence Day, Sports, and Awards — 26 July",
    body: "Sunday centered on Liberia's Independence Day observance alongside sporting activities and the awards night program. Football on the hotel sports grounds, the red-carpet Independence Day opening, guest orations, NEC annual summary and book launch, induction ceremonies, ambassador statements, cake cutting, dinner, and awards recognition formed the ceremonial heart of the conference.",
  },
  {
    heading: "Departure — 27 July",
    body: "Delegates checked out and departed by noon, carrying forward renewed commitments to service, leadership, and influence in their respective cities across China.",
  },
] as const;

export const OUTCOMES = [
  {
    label: "Legacy honored",
    detail:
      "Veterans, past leaders, and the history of two decades of annual conferences were recognized throughout the program.",
  },
  {
    label: "Governance renewed",
    detail:
      "Elections, resolutions, and constitution review strengthened institutional accountability.",
  },
  {
    label: "Influence extended",
    detail:
      "Delegates from dozens of cities and provinces returned to their communities with renewed purpose under the Jinan 2026 theme.",
  },
  {
    label: "Fellowship deepened",
    detail:
      "Meet-and-greet, pool party, sports, Independence Day celebrations, and awards night strengthened bonds across the Liberian student community in China.",
  },
] as const;

export const REPORT_PHOTOS = [
  {
    src: "/conf/assets/before-after-conf/photos/independence-cake-cutting-ceremony.jpg",
    caption: "Independence cake-cutting ceremony",
  },
  {
    src: "/conf/assets/before-after-conf/photos/independence-day-oration-podium.jpg",
    caption: "Independence Day oration",
  },
  {
    src: "/conf/assets/before-after-conf/photos/inaugural-address-new-president.jpg",
    caption: "Inaugural address — new national president",
  },
  {
    src: "/conf/assets/before-after-conf/photos/ambassador-welcome-flower-presentation.jpg",
    caption: "Ambassador welcome — flower presentation",
  },
  {
    src: "/conf/assets/before-after-conf/photos/miss-lsuic-pageant-winners.jpg",
    caption: "Miss LSUIC pageant",
  },
  {
    src: "/conf/assets/before-after-conf/photos/awards-night-delegate-speech.jpg",
    caption: "Awards Night — delegate speech",
  },
  {
    src: "/conf/assets/before-after-conf/photos/banquet-delegates-applause.jpg",
    caption: "Banquet — delegates applauding",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-football-kick.jpg",
    caption: "Independence Day sports — football",
  },
] as const;

export const ATTENDANCE_ROWS_PER_PAGE = 22;

export function chunkAttendance(rows: AttendanceRow[]): AttendanceRow[][] {
  const chunks: AttendanceRow[][] = [];
  for (let i = 0; i < rows.length; i += ATTENDANCE_ROWS_PER_PAGE) {
    chunks.push(rows.slice(i, i + ATTENDANCE_ROWS_PER_PAGE));
  }
  return chunks;
}

/** Attendance pages + fixed content pages (cover, summary×2, outcomes, photos, certification). */
export function computeReportTotalPages(): number {
  const attendancePages = chunkAttendance(ATTENDANCE_ROWS).length;
  const photoPages = Math.ceil(REPORT_PHOTOS.length / 4);
  return 1 + 2 + attendancePages + 1 + photoPages + 1;
}
