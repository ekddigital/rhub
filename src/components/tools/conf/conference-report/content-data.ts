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
import {
  buildCookingAppendixPages,
  buildCookingBudgetCategories,
  COOKING_CERTIFICATION,
  COOKING_COMMITTEE_NARRATIVE,
  COOKING_EQUIPMENT,
  COOKING_FOOD_ITEMS,
  COOKING_SEASONINGS,
  COOKING_TRANSFERS,
  COOKING_TRANSPORTATION,
  computeCookingBalance,
  computeCookingExpenditure,
  COOKING_FUNDS_DISBURSED,
  type CookingAppendixPagePlan,
} from "@/lib/conf/cooking-report-data";
import {
  countReportBookletPages,
  countReportReceiptAppendixPages,
  countReportRoomPairingPages,
} from "@/lib/conf/conference-report/connectors";
import { buildStaticReportBookletContent } from "@/lib/conf/conference-report/connectors/booklet";
import type { ReportRuntimeContext } from "@/lib/conf/conference-report/report-runtime";
import {
  REPORT_PROGRAM_PAGINATION,
  splitProgramDaySlots,
} from "@/lib/conf/detailed-program-pagination";
import attendanceRows from "./attendance.generated.json";
import {
  buildPreConferencePagePlans,
  chunkAttendanceVariable,
  FLYER_LANDSCAPE_ASPECT,
  FLYER_PORTRAIT_ASPECT,
  type FlyerItem,
  type PreConferencePagePlan,
} from "./report-layout";

export {
  buildCookingAppendixPages,
  COOKING_COMMITTEE_NARRATIVE,
  COOKING_EQUIPMENT,
  COOKING_FOOD_ITEMS,
  COOKING_SEASONINGS,
  COOKING_TRANSFERS,
  COOKING_TRANSPORTATION,
  COOKING_CERTIFICATION,
  type CookingAppendixPagePlan,
};

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
  cookingFundsDisbursed: COOKING_FUNDS_DISBURSED,
  cookingExpenditure: computeCookingExpenditure(),
  cookingBalance: computeCookingBalance(),
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

export type ReportImageItem = {
  src: string;
  caption: string;
};

/** Arcadia Spa Golf International Hotel — static venue photos for §4. */
export const VENUE_HOTEL_PHOTOS: readonly ReportImageItem[] = [
  {
    src: "/conf/assets/hotel/main_entrance_view.png",
    caption: "Hotel main entrance and driveway",
  },
  {
    src: "/conf/assets/hotel/receptionist_desk.png",
    caption: "Reception desk and lobby",
  },
  {
    src: "/conf/assets/hotel/evening_view.jpg",
    caption: "Hotel exterior — evening view",
  },
  {
    src: "/conf/assets/hotel/evening_view0.jpg",
    caption: "Hotel grounds — evening view",
  },
  {
    src: "/conf/assets/hotel/conference_hall.jpg",
    caption: "Conference hall — plenary seating",
  },
  {
    src: "/conf/assets/hotel/f1a226969ddcd8e6e824f844c27bde80.jpg",
    caption: "Conference hall — alternate setup",
  },
  {
    src: "/conf/assets/hotel/dinning_hall.jpg",
    caption: "Dining hall — main room",
  },
  {
    src: "/conf/assets/hotel/dinner_hall0.jpg",
    caption: "Dining hall — banquet seating",
  },
  {
    src: "/conf/assets/hotel/dinner_hall1.png",
    caption: "Dining hall — interior",
  },
  {
    src: "/conf/assets/hotel/dinner_hall2.jpg",
    caption: "Dining hall — service area",
  },
  {
    src: "/conf/assets/hotel/dinning_hall3.jpg",
    caption: "Dining hall — additional seating",
  },
  {
    src: "/conf/assets/hotel/dinning_hall5.jpg",
    caption: "Dining hall — interior view",
  },
  {
    src: "/conf/assets/hotel/dinning_hall6.jpg",
    caption: "Dining hall — seating layout",
  },
  {
    src: "/conf/assets/hotel/dinning_hall7.png",
    caption: "Dining hall — banquet setup",
  },
  {
    src: "/conf/assets/hotel/swimming_pool_at_night.png",
    caption: "Indoor pool and spa area",
  },
  {
    src: "/conf/assets/hotel/gymn.png",
    caption: "Fitness center",
  },
  {
    src: "/conf/assets/hotel/play_ground.png",
    caption: "Outdoor sports grounds",
  },
  {
    src: "/conf/assets/hotel/single_bed.png",
    caption: "Guest room — single bed",
  },
  {
    src: "/conf/assets/hotel/double_bed.png",
    caption: "Guest room — twin beds",
  },
] as const;

