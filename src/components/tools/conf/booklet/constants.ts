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

/** Vertical space inside A4Page content area (header, footer, content padding). */
export const BOOKLET_CONTENT_HEIGHT =
  BOOKLET_A4.height - 61 - 33 - 48;

// ─── Delegate roster (booklet / print) ─────────────────────────────────────
/** Grid columns; card height matches full-page (6-row) density on every page. */
export const DELEGATE_ROSTER_COLS = 3;

export const DELEGATE_ROSTER_GAP_PX = 8;
export const DELEGATE_ROSTER_GAP = `${DELEGATE_ROSTER_GAP_PX}px`;

/** Section header block inside DelegatesSection (title row + margin). */
export const DELEGATE_ROSTER_HEADER_BLOCK_H = 44;
export const DELEGATE_ROSTER_BODY_TEXT_EXTRA_H = 18;
export const DELEGATE_ROSTER_LAST_PAGE_FOOTER_H = 28;

/** Target 6 rows × 3 cols; card height always derived for this row count. */
export const DELEGATE_ROSTER_ROWS = 6;

export const DELEGATES_PER_BOOKLET_PAGE =
  DELEGATE_ROSTER_COLS * DELEGATE_ROSTER_ROWS;

export const DELEGATE_CARD_PADDING = "6px 7px";
export const DELEGATE_CARD_INNER_GAP = "8px";

export type DelegateRosterLayoutOptions = {
  bodyText?: boolean;
  lastPage?: boolean;
};

/** Usable vertical space for the delegate card grid on one roster page. */
export function delegateRosterUsableHeight(
  options?: DelegateRosterLayoutOptions,
): number {
  let h = BOOKLET_CONTENT_HEIGHT - DELEGATE_ROSTER_HEADER_BLOCK_H;
  if (options?.bodyText) h -= DELEGATE_ROSTER_BODY_TEXT_EXTRA_H;
  if (options?.lastPage) h -= DELEGATE_ROSTER_LAST_PAGE_FOOTER_H;
  return h;
}

/** Card height for full-page density; partial pages keep this size (no stretch). */
export function computeDelegateRosterCardHeight(
  delegatesOnPage: number,
  options?: DelegateRosterLayoutOptions,
): number {
  if (delegatesOnPage <= 0) return 122;
  const usable = delegateRosterUsableHeight(options);
  return Math.floor(
    (usable -
      Math.max(0, DELEGATE_ROSTER_ROWS - 1) * DELEGATE_ROSTER_GAP_PX) /
      DELEGATE_ROSTER_ROWS,
  );
}

/** Photo size scales with card height; capped so text column stays readable. */
export function computeDelegatePhotoSize(cardHeight: number): number {
  return Math.min(72, Math.max(48, Math.floor(cardHeight * 0.5)));
}

// ─── Static asset paths (served from /public) ─────────────────────────────────
export const ASSETS = {
  lsuicLogo: "/conf/lsuic_logo.png",
  liberiaSeal: "/conf/liberia-seal.svg",
  cityEvening: "/conf/assets/jinan_city/evening_view_portrait.png",
  cityDay: "/conf/assets/jinan_city/day_view_landscape.png",
  cityMorning: "/conf/assets/jinan_city/morning_view_landscape.png",
  hotelEntrance: "/conf/assets/hotel/main_entrance_view.png",
  hotelConferenceHall: "/conf/assets/hotel/conference_hall.jpg",
  // State dignitaries — shown on booklet cover / LEADER pages
  presidentBoakai: "/conf/president_boakai_Liberia.png",
  presidentXi: "/conf/president_xi_China.png",
  ambassadorThomas: "/conf/ambassador.jpg",
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
