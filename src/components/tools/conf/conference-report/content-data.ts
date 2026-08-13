import { CONF_2026 } from "@/lib/conf/config";
import {
  DETAILED_PROGRAM_DAYS,
  PROGRAM_GENERAL_NOTES,
  type ProgramDay,
  type ProgramSlot,
} from "@/components/tools/conf/detailed-program/program-data";
import { bookletProgramDayLabel } from "@/lib/conf/booklet-program-outline";
import {
  loadLsuicLeadersRoster,
  stripHonorificDisplayName,
} from "@/lib/conf/lsuic-leaders-roster";
import attendanceRows from "./attendance.generated.json";
import {
  buildPreConferencePagePlans,
  chunkAttendanceVariable,
  FLYER_LANDSCAPE_ASPECT,
  FLYER_PORTRAIT_ASPECT,
  type FlyerItem,
  type PreConferencePagePlan,
} from "./report-layout";

export const REPORT_PROGRAM_DAYS = DETAILED_PROGRAM_DAYS;
export { PROGRAM_GENERAL_NOTES };

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
  reportDate: "13 August 2026",
  venueAddress: CONF_2026.address,
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
  iecRevenue: 2_365.0,
  iecExpenditure: 948.69,
  iecBalanceTurnover: 1_416.31,
} as const;

export type CommitteeMember = {
  role: string;
  name: string;
  city: string;
};

export const CONFERENCE_COMMITTEE: readonly CommitteeMember[] =
  loadLsuicLeadersRoster()
    .filter((row) => row.committee_short_name === "CC")
    .map((row) => ({
      role: row.leader_role,
      name: stripHonorificDisplayName(row.leader_name.replace(/\*\*/g, "")),
      city: row.leader_city_area,
    }));

export const VENUE_AND_ACCOMMODATION = {
  nameEn: CONF_2026.venue,
  nameZh: CONF_2026.venueCn,
  address: CONF_2026.address,
  location:
    "Qihe County, Dezhou, Shandong Province — approximately 40 km southwest of central Jinan",
  facilities: [
    "Dedicated hotel conference room for plenary sessions, elections, and formal business",
    "Hotel yard and golf course grounds for Day 1 meet-and-greet and fellowship",
    "Indoor pool and spa area for Day 2 pool party",
    "Outdoor sports grounds for Independence Day football, basketball, and team activities",
    "On-site dining areas for Cooking Committee meal service throughout the program",
    "Guest room blocks for single-room, shared-room, and veteran delegate placements",
  ],
  roomCategories: [
    { category: "GS — Single Room", feeRmb: 600, notes: "One delegate per room" },
    {
      category: "Veteran — Single Room",
      feeRmb: 740,
      notes: "Honourary veteran placement",
    },
    {
      category: "GS — Shared Room",
      feeRmb: 250,
      notes: "Two delegates per room (primary registration tier)",
    },
    {
      category: "GS — Shared Room + Guest",
      feeRmb: 750,
      notes: "Delegate with registered guest companion",
    },
    {
      category: "March Intake — Shared Room",
      feeRmb: 330,
      notes: "Reduced rate for March intake delegates",
    },
    {
      category: "GS — No Accommodation",
      feeRmb: 175,
      notes: "Local Jinan-area delegates without hotel room",
    },
  ],
  travelNote:
    "Bus K904 serves the hotel stop until 7:20 PM daily. Delegates arriving after this time should use DiDi or a taxi from Jinan West Railway Station or Jinan East Railway Station.",
} as const;

export const PRE_CONFERENCE_FLYERS: readonly FlyerItem[] = [
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-20th-annual-general-conference.jpg",
    caption: "20th Annual Conference overview poster",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-legacy-and-influence-conference.jpg",
    caption: "Legacy and Influence theme poster",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-what-to-expect-highlights.jpg",
    caption: "Program highlights and delegate expectations",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-delegate-registration-guide.png",
    caption: "Delegate registration guide",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-conference-fees-structure.png",
    caption: "Conference fee tiers and room categories",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-51-days-countdown.png",
    caption: "51-day countdown campaign",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-conference-info-session-online.png",
    caption: "Online pre-conference information session",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-fundraising-campaign-payment-methods.png",
    caption: "Fundraising campaign and payment methods",
    aspectRatio: FLYER_LANDSCAPE_ASPECT,
  },
] as const;

