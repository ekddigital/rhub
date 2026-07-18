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
    { session: "Meet & Greet / Welcome Dinner", code: "Business Casual" },
    { session: "General (all day)", code: "Casual / Comfortable travel wear" },
  ],
  slots: [
    {
      time: "All Day",
      activity: "Delegates arrive and travel to the conference venue",
      by: "All Delegates",
      highlight: false,
    },
    {
      time: "8:00 AM – 6:00 PM",
      activity:
        "Arrival, check-in at hotel reception, room assignment, and welfare support desk",
      by: "Logistics Committee · Welfare Committee",
    },
    {
      time: "8:00 AM – 6:00 PM",
      activity:
        "Conference registration desk — collect conference badge, booklet, and program guide",
      by: "Conference Committee Secretary",
    },
    {
      time: "Ongoing",
      activity:
        "City arrival follow-up and late delegate reception / coordination",
      by: "Council of Coordinators (CoC)",
    },
    {
      time: "1:00 PM",
      activity: "Lunch — Liberian Dry Rice",
      by: "Cooking Committee",
      highlight: true,
      meal: "Liberian Dry Rice",
    },
    {
      time: "2:00 PM – 4:30 PM",
      activity:
        "Rest window — delegates settle into rooms and explore the hotel grounds",
      by: "All Delegates",
    },
    {
      time: "5:00 PM – 5:05 PM",
      activity: "Opening Prayer",
      by: "[TBA] — National Chaplain General / Designee",
    },
    {
      time: "5:05 PM – 5:20 PM",
      activity: "Welcome Remarks — Meet and Greet official opening",
      by: "National President / Conference Chair",
    },
    {
      time: "5:20 PM – 6:00 PM",
      activity: "Self-Introductions — all delegates introduce themselves",
      by: "All Participants",
    },
    {
      time: "6:00 PM – 6:20 PM",
      activity:
        "Conference orientation — overview of four-day program, hotel ground rules, and delegate expectations",
      by: "Conference Chair — Enoch Kwateh Dongbo",
    },
    {
      time: "6:20 PM – 6:30 PM",
      activity: "Housekeeping announcements and logistics briefing for Day 2",
      by: "National Secretary General",
    },
    {
      time: "7:00 PM – 9:00 PM",
      activity: "Welcome dinner, fellowship, and informal networking",
      by: "Cooking Committee · All Delegates",
      highlight: true,
      meal: "Liberian Dry Rice (Dinner)",
    },
    {
      time: "9:00 PM",
      activity: "Closing prayer — end of Day 1",
      by: "[TBA] — National Chaplain General / Designee",
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
    {
      session: "Plenary / Conference Sessions",
      code: "Business Formal",
    },
    {
      session: "Pool Party",
      code: "Casual — Liberia's national colors (Red, White & Blue) encouraged",
    },
    { session: "Evening Fellowship", code: "Business Casual" },
  ],
  slots: [
    {
      time: "8:00 AM – 8:30 AM",
      activity: "Morning prayer and devotion",
      by: "National Chaplain General — Mitchell Vampelt",
    },
    {
      time: "8:30 AM – 8:35 AM",
      activity:
        "Call to Order — 20th Annual General Conference officially opened",
      by: "Presiding Officer — Conference Chair / National President",
    },
    {
      time: "8:35 AM – 8:45 AM",
      activity: "Reading and Adoption of the Conference Agenda",
      by: "National Secretary General — C. Nathaniel Willie II",
    },
    {
      time: "8:45 AM – 9:00 AM",
      activity: "Establishment of the Bar (Credentials Report)",
      by: "National Vice President — Ruphine M. Harmon",
    },
    {
      time: "9:00 AM – 9:15 AM",
      activity: "Welcome Remarks",
      by: "National President — Olano Teah Bloh",
    },
    {
      time: "9:15 AM – 9:30 AM",
      activity: "Special Statement — Opening of the Conference",
      by: "Special Guest / Liberian Embassy Representative",
    },
    {
      time: "9:30 AM – 10:00 AM",
      activity: "Annual Reports — National Secretariat Report",
      by: "National Secretary General — C. Nathaniel Willie II",
    },
    {
      time: "10:00 AM – 10:30 AM",
      activity: "Annual Reports — National Financial Report",
      by: "National Financial Secretary General — Noah Dave Mason Jr.",
    },
    {
      time: "10:30 AM – 11:00 AM",
      activity: "Annual Reports — National President's Annual Report",
      by: "National President — Olano Teah Bloh",
      subs: [
        { label: "Floor interventions and questions on all reports" },
        { label: "Resolutions arising from annual reports" },
      ],
    },
    {
      time: "11:00 AM – 11:30 AM",
      activity:
        "Committee Annual Reports (brief summaries — PPC, IEC, CRC, WC, AC)",
      by: "Respective Committee Chairpersons",
    },
    {
      time: "11:30 AM – 12:00 PM",
      activity: "Strategic Resolutions and motions from the floor",
      by: "All Delegates · Presiding Officer",
    },
    {
      time: "12:00 PM – 1:00 PM",
      activity: "Lunch Break",
      by: "Cooking Committee",
      highlight: true,
      meal: "Beans Toborgee",
    },
    {
      time: "1:00 PM – 1:15 PM",
      activity:
        "Constitutional Business — amendments, submissions, and referrals",
      by: "Constitution Review Committee (CRC)",
    },
    {
      time: "1:15 PM – 2:00 PM",
      activity:
        "Elections — NEC Officer nominations, debate, voting, and results",
      by: "Independent Elections Commission (IEC)",
      subs: [
        { label: "Debate period per candidate" },
        { label: "Voting (electronic or show of hands)" },
        { label: "Results announcement" },
      ],
    },
    {
      time: "2:00 PM – 2:15 PM",
      activity:
        "Vote of Thanks · Announcements · Closing Prayer (Morning Session)",
      by: "Conference Committee · National President",
    },
    {
      time: "2:00 PM – 4:00 PM",
      activity: "Rest — delegates relax at the hotel",
      by: "All Delegates",
      highlight: false,
    },
    {
      time: "4:00 PM – 6:00 PM",
      activity: "Pool Party and Swimming",
      by: "All Delegates",
      highlight: true,
    },
    {
      time: "7:00 PM",
      activity: "Dinner",
      by: "Cooking Committee",
      highlight: true,
      meal: "Pepper Soup with Rice and Fufu",
    },
    {
      time: "7:30 PM – 9:00 PM",
      activity:
        "Evening fellowship — city and province caucus check-ins, informal networking",
      by: "All Delegates",
    },
    {
      time: "9:00 PM",
      activity: "Closing Prayer — end of Day 2",
      by: "National Chaplain General — Mitchell Vampelt",
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
    {
      session: "Morning Conference / Independence Ceremony",
      code: "Business Formal",
    },
    {
      session: "Football / Sports Activities",
      code: "Sports Wear — Liberia's national colors encouraged",
    },
    {
      session: "Awards Night & Independence Ball",
      code: "Formal / Semi-Formal (Suit, Dress, or Traditional Attire)",
    },
    { session: "LSUIC Pageant", code: "Formal Attire" },
  ],
  slots: [
    {
      time: "8:00 AM – 8:30 AM",
      activity: "Morning Prayer and Devotion",
      by: "National Chaplain General — Mitchell Vampelt",
    },
    {
      time: "8:30 AM – 8:40 AM",
      activity: "Call to Order (morning session)",
      by: "Presiding Officer",
    },
    {
      time: "8:40 AM – 9:00 AM",
      activity: "Welcome Remarks",
      by: "Conference Committee Secretary",
    },
    {
      time: "9:00 AM – 9:10 AM",
      activity: "Recognition of Special & Invited Guests",
      by: "National President — Olano Teah Bloh",
    },
    {
      time: "9:10 AM – 9:30 AM",
      activity: "Cultural Performance",
      by: "[TBA] — Performing Member / Group",
    },
    {
      time: "9:30 AM – 9:40 AM",
      activity: "Introduction of Guest Speaker",
      by: "[TBA] — Member, Conference Committee",
    },
    {
      time: "9:40 AM – 10:10 AM",
      activity: "Independence Day Oration",
      by: "[TBA] — Independence Day Orator",
    },
    {
      time: "10:10 AM – 10:30 AM",
      activity: "Certification of Elected Officers",
      by: "Chair, Independent Elections Commission (IEC)",
    },
    {
      time: "10:30 AM – 10:50 AM",
      activity: "Induction of Newly Elected Officials",
      by: "National President · IEC Chair",
    },
    {
      time: "10:50 AM – 11:10 AM",
      activity: "Inaugural Address by Newly Elected National President",
      by: "Incoming National President",
    },
    {
      time: "11:10 AM – 12:10 PM",
      activity: "Independence Rally & Cutting of the Cake",
      by: "All Delegates · Liberian Embassy · Invited Personalities",
      subs: [
        { label: "Remarks — Liberian Embassy in Beijing" },
        { label: "Remarks — Invited Personalities & Institutions" },
        { label: "Cake cutting ceremony" },
      ],
    },
    {
      time: "12:10 PM – 12:30 PM",
      activity: "Vote of Thanks · Announcements · National Anthem",
      by: "Conference Committee · All Participants",
    },
    {
      time: "12:30 PM – 12:40 PM",
      activity: "Closing Prayer (morning session)",
      by: "National Chaplain General",
    },
    {
      time: "12:30 PM – 1:30 PM",
      activity: "Lunch and Group Photos",
      by: "Cooking Committee · Conference Committee",
      highlight: true,
      meal: "Pepper Kala",
    },
    {
      time: "2:00 PM – 5:30 PM",
      activity: "Sports Activities — Football Tournament",
      by: "All Delegates · Sports Coordinator",
    },
    {
      time: "5:30 PM – 7:30 PM",
      activity:
        "Return to hotel, freshening up, and preparation for Awards Night",
      by: "All Delegates",
    },
    {
      time: "8:00 PM – 8:30 PM",
      activity: "Red Carpet · National Anthem",
      by: "Master of Ceremony (MC) · All Participants",
      highlight: true,
    },
    {
      time: "8:30 PM – 9:00 PM",
      activity: "Welcome Remark · Opening Statement",
      by: "[TBA] — Senior Officer · National President / Incoming NP",
      subs: [
        { label: "Welcome Remark" },
        { label: "Opening Statement — National President" },
      ],
    },
    {
      time: "9:00 PM – 11:00 PM",
      activity: "Awards Night Programme",
      by: "Master of Ceremony · Conference Committee",
      subs: [
        { label: "Musical Interlude" },
        {
          label:
            "Recognition of Veterans — Graduates of the Class of 2025/2026",
        },
        { label: "Recognition of Special Invitees" },
        { label: "Award: Most Dedicated Scholars (Male & Female)" },
        { label: "Award: Most Influential Scholars (Male & Female)" },
        { label: "Award: Most Sociable Scholars (Male & Female)" },
        { label: "Musical Performance" },
        { label: "Award: Most Generous Scholars (Male & Female)" },
        { label: "Award: Most Innovative Scholars (Male & Female)" },
        { label: "Award: Best Entrepreneurial Scholars (Male & Female)" },
        {
          label:
            "LSUIC Financial Supporters Recognition — Highest Due-Paying City & Province",
        },
        { label: "Academic Excellence Awards (AEA-2026)" },
        { label: "Presidential Awards & Scholars of the Year" },
        { label: "LSUIC Special Honoree Award" },
        { label: "Group Photos with Honorees" },
      ],
      highlight: true,
      meal: "Dinner: Jollof Rice · Fried Rice · Fried Chicken · Barbecue · Fried Turkey · Potato Salad · Vegetable Salad · Macaroni Salad & More",
    },
    {
      time: "11:00 PM – 11:15 PM",
      activity: "Special Statement · Vote of Thanks · Closing",
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
      time: "6:30 AM – 7:30 AM",
      activity: "Breakfast and room check-out preparation",
      by: "All Delegates",
      highlight: true,
      meal: "Sandwich",
    },
    {
      time: "7:30 AM – 9:00 AM",
      activity: "Baggage coordination and final welfare check",
      by: "Logistics Committee · Welfare Committee",
    },
    {
      time: "8:00 AM – 12:00 PM",
      activity: "Official hotel check-out — all rooms must be vacated by noon",
      by: "All Delegates",
      highlight: true,
    },
    {
      time: "As needed",
      activity:
        "Conference-arranged group transfers to Jinan West Railway Station (for delegates requiring coordination)",
      by: "Logistics Committee",
    },
    {
      time: "After 12:00 PM",
      activity: "Delegates depart for individual travel routes",
      by: "All Delegates",
    },
    {
      time: "Ongoing",
      activity:
        "City and provincial coordinator follow-up — confirm all delegates arrived safely",
      by: "Council of Coordinators (CoC) · National Welfare Committee",
    },
    {
      time: "Note",
      activity:
        "Bus K904 operates to the hotel stop only until 7:20 PM. Delegates arriving or departing after this time must use DiDi or a taxi. Please refer to the Travel Guide for directions.",
      by: "Logistics Committee",
      highlight: false,
    },
  ],
};

export const DETAILED_PROGRAM_DAYS: ProgramDay[] = [DAY_1, DAY_2, DAY_3, DAY_4];

export const PROGRAM_GENERAL_NOTES = [
  "All times are China Standard Time (CST / UTC+8).",
  "Dress code — Conference sessions: formal or smart business attire. Pool Party and sports: casual with Liberia's national colors (Red, White, Blue) encouraged. Awards Night: formal / semi-formal.",
  "Conference room is located within the hotel. All plenary sessions will take place there unless otherwise announced.",
  "Delegates are expected to be seated and ready 5 minutes before each session begins.",
  "Mobile phones should be on silent during all formal sessions.",
  "For travel assistance and emergencies, contact the Logistics Committee (see Travel Guide).",
];
