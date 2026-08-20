/** ─────────────────────────────────────────────────────────────────────────
 *  LSUIC 20th Annual Conference — Jinan 2026
 *  Detailed Program Flow (all four days)
 *
 *  Based on:
 *    • Booklet summary schedule (booklet-program-outline.ts)
 *    • 2023 17th Annual Conference program booklet (reference photos)
 *    • Conference Event Menu (menu-cooking-committee.jpg)
 *    • NEC/Committee meeting records
 *  ──────────────────────────────────────────────────────────────────────── */

export const PROGRAM_META = {
  confName: "LSUIC 20th Annual Conference",
  confYear: 2026,
  theme: "Jinan 2026: Legacy and Influence",
  subTheme: "Honoring Our Past, Engaging Our Present, and Inspiring Our Future",
  venue: "Arcadia Spa Golf International Hotel",
  location: "Qihe County, Dezhou, Shandong Province",
  dates: "July 24–27, 2026",
} as const;

export type ProgramSlot = {
  time: string;
  activity: string;
  /** Person or group responsible. Use "[TBA]" for slots to be confirmed. */
  by?: string;
  /** Optional sub-items (agenda items within a main block). */
  subs?: { label: string; by?: string }[];
  /** Visually emphasised block (e.g. breaks, meals, key transitions). */
  highlight?: boolean;
  /** Meal info attached to this slot. */
  meal?: string;
};

export type ProgramDay = {
  day: number;
  label: string;
  theme?: string;
  date: string;
  dayOfWeek: string;
  /** Session name → dress code pairs, shown on the overview card. */
  dressCodes: { session: string; code: string }[];
  slots: ProgramSlot[];
};

// ─── DAY 1: Arrival Day — Friday, 24 July 2026 ───────────────────────────────
const DAY_1: ProgramDay = {
  day: 1,
  label: "Arrival Day",
  date: "July 24, 2026",
  dayOfWeek: "Friday",
  dressCodes: [
    { session: "Arrival / Check-in", code: "Casual / Comfortable travel wear" },
    { session: "Meet & Greet", code: "Business Casual" },
  ],
  slots: [
    {
      time: "All Day",
      activity: "Delegates arrive and travel to the conference venue.",
      by: "All Delegates",
    },
    {
      time: "11:00 AM – 8:00 PM",
      activity:
        "Arrival, check-in at hotel reception, room assignment, and welfare support desk.",
      by: "Logistics Committee · Welfare Committee",
    },
    {
      time: "2:00 PM – 4:00 PM",
      activity:
        "Rest window — delegates settle into rooms and explore hotel grounds.",
      by: "All Delegates",
    },
    {
      time: "4:10 PM – 4:15 PM",
      activity: "Opening Prayer.",
      by: "National Chaplain General / Designee",
    },
    {
      time: "4:30 PM",
      activity: "Lunch — Liberian Dry Rice.",
      by: "Cooking Committee",
      highlight: true,
      meal: "Liberian Dry Rice",
    },
    {
      time: "5:05 PM – 5:20 PM",
      activity: "Welcome Remarks — Meet and Greet official opening.",
      by: "National President / Conference Chair",
    },
    {
      time: "5:20 PM – 6:00 PM",
      activity: "Self-Introductions — all delegates introduce themselves.",
      by: "All Delegates",
    },
    {
      time: "6:00 PM – 6:20 PM",
      activity:
        "Conference orientation — overview of four-day program, hotel ground rules, and delegate expectations.",
      by: "Conference Chair — Enoch Kwateh Dongbo",
    },
    {
      time: "6:20 PM – 6:30 PM",
      activity: "Housekeeping announcements and logistics briefing for Day 2.",
      by: "National Secretary General",
    },
    {
      time: "7:00 PM – 9:00 PM",
      activity: "Games, Fellowship, and informal networking.",
      by: "National Vice President - Hon. Ruphine M. Harmon",
      highlight: true,
    },
    {
      time: "9:10 PM",
      activity: "Closing prayer — end of Day 1.",
      by: "National Chaplain General / Designee",
    },
  ],
};

