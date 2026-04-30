/** Conference configuration — LSUIC 2026 — Single Source of Truth */

export const CONF_2026 = {
  // Identity
  shortLabel: "LSUIC 2026",
  name: "LSUIC 20th Annual Conference & Anniversary",
  year: 2026,
  phase: "Planning Phase",

  // Theme (NEC official)
  theme: "Jinan 2026: Legacy and Influence",
  subTheme: "Honoring Our Past, Engaging Our Present, and Inspiring Our Future",
  coreValues: ["Peace", "Togetherness", "Love", "Support", "Willingness", "Passion", "Service"],

  // Location
  city: "Jinan",
  province: "Shandong",
  venue: "Arcadia Spa Golf International Hotel",
  venueCn: "齐河阿尔卡迪亚温泉高尔夫国际酒店",
  venueShort: "Arcadia Spa Golf Hotel · Jinan, Shandong",
  address: "山东省德州市齐河县308国道国科球类中心旁",

  // Dates
  startsAt: "2026-07-24",
  endsAt: "2026-07-27",
  independenceDayDate: "2026-07-26", // Liberia Independence Day — special program during conference

  // Finance
  delegateFee: 250, // RMB
  deposit: 5000,
  xrRate: 7.2,
} as const;

export const BUDGET_CATEGORIES: Record<
  string,
  { label: string; color: string }
> = {
  FOOD: { label: "Food & Groceries", color: "bg-orange-500" },
  BEVERAGE: { label: "Beverages", color: "bg-blue-500" },
  SUPPLIES: { label: "Supplies & Disposables", color: "bg-gray-500" },
  LOGISTICS: { label: "Logistics", color: "bg-purple-500" },
  VENUE: { label: "Venue & Hotel", color: "bg-emerald-500" },
  TRANSPORT: { label: "Transportation", color: "bg-cyan-500" },
  MEDIA: { label: "Media & Photography", color: "bg-pink-500" },
  ENTERTAINMENT: { label: "Entertainment", color: "bg-yellow-500" },
  ADMIN: { label: "Administrative", color: "bg-indigo-500" },
  MISC: { label: "Miscellaneous", color: "bg-slate-500" },
};

export const PAY_METHODS: Record<string, string> = {
  WECHAT: "WeChat Pay",
  ALIPAY: "Alipay",
  BANK: "Bank Transfer",
  CASH: "Cash",
  OTHER: "Other",
};

export const BUDGET_STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  REVIEW: { label: "Under Review", variant: "outline" },
  APPROVED: { label: "Approved", variant: "default" },
  REJECTED: { label: "Rejected", variant: "destructive" },
};

export const COMMON_UNITS = [
  "pcs",
  "KG",
  "L",
  "carton",
  "bags",
  "bottles",
  "packs",
  "dozen",
  "days",
  "nights",
  "trips",
  "rooms",
  "sacs",
  "plastics",
  "rolls",
  "boxes",
  "players",
  "teams",
  "persons",
  "sets",
  "sessions",
  "custom",
];
