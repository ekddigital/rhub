/**
 * Document System Constants
 * Single source of truth for company metadata, page dimensions, and branding
 */

/* ─── Company Information ──────────────────────────────────────── */
export const COMPANY = {
  name: "EKD DIGITAL",
  legalName: "EKD Digital (a subsidiary of A.N.D. GROUP OF COMPANIES LLC)",
  parentCompany: "A.N.D. GROUP OF COMPANIES LLC",
  registrationNo: "053881378",
  tinNo: "502203616",
  address: "Japan Freeway, Adjacent Lonestar, Jacob Town",
  addressLine2: "Paynesville City, Montserrado, Liberia",
  fullAddress:
    "Japan Freeway, Adjacent Lonestar, Jacob Town, Paynesville City, Montserrado, Liberia",
  phone: {
    liberia: "+231889233833",
    china: "+8618506832159",
    formatted: {
      liberia: "+231 889233833",
      china: "+86 18506832159",
    },
  },
  email: "info@ekddigital.com",
  website: "www.ekddigital.com",
  websiteUrl: "https://ekddigital.com",
  logo: "/logo.png",
} as const;

/* ─── A4 Page Dimensions ───────────────────────────────────────── */
export const A4 = {
  /** A4 in millimeters */
  mm: { width: 210, height: 297 },
  /** A4 in inches */
  inches: { width: 8.27, height: 11.69 },
  /** A4 at 96 DPI (CSS pixels for screen preview) */
  px96: { width: 794, height: 1123 },
  /** A4 at 72 DPI (PDF standard) */
  px72: { width: 595, height: 842 },
} as const;

/* ─── Page Margins (mm) ────────────────────────────────────────── */
export const MARGINS = {
  standard: { top: 25, right: 20, bottom: 25, left: 20 },
  narrow: { top: 15, right: 15, bottom: 15, left: 15 },
  wide: { top: 30, right: 25, bottom: 30, left: 25 },
} as const;

/* ─── Letterhead Dimensions (mm) ───────────────────────────────── */
export const LETTERHEAD = {
  /** Header area height for first page (with logo + decorations) */
  firstPageHeaderHeight: 38,
  /** Header area height for subsequent pages (thin gold line only) */
  subsequentPageHeaderHeight: 12,
  /** Footer height (registration info bar) */
  footerHeight: 18,
  /** Gold accent color matching the template */
  goldColor: "#C8A061",
  /** Dark primary color */
  primaryColor: "#1F1C18",
  /** Corner decoration width */
  cornerDecorationWidth: 45,
} as const;

/* ─── Typography ───────────────────────────────────────────────── */
export const TYPOGRAPHY = {
  heading: {
    fontFamily: "'Times New Roman', Times, serif",
    h1: { fontSize: "22px", fontWeight: 700, lineHeight: 1.3 },
    h2: { fontSize: "18px", fontWeight: 600, lineHeight: 1.35 },
    h3: { fontSize: "15px", fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: "13px", fontWeight: 600, lineHeight: 1.45 },
  },
  body: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "12px",
    lineHeight: 1.6,
  },
  caption: {
    fontFamily: "'Times New Roman', Times, serif",
    fontSize: "9px",
    lineHeight: 1.4,
    fontStyle: "italic" as const,
  },
  table: {
    fontFamily: "'Times New Roman', Times, serif",
    headerFontSize: "11px",
    bodyFontSize: "11px",
    lineHeight: 1.4,
  },
  mono: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: "9.5px",
    lineHeight: 1.5,
  },
} as const;

/* ─── Table Styling ────────────────────────────────────────────── */
export const TABLE_STYLES = {
  headerBg: "#C8A061",
  headerColor: "#FFFFFF",
  headerFontWeight: 600,
  borderColor: "#D4C5A9",
  stripedBg: "#FAF8F4",
  cellPadding: "6px 10px",
} as const;

/* ─── Signature Defaults ───────────────────────────────────────── */
export const SIGNATURE_DEFAULTS = {
  name: "Enoch Kwateh Dongbo",
  title: "Chief Executive Officer (CEO) & Founder",
  company: COMPANY.legalName,
  /** Populated dynamically when user uploads via the asset browser */
  signatureImage: undefined as string | undefined,
} as const;

/* ─── Export Formats ───────────────────────────────────────────── */
export type ExportFormat = "pdf" | "docx";
export type PageSize = "a4" | "letter";
export type MarginPreset = keyof typeof MARGINS;

/* ─── Document Template IDs ────────────────────────────────────── */
export const TEMPLATE_IDS = {
  STANDARD_LETTERHEAD: "standard-letterhead",
  MODERN_MINIMAL: "modern-minimal",
  PROPOSAL: "proposal",
} as const;
