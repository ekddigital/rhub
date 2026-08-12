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
  totalFeesRmb: ATTENDANCE_ROWS.reduce(
    (sum, r) => sum + Number.parseFloat(r.fee || "0"),
    0,
  ),
  vipGuests: ATTENDANCE_ROWS.filter((r) => r.room.includes("VIP")).length,
  veteranPlacements: ATTENDANCE_ROWS.filter((r) =>
    r.room.includes("Veteran"),
  ).length,
} as const;

export const FINANCE_SUMMARY = {
  delegateFeesCollected: ATTENDANCE_STATS.totalFeesRmb,
  cookingFundsDisbursed: 18_113.03,
  cookingExpenditure: 17_538.08,
  cookingBalance: 574.95,
} as const;

/** Table of contents — mirrors jinan-2026-conference-report.md section numbering. */
export const REPORT_TOC = [
  { num: 1, title: "Executive Summary" },
  { num: 2, title: "Conference Objectives and Theme" },
  { num: 3, title: "Pre-Conference Preparation" },
  { num: 4, title: "Conference Overview" },
  {
    num: 5,
    title: "Opening Day — Arrival and Meet and Greet",
    subs: ["Plenary Business and Elections (§6)", "Independence Day Ceremonies (§7)", "Closing Day — Departure (§8)"],
  },
  { num: 9, title: "Attendance and Finance Summary" },
  { num: 10, title: "Full Delegate Register" },
  { num: 11, title: "Distinguished Guests and Speakers" },
  { num: 12, title: "Outcomes, Resolutions, and Recommendations" },
  { num: 13, title: "Lessons Learned for Future Conferences" },
  { num: 14, title: "Photographic Record" },
  { num: 15, title: "Acknowledgements" },
  { num: 16, title: "Certification" },
  { num: 17, title: "Appendices" },
] as const;

export const EXECUTIVE_SUMMARY = [
  "The Liberian Student Union in China (LSUIC) successfully convened its 20th Annual Conference & Anniversary at the Arcadia Spa Golf International Hotel in Jinan, Shandong Province, from 24 to 27 July 2026, under the theme Jinan 2026: Legacy and Influence.",
  "Delegates, national officers, conference committee members, veterans, guests, and distinguished representatives gathered for four days of fellowship, plenary business, elections, constitution review, Independence Day observance, sporting activities, and awards recognition.",
  "This unified report records conference attendance, financial reconciliation, program outcomes, photographic evidence, and recommendations for future conferences. Attendance figures are drawn from the official Jinan 2026 registration and fee records; catering expenditure is cross-referenced against the Cooking Committee financial report.",
] as const;

export const CONFERENCE_OBJECTIVES = [
  "Honor twenty years of LSUIC annual conferences, veterans, and institutional memory.",
  "Renew governance through annual reports, elections, resolutions, and constitution review.",
  "Celebrate Liberia's 179th Independence Day with diplomatic engagement and civic ceremony.",
  "Certify newly elected NEC officers in the presence of the Ambassador of Liberia to China.",
  "Recognize achievement through awards for excellence, service, pageantry, and special honor.",
  "Strengthen fellowship and extend influence as delegates return to cities across China.",
] as const;

export const PRE_CONFERENCE = [
  "Months before arrival, the Conference Committee published rhub registration guides, fee-structure flyers, countdown campaigns, online info sessions, and Legacy and Influence theme posters.",
  "Fundraising payment methods, delegate profile cards, badge mockups, Miss LSUIC calls, and merchandise designs were distributed through the rhub asset library.",
  "Standing and ad hoc committees — Cooking, Logistics, Welfare, Protocol, Press & Public Affairs, and IEC — were activated with disbursed allocations and pre-arrival coordination.",
] as const;

