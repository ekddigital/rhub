/**
 * Shared Document Styles
 * ═══════════════════════════════════════════════════════════════════
 * Single source of truth for style values consumed by both:
 *   • Web preview  (ContentRenderer.tsx / CoverPage.tsx / etc.)
 *   • DOCX export  (renderers.ts / coverPage.ts / pageLayout.ts / etc.)
 *
 * The web components consume CSS-px constants from `constants.ts` directly.
 * This module provides DOCX-unit equivalents derived from those SAME
 * constants so both renderers stay in sync automatically.
 *
 * ── Unit mapping ─────────────────────────────────────────────────
 * 1 CSS px  = 0.75 pt  (at 96 DPI)
 * 1 pt      = 2 half-points  (DOCX font size unit)
 * 1 pt      = 20 twips       (DOCX spacing unit)
 * So: CSS px × 1.5 = half-points,  CSS px × 15 = twips
 *
 * The web preview renders on a 794 × 1123 px canvas (A4 @ 96 DPI).
 * When captured to PDF, the effective text size is px × 0.75 pt.
 * DOCX_FONT_SCALE adjusts how closely the DOCX sizes match this.
 */

import { TYPOGRAPHY, TABLE_STYLES, LETTERHEAD } from "./constants";

/* ═════════════════════════════════════════════════════════════════
   Unit Conversions
   ════════════════════════════════════════════════════════════════ */

/** Parse a CSS px string (e.g. "12px") into a bare number. */
export const parsePx = (s: string): number => parseFloat(s);

/**
 * Master scale for DOCX font sizes relative to exact web-PDF parity.
 *
 *   1.0  → exact match with the website PDF  (~9 pt body text)
 *   1.11 → ~10 pt body  (comfortable for editing in Word)
 *   1.33 → ~12 pt body  (standard Word default)
 *
 * Adjust this single value to uniformly scale all DOCX content text.
 */
export const DOCX_FONT_SCALE = 1.0;

/** CSS px → DOCX half-points (for font sizes) */
export const pxToHalfPt = (px: number): number =>
  Math.round(px * 0.75 * DOCX_FONT_SCALE * 2);

/** CSS px → DOCX twips (for spacing / indentation) */
export const pxToTwips = (px: number): number =>
  Math.round(px * 15 * DOCX_FONT_SCALE);

/** mm → DOCX twips (1 in = 25.4 mm = 1440 twips) */
export const mmToTwips = (mm: number): number => Math.round(mm * (1440 / 25.4));

/* ═════════════════════════════════════════════════════════════════
   Color Tokens  (hex strings without '#', ready for docx)
   ════════════════════════════════════════════════════════════════ */

export const COLORS = {
  gold: LETTERHEAD.goldColor.replace("#", ""),
  primary: LETTERHEAD.primaryColor.replace("#", ""),
  white: "FFFFFF",
  lightBg: TABLE_STYLES.stripedBg.replace("#", ""),
  border: TABLE_STYLES.borderColor.replace("#", ""),
  /** Subtle column dividers inside header row */
  headerDivider: "E8D5B0",
  muted: "888888",
  subtle: "666666",
  bodyText: "333333",
  codeText: "E0DCD5",
} as const;

/* ═════════════════════════════════════════════════════════════════
   Font Family Names  (first family only — no CSS fallback stack)
   ════════════════════════════════════════════════════════════════ */

export const FONT = {
  serif: "Times New Roman",
  mono: "JetBrains Mono",
} as const;

/* ═════════════════════════════════════════════════════════════════
   Font Sizes  (DOCX half-points, derived from web TYPOGRAPHY)
   ════════════════════════════════════════════════════════════════ */

export const FONT_SIZES = {
  body: pxToHalfPt(parsePx(TYPOGRAPHY.body.fontSize)), // 12px → 18
  h1: pxToHalfPt(parsePx(TYPOGRAPHY.heading.h1.fontSize)), // 22px → 33
  h2: pxToHalfPt(parsePx(TYPOGRAPHY.heading.h2.fontSize)), // 18px → 27
  h3: pxToHalfPt(parsePx(TYPOGRAPHY.heading.h3.fontSize)), // 15px → 23
  h4: pxToHalfPt(parsePx(TYPOGRAPHY.heading.h4.fontSize)), // 13px → 20
  tableHeader: pxToHalfPt(parsePx(TYPOGRAPHY.table.headerFontSize)), // 11px → 17
  tableBody: pxToHalfPt(parsePx(TYPOGRAPHY.table.bodyFontSize)), // 11px → 17
  caption: pxToHalfPt(parsePx(TYPOGRAPHY.caption.fontSize)), // 9px  → 14
  mono: pxToHalfPt(parsePx(TYPOGRAPHY.mono.fontSize)), // 9.5px→ 14
} as const;

/** Heading level → half-point font size */
export const HEADING_SIZE_MAP: Record<number, number> = {
  1: FONT_SIZES.h1,
  2: FONT_SIZES.h2,
  3: FONT_SIZES.h3,
  4: FONT_SIZES.h4,
};

/** Heading level → colour (hex without '#') */
export const HEADING_COLOR_MAP: Record<number, string> = {
  1: COLORS.primary,
  2: COLORS.primary,
  3: COLORS.gold,
  4: COLORS.subtle,
};

/* ═════════════════════════════════════════════════════════════════
   Spacing  (twips — used for paragraph before/after, indentation)
   ════════════════════════════════════════════════════════════════ */

export const SPACING = {
  /** After a body paragraph */
  bodyAfter: 60,
  /** Heading before/after by level */
  headingBefore: { 1: 180, 2: 120, 3: 100, 4: 80 } as Record<number, number>,
  headingAfter: { 1: 60, 2: 40, 3: 40, 4: 30 } as Record<number, number>,
  /** After a list item */
  listItemAfter: 40,
  /** Body paragraph first-line indent (twips) — matches web textIndent: 1.5em */
  paragraphIndent: 360,
  /** List indent per nesting level (twips) */
  listIndentPerLevel: 360,
  /** Blockquote outer spacing */
  blockquoteBefore: 160,
  blockquoteAfter: 160,
  /** Figure image spacing */
  figureBefore: 120,
  figureAfter: 120,
  /** Gap between figure image and caption */
  figureCaptionGap: 40,
  /** Signature block spacer */
  signatureGap: 400,
  /** Table caption spacing */
  tableCaptionBefore: 200,
  tableCaptionAfter: 80,
  /** Table cell inner padding */
  headerCellBefore: 60,
  headerCellAfter: 60,
  bodyCellBefore: 40,
  bodyCellAfter: 40,
} as const;

/* ═════════════════════════════════════════════════════════════════
   CSS-ready helpers  (for web ContentRenderer / CoverPage / etc.)
   ════════════════════════════════════════════════════════════════ */

/** Heading colour per level — CSS format (with '#') */
export const WEB_HEADING_COLORS: Record<number, string> = {
  1: LETTERHEAD.primaryColor,
  2: LETTERHEAD.primaryColor,
  3: LETTERHEAD.goldColor,
  4: `#${COLORS.subtle}`,
};