export const PRE_CONFERENCE_FLYERS: readonly FlyerItem[] = [
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-20th-annual-general-conference.jpg",
    caption: "20th Annual Conference overview poster",
    aspectRatio: FLYER_PORTRAIT_ASPECT,
  },
  {
    src: "/conf/assets/before-after-conf/flyers/flyer-what-to-expect-highlights.jpg",
    caption: "Legacy and Influence theme poster",
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
    caption: "Conference countdown campaign flyer",
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
  certificationDate: "26 July 2026",
  reportSubmittedDate: "28 July 2026",
  voterStats: {
    platformUsers: 90,
    eligibleVoters: 85,
    inPersonVoters: 56,
    onlineVoters: 29,
    candidatesRegistered: 7,
  },
  /** Highest and lowest vote tallies across NEC positions (IEC certified results). */
  voteTallyRange: { min: 56, max: 59 },
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
    "Seven candidates were verified for NEC positions; no provincial or city nominations were received at the national level.",
  ],
} as const;

export const IEC_COMMISSIONERS = [
  { name: "Aaron S. Pittman", role: "Chairman", city: "Guangzhou" },
  { name: "Daniel Karlay Hinneh", role: "Co-Chairman", city: "Suzhou" },
  { name: "Jefferson D. Kanneh", role: "Secretary", city: "Xinxiang" },
  { name: "Zack Tito Tweh", role: "PRO & Ex-Official", city: "Shenzhen" },
  { name: "Olive Kulah Kamara", role: "Member", city: "Guiyang" },
  { name: "Linus Burke Snyder", role: "Member", city: "Qingdao" },
  { name: "Amos Jusu Swaray", role: "Member", city: "Chengdu" },
] as const;

export const IEC_ELECTORAL_INITIATIVES = [
  "Digital registration — Online candidate and voter registration platform deployed for the 2026 cycle.",
  "Voter education — Online civic education session held 17 July 2026.",
  "Candidate debates — Online debate (20 July) and in-person manifesto presentations at the conference (25 July).",
  "Hybrid voting — First LSUIC election combining in-person (56) and online (29) ballot casting on 25 July 2026.",
  "Provincial observers — IEC received observer invitations from election committees in Zhejiang, Wuhan, and Beijing.",
] as const;

/** Participation metrics derived from IEC-2026 certified voter and results data. */
export function getIecParticipationMetrics() {
  const { eligibleVoters, inPersonVoters, onlineVoters } =
    ELECTION_SUMMARY.voterStats;
  const { min, max } = ELECTION_SUMMARY.voteTallyRange;
  const turnoutPctMax = Math.round((max / eligibleVoters) * 1000) / 10;
  const turnoutPctMin = Math.round((min / eligibleVoters) * 1000) / 10;
  const inPersonShare = Math.round((inPersonVoters / eligibleVoters) * 1000) / 10;
  const onlineShare = Math.round((onlineVoters / eligibleVoters) * 1000) / 10;

  return {
    turnoutPctMin,
    turnoutPctMax,
    inPersonShare,
    onlineShare,
  } as const;
}

export const COOKING_BUDGET_CATEGORIES = buildCookingBudgetCategories();

export const COOKING_REIMBURSEMENTS = COOKING_TRANSFERS;

export const IEC_EXPENDITURE_ITEMS = [
  {
    description: "Candidate and voter registration platform development",
    amount: 500.0,
  },
  {
    description: "Preparation of candidates' certificates",
    amount: 245.0,
  },
  {
    description: "Printing of ballot papers and transportation",
    amount: 203.69,
  },
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
  id?: string;
  startPage?: number;
  pageSpan?: number;
  isProgramDay?: boolean;
  isBookletEmbed?: boolean;
};