export const PROGRAM_NARRATIVE = [
  {
    heading: "Opening Day — 24 July",
    body: "Delegates arrived at the Arcadia Spa Golf International Hotel, completed check-in, and assembled for the Meet and Greet in the hotel yard. Welcome remarks, self-introductions, fellowship games, the Expectation Tree, and signed t-shirt traditions set a tone of unity and expectation.",
  },
  {
    heading: "Plenary Business — 25 July",
    body: "The conference room hosted opening prayer, annual reports, elections, resolutions, and constitution review from 8:30 AM through 2:00 PM. An afternoon rest period and evening pool party balanced governance with community fellowship.",
  },
  {
    heading: "Independence Day and Awards — 26 July",
    body: "Sunday centered on Liberia's Independence Day alongside football, basketball, and team-building sports; the red-carpet formal program; guest orations; NEC annual summary and book launch; induction ceremonies; ambassador statements; cake cutting; dinner; and awards recognition through the early morning.",
  },
  {
    heading: "Closing Day — 27 July",
    body: "Delegates checked out and departed by noon, carrying forward renewed commitments to service, leadership, and influence in their respective cities across China.",
  },
] as const;

export const INDEPENDENCE_DAY_NARRATIVE = [
  "Hon. Joshua Bosco Barvor delivered the Independence Day oration. Hon. Olano Teah Bloh presented the NEC annual summary and book launch — How Far We Have Come.",
  "The IEC certified newly elected NEC officers before H.E. Dudley McKinley Thomas, Ambassador of Liberia to China, who delivered a special statement commending LSUIC's twenty-year record.",
  "Awards Night recognized veterans, Miss LSUIC, achievers, financial supporters, academic excellence, NEC service, and special honorees.",
] as const;

export const DISTINGUISHED_GUESTS = [
  { role: "Ambassador of Liberia to the PRC", name: "H.E. Dudley McKinley Thomas" },
  { role: "Independence Day Orator", name: "Hon. Joshua Bosco Barvor" },
  { role: "Outgoing National President", name: "Hon. Olano Teah Bloh" },
  { role: "Conference Chair", name: "Enoch Kwateh Dongbo" },
  { role: "General Secretary, Conference Committee", name: "Harris M. Bowulo" },
  { role: "Cooking Committee Chair", name: "Kukor Brooks" },
  { role: "Official Photographer", name: "K-Visuals Studio" },
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
    label: "Leadership certified",
    detail:
      "Newly elected NEC officers were inducted before the Ambassador and assembled delegates.",
  },
  {
    label: "Influence extended",
    detail:
      "Delegates from dozens of cities and provinces returned with renewed purpose under the Jinan 2026 theme.",
  },
] as const;

export const RESOLUTIONS_SUMMARY = [
  "Strengthen city chapter coordination and reporting to NEC.",
  "Support academic excellence and welfare programs across provinces.",
  "Institutionalize conference documentation and financial transparency standards.",
  "Endorse incoming NEC leadership and transition protocols.",
] as const;

export const LESSONS_LEARNED = [
  {
    label: "Financial accountability",
    detail:
      "Committee-level itemized reporting (as modeled by the Cooking Committee's RMB 574.95 reconciliation) should be mandatory before adjournment.",
  },
  {
    label: "Pre-conference mobilization",
    detail:
      "Begin themed communications at least sixty days out with rhub registration guides, fee flyers, and info sessions.",
  },
  {
    label: "Program balance",
    detail:
      "Protect half-day informal fellowship blocks adjacent to heavy plenary agendas to prevent governance fatigue.",
  },
  {
    label: "Documentation",
    detail:
      "Enforce descriptive asset filenames and README indexing at ingest time; contract photography for all conference days.",
  },
] as const;