export const ELECTION_SUMMARY = {
  electionDate: "25 July 2026",
  voterStats: {
    platformUsers: 90,
    eligibleVoters: 85,
    inPersonVoters: 56,
    onlineVoters: 29,
    candidatesRegistered: 7,
  },
  outcomes: [
    {
      position: "National President",
      winner: "Moses Kingsford Flomo",
      votes: 58,
    },
    {
      position: "National Vice President",
      winner: "John Tarway Twalla",
      votes: 59,
    },
    {
      position: "Secretary General",
      winner: "Frederick Francis Johnson II",
      votes: 56,
    },
    {
      position: "Deputy Secretary General",
      winner: "Abraham Dixon",
      votes: 57,
    },
    {
      position: "Financial Secretary General",
      winner: "Alfreda R. Togbah",
      votes: 56,
    },
    {
      position: "National Treasurer",
      winner: "Antoinette T. Dickson",
      votes: 57,
    },
    {
      position: "Chaplain General",
      winner: "Laimah A. Dowie",
      votes: 56,
    },
  ],
  highlights: [
    "IEC-2026 introduced the first online voter registration and remote voting platform, enabling 29 online voters to participate alongside 56 in-person voters at the conference.",
    "Candidate debates were held online (20 July) and in person at the conference (25 July) before voting commenced.",
    "Newly elected officers were certified and inducted on Independence Day (26 July) before H.E. Dudley McKinley Thomas, Ambassador of Liberia to China.",
    "IEC financial balance of RMB 1,416.31 was formally turned over to outgoing NEC leadership upon completion of the electoral cycle.",
  ],
} as const;

export const COOKING_BUDGET_CATEGORIES = [
  {
    label: "Food, meat, vegetables, and groceries",
    amount: 8_170.29,
  },
  {
    label: "Seasonings, baking supplies, and condiments",
    amount: 1_414.42,
  },
  {
    label: "Kitchen equipment and supplies",
    amount: 3_274.81,
  },
  {
    label: "Member reimbursements and transfers",
    amount: 3_766.99,
  },
  {
    label: "Transportation",
    amount: 911.57,
  },
] as const;

export const COOKING_REIMBURSEMENTS = [
  { recipient: "Mason", purpose: "Purchase of food items", amount: 2_935.8 },
  { recipient: "Jenneh", purpose: "Dry fish and oil", amount: 940.0 },
  { recipient: "John", purpose: "Gas and cooking tub", amount: 569.24 },
  { recipient: "Albert", purpose: "Beans purchase", amount: 100.0 },
  { recipient: "SF", purpose: "Miscellaneous expenses", amount: 37.0 },
  { recipient: "Kukor", purpose: "Fufu purchase", amount: 700.0 },
] as const;

/** Report section titles for each conference day (§7–§10), aligned with booklet Program Outline. */
export const REPORT_DAY_SECTIONS = [
  { sectionNum: 7, title: bookletProgramDayLabel(1), day: 1 },
  { sectionNum: 8, title: bookletProgramDayLabel(2), day: 2 },
  { sectionNum: 9, title: bookletProgramDayLabel(3), day: 3 },
  { sectionNum: 10, title: bookletProgramDayLabel(4), day: 4 },
] as const;

export type ReportTocEntry = {
  num: number;
  title: string;
  startPage?: number;
  pageSpan?: number;
  isProgramDay?: boolean;
};