const REPORT_TOC_AFTER_DAYS = [
  { num: 11, title: "Election Report Summary" },
  { num: 12, title: "Attendance and Finance Summary" },
  { num: 13, title: "Full Delegate Register" },
  { num: 14, title: "Distinguished Guests and Speakers" },
  { num: 15, title: "Outcomes, Resolutions, and Recommendations" },
  { num: 16, title: "Challenges Faced During the Conference" },
  { num: 17, title: "EKD Digital Resources — Conference Management Platform" },
  { num: 18, title: "Lessons Learned for Future Conferences" },
  { num: 19, title: "Advisories and Recommendations for Future Conferences" },
  { num: 20, title: "Photographic Record" },
  { num: 21, title: "Acknowledgements" },
  { num: 22, title: "Certification" },
  { num: 23, title: "Appendices" },
] as const;

/** Table of contents — mirrors jinan-2026-conference-report.md; program days match booklet Program Outline. */
export const REPORT_TOC: readonly ReportTocEntry[] = [
  { num: 1, title: "Executive Summary" },
  { num: 2, title: "Conference Objectives and Theme" },
  { num: 3, title: "Pre-Conference Preparation" },
  { num: 4, title: "Venue and Accommodation" },
  { num: 5, title: "Conference Committee", id: "committee" },
  { num: 6, title: "Conference Overview", id: "overview" },
  {
    num: 6,
    title: "Conference Booklet — Introduction & Program Outline",
    id: "booklet-embed",
    isBookletEmbed: true,
  },
  ...REPORT_DAY_SECTIONS.map(({ sectionNum, title }) => ({
    num: sectionNum,
    title,
    isProgramDay: true,
  })),
  ...REPORT_TOC_AFTER_DAYS,
];

/** Resolve interior start pages for each TOC row (cover = 1, TOC = 2, body from 3). */
export function buildReportTocWithPages(runtime?: ReportRuntimeContext): ReportTocEntry[] {
  const attendanceRows = runtime?.attendanceRows ?? ATTENDANCE_ROWS;
  const preConferencePages = buildPreConferencePages();
  const programPages = buildReportProgramPages();
  const attendancePages = chunkAttendance(attendanceRows).length;
  const roomPairingPages = runtime
    ? countReportRoomPairingPages(runtime.roomPairings)
    : 0;
  const photoPages = chunkReportPhotos(REPORT_PHOTOS).length;
  const fixed = getReportFixedPageCounts(runtime);
  const appendixPages =
    fixed.cookingAppendix + fixed.receiptAppendix + fixed.iecAppendix;

  let page = 3;
  const executiveStart = page;
  page += REPORT_FIXED_PAGES.executiveAndObjectives;

  const preConferenceStart = page;
  page += preConferencePages.length;

  const venuePageCount = buildVenueAndAccommodationPageCount();
  const venueStart = page;
  page += venuePageCount;
  const committeeAndOverviewStart = page++;
  const bookletStart = page;
  const bookletPages = runtime?.bookletPages.length ?? countReportBookletPages(
    runtime?.booklet ?? buildStaticReportBookletContent(),
  );
  page += bookletPages;

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
  page += fixed.financeSummary;
  const registerStart = page;
  page += attendancePages + roomPairingPages;
  const guestsStart = page;
  page += fixed.keynoteCertificate;
  const outcomesStart = page++;
  const challengesStart = page++;
  const rhubStart = page++;
  const lessonsAdvisoriesStart = page++;
  const acknowledgementsStart = page++;
  const photosStart = page;
  page += photoPages;
  const certificationStart = page;
  page += fixed.certification;
  const appendixStart = page;

  return REPORT_TOC.map((entry) => {
    if (entry.isBookletEmbed) {
      return { ...entry, startPage: bookletStart, pageSpan: bookletPages };
    }

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
        return { ...entry, startPage: venueStart, pageSpan: venuePageCount };
      case 5:
        return { ...entry, startPage: committeeAndOverviewStart, pageSpan: 1 };
      case 6:
        if (entry.id === "overview") {
          return { ...entry, startPage: committeeAndOverviewStart, pageSpan: 1 };
        }
        return entry;
      case 11:
        return { ...entry, startPage: electionStart, pageSpan: 1 };
      case 12:
        return {
          ...entry,
          startPage: financeStart,
          pageSpan: fixed.financeSummary,
        };
      case 13:
        return {
          ...entry,
          startPage: registerStart,
          pageSpan: attendancePages + roomPairingPages,
        };
      case 14:
        return {
          ...entry,
          startPage: guestsStart,
          pageSpan: 1 + fixed.keynoteCertificate,
        };
      case 15:
        return { ...entry, startPage: outcomesStart, pageSpan: 1 };
      case 16:
        return { ...entry, startPage: challengesStart, pageSpan: 1 };
      case 17:
        return { ...entry, startPage: rhubStart, pageSpan: 1 };
      case 18:
      case 19:
        return { ...entry, startPage: lessonsAdvisoriesStart, pageSpan: 1 };
      case 20:
        return { ...entry, startPage: photosStart, pageSpan: photoPages };
      case 21:
        return { ...entry, startPage: acknowledgementsStart, pageSpan: 1 };
      case 22:
        return { ...entry, startPage: certificationStart, pageSpan: 1 };
      case 23:
        return {
          ...entry,
          startPage: appendixStart,
          pageSpan: appendixPages,
        };
      default:
        return entry;
    }
  });
}

