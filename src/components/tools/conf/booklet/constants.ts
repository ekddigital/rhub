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

// ─── A4 page size (96 DPI — matches pdfExport html2canvas capture) ─────────
export const BOOKLET_A4 = {
  width: 794,
  height: 1123,
} as const;

// ─── Delegate roster (booklet / print) ─────────────────────────────────────
/** Grid columns; rows derived from A4 content height (see below). */
export const DELEGATE_ROSTER_COLS = 3;

/** Shared delegate roster card sizing — fixed height, no flex-grow stretch. */
export const DELEGATE_ROSTER_GAP_PX = 8;
export const DELEGATE_ROSTER_GAP = `${DELEGATE_ROSTER_GAP_PX}px`;
/** Taller cards + 6 rows (18/page) for readable PDF text. */
export const DELEGATE_CARD_HEIGHT = 122;
export const DELEGATE_ROSTER_ROWS = 6;

/** Fixed row cap — 18 delegates/page (6×3) for legible roster PDFs. */
export const DELEGATES_PER_BOOKLET_PAGE =
  DELEGATE_ROSTER_COLS * DELEGATE_ROSTER_ROWS;
export const DELEGATE_CARD_PHOTO_SIZE = 76;
export const DELEGATE_CARD_PADDING = "5px 7px 4px";
export const DELEGATE_CARD_INNER_GAP = "7px";

// ─── Static asset paths (served from /public) ─────────────────────────────────
export const ASSETS = {
  lsuicLogo: "/conf/lsuic_logo.png",
  liberiaSeal: "/conf/liberia-seal.svg",
  cityEvening: "/conf/assets/jinan_city/evening_view_portrait.png",
  cityDay: "/conf/assets/jinan_city/day_view_landscape.png",
  cityMorning: "/conf/assets/jinan_city/morning_view_landscape.png",
  hotelEntrance: "/conf/assets/hotel/main_entrance_view.png",
  hotelConferenceHall: "/conf/assets/hotel/conference_hall.jpg",
  // State dignitaries — shown on booklet cover
  presidentBoakai: "/conf/president_boakai_Liberia.png",
  presidentXi: "/conf/president_xi_China.png",
  // Placeholder for delegates who have not yet uploaded a photo
  placeholderDelegate: "/conf/placeholder-delegate.svg",
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
