import { CONF_2026 } from "@/lib/conf/config";

/** Full Conference Introduction default (booklet TEXT section). */
export const CONFERENCE_INTRO_PARAGRAPHS = [
  `Welcome to the ${CONF_2026.name} — ${CONF_2026.theme}. As delegates of the Liberian Student Union in China, we gather in Jinan for our twentieth annual conference — a milestone that celebrates unity, leadership, academic excellence, and the enduring legacy of our community across China. Two decades of annual conferences have built a record of service, fellowship, and responsible student leadership; this gathering marks both that history and our shared responsibility to carry it forward.`,
  `Our theme, ${CONF_2026.theme}, invites us to reflect on the foundations laid by past leaders and alumni, to strengthen the bonds that unite Liberian students in every city and province, and to extend our influence through disciplined study, civic responsibility, and constructive engagement with Liberia and with our host nation. The sub-theme — ${CONF_2026.subTheme} — calls us to honor what has been achieved, to participate fully in the work of this conference, and to leave Jinan with renewed purpose for the year ahead. These ideals are grounded in LSUIC's core values: ${CONF_2026.coreValues.join(", ")}. Together they define how we conduct ourselves as delegates, as elected officers, and as ambassadors of Liberian youth in China.`,
  `The conference takes place from Friday, 24 July through Monday, 27 July 2026 at the ${CONF_2026.venue}, ${CONF_2026.province} Province. Jinan, the capital of Shandong, is widely known as the City of Springs for its historic artesian wells and long cultural heritage; Shandong is the birthplace of Confucian thought and one of China's great provincial centers of learning and industry. Our venue offers a dedicated setting for plenary sessions, fellowship, and recreation — with conference facilities, spa amenities, and sports grounds for football and other outdoor activities. This booklet contains the conference program, leadership profiles, committee roster, Navigation Guide, and essential information to help you navigate the days ahead. The four-day schedule moves from arrival and meet-and-greet through plenary business, elections, and constitution review; an afternoon of rest and pool activities; conference sessions, football, and an evening celebration; and final departure on Monday morning. We ask every delegate to arrive on time for each scheduled activity, to participate actively in plenary sessions, elections, resolutions, and fellowship events, and to conduct themselves with respect toward fellow delegates, conference officials, and hotel staff. Please review the daily program outline in this booklet each evening and plan the following day accordingly — punctuality and full engagement ensure that business sessions, recreation, and celebrations run smoothly for everyone.`,
  `Travel to and from Jinan, and local transport other than conference-arranged transfers for sporting activities, is the responsibility of each delegate. Step-by-step directions from Jinan's major railway stations to the hotel — including subway connections, Bus K904, and taxi or ride-hail options — are provided in the Navigation Guide section of this booklet. Please note that Bus K904 operates only until 7:20 PM; delegates arriving after that hour must use a taxi or ride-hail service to reach the hotel. Dress appropriately for each occasion: formal or business attire is expected for conference room sessions, reports, elections, and other official business; casual dress is welcome for the meet and greet, pool party, football, and evening celebrations — and we encourage wearing Liberia's national colors (red, white, and blue) during sporting and social events. We extend our deepest gratitude to the Liberian and Chinese governments for their continued support of Liberian students in China, and to the National Executive Committee, Conference Committee, and all volunteers whose dedication makes this gathering possible.`,
  `The detailed daily program follows in the Program Outline section of this booklet. We look forward to welcoming you to Jinan and to four days of fellowship, purpose, and lasting memories.`,
];

export const DEFAULT_CONFERENCE_INTRO =
  CONFERENCE_INTRO_PARAGRAPHS.join("\n\n");

/** Stored booklet sections seeded before the expanded Jinan 2026 intro. */
export const LEGACY_CONFERENCE_INTRO_MARKERS = [
  "Under this year's theme, we honor our past, engage our present, and inspire our future",
  "navigation guide, and essential information to help you navigate the days ahead",
  "golf grounds that will host several of our fellowship and sporting programs",
  "golf grounds that will host several of our social and sporting programs",
] as const;

/** Intro bodies shorter than this are treated as stale and upgraded on load. */
export const CONFERENCE_INTRO_MIN_CHARS = Math.floor(
  DEFAULT_CONFERENCE_INTRO.length * 0.72,
);