export const REPORT_PHOTOS = [
  {
    src: "/conf/assets/before-after-conf/photos/group-photo-day3-cover.jpg",
    caption: "Official Day 3 group photograph",
  },
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
    src: "/conf/assets/before-after-conf/photos/ambassador-dudley-mckinley-thomas-podium.jpg",
    caption: "Ambassador at formal session",
  },
  {
    src: "/conf/assets/before-after-conf/photos/formal-spoken-word-presentation.jpg",
    caption: "Spoken word presentation",
  },
  {
    src: "/conf/assets/before-after-conf/photos/formal-podium-monthly-city-visits.jpg",
    caption: "Podium address — monthly city visits",
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
    src: "/conf/assets/before-after-conf/photos/banquet-dinner-seated-delegates.jpg",
    caption: "Banquet dinner — seated delegates",
  },
  {
    src: "/conf/assets/before-after-conf/photos/banquet-attendees-formal-session.jpg",
    caption: "Banquet — formal session",
  },
  {
    src: "/conf/assets/before-after-conf/photos/banquet-vip-guest-portrait.jpg",
    caption: "Banquet VIP guest portrait",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-football-kick.jpg",
    caption: "Independence Day sports — football",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-football-match.jpg",
    caption: "Football match in progress",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-football-action-shot.jpg",
    caption: "Football action shot",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-basketball-team-group.jpg",
    caption: "Basketball team group photo",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-basketball-game-action.jpg",
    caption: "Basketball game action",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-multi-legged-race.jpg",
    caption: "Multi-legged race — team building",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-multi-legged-race-team.jpg",
    caption: "Multi-legged race — team coordination",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-tug-of-war.jpg",
    caption: "Tug-of-war team activity",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-handball-throw.jpg",
    caption: "Handball throw",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-spoon-ball-race.jpg",
    caption: "Spoon-and-ball race",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-chopstick-game-team-building.jpg",
    caption: "Chopstick team-building game",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-chopstick-ball-pickup.jpg",
    caption: "Chopstick ball pickup challenge",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-team-huddle-board-game.jpg",
    caption: "Team huddle — floor board game",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-field-group-photo.jpg",
    caption: "Sports field group photo",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-team-bibs-group-photo.jpg",
    caption: "Sports day group photo (yellow bibs)",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-red-bibs-group-photo.jpg",
    caption: "Sports day group photo (red bibs)",
  },
  {
    src: "/conf/assets/before-after-conf/photos/sports-participant-livestreaming.jpg",
    caption: "Participant recording on sports court",
  },
] as const;

/** ~40 rows fill A4 with compact table padding; first page has section title. */
export const ATTENDANCE_ROWS_PER_PAGE = 40;

/** Photos per interior page — 3×3 grid. */
export const PHOTOS_PER_PAGE = 9;

/** Fixed interior pages excluding cover, attendance chunks, and photo chunks. */
export const REPORT_FIXED_PAGES = {
  toc: 1,
  executiveAndObjectives: 1,
  preConferenceAndOverview: 1,
  programAndIndependence: 1,
  financeSummary: 1,
  guestsOutcomes: 1,
  lessonsAndAcknowledgements: 1,
  certification: 1,
} as const;

export function chunkAttendance(rows: AttendanceRow[]): AttendanceRow[][] {
  const chunks: AttendanceRow[][] = [];
  for (let i = 0; i < rows.length; i += ATTENDANCE_ROWS_PER_PAGE) {
    chunks.push(rows.slice(i, i + ATTENDANCE_ROWS_PER_PAGE));
  }
  return chunks;
}

export function chunkReportPhotos(
  photos: readonly (typeof REPORT_PHOTOS)[number][],
): (typeof REPORT_PHOTOS)[number][][] {
  const chunks: (typeof REPORT_PHOTOS)[number][][] = [];
  for (let i = 0; i < photos.length; i += PHOTOS_PER_PAGE) {
    chunks.push(photos.slice(i, i + PHOTOS_PER_PAGE));
  }
  return chunks;
}

export function computeReportTotalPages(): number {
  const attendancePages = chunkAttendance(ATTENDANCE_ROWS).length;
  const photoPages = chunkReportPhotos(REPORT_PHOTOS).length;
  const fixedPages = Object.values(REPORT_FIXED_PAGES).reduce((a, b) => a + b, 0);
  return 1 + fixedPages + attendancePages + photoPages;
}