export const EXECUTIVE_SUMMARY = [
  "The Liberian Student Union in China (LSUIC) successfully convened its 20th Annual Conference & Anniversary at the Arcadia Spa Golf International Hotel in Jinan, Shandong Province, from 24 to 27 July 2026, under the theme Jinan 2026: Legacy and Influence.",
  "Delegates, national officers, conference committee members, veterans, guests, and distinguished representatives gathered for four days of fellowship, plenary business, elections, constitution review, Independence Day observance, sporting activities, and awards recognition. The assembly marked two decades of uninterrupted annual conferences.",
  "This unified report records conference attendance, financial reconciliation, program outcomes, operational challenges, platform support, photographic evidence, and recommendations for future conferences. Attendance figures are drawn from the official Jinan 2026 registration and fee records; catering expenditure is cross-referenced against the Cooking Committee financial report (Appendix A).",
  "A total of 109 registered delegate and guest records represent Liberian students and guests from more than 35 cities across China. All listed conference fees were fully collected (RMB 34,640 in delegate registrations), demonstrating strong financial compliance and delegate commitment.",
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
      "Veterans, past leaders, and twenty years of annual conferences were recognized throughout the program, including the NEC book launch.",
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
    label: "Nationhood celebrated",
    detail:
      "Liberia's 179th Independence Day was observed with oration, rally, and cake-cutting ceremony.",
  },
  {
    label: "Achievement recognized",
    detail:
      "Awards Night honored academic excellence, service, financial supporters, Miss LSUIC, and special honorees.",
  },
  {
    label: "Fellowship deepened",
    detail:
      "Meet-and-greet, pool party, sports, shared meals, and awards night strengthened bonds across the Liberian student community in China.",
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
      "Begin themed communications at least sixty days out with delegate registration guides, fee flyers, and info sessions.",
  },
  {
    label: "Program balance",
    detail:
      "Protect half-day informal fellowship blocks adjacent to heavy plenary agendas to prevent governance fatigue.",
  },
  {
    label: "Ceremonial scheduling",
    detail:
      "Confirm diplomatic schedules before publishing final Day 3 timetables; build buffer time between red carpet, oration, induction, and awards night.",
  },
  {
    label: "Documentation",
    detail:
      "Enforce descriptive asset filenames and README indexing at ingest time; contract photography for all conference days.",
  },
  {
    label: "Catering on sports day",
    detail:
      "Serving Pepper Kala at the sports grounds at 1:30 PM kept delegates engaged through the Independence Day morning program — coordinate meal timing with outdoor schedules.",
  },
] as const;

export const CONFERENCE_CHALLENGES = [
  {
    label: "Delegate travel and arrival coordination",
    detail:
      "Delegates arrived from more than 35 cities. The hotel's Bus K904 stop ends service at 7:20 PM daily, requiring DiDi or taxi arrangements from Jinan West and Jinan East Railway Stations for late arrivals.",
  },
  {
    label: "Remote venue logistics",
    detail:
      "The Arcadia Spa Golf International Hotel sits approximately 40 km southwest of central Jinan. Cooking Committee transportation expenses (RMB 911.57) and coordinated bus movement were essential to keep delegates on schedule.",
  },
  {
    label: "Cooking Committee procurement and meal timing",
    detail:
      "The Committee managed 34 food line items, six member reimbursements, and same-day service for plenary sessions, pool party, sports-day Pepper Kala, and the awards night banquet — all within a RMB 18,113.03 allocation.",
  },
  {
    label: "Registration and payment reconciliation",
    detail:
      "109 delegate and guest records across single-room, shared-room, veteran, March intake, and no-accommodation tiers required continuous fee tracking. All listed fees were collected (RMB 34,640), but reconciliation demanded disciplined record-keeping throughout the cycle.",
  },
  {
    label: "Hybrid election administration",
    detail:
      "IEC-2026 introduced the union's first online voter registration and remote voting platform. Of 90 platform users, 85 were confirmed eligible — 56 voting in person at Jinan and 29 online — requiring parallel technical and procedural oversight on election day.",
  },
  {
    label: "Independence Day program density",
    detail:
      "Day 3 combined sports, formal Independence Day ceremonies, ambassador engagement, NEC induction, and an awards night program running from 8:30 PM through the early morning — demanding tight transitions between outdoor and indoor venues.",
  },
  {
    label: "Post-conference documentation deadlines",
    detail:
      "Committee financial certification (Cooking Committee, 1 August 2026), IEC election report submission (28 July 2026), and this unified report required coordinated documentation under the Conference Committee's thirty-day reporting standard.",
  },
] as const;