// ─── DAY 2: Conference Business & Pool Party — Saturday, 25 July 2026 ─────────
const DAY_2: ProgramDay = {
  day: 2,
  label: "Conference Business & Pool Party",
  date: "July 25, 2026",
  dayOfWeek: "Saturday",
  dressCodes: [
    { session: "Conference Sessions", code: "Formal / Smart Business Attire" },
    {
      session: "Pool Party",
      code: "Casual with Liberia's national colors (Red, White, Blue) encouraged",
    },
  ],
  slots: [
    {
      time: "7:00 AM – 8:30 AM",
      activity: "Breakfast.",
      by: "Hotel Service",
      highlight: true,
    },
    {
      time: "8:30 AM – 8:35 AM",
      activity: "Morning prayer and devotion.",
      by: "National Vice President - Hon. Ruphine M. Harmon",
    },
    {
      time: "8:30 AM – 8:35 AM",
      activity:
        "Call to Order — 20th Annual General Conference officially opened.",
      by: "Presiding Officer — Conference Chair / National President",
    },
    {
      time: "8:35 AM – 8:45 AM",
      activity: "Reading and Adoption of the Conference Agenda.",
      by: "National Secretary General — C. Nathaniel Willie II",
    },
    {
      time: "8:45 AM – 9:00 AM",
      activity: "Establishment of the Bar (Credentials Report).",
      by: "National President — Hon. Olano Teah Bloh",
    },
    {
      time: "9:00 AM – 9:15 AM",
      activity: "Welcome Remarks.",
      by: "National Vice President - Hon. Ruphine M. Harmon",
    },
    {
      time: "9:15 AM – 9:30 AM",
      activity: "Special Statement — Opening of the Conference.",
      by: "Conference Chair — Enoch Kwateh Dongbo",
    },
    {
      time: "9:30 AM – 9:50 AM",
      activity: "Annual Reports - Q&A — National Financial Report.",
      by: "National Financial Secretary General — Noah Dave Mason Jr.",
    },
    {
      time: "9:55 AM – 10:55 AM",
      activity: "Annual Reports - Q&A — National President’s Annual Report.",
      by: "National President — Olano Teah Bloh",
    },
    {
      time: "11:00 AM – 12:00 PM",
      activity: "Strategic Resolutions and motions from the floor.",
      by: "All Delegates",
    },
    {
      time: "12:00 PM – 2:00 PM",
      activity:
        "Elections, reports, resolutions, and remaining formal conference business.",
      by: "Independent Elections Commission (IEC) · Plenary",
    },
    {
      time: "2:00 PM – 4:30 PM",
      activity: "Lunch and relaxation break.",
      by: "Cooking Committee",
      highlight: true,
      meal: "Beans Toborgee",
    },
    {
      time: "4:30 PM – 9:00 PM",
      activity: "Pool Party and Swimming.",
      by: "All Delegates",
      highlight: true,
    },
    {
      time: "7:00 PM",
      activity: "Dinner — Pepper Soup with Rice and Fufu.",
      by: "Cooking Committee",
      highlight: true,
      meal: "Pepper Soup with Rice and Fufu",
    },
    {
      time: "9:00 PM",
      activity:
        "Closing Prayer - City and Province caucus, check-ins, informal networking.",
      by: "National Chaplain General / Designee",
    },
  ],
};

