export const NAV_GUIDE_META = {
  title: "Travel Guide to The Conference Venue",
  venueEn: "Arcadia Spa Golf International Hotel",
  venueZh: "齐河阿尔卡迪亚温泉高尔夫国际酒店",
  addressZh: "山东省德州市齐河县308国道国科球类中心旁",
  dates: "July 24–27, 2026",
  theme: "Jinan 2026: Legacy and Influence",
  subTheme: "Honoring Our Past, Engaging Our Present, and Inspiring Our Future",
  confName: "LSUIC 20th Annual Conference",
  confYear: 2026,
  city: "Jinan",
} as const;

export const HOTEL_ADDRESS_LABEL =
  "Hotel address (DiDi / maps / bus apps)";

export const HOTEL_APP_SEARCH_TIP =
  "Copy the Chinese hotel name or full address above into DiDi (滴滴), Amap (高德), Baidu Maps, Apple Maps, Google Maps, or local bus apps.";

export const JINAN_TRAIN_HUBS = [
  {
    id: "west",
    en: "Jinan West Railway Station",
    zh: "济南西站",
    badge: "Recommended" as const,
    drive: "23–32 mins",
    toll: "¥10–20",
    note: "Closest to the hotel",
    cheatTag: "Best",
    transitCost: "¥10 total",
  },
  {
    id: "central",
    en: "Jinan Railway Station",
    zh: "济南站",
    badge: null,
    drive: "~36 mins",
    toll: "¥10",
    note: "Downtown hub",
    cheatTag: "Downtown",
    transitCost: "¥6 total",
  },
  {
    id: "east",
    en: "Jinan East Railway Station",
    zh: "济南东站",
    badge: "Farthest" as const,
    drive: "38–50 mins",
    toll: "¥10–22",
    note: "Far east station",
    cheatTag: "Far",
    transitCost: "¥11 total",
  },
] as const;

export const HOTEL_DRIVER_NOTE = `Pre-save for taxi / ride-hail drivers: ${NAV_GUIDE_META.venueZh} · ${NAV_GUIDE_META.addressZh}`;

export const NAV_PREFACE =
  "Welcome to the LSUIC 20th Annual Conference Navigation Guide! This document provides full, step-by-step travel directions from all three major Jinan railway stations to our conference venue: Arcadia Spa Golf International Hotel. Two travel options are provided for every arrival hub: public transport (subway + local bus) and direct DiDi/Taxi routes. All attendees traveling via public transport will rely on Bus K904 to reach the hotel; please review the critical bus operating hours to avoid travel delays.";

export const NAV_TOC = [
  {
    num: 1,
    title: "Key Travel Hub Overview (3 Major Jinan Train Stations)",
  },
  {
    num: 2,
    title: "Option 1: Jinan West Railway Station (Closest Station to Hotel – Recommended Route)",
    subs: ["Public Transport", "DiDi/Taxi Routes"],
  },
  {
    num: 3,
    title: "Option 2: Jinan Railway Station (City Center Station)",
    subs: ["Public Transport", "DiDi/Taxi Routes"],
  },
  {
    num: 4,
    title: "Option 3: Jinan East Railway Station (Far East Station)",
    subs: ["Public Transport", "DiDi/Taxi Routes"],
  },
  {
    num: 5,
    title: "Critical Bus K904 Important Rules (All sub-way/metro routes rely on this bus)",
  },
  {
    num: 6,
    title: "Walking Directions: From the Bus Stop to Hotel",
  },
  {
    num: 7,
    title: "Quick Reference Cheat Sheet for Conference Attendees",
  },
] as const;

export const TRAVEL_CONTACTS = [
  {
    name: "Robert D. Molley",
    role: "Chair on Logistics",
    phone: "18662966349",
    wechat: "wxid_32k7ikgo33ax22",
  },
  {
    name: "Harris M Bowulo",
    role: "Conference General Secretary",
    phone: "18514556295",
    wechat: "Bowulo2019",
  },
  {
    name: "Enoch Kwateh Dongbo",
    role: "Conference Chair",
    phone: "18506832159",
    wechat: "EKD231777285010",
  },
] as const;