export const RHUB_PLATFORM_LINKS = [
  {
    label: "Conference Hub (main platform)",
    url: "https://rhub.ekddigital.com/tools/conf",
    description:
      "Central dashboard for delegates, committees, finance, and conference tools",
  },
  {
    label: "Platform account registration",
    url: "https://rhub.ekddigital.com/register",
    description:
      "Create a rhub member account on the Resource Hub (distinct from delegate conference registration)",
  },
  {
    label: "Platform login",
    url: "https://rhub.ekddigital.com/login",
    description:
      "Member sign-in for delegate profiles, committee tools, and IEC voting",
  },
  {
    label: "Delegate registration portal",
    url: "https://rhub.ekddigital.com/tools/conf/delegates/register",
    description:
      "Conference delegate registration with document uploads and payment declaration",
  },
] as const;

export const RHUB_PLATFORM = {
  intro: [
    "The EKD Digital Resource Hub (rhub) — developed and operated by EKD Digital — served as the integrated conference management platform for LSUIC Jinan 2026. From pre-conference mobilization through post-conference reporting, the Conference Hub at rhub.ekddigital.com provided a single operational environment for delegate data, finance, communications, and program documentation.",
    "Conference leadership used rhub to reduce manual coordination across committees and to preserve auditable records aligned with LSUIC financial transparency standards. The platform supported both on-site Jinan operations and remote participation — notably IEC-2026 online voter registration and remote voting.",
  ],
  platformAccessIntro:
    "Delegates, committee members, and election participants accessed rhub through the following entry points throughout the conference cycle:",
  capabilities: [
    "Public delegate registration portal with document uploads and payment declaration",
    "Delegate profiles, room assignments, and fee tracking for 109 registered records",
    "Conference finance, payments, budget, and audit modules for committee disbursements",
    "Booklet builder and downloadable participant materials",
    "Detailed program, navigation guide, and conference report generation (this document)",
    "Letter and memo composer for official LSUIC correspondence",
    "Flyer studio for pre-conference campaigns — registration guides, fee structure, and countdown assets",
    "Committee roster, logistics name list, timeline, and meetings documentation",
    "IEC-2026 online voter registration and remote voting platform integration",
    "Certificates module and centralized conference documentation hub",
  ],
  closing:
    "The Conference Committee acknowledges EKD Digital for providing rhub as the operational backbone of Jinan 2026. Platform support enabled accountable registration, transparent finance tracking, and reproducible post-conference documentation consistent with prior LSUIC reporting standards.",
} as const;

export const FUTURE_ADVISORIES = [
  "Publish unified post-conference reports within thirty days of adjournment, following the structure of this document.",
  "Maintain separate committee financial reports (as modeled by the Cooking Committee) and consolidate summaries in the main conference report.",
  "Continue online registration, delegate profiles, and digital asset archiving through rhub for each conference cycle.",
  "Schedule ambassador and VIP engagements early, with confirmed windows for Independence Day formalities.",
  "Contract official photography for all four conference days, not only the ceremonial day.",
  "Preserve the Expectation Tree and signed t-shirt traditions as standard opening-day fellowship elements.",
  "Require mandatory line-item committee reporting and chairperson certification before conference adjournment.",
  "Begin themed pre-conference communications at least sixty days out with registration guides, fee flyers, and online information sessions.",
] as const;

