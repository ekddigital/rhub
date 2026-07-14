/**
 * Server-side SVG builders for downloadable conference booklet assets.
 * Dimensions match A4 at 96 DPI (794 × 1123), consistent with letterhead exports.
 */

import { buildCityRegionLine } from "@/lib/conf/letterhead-config";
import {
  COVER_TYPOGRAPHY,
} from "@/lib/conf/booklet-cover-typography";

export const BOOKLET_PAGE_W = 794;
export const BOOKLET_PAGE_H = 1123;

const C = {
  blue: "#002868",
  red: "#BF0A30",
  white: "#FFFFFF",
  gold: "#C8A061",
  darkBlue: "#001A4E",
  lightBlue: "#E8EEF8",
  text: "#1A1A1A",
  muted: "#6B7280",
  border: "#D1D9F0",
} as const;

const FLAG_11 = [
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

const FLAG_7 = [
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
  C.white,
  C.red,
] as const;

const FLAG_9 = [
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

const ORG_NAME = "Liberian Student Union in China";
const MOTTO = "Excellence Through Hard Work";

export type BookletAssetContext = {
  confName: string;
  confYear: number;
  city: string;
  venue: string | null;
  dateRange: string;
  bookletTitle: string;
  bookletSubtitle: string | null;
  theme: string | null;
  logoUri: string | null;
  sealUri: string | null;
  cityPhotoUri: string | null;
  hotelPhotoUri: string | null;
  fonts: FontSet;
};

type FontSet = { heading: string; body: string; semibold: string } | null;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function fontBlock(fonts: FontSet): string {
  if (!fonts) return "";
  return `<style>
    @font-face { font-family: 'H'; src: url('${fonts.heading}') format('truetype'); font-weight: 700; }
    @font-face { font-family: 'B'; src: url('${fonts.body}') format('truetype'); }
    @font-face { font-family: 'S'; src: url('${fonts.semibold}') format('truetype'); font-weight: 600; }
  </style>`;
}

function flagStripes(
  width: number,
  height: number,
  colors: readonly string[],
  y = 0,
): string {
  const sw = width / colors.length;
  return colors
    .map(
      (color, i) =>
        `<rect x="${(i * sw).toFixed(2)}" y="${y}" width="${(sw + 0.3).toFixed(2)}" height="${height}" fill="${color}"${color === C.white ? ' opacity="0.85"' : ""}/>`,
    )
    .join("\n  ");
}

function logoImage(
  uri: string | null,
  x: number,
  y: number,
  size: number,
  fallback: string,
): string {
  if (uri) {
    return `<image href="${escapeXml(uri)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  return `<text x="${x + size / 2}" y="${y + size / 2 + 4}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="12" font-weight="700" fill="${C.blue}">${escapeXml(fallback)}</text>`;
}

export function buildBookletCoverSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const H = BOOKLET_PAGE_H;
  const stripeH = 28;
  const cantonW = 222;
  const cantonH = stripeH * 6;
  const T = COVER_TYPOGRAPHY;

  const bgPhoto = ctx.cityPhotoUri
    ? `<image href="${escapeXml(ctx.cityPhotoUri)}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="${W}" height="${H}" fill="${C.darkBlue}"/>`;

  const themeBlock = ctx.theme
    ? `<rect x="${W / 2 - 250}" y="518" width="500" height="78" rx="8" fill="${C.gold}20" stroke="${C.gold}80" stroke-width="1.5"/>
  <text x="${W / 2}" y="542" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="${T.themeLabel.fontSize}" font-weight="800" fill="${C.gold}" letter-spacing="2.2">CONFERENCE THEME</text>
  <text x="${W / 2}" y="576" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="${T.themeText.fontSize}" font-weight="600" fill="${C.white}">&ldquo;${escapeXml(ctx.theme)}&rdquo;</text>`
    : "";

  const subtitleBlock = ctx.bookletSubtitle
    ? `<text x="${W / 2}" y="472" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="${T.subtitle.fontSize}" font-weight="600" fill="${C.gold}" letter-spacing="0.6">${escapeXml(ctx.bookletSubtitle)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${fontBlock(ctx.fonts)}
    <linearGradient id="coverGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,18,56,0.92)"/>
      <stop offset="22%" stop-color="rgba(0,28,80,0.78)"/>
      <stop offset="45%" stop-color="rgba(0,28,80,0.55)"/>
      <stop offset="72%" stop-color="rgba(0,0,0,0.60)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.88)"/>
    </linearGradient>
  </defs>

  ${bgPhoto}
  <rect width="${W}" height="${H}" fill="url(#coverGrad)"/>

  ${flagStripes(W, stripeH, FLAG_11)}
  <rect x="0" y="0" width="${cantonW}" height="${cantonH}" fill="${C.blue}"/>
  <text x="${cantonW / 2}" y="${cantonH / 2 + 8}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="${T.flagStar}" fill="${C.white}">★</text>

  <circle cx="${W / 2 - 72}" cy="250" r="58" fill="${C.white}" stroke="${C.gold}" stroke-opacity="0.6" stroke-width="4"/>
  ${logoImage(ctx.logoUri, W / 2 - 72 - 45, 250 - 45, 90, "LSUIC")}

  <circle cx="${W / 2 + 72}" cy="250" r="58" fill="${C.white}" stroke="${C.red}" stroke-opacity="0.6" stroke-width="4"/>
  ${logoImage(ctx.sealUri, W / 2 + 72 - 45, 250 - 45, 90, "Seal")}

  <text x="${W / 2}" y="340" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="${T.orgName.fontSize}" font-weight="800" fill="${C.gold}" letter-spacing="2.2">${escapeXml(ORG_NAME.toUpperCase())}</text>
  <line x1="${W / 2 - 50}" y1="354" x2="${W / 2 + 50}" y2="354" stroke="${C.gold}" stroke-width="1.5"/>
  <text x="${W / 2}" y="424" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="${T.title.fontSize}" font-weight="900" fill="${C.white}">${escapeXml(ctx.bookletTitle)}</text>
  ${subtitleBlock}
  ${themeBlock}

  <line x1="${W / 2 - 50}" y1="612" x2="${W / 2 + 50}" y2="612" stroke="${C.red}" stroke-width="2"/>

  <rect x="${W / 2 - 230}" y="628" width="460" height="112" rx="14" fill="${C.white}18" stroke="${C.white}40"/>
  <text x="${W / 2}" y="668" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="${T.date.fontSize}" font-weight="800" fill="${C.white}">${escapeXml(ctx.dateRange)}</text>
  <text x="${W / 2}" y="696" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="${T.venue.fontSize}" font-weight="600" fill="${C.white}">${escapeXml(ctx.venue ?? "Conference Venue")}</text>
  <text x="${W / 2}" y="718" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="${T.location.fontSize}" fill="${C.white}" opacity="0.9">${escapeXml(buildCityRegionLine(ctx.city))}</text>

  <line x1="${W / 2 - 52}" y1="748" x2="${W / 2 - 18}" y2="748" stroke="${C.gold}" stroke-opacity="0.8"/>
  <text x="${W / 2}" y="752" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="${T.taglineMeta.fontSize}" font-weight="800" fill="${C.gold}" letter-spacing="1.4">EST. JULY 2006</text>
  <line x1="${W / 2 + 18}" y1="748" x2="${W / 2 + 52}" y2="748" stroke="${C.gold}" stroke-opacity="0.8"/>

  ${flagStripes(W, 20, FLAG_7, H - 36)}
  <rect y="${H - 16}" width="${W}" height="16" fill="rgba(0,10,32,0.92)"/>
  <text x="${W / 2}" y="${H - 5}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="${T.footer.fontSize}" font-weight="600" fill="${C.white}" opacity="0.7" letter-spacing="1.4">OFFICIAL CONFERENCE BOOKLET · PAGE 1</text>
</svg>`;
}

export function buildBookletBackCoverSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const H = BOOKLET_PAGE_H;
  const photoH = 200;

  const hotelPhoto = ctx.hotelPhotoUri
    ? `<image href="${escapeXml(ctx.hotelPhotoUri)}" x="0" y="20" width="${W}" height="${photoH}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="0" y="20" width="${W}" height="${photoH}" fill="${C.lightBlue}"/>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(ctx.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>

  ${flagStripes(W, 20, FLAG_7)}
  <rect x="0" y="0" width="130" height="86" fill="${C.blue}"/>
  <text x="65" y="52" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="32" fill="${C.white}">★</text>

  <clipPath id="hotelClip"><rect x="0" y="20" width="${W}" height="${photoH}"/></clipPath>
  <g clip-path="url(#hotelClip)">
    ${hotelPhoto}
    <rect x="0" y="${20 + photoH - 80}" width="${W}" height="80" fill="url(#fadeWhite)"/>
  </g>
  <defs>
    <linearGradient id="fadeWhite" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.white}" stop-opacity="0"/>
      <stop offset="100%" stop-color="${C.white}" stop-opacity="1"/>
    </linearGradient>
  </defs>
  <text x="${W - 20}" y="${20 + photoH - 12}" text-anchor="end" font-family="S,Arial,sans-serif" font-size="8" font-weight="600" fill="${C.muted}" letter-spacing="1">${escapeXml(`${ctx.venue ?? "Venue"} · ${ctx.city}`)}</text>

  ${logoImage(ctx.logoUri, W / 2 - 44, 260, 88, "LSUIC")}
  <text x="${W / 2}" y="370" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="11" font-weight="800" fill="${C.blue}" letter-spacing="2.2">${escapeXml(ORG_NAME.toUpperCase())}</text>
  <text x="${W / 2}" y="388" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="10" fill="${C.muted}" font-style="italic">${escapeXml(MOTTO)}</text>

  <line x1="${W / 2 - 150}" y1="410" x2="${W / 2 - 12}" y2="410" stroke="${C.red}" stroke-width="1.5"/>
  <text x="${W / 2}" y="416" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="16" fill="${C.blue}">★</text>
  <line x1="${W / 2 + 12}" y1="410" x2="${W / 2 + 150}" y2="410" stroke="${C.blue}" stroke-width="1.5"/>

  <text x="${W / 2}" y="450" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="17" font-weight="700" fill="${C.blue}">${escapeXml(ctx.confName)}</text>
  <text x="${W / 2}" y="472" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="11" fill="${C.muted}">${escapeXml(`${ctx.venue ?? "Venue"} · ${ctx.city}, China`)}</text>
  <text x="${W / 2}" y="492" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="11" fill="${C.muted}">${escapeXml(ctx.dateRange)}</text>

  <rect x="${W / 2 - 220}" y="520" width="440" height="96" rx="14" fill="${C.lightBlue}" stroke="${C.blue}33"/>
  <text x="${W / 2}" y="548" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="13" font-weight="700" fill="${C.blue}">Thank You for Attending</text>
  <text x="${W / 2}" y="580" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="11" fill="${C.muted}">Your participation makes LSUIC stronger. Together we advance</text>
  <text x="${W / 2}" y="596" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="11" fill="${C.muted}">education, unity, and development for Liberian students across China.</text>

  <line x1="40" y1="${H - 52}" x2="${W - 40}" y2="${H - 52}" stroke="url(#footerGrad)" stroke-width="1"/>
  <defs>
    <linearGradient id="footerGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${C.blue}"/>
      <stop offset="100%" stop-color="${C.red}"/>
    </linearGradient>
  </defs>
  <text x="40" y="${H - 32}" font-family="B,Arial,sans-serif" font-size="8" fill="${C.muted}">LSUIC © ${ctx.confYear}</text>
  <text x="${W / 2}" y="${H - 32}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="8" font-weight="600" fill="${C.blue}">Page · · ·</text>
  <text x="${W - 40}" y="${H - 32}" text-anchor="end" font-family="B,Arial,sans-serif" font-size="8" fill="${C.muted}">Established July 2006</text>

  ${flagStripes(W, 16, FLAG_11, H - 16)}
</svg>`;
}

export function buildBookletPageHeaderSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const stripeH = 14;
  const headerH = 52;
  const H = stripeH + headerH;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(ctx.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  ${flagStripes(W, stripeH, FLAG_9)}
  <line x1="0" y1="${H - 1}" x2="${W}" y2="${H - 1}" stroke="${C.blue}" stroke-width="1.5"/>
  ${logoImage(ctx.logoUri, 40, stripeH + 10, 30, "LSUIC")}
  <text x="78" y="${stripeH + 22}" font-family="H,Arial,sans-serif" font-size="8" font-weight="800" fill="${C.blue}" letter-spacing="1.2">${escapeXml(ORG_NAME.toUpperCase())}</text>
  <text x="78" y="${stripeH + 34}" font-family="B,Arial,sans-serif" font-size="7.5" fill="${C.muted}">${escapeXml(ctx.confName)}</text>
  <text x="${W - 72}" y="${stripeH + 28}" text-anchor="end" font-family="S,Arial,sans-serif" font-size="8" font-weight="700" fill="${C.red}" letter-spacing="1.4">SECTION TITLE</text>
  <circle cx="${W - 40}" cy="${stripeH + 26}" r="11" fill="${C.blue}"/>
  <text x="${W - 40}" y="${stripeH + 30}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="9" font-weight="700" fill="${C.white}">1</text>
</svg>`;
}

export function buildBookletPageFooterSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const H = 40;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(ctx.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  <line x1="40" y1="4" x2="${W - 40}" y2="4" stroke="${C.blue}" stroke-opacity="0.4" stroke-width="1"/>
  <text x="40" y="26" font-family="B,Arial,sans-serif" font-size="7.5" fill="${C.muted}">${escapeXml(ctx.confName)} · ${ctx.confYear}</text>
  <circle cx="${W / 2 - 8}" cy="22" r="8" fill="${C.blue}"/>
  <text x="${W / 2 - 8}" y="25" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="7" font-weight="700" fill="${C.white}">1</text>
  <text x="${W / 2 + 8}" y="25" font-family="B,Arial,sans-serif" font-size="8" fill="${C.border}">of · · ·</text>
  <text x="${W - 40}" y="26" text-anchor="end" font-family="B,Arial,sans-serif" font-size="7.5" fill="${C.muted}" font-style="italic">${escapeXml(MOTTO)}</text>
</svg>`;
}

export function buildBookletInteriorReferenceSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const H = BOOKLET_PAGE_H;
  const headerH = 66;
  const footerH = 40;
  const bodyY = headerH + 28;
  const bodyH = H - bodyY - footerH - 20;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(ctx.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  ${flagStripes(W, 14, FLAG_9)}
  <rect y="14" width="${W}" height="52" fill="${C.white}"/>
  <line x1="0" y1="66" x2="${W}" y2="66" stroke="${C.blue}" stroke-width="1.5"/>
  ${logoImage(ctx.logoUri, 40, 24, 30, "LSUIC")}
  <text x="78" y="36" font-family="H,Arial,sans-serif" font-size="8" font-weight="800" fill="${C.blue}" letter-spacing="1.2">${escapeXml(ORG_NAME.toUpperCase())}</text>
  <text x="78" y="48" font-family="B,Arial,sans-serif" font-size="7.5" fill="${C.muted}">${escapeXml(ctx.confName)}</text>

  <rect x="40" y="${bodyY}" width="${W - 80}" height="${bodyH}" rx="10" fill="none" stroke="${C.border}" stroke-width="2" stroke-dasharray="8 6"/>
  <text x="${W / 2}" y="${bodyY + bodyH / 2}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="12" fill="${C.muted}">Interior body content area</text>

  <line x1="40" y1="${H - footerH - 8}" x2="${W - 40}" y2="${H - footerH - 8}" stroke="${C.blue}" stroke-opacity="0.4"/>
  <text x="40" y="${H - 16}" font-family="B,Arial,sans-serif" font-size="7.5" fill="${C.muted}">${escapeXml(ctx.confName)} · ${ctx.confYear}</text>
  <text x="${W - 40}" y="${H - 16}" text-anchor="end" font-family="B,Arial,sans-serif" font-size="7.5" fill="${C.muted}" font-style="italic">${escapeXml(MOTTO)}</text>
</svg>`;
}

export function buildBookletSectionDividerSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const H = BOOKLET_PAGE_H;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(ctx.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="${C.lightBlue}"/>
  ${flagStripes(W, 20, FLAG_7)}
  <rect x="60" y="120" width="${W - 120}" height="${H - 240}" rx="16" fill="${C.white}" stroke="${C.blue}33" stroke-width="2"/>
  <text x="${W / 2}" y="${H / 2 - 24}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="22" font-weight="800" fill="${C.blue}">Section Divider</text>
  <text x="${W / 2}" y="${H / 2 + 8}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="12" fill="${C.muted}">Template placeholder — final artwork TBD</text>
  <text x="${W / 2}" y="${H / 2 + 36}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="11" font-weight="600" fill="${C.gold}">${escapeXml(ctx.confName)}</text>
  ${flagStripes(W, 16, FLAG_11, H - 16)}
</svg>`;
}

export function buildBookletTocReferenceSvg(ctx: BookletAssetContext): string {
  const W = BOOKLET_PAGE_W;
  const H = BOOKLET_PAGE_H;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(ctx.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="${C.white}"/>
  ${flagStripes(W, 14, FLAG_9)}
  <text x="${W / 2}" y="80" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="20" font-weight="800" fill="${C.blue}">Table of Contents</text>
  <text x="${W / 2}" y="108" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="11" fill="${C.muted}">Reference shell — live TOC is generated in Booklet Builder</text>
  ${[0, 1, 2, 3, 4, 5].map((i) => {
    const y = 160 + i * 42;
    return `<text x="80" y="${y}" font-family="S,Arial,sans-serif" font-size="11" font-weight="600" fill="${C.text}">Section ${i + 1} · · · · · · · · · · · · · · · · · · · ·</text>
  <text x="${W - 80}" y="${y}" text-anchor="end" font-family="B,Arial,sans-serif" font-size="11" fill="${C.muted}">${i + 3}</text>`;
  }).join("\n  ")}
  <rect x="80" y="${H - 120}" width="${W - 160}" height="56" rx="8" fill="${C.lightBlue}" stroke="${C.border}"/>
  <text x="${W / 2}" y="${H - 88}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="10" fill="${C.muted}">${escapeXml(ctx.confName)} · ${ctx.confYear}</text>
</svg>`;
}

export function basePngWidthForMode(mode: string): number {
  if (mode === "page-header") return BOOKLET_PAGE_W;
  if (mode === "page-footer") return BOOKLET_PAGE_W;
  return BOOKLET_PAGE_W;
}

export type { FontSet };
