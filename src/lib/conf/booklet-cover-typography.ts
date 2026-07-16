/**
 * Cover page type scale for A4 delegate booklets (794×1123 @ 96dpi).
 * Shared by CoverPage (preview/print) and booklet-asset-svg (downloads).
 *
 * Hierarchy: org name → title → subtitle/theme → date → venue → location.
 * Sizes tuned for arm's-length legibility on printed copies.
 */
export const COVER_TYPOGRAPHY = {
  orgName: {
    fontSize: 18,
    fontWeight: 800,
    letterSpacing: "0.22em",
  },
  title: {
    fontSize: 48,
    fontWeight: 900,
    lineHeight: 1.12,
    letterSpacing: "-0.01em",
  },
  subtitle: {
    fontSize: 22,
    fontWeight: 600,
    letterSpacing: "0.04em",
  },
  themeLabel: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.22em",
  },
  themeText: {
    fontSize: 20,
    fontWeight: 600,
    lineHeight: 1.55,
  },
  date: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: "0.02em",
  },
  venue: {
    fontSize: 20,
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  location: {
    fontSize: 18,
  },
  tagline: {
    fontSize: 12,
    letterSpacing: "0.08em",
  },
  taglineMeta: {
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: "0.14em",
  },
  footer: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.14em",
  },
  /** Decorative elements (not part of the text hierarchy). */
  flagStar: 52,
  logoDivider: 18,
} as const;

/** Vertical rhythm for cover layout (px). */
export const COVER_SPACING = {
  orgNameMarginBottom: 14,
  goldDividerMarginBottom: 22,
  titleMarginBottom: 18,
  subtitleMarginBottom: 16,
  themePaddingY: 16,
  themePaddingX: 32,
  themeMarginBottom: 20,
  detailsCardPaddingY: 24,
  detailsCardPaddingX: 48,
  detailsCardMarginBottom: 24,
  dateMarginBottom: 12,
  locationMarginTop: 6,
  redRuleMarginBottom: 24,
} as const;