export const ACKNOWLEDGEMENTS = [
  "His Excellency Dudley McKinley Thomas, Ambassador of the Republic of Liberia to the People's Republic of China, and the staff of the Embassy of Liberia in Beijing",
  "The National Executive Committee (NEC) and all standing and ad hoc committees — Cooking, Logistics, Welfare, Protocol, Press & Public Affairs, IEC, and others",
  "EKD Digital for the EKD Digital Resource Hub (rhub) — conference management platform support throughout the Jinan 2026 cycle",
  "K-Visuals Studio for official conference photography and the Day 3 Pixieset gallery",
  "The Arcadia Spa Golf International Hotel management and staff",
  "Every delegate, veteran, guest, and volunteer who traveled to Jinan and contributed to a safe, dignified, and memorable twentieth conference",
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
    caption: "Awards Night — delegate singing",
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

export function chunkReportImages<T extends ReportImageItem>(
  photos: readonly T[],
  perPage: number = PHOTOS_PER_PAGE,
): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < photos.length; i += perPage) {
    chunks.push(photos.slice(i, i + perPage) as T[]);
  }
  return chunks;
}

export function chunkVenuePhotos(): ReportImageItem[][] {
  return chunkReportImages(VENUE_HOTEL_PHOTOS);
}

/** §4 text page plus venue photo gallery pages. */
export function buildVenueAndAccommodationPageCount(): number {
  return 1 + chunkVenuePhotos().length;
}

export function buildPreConferencePages(): PreConferencePagePlan[] {
  return buildPreConferencePagePlans(PRE_CONFERENCE, PRE_CONFERENCE_FLYERS);
}

function splitReportDaySlots(slots: readonly ProgramSlot[]): ProgramSlot[][] {
  return splitProgramDaySlots(slots, REPORT_PROGRAM_PAGINATION);
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
export function getReportFixedPageCounts(runtime?: ReportRuntimeContext) {
  const receiptAppendixPages = runtime
    ? countReportReceiptAppendixPages(runtime.cookingReceiptEntries.length)
    : 0;
  const bookletEmbedPages = runtime
    ? runtime.bookletPages.length
    : countReportBookletPages(buildStaticReportBookletContent());
  const certificatePage = 1;

  return {
    toc: 1,
    executiveAndObjectives: 1,
    preConference: buildPreConferencePages().length,
    venueAndAccommodation: buildVenueAndAccommodationPageCount(),
    committeeAndOverview: 1,
    bookletEmbed: bookletEmbedPages,
    electionSummary: 1,
    financeSummary: 3,
    keynoteCertificate: certificatePage,
    guestsOutcomes: 1,
    challenges: 1,
    rhubPlatform: 1,
    lessonsAndAdvisories: 1,
    acknowledgements: 1,
    certification: 1,
    cookingAppendix: buildCookingAppendixPages().length,
    receiptAppendix: receiptAppendixPages,
    iecAppendix: 2,
  } as const;
}

export const REPORT_FIXED_PAGES = getReportFixedPageCounts();

export function chunkAttendance(rows: AttendanceRow[]): AttendanceRow[][] {
  return chunkAttendanceVariable(rows);
}

export function chunkReportPhotos(
  photos: readonly (typeof REPORT_PHOTOS)[number][],
): (typeof REPORT_PHOTOS)[number][][] {
  return chunkReportImages(photos);
}

export function computeReportTotalPages(runtime?: ReportRuntimeContext): number {
  const attendanceRows = runtime?.attendanceRows ?? ATTENDANCE_ROWS;
  const attendancePages = chunkAttendance(attendanceRows).length;
  const roomPairingPages = runtime
    ? countReportRoomPairingPages(runtime.roomPairings)
    : 0;
  const photoPages = chunkReportPhotos(REPORT_PHOTOS).length;
  const programPages = buildReportProgramPages(REPORT_PROGRAM_DAYS).length;
  const fixed = getReportFixedPageCounts(runtime);
  const fixedPages =
    fixed.toc +
    fixed.executiveAndObjectives +
    fixed.preConference +
    fixed.venueAndAccommodation +
    fixed.committeeAndOverview +
    fixed.bookletEmbed +
    fixed.electionSummary +
    fixed.financeSummary +
    fixed.keynoteCertificate +
    fixed.guestsOutcomes +
    fixed.challenges +
    fixed.rhubPlatform +
    fixed.lessonsAndAdvisories +
    fixed.acknowledgements +
    fixed.certification +
    fixed.cookingAppendix +
    fixed.receiptAppendix +
    fixed.iecAppendix;
  return (
    1 + fixedPages + programPages + attendancePages + roomPairingPages + photoPages
  );
}
