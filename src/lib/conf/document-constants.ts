/**
 * Shared document design tokens for conference letterhead, budgets, payments, and reports.
 * Mirrors letterhead route styling (colors, fonts, layout) for consistency.
 */

export const DOCUMENT_COLORS = {
  navy: "#002868",
  darkNavy: "#001A4E",
  red: "#BF0A30",
  gold: "#C8A061",
  white: "#FFFFFF",
  muted: "#777777",
  sideAccent: "#88A4C8",
  divider: "#1a3568",
} as const;

export const LIBERIAN_FLAG_STRIPES = [
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
] as const;

// ── A4 page layout (794 × 1123 px @ 96dpi) ───────────────────────────────────

export const PAGE_LAYOUT = {
  width: 794,
  height: 1123,
  margin: { top: 20, right: 20, bottom: 20, left: 20 },
} as const;

export const PAGE_DIMENSIONS = {
  width: "794px",
  height: "1123px",
} as const;

// ── Letterhead sections ───────────────────────────────────────────────────────

export const LETTERHEAD_SECTIONS = {
  stripeHeight: 14,
  headerHeight: 158,
  goldBarHeight: 2.5,
  officeRowHeight: 26,
  navyBarHeight: 7,
  redBarHeight: 3,
  sidebarWidth: 215,
  footerHeight: 32,
  bodyHeight: 880,
} as const;

export const CONTENT_AREA = {
  width: PAGE_LAYOUT.width - (LETTERHEAD_SECTIONS.sidebarWidth + 40), // sidebar + margins
  height: LETTERHEAD_SECTIONS.bodyHeight,
} as const;

// ── Typography ───────────────────────────────────────────────────────────────

export const FONTS = {
  heading: "Oswald, 'Helvetica Neue', Arial, sans-serif",
  body: "Poppins, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Courier New', monospace",
} as const;

export const FONT_SIZES = {
  documentTitle: 20,
  sectionHeading: 14,
  tableHeader: 11,
  tableBody: 10,
  caption: 9,
  footer: 8,
  tiny: 7,
} as const;

// ── Table styling ────────────────────────────────────────────────────────────

export const TABLE_STYLES = {
  headerBg: DOCUMENT_COLORS.navy,
  headerTextColor: DOCUMENT_COLORS.white,
  headerFontSize: FONT_SIZES.tableHeader,
  rowBg: DOCUMENT_COLORS.white,
  rowAltBg: "#f9f9f9",
  borderColor: "#ddd",
  borderWidth: "1px",
  cellPadding: 8,
  minRowHeight: 24,
} as const;

// ── Document types ───────────────────────────────────────────────────────────

export const DOCUMENT_TYPES = {
  LETTER: "letter",
  BUDGET: "budget",
  PAYMENT: "payment",
  REPORT: "report",
} as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];

// ── Common utility for date formatting ────────────────────────────────────────

export function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", opts);
  return (
    fmt(start, { month: "long", day: "numeric" }) +
    " – " +
    fmt(end, { month: "long", day: "numeric", year: "numeric" })
  );
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