function normalizeIntroCompare(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isStaleConferenceIntroBody(
  bodyText: string | null | undefined,
): boolean {
  const trimmed = (bodyText ?? "").trim();
  if (!trimmed) return false;

  const normalized = normalizeIntroCompare(trimmed);
  const currentDefault = normalizeIntroCompare(DEFAULT_CONFERENCE_INTRO);
  if (normalized === currentDefault) return false;

  if (trimmed.length < CONFERENCE_INTRO_MIN_CHARS) return true;

  return LEGACY_CONFERENCE_INTRO_MARKERS.some((marker) =>
    normalized.includes(normalizeIntroCompare(marker)),
  );
}

export function resolveConferenceIntroBody(
  bodyText: string | null | undefined,
): string {
  const trimmed = (bodyText ?? "").trim();
  if (!trimmed || isStaleConferenceIntroBody(trimmed)) {
    return DEFAULT_CONFERENCE_INTRO;
  }
  return trimmed;
}

/** Program Outline welcome preamble (shorter than full intro; references Conference Introduction). */
export const PROGRAM_OUTLINE_INTRO_PARAGRAPHS = [
  `As delegates of the Liberian Student Union in China, we gather in Jinan for our 20th Annual Conference under the theme ${CONF_2026.theme} — four days that balance conference business, fellowship, recreation, and celebration.`,
  `Our sub-theme, ${CONF_2026.subTheme}, reminds us that this twentieth anniversary is both a celebration of LSUIC's legacy and an invitation to lead with influence in the year ahead. Jinan, capital of ${CONF_2026.province} Province and the City of Springs, welcomes us to a province rich in history and learning; we meet at the ${CONF_2026.venue} from Friday, 24 July through Monday, 27 July 2026.`,
  `The schedule below outlines each day's activities: arrival and meet-and-greet in the hotel yard; a Day 2 plenary from 8:30 - 2:00 covering reports, elections, resolutions, and constitution review, followed by rest and an afternoon pool party; Day 3 conference sessions, football on the sports grounds, and an evening party; and check-out by noon on Day 4.`,
  `Please review the program carefully, arrive on time for every session, and take part actively in meetings, elections, sports, and social events. Consult the Navigation Guide in this booklet for travel directions from Jinan's railway stations (including Bus K904), and the Conference Introduction for delegate expectations, transportation responsibility, and dress code.`,
];

export const DEFAULT_PROGRAM_OUTLINE_INTRO =
  PROGRAM_OUTLINE_INTRO_PARAGRAPHS.join("\n\n");

/** Overview + historical reference section for LSUIC booklet pages. */
export const LSUIC_OVERVIEW_PARAGRAPHS = [
  "The Liberian Student Union in China (LSUIC) was established in July 2006 as a student-led organization committed to unity, academic excellence, leadership development, and welfare support for Liberian students across China. The union exists to strengthen communication among members, promote responsible representation, and build a constructive bridge between Liberian students, Chinese institutions, and Liberia's national interest.",
  "Over the years, LSUIC has grown from a small student network into a structured union with an elected National Executive Committee, city and provincial coordination, specialized committees, and annual general conferences that guide policy, leadership transition, and collective action. Through these structures, members support one another academically, socially, and professionally while preserving shared identity and service values.",
  "Presidents of LSUIC (2006 - Present): Mr. Alexander Nuetah (2006-2010); Mr. Augustine F. Tokpa (2010-2011); Mr. Bernel S. Dennis (2011-2012); Dr. Presley K. Wesseh, Jr. (2012-2013); Ms. Patience M. Martor (2013-2014); Dr. Edwin N. Sumowar (2014-2015); Dr. Abimelech P. Gbatu (2015-2016); Mr. Mulbah Gbozee (2016-2017); Mr. Allen Bohr James (2017-2018); Dr. Charles Gbolie (2018-2019); Dr. Yamah Bavor King (2019-2020); Mr. Hassan Francis Whitfield (2020-2022); Mr. Emmet A. Johee Greene (2022-2023); Jacob Cephus Johnson (2023-2025); Hon. Gideon F. B. Solre (2025).",
  "Past conference venues include Beijing, Wuhan, Tianjin, Shanghai, Changsha, Xuzhou, Hangzhou, Guangzhou, Nanjing, and other host cities over multiple years, including online-era transitions during 2020 and 2021. These annual gatherings remain central to LSUIC's identity: they renew leadership, strengthen democratic participation, and sustain institutional memory across generations.",
].join("\n\n");

/** Union history section for booklet context and institutional continuity. */
export const LSUIC_HISTORY_PARAGRAPHS = [
  "LSUIC's history is defined by continuity through student transitions. Because members graduate and relocate, each leadership cycle must document decisions, preserve records, and hand over systems that the next team can improve rather than rebuild. This principle has shaped the union's long-term progress in governance, conference delivery, and member services.",
  "The union's development has moved through key phases: foundation and city-level expansion, committee-based organization, broader conference participation, and modern digital operations for registration, communication, and reporting. Each phase reflects the same goal: to serve Liberian students with integrity, accountability, and practical support in their academic journey.",
  "As LSUIC enters its third decade, its institutional mission remains clear: honor past contributions, engage present responsibilities, and equip future leaders to carry the union forward. The annual conference is not only a celebration - it is the union's primary civic forum for collective reflection, constitutional engagement, and responsible transition.",
].join("\n\n");

export const LSUIC_PRESIDENT_HISTORY: Array<{ name: string; term: string }> = [
  { name: "Mr. Alexander Nuetah", term: "2006-2010" },
  { name: "Mr. Augustine F. Tokpa", term: "2010-2011" },
  { name: "Mr. Bernel S. Dennis", term: "2011-2012" },
  { name: "Dr. Presley K. Wesseh, Jr.", term: "2012-2013" },
  { name: "Ms. Patience M. Martor", term: "2013-2014" },
  { name: "Dr. Edwin N. Sumowar", term: "2014-2015" },
  { name: "Dr. Abimelech P. Gbatu", term: "2015-2016" },
  { name: "Mr. Mulbah Gbozee", term: "2016-2017" },
  { name: "Mr. Allen Bohr James", term: "2017-2018" },
  { name: "Dr. Charles Gbolie", term: "2018-2019" },
  { name: "Dr. Yamah Bavor King", term: "2019-2020" },
  { name: "Mr. Hassan Francis Whitfield", term: "2020-2022" },
  { name: "Mr. Emmet A. Johee Greene", term: "2022-2023" },
  { name: "Mr. Jacob Cephus Johnson", term: "2023-2025" },
  { name: "Hon. Gideon F. B. Solre", term: "2025" },
];

export const LSUIC_HISTORY_MILESTONES: Array<{
  period: string;
  focus: string;
  outcomes: string;
}> = [
  {
    period: "2006-2012",
    focus: "Foundation & Expansion",
    outcomes:
      "City-level growth, delegate identity building, and annual conference continuity.",
  },
  {
    period: "2013-2019",
    focus: "Institutional Structuring",
    outcomes:
      "Committee systems, stronger leadership handover patterns, and policy consolidation.",
  },
  {
    period: "2020-2023",
    focus: "Adaptation & Hybrid Coordination",
    outcomes:
      "Online coordination, resilient annual programming, and broader member participation.",
  },
  {
    period: "2024-2026",
    focus: "Digital Governance",
    outcomes:
      "Platform-based registration, documentation workflows, and stronger historical archiving.",
  },
];

export const LIBERIAN_NATIONAL_ANTHEM = {
  title: "The National Anthem of Liberia",
  verse1: [
    "All hail, Liberia, hail! (All hail!)",
    "This glorious land of liberty",
    "Shall long be ours.",
    "Though new her name,",
    "Green be her fame,",
    "And mighty be her powers.",
    "In joy and gladness,",
    "With our hearts united,",
    "We'll shout the freedom",
    "Of a race benighted,",
    "Long live Liberia, happy land!",
    "A home of glorious liberty,",
    "By God's command!",
  ],
  verse2: [
    "All hail, Liberia, hail! (All hail!)",
    "In union strong success is sure.",
    "We cannot fail!",
    "With God above,",
    "Our rights to prove,",
    "We will o'er all prevail!",
    "With heart and hand",
    "Our country's cause defending,",
    "We'll meet the foe",
    "With valor unpretending.",
    "Long live Liberia, happy land!",
    "A home of glorious liberty,",
    "By God's command!",
  ],
};