// ─── DAY 3: Conference, Independence Day & Awards Night — Sunday, 26 July 2026 ─
const DAY_3: ProgramDay = {
  day: 3,
  label: "Independence Day, Sports & Awards Night",
  theme: "179th Independence Day of Liberia",
  date: "July 26, 2026",
  dayOfWeek: "Sunday",
  dressCodes: [
    { session: "Breakfast", code: "Casual Morning Wear" },
    {
      session: "Sports Activities",
      code: "Sports Wear — Liberia's national colors encouraged",
    },
    {
      session: "Major Formal Session (Ambassador Present)",
      code: "Business Formal",
    },
    { session: "Dinner & Awards Night", code: "Formal / Semi-Formal" },
  ],
  slots: [
    {
      time: "7:00 AM – 8:30 AM",
      activity: "Breakfast.",
      by: "Hotel Service",
      highlight: true,
    },
    {
      time: "9:00 AM – 2:00 PM",
      activity: "Sports Activities (Football and related games).",
      by: "All Delegates · Sports Coordinator",
    },
    {
      time: "1:30 PM",
      activity: "Lunch — Pepper Kala.",
      by: "Cooking Committee",
      highlight: true,
      meal: "Pepper Kala",
    },
    {
      time: "4:00 PM – 4:20 PM",
      activity: "Red Carpet · Musical Interlude, DJ.",
      by: "Master of Ceremony (MC) · All Participants",
      highlight: true,
    },
    {
      time: "4:20 PM – 5:00 PM",
      activity:
        "Official Opening of the Independence Day Program (Opening Prayer and Call to Order).",
      by: "National Chaplain General · Presiding Officer",
      highlight: true,
    },
    {
      time: "5:00 PM – 5:10 PM",
      activity: "Introduction of Guest Speaker.",
      by: "Olive K. Kamara",
    },
    {
      time: "5:10 PM – 5:40 PM",
      activity: "Independence Day Oration, Hon. Joshua Bosco Barvor.",
      by: "Hon. Joshua Bosco Barvor",
    },
    {
      time: "5:40 PM – 6:00 PM",
      activity:
        "Recognition of The Liberian Embassy and Special Guests, Hon. Olano Teah Bloh.",
      by: "Hon. Olano Teah Bloh",
    },
    {
      time: "6:00 PM – 6:20 PM",
      activity: "Summary of the Annual Report  & Book Launch - NEC 2025-2026.",
      by: "Hon. Olano Teah Bloh",
    },
    {
      time: "6:20 PM – 6:40 PM",
      activity: "Certification and induction of elected officers.",
      by: "IEC Chair · Abmassador",
    },
    {
      time: "6:40 PM – 7:00 PM",
      activity: "Inaugural Address by newly elected National President.",
      by: "Incoming National President",
    },
    {
      time: "7:00 PM – 7:35 PM",
      activity:
        "Special Statement · Liberia’s Ambassador to China, His Excellency Dudley McKinley Thomas.",
      by: "His Excellency Dudley McKinley Thomas",
    },
    {
      time: "7:35 PM – 8:00 PM",
      activity: "Independence rally, statements, and cake cutting ceremony.",
      by: "All Delegates · Liberian Embassy · Invited Personalities",
      subs: [
        { label: "Remarks — Liberian Embassy in Beijing" },
        { label: "Remarks — Invited Personalities & Institutions" },
        { label: "Cake cutting ceremony" },
      ],
    },
    {
      time: "8:00 PM – 8:30 PM",
      activity: "Dinner service and formal networking.",
      by: "Cooking Committee",
      highlight: true,
    },
    {
      time: "8:30 PM – 4:00 AM",
      activity: "Awards Night Program.",
      by: "Master of Ceremony · Conference Committee",
      subs: [
        { label: "Musical Interlude" },
        {
          label:
            "Recognition of Veterans — Graduates of the Class of 2025/2026",
        },
        { label: "Recognition of Special Invitees" },
        { label: "MISS LSUIC" },
        { label: "LSUIC 2026 Achievers' Awards" },
        { label: "LSUIC Financial Supporters" },
        { label: "Academic Excellence Awards (AEA-2026)" },
        { label: "NEC Service Awards & Scholars of the Year" },
        { label: "LSUIC Special Honoree Award" },
      ],
      highlight: true,
      meal: "Dinner: Jollof Rice · Fried Rice · Fried Chicken · Barbecue · Fried Turkey · Potato Salad · Vegetable Salad · Macaroni Salad & More",
    },
    {
      time: "4:00 AM – 4:15 AM",
      activity: "Special Statement · Vote of Thanks · Closing.",
      by: "National President · Chair, Conference Committee",
    },
  ],
};

// ─── DAY 4: Departure — Monday, 27 July 2026 ─────────────────────────────────
const DAY_4: ProgramDay = {
  day: 4,
  label: "Departure Day",
  date: "July 27, 2026",
  dayOfWeek: "Monday",
  dressCodes: [
    { session: "Checkout / Departure", code: "Casual / Travel Wear" },
  ],
  slots: [
    {
      time: "7:00 AM – 8:30 AM",
      activity: "Breakfast and room check-out preparation.",
      by: "All Delegates",
      highlight: true,
    },
    {
      time: "8:30 AM – 9:30 AM",
      activity: "Baggage coordination and final welfare check.",
      by: "Logistics Committee · Welfare Committee",
    },
    {
      time: "9:30 AM – 12:00 PM",
      activity: "Official hotel check-out — all rooms must be vacated by noon.",
      by: "All Delegates",
      highlight: true,
    },
    {
      time: "As needed",
      activity:
        "Conference-arranged group transfers to Jinan West Railway Station.",
      by: "Logistics Committee",
    },
    {
      time: "After 12:00 PM",
      activity: "Delegates depart for individual travel routes.",
      by: "All Delegates",
    },
    {
      time: "Ongoing",
      activity:
        "City and provincial coordinator follow-up — confirm all delegates arrived safely.",
      by: "Council of Coordinators (CoC) · National Welfare Committee",
    },
    {
      time: "Note",
      activity:
        "Bus K904 operates to the hotel stop only until 7:20 PM. Delegates arriving or departing after this time must use DiDi or a taxi.",
      by: "Logistics Committee",
    },
  ],
};

export const DETAILED_PROGRAM_DAYS: ProgramDay[] = [DAY_1, DAY_2, DAY_3, DAY_4];

export const PROGRAM_GENERAL_NOTES = [
  "All times are China Standard Time (CST / UTC+8).",
  "Dress code: Conference sessions: formal or smart business attire. Pool Party and sports: casual with Liberia's national colors (Red, White, Blue) encouraged. Awards Night: formal / semi-formal.",
  "The conference room was located within the hotel. All plenary sessions took place there unless otherwise announced.",
  "Delegates were expected to be seated and ready 5 minutes before each session began.",
  "Mobile phones were kept on silent during all formal sessions.",
  "For travel assistance and emergencies, delegates contacted the Logistics Committee.",
];
