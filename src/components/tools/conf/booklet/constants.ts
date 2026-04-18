// ─── LSUIC Brand Palette ──────────────────────────────────────────────────────
export const C = {
  blue: "#002868", // Liberian flag blue canton — primary
  red: "#BF0A30", // Liberian flag red stripes — accent
  white: "#FFFFFF",
  gold: "#C8A061", // EKD brand gold — secondary accent
  darkBlue: "#001A4E", // Deeper navy for gradients / cover bg
  lightBlue: "#E8EEF8", // Pale blue for page card backgrounds
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#D1D9F0",
} as const;

// ─── Static asset paths (served from /public) ─────────────────────────────────
export const ASSETS = {
  lsuicLogo: "/conf/lsuic_logo.png",
  liberiaSeal: "/conf/liberia-seal.svg",
  cityEvening: "/conf/assets/jinan_city/evening_view_portrait.png",
  cityDay: "/conf/assets/jinan_city/day_view_landscape.png",
  cityMorning: "/conf/assets/jinan_city/morning_view_landscape.png",
  hotelEntrance: "/conf/assets/hotel/main_entrance_view.png",
  hotelConferenceHall: "/conf/assets/hotel/conference_hall.jpg",
} as const;

// ─── Liberian flag stripe patterns ───────────────────────────────────────────
export const FLAG_STRIPES_11 = [
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
] as const;
export const FLAG_STRIPES_7 = [
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
] as const;
export const FLAG_STRIPES_9 = [
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
] as const;