const REPORT_TOC_AFTER_DAYS = [
  { num: 11, title: "Election Report Summary" },
  { num: 12, title: "Attendance and Finance Summary" },
  { num: 13, title: "Full Delegate Register" },
  { num: 14, title: "Distinguished Guests and Speakers" },
  { num: 15, title: "Outcomes, Resolutions, and Recommendations" },
  { num: 16, title: "Lessons Learned for Future Conferences" },
  { num: 17, title: "Photographic Record" },
  { num: 18, title: "Acknowledgements" },
  { num: 19, title: "Certification" },
  { num: 20, title: "Appendices" },
] as const;

/** Table of contents — mirrors jinan-2026-conference-report.md; program days match booklet Program Outline. */
export const REPORT_TOC: readonly ReportTocEntry[] = [
  { num: 1, title: "Executive Summary" },
  { num: 2, title: "Conference Objectives and Theme" },
  { num: 3, title: "Pre-Conference Preparation" },
  { num: 4, title: "Venue and Accommodation" },
  { num: 5, title: "Conference Committee" },
  { num: 6, title: "Conference Overview" },
  ...REPORT_DAY_SECTIONS.map(({ sectionNum, title }) => ({
    num: sectionNum,
    title,
    isProgramDay: true,
  })),
  ...REPORT_TOC_AFTER_DAYS,
];

/** Resolve interior start pages for each TOC row (cover = 1, TOC = 2, body from 3). */
export function buildReportTocWithPages(): ReportTocEntry[] {
  const preConferencePages = buildPreConferencePages();
  const programPages = buildReportProgramPages();
  const attendancePages = chunkAttendance(ATTENDANCE_ROWS).length;
  const photoPages = chunkReportPhotos(REPORT_PHOTOS).length;

  let page = 3;
  const executiveStart = page;
  page += REPORT_FIXED_PAGES.executiveAndObjectives;

  const preConferenceStart = page;
  page += preConferencePages.length;

  const venueStart = page++;
  const committeeStart = page++;
  const overviewStart = page++;

  const dayPageInfo = new Map<number, { startPage: number; pageSpan: number }>();
  for (const section of REPORT_DAY_SECTIONS) {
    const pageSpan = programPages.filter(
      (entry) => entry.sectionNum === section.sectionNum,
    ).length;
    dayPageInfo.set(section.sectionNum, { startPage: page, pageSpan });
    page += pageSpan;
  }

  const electionStart = page++;
  const financeStart = page;
  page += REPORT_FIXED_PAGES.financeSummary;
  const registerStart = page;
  page += attendancePages;
  const outcomesStart = page++;
  const lessonsStart = page++;
  const photosStart = page;
  page += photoPages;
  const certificationStart = page;

  return REPORT_TOC.map((entry) => {
    if (entry.isProgramDay) {
      const info = dayPageInfo.get(entry.num);
      return info ? { ...entry, ...info } : entry;
    }

    switch (entry.num) {
      case 1:
      case 2:
        return { ...entry, startPage: executiveStart, pageSpan: 1 };
      case 3:
        return {
          ...entry,
          startPage: preConferenceStart,
          pageSpan: preConferencePages.length,
        };
      case 4:
        return { ...entry, startPage: venueStart, pageSpan: 1 };
      case 5:
        return { ...entry, startPage: committeeStart, pageSpan: 1 };
      case 6:
        return { ...entry, startPage: overviewStart, pageSpan: 1 };
      case 11:
        return { ...entry, startPage: electionStart, pageSpan: 1 };
      case 12:
        return {
          ...entry,
          startPage: financeStart,
          pageSpan: REPORT_FIXED_PAGES.financeSummary,
        };
      case 13:
        return { ...entry, startPage: registerStart, pageSpan: attendancePages };
      case 14:
      case 15:
        return { ...entry, startPage: outcomesStart, pageSpan: 1 };
      case 16:
      case 18:
        return { ...entry, startPage: lessonsStart, pageSpan: 1 };
      case 17:
        return { ...entry, startPage: photosStart, pageSpan: photoPages };
      case 19:
        return { ...entry, startPage: certificationStart, pageSpan: 1 };
      case 20:
        return entry;
      default:
        return entry;
    }
  });
}

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
  "Months before arrival, the Conference Committee published delegate registration guides, fee-structure flyers, countdown campaigns, online information sessions, and Legacy and Influence theme posters across LSUIC communication channels.",
  "Fundraising payment methods, delegate profile cards, badge designs, Miss LSUIC contestant calls, and conference merchandise were distributed to mobilize delegates from more than thirty-five cities.",
  "Standing and ad hoc committees — Cooking, Logistics, Welfare, Protocol, Press & Public Affairs, and the Independent Elections Commission (IEC) — were activated with disbursed allocations and pre-arrival coordination.",
] as const;

export const DISTINGUISHED_GUESTS = [
  { role: "Ambassador of Liberia to the PRC", name: "H.E. Dudley McKinley Thomas" },
  { role: "Independence Day Orator", name: "Hon. Joshua Bosco Barvor" },
  { role: "Outgoing National President", name: "Hon. Olano Teah Bloh" },
  { role: "Incoming National President", name: "Hon. Moses Kingsford Flomo" },
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

/** Photos per interior page — 2×3 grid; row height scales to fill the page. */
export const PHOTOS_PER_PAGE = 6;

export function buildPreConferencePages(): PreConferencePagePlan[] {
  return buildPreConferencePagePlans(PRE_CONFERENCE, PRE_CONFERENCE_FLYERS);
}

const REPORT_PROGRAM_FIRST_PAGE_CAPACITY = 96;
const REPORT_PROGRAM_CONTINUED_PAGE_CAPACITY = 108;

function estimateReportSlotUnits(slot: ProgramSlot): number {
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
}

function splitReportDaySlots(slots: readonly ProgramSlot[]): ProgramSlot[][] {
  const pages: ProgramSlot[][] = [];
  let currentPage: ProgramSlot[] = [];
  let usedUnits = 0;

  for (const slot of slots) {
    const capacity =
      pages.length === 0
        ? REPORT_PROGRAM_FIRST_PAGE_CAPACITY
        : REPORT_PROGRAM_CONTINUED_PAGE_CAPACITY;
    const slotUnits = estimateReportSlotUnits(slot);
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

export type ReportProgramPage = {
  sectionNum: number;
  sectionTitle: string;
  day: ProgramDay;
  slots: ProgramSlot[];
  pageIndex: number;
  pageCount: number;
};

/** One report section (§5–§8) per day; paginate long slot lists within a day. */
export function buildReportProgramPages(
  days: readonly ProgramDay[] = REPORT_PROGRAM_DAYS,
): ReportProgramPage[] {
  const pages: ReportProgramPage[] = [];

  for (const section of REPORT_DAY_SECTIONS) {
    const day = days.find((entry) => entry.day === section.day);
    if (!day) continue;

    const slotPages = splitReportDaySlots(day.slots);
    slotPages.forEach((slots, pageIndex) => {
      pages.push({
        sectionNum: section.sectionNum,
        sectionTitle: section.title,
        day,
        slots,
        pageIndex,
        pageCount: slotPages.length,
      });
    });
  }

  return pages;
}

/** Fixed interior pages excluding cover, attendance chunks, photo chunks, and program chunks. */
export function getReportFixedPageCounts() {
  return {
    toc: 1,
    executiveAndObjectives: 1,
    preConference: buildPreConferencePages().length,
    venueAndAccommodation: 1,
    conferenceCommittee: 1,
    conferenceOverview: 1,
    electionSummary: 1,
    financeSummary: 2,
    guestsOutcomes: 1,
    lessonsAndAcknowledgements: 1,
    certification: 1,
  } as const;
}

export const REPORT_FIXED_PAGES = getReportFixedPageCounts();

export function chunkAttendance(rows: AttendanceRow[]): AttendanceRow[][] {
  return chunkAttendanceVariable(rows);
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
  const programPages = buildReportProgramPages(REPORT_PROGRAM_DAYS).length;
  const fixedPages = Object.values(REPORT_FIXED_PAGES).reduce((a, b) => a + b, 0);
  return 1 + fixedPages + programPages + attendancePages + photoPages;
}
