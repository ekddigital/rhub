import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  LETTERHEAD_CONFIG,
  LETTER_COMPOSER_HEADER_PRIMARY_LINE,
  buildCityRegionLine,
} from "@/lib/conf/letterhead-config";
import { CONFERENCE_LETTER_ROSTER_ROLES } from "@/lib/conf/conference-letter-roster";
import { getBootstrapMemberContactFallback } from "@/lib/conf/bootstrap";
import { LETTERHEAD_DOWNLOAD_PARTS } from "@/lib/conf/letterhead-download-catalog";

// GET /api/conf/[confId]/letterhead
// Returns SVG or PNG of the LSUIC conference committee letterhead.
// Query params:
//   ?mode=page                 — full A4 first page with sidebar (default)
//   ?mode=header               — first-page header band (~190px)
//   ?mode=sidebar              — first-page committee sidebar column only
//   ?mode=footer               — first-page footer motto strip only
//   ?mode=continuation         — full A4 continuation page
//   ?mode=continuation-header  — continuation header band only
//   ?mode=continuation-footer  — continuation footer strip only
//   ?format=svg|png
//   ?download=1                — Content-Disposition: attachment with friendly filename
//   ?officeLabel=1|0           — show/hide "Office of the Conference Chairman" label

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toDataUri(data: Buffer, mime: string) {
  return `data:${mime};base64,${data.toString("base64")}`;
}

async function readPublicFile(...parts: string[]) {
  try {
    const fp = path.join(process.cwd(), "public", ...parts);
    return await readFile(fp);
  } catch {
    return null;
  }
}

const LOGO_CANDIDATES = ["conf/lsuic_logo.png", "conf/lsuic_logo_white_bg.png"];

async function loadLogo(): Promise<string | null> {
  for (const c of LOGO_CANDIDATES) {
    const buf = await readPublicFile(c);
    if (buf) return toDataUri(buf, "image/png");
  }
  return null;
}

async function loadSeal(): Promise<string | null> {
  const buf = await readPublicFile("conf", "liberia-seal.svg");
  if (buf) return toDataUri(buf, "image/svg+xml");
  return null;
}

type FontSet = { heading: string; body: string; semibold: string } | null;

let fontsCache: Promise<FontSet> | null = null;

async function loadFonts(): Promise<FontSet> {
  if (!fontsCache) {
    fontsCache = (async () => {
      const read = async (name: string) => {
        const buf = await readPublicFile("conf", "fonts", name);
        return buf ? toDataUri(buf, "font/ttf") : null;
      };
      const [heading, body, semibold] = await Promise.all([
        read("Oswald-Bold.ttf"),
        read("Poppins-Regular.ttf"),
        read("Poppins-SemiBold.ttf"),
      ]);
      if (!heading || !body || !semibold) return null;
      return { heading, body, semibold };
    })();
  }
  return fontsCache;
}

// ── Role labels ───────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  FINANCIAL_SECRETARY: "National Financial Secretary",
  TREASURER: "National Treasurer",
  COMMITTEE: "",
};

function memberRoleLabel(
  role: string,
  title: string | null,
  committeeScope: string | null,
): string {
  const base = ROLE_LABELS[role];
  if (base !== undefined && base !== "") return base;
  if (title) return title;
  if (committeeScope) return committeeScope;
  return "Committee Member";
}

type Member = {
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  phone: string | null;
  committeeScope: string | null;
};

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", opts);
  return (
    fmt(start, { month: "long", day: "numeric" }) +
    " – " +
    fmt(end, { month: "long", day: "numeric", year: "numeric" })
  );
}

function formatChinaPhone(phone: string | null | undefined): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.startsWith("86")) return `+${digits}`;
  return `+86${digits}`;
}

// ── Flag stripes (Liberian: 6 red + 5 white = 11) ────────────────────────────

const FLAG_11 = [
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

const PAGE_W = 794;
const PAGE_H = 1123;

const FIRST_STRIPE_H = 14;
const FIRST_HEADER_H = 178;
const FIRST_GOLD_BAR_H = 2.5;
const FIRST_OFFICE_ROW_H = 26;
const FIRST_NAVY_BAR_H = 7;
const FIRST_RED_BAR_H = 3;
const FIRST_TOTAL_HEADER_H =
  FIRST_STRIPE_H +
  FIRST_HEADER_H +
  FIRST_GOLD_BAR_H +
  FIRST_OFFICE_ROW_H +
  FIRST_NAVY_BAR_H +
  FIRST_RED_BAR_H;
const FOOTER_H = 32;
const FIRST_SIDEBAR_W = 215;
const FIRST_BODY_H = PAGE_H - FIRST_TOTAL_HEADER_H - FOOTER_H;

const CONTINUATION_STRIPES_H = 8;
const CONTINUATION_TITLEBAR_H = 62;
const CONTINUATION_HEADER_H = CONTINUATION_STRIPES_H + CONTINUATION_TITLEBAR_H;

const LETTER_FOOTER_MOTTO =
  "Honoring Our Past, Engaging Our Present, and Inspiring Our Future";

function flagStripes(W: number, h: number, yOff = 0): string {
  const sw = W / 11;
  return FLAG_11.map(
    (c, i) =>
      `<rect x="${(i * sw).toFixed(2)}" y="${yOff}" width="${(sw + 0.3).toFixed(2)}" height="${h}" fill="${c}"/>`,
  ).join("\n  ");
}

// ── Font @font-face block ─────────────────────────────────────────────────────

function fontBlock(fonts: FontSet): string {
  if (!fonts) return "";
  return `<style>
    @font-face { font-family: 'H'; src: url('${fonts.heading}') format('truetype'); font-weight: 700; }
    @font-face { font-family: 'B'; src: url('${fonts.body}') format('truetype'); }
    @font-face { font-family: 'S'; src: url('${fonts.semibold}') format('truetype'); font-weight: 600; }
  </style>`;
}

// ── Shared sidebar member list (first page) ───────────────────────────────────

function buildSidebarMemberLines(opts: {
  members: Member[];
  contentX: number;
  contentW: number;
  startY: number;
  maxY: number;
}): { svg: string; endY: number } {
  const KEY_ORDER = [
    "CHAIR",
    "VICE_CHAIR",
    "SECRETARY",
    "FINANCIAL_SECRETARY",
    "TREASURER",
  ];
  const sorted = [
    ...KEY_ORDER.map((r) => opts.members.find((m) => m.role === r)).filter(
      Boolean,
    ),
    ...opts.members.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as Member[];

  const centerX = opts.contentX + opts.contentW / 2;

  let sideLines = "";
  let sy = opts.startY;

  sideLines += `<text x="${centerX}" y="${sy}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="7.5" font-weight="800" fill="#002868" letter-spacing="0.8">${escapeXml("CONFERENCE COMMITTEE")}</text>`;
  sy += 6;
  sideLines += `<line x1="${opts.contentX + 8}" y1="${sy}" x2="${opts.contentX + opts.contentW - 8}" y2="${sy}" stroke="#002868" stroke-opacity="0.25" stroke-width="1"/>`;
  sy += 18;

  for (const m of sorted) {
    if (sy > opts.maxY) break;
    const label = memberRoleLabel(m.role, m.title, m.committeeScope);

    sideLines += `<text x="${centerX}" y="${sy}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="11" font-weight="700" fill="#002868" font-style="italic">${escapeXml(m.name)}</text>`;
    sy += 15;

    if (label) {
      sideLines += `<text x="${centerX}" y="${sy}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="9.5" fill="#002868" fill-opacity="0.85" font-style="italic">${escapeXml(label)}</text>`;
      sy += 13;
    }

    if (m.city) {
      sideLines += `<text x="${centerX}" y="${sy}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="9" fill="#444" font-style="italic">${escapeXml(m.city + ", China")}</text>`;
      sy += 11;
    }

    if (m.phone) {
      sideLines += `<text x="${centerX}" y="${sy}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="10.5" font-weight="700" fill="#002868" font-style="italic">${escapeXml(formatChinaPhone(m.phone))}</text>`;
      sy += 13;
    }

    sy += 4;
    sideLines += `<line x1="${opts.contentX + 8}" y1="${sy}" x2="${opts.contentX + opts.contentW - 8}" y2="${sy}" stroke="#002868" stroke-opacity="0.15" stroke-width="0.8"/>`;
    sy += 12;
  }

  return { svg: sideLines, endY: sy };
}

// ── FIRST PAGE (full A4 with sidebar, OR header-only strip) ──────────────────

function buildFirstPageSvg(opts: {
  headerOnly: boolean;
  showOfficeLabel: boolean;
  confName: string;
  city: string;
  venue: string | null;
  dateRange: string;
  members: Member[];
  logoUri: string | null;
  sealUri: string | null;
  fonts: FontSet;
}): string {
  const W = PAGE_W;
  const H = opts.headerOnly ? FIRST_TOTAL_HEADER_H : PAGE_H;
  const logoX = 18;
  const logoY = FIRST_STRIPE_H + 16;
  const logoW = 108;
  const logoH = 108;
  const sealW = 100;
  const sealH = 100;
  const sealX = W - 18 - sealW;
  const sealY = FIRST_STRIPE_H + 16;
  const textCX = W / 2;

  const yOrg = FIRST_STRIPE_H + 44;
  const yConf = yOrg + 28;
  const yCity = yConf + 16;
  const yDate = yCity + 14;
  const yEmail = yDate + 16;
  const yWebsite = yEmail + 14;
  const yOfficer = yWebsite + 14;

  const chairPhone = formatChinaPhone(
    opts.members.find((m) => m.role === "CHAIR")?.phone ||
      LETTERHEAD_CONFIG.officerPhones.chair,
  );
  const coChairPhone = formatChinaPhone(
    opts.members.find((m) => m.role === "VICE_CHAIR")?.phone ||
      LETTERHEAD_CONFIG.officerPhones.coChair,
  );
  const secretaryPhone = formatChinaPhone(
    opts.members.find((m) => m.role === "SECRETARY")?.phone ||
      LETTERHEAD_CONFIG.officerPhones.secretary,
  );

  const officerLine = `Chair: ${chairPhone} · Co-Chair: ${coChairPhone} · Secretary: ${secretaryPhone}`;
  const emailEntries = [
    LETTERHEAD_CONFIG.primaryEmail,
    LETTERHEAD_CONFIG.secondaryEmail,
    LETTERHEAD_CONFIG.tertiaryEmail,
  ]
    .map((v) => v.trim())
    .filter(Boolean);
  const emailLine = emailEntries.length
    ? `Email: ${emailEntries.join(" · ")}`
    : "Email:";

  const websiteMain = LETTERHEAD_CONFIG.officialWebsite.replace(
    /https?:\/\//g,
    "",
  );
  const websitePortal = LETTERHEAD_CONFIG.conferenceWebsite.replace(
    /https?:\/\//g,
    "",
  );
  const websiteLine =
    websitePortal && websitePortal !== websiteMain
      ? `Website: ${websiteMain} · Portal: ${websitePortal}`
      : `Website: ${websiteMain}`;

  const goldY = FIRST_STRIPE_H + FIRST_HEADER_H;
  const officeRowY = goldY + FIRST_GOLD_BAR_H;
  const navyY = officeRowY + FIRST_OFFICE_ROW_H;
  const redY = navyY + FIRST_NAVY_BAR_H;

  const sideContentX = 11;
  const sideContentW = FIRST_SIDEBAR_W - 11;
  const { svg: sideLines } = buildSidebarMemberLines({
    members: opts.members,
    contentX: sideContentX,
    contentW: sideContentW,
    startY: FIRST_TOTAL_HEADER_H + 20,
    maxY: FIRST_TOTAL_HEADER_H + FIRST_BODY_H - 16,
  });

  const logoBlock = opts.logoUri
    ? `<image href="${escapeXml(opts.logoUri)}" x="${logoX}" y="${logoY}" width="${logoW}" height="${logoH}" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="${logoX + logoW / 2}" y="${logoY + logoH / 2}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="14" font-weight="700" fill="#002868">LSUIC</text>`;

  const sealBlock = opts.sealUri
    ? `<image href="${escapeXml(opts.sealUri)}" x="${sealX}" y="${sealY}" width="${sealW}" height="${sealH}" preserveAspectRatio="xMidYMid meet"/>`
    : `<text x="${sealX + sealW / 2}" y="${sealY + sealH / 2}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="8" fill="#002868">REPUBLIC OF LIBERIA</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>

  <!-- Page background -->
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>

  <!-- Top stripes -->
  ${flagStripes(W, FIRST_STRIPE_H)}

  <!-- Header row -->
  <rect y="${FIRST_STRIPE_H}" width="${W}" height="${FIRST_HEADER_H}" fill="#FFFFFF"/>

  ${logoBlock}

  <!-- Center text -->
  <text x="${textCX}" y="${yOrg}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="15.5" font-weight="700" fill="#002868" letter-spacing="0.4">${escapeXml(LETTERHEAD_CONFIG.organizationName)}</text>
  <text x="${textCX}" y="${yConf}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="11" font-weight="600" fill="#C8A061">${escapeXml(opts.confName)}</text>
  <text x="${textCX}" y="${yCity}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="9" fill="#555555">${escapeXml(buildCityRegionLine(opts.city))}</text>
  <text x="${textCX}" y="${yDate}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="9" fill="#555555">${escapeXml(opts.dateRange)}</text>
  <text x="${textCX}" y="${yEmail}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="7.2" fill="#777777">${escapeXml(emailLine)}</text>
  <text x="${textCX}" y="${yWebsite}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="7.6" fill="#777777">${escapeXml(websiteLine)}</text>
  <text x="${textCX}" y="${yOfficer}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="8.2" font-weight="700" fill="#002868">${escapeXml(officerLine)}</text>

  ${sealBlock}

  <!-- Gold divider + office row + bars -->
  <rect y="${goldY}" width="${W}" height="${FIRST_GOLD_BAR_H}" fill="#C8A061"/>
  <rect y="${officeRowY}" width="${W}" height="${FIRST_OFFICE_ROW_H}" fill="#FFFFFF"/>
  ${
    opts.showOfficeLabel
      ? `<text x="${W - 18}" y="${officeRowY + 16}" text-anchor="end" font-family="S,Arial,sans-serif" font-size="9" font-weight="700" fill="#002868" font-style="italic">${escapeXml(LETTERHEAD_CONFIG.defaultOfficeLabel)}</text>`
      : ""
  }
  <rect y="${navyY}" width="${W}" height="${FIRST_NAVY_BAR_H}" fill="#002868"/>
  <rect y="${redY}" width="${W}" height="${FIRST_RED_BAR_H}" fill="#BF0A30"/>

  ${
    !opts.headerOnly
      ? `
  <!-- Sidebar + accents -->
  <rect x="0" y="${FIRST_TOTAL_HEADER_H}" width="${FIRST_SIDEBAR_W}" height="${FIRST_BODY_H}" fill="#FFFFFF"/>
  <rect x="${FIRST_SIDEBAR_W - 1}" y="${FIRST_TOTAL_HEADER_H}" width="1" height="${FIRST_BODY_H}" fill="#dde3ef"/>
  <rect x="0" y="${FIRST_TOTAL_HEADER_H}" width="8" height="${FIRST_BODY_H}" fill="#002868"/>
  <rect x="8" y="${FIRST_TOTAL_HEADER_H}" width="3" height="${FIRST_BODY_H}" fill="#BF0A30"/>

  <!-- Sidebar roster -->
  ${sideLines}

  <!-- Footer -->
  <rect y="${H - FOOTER_H}" width="${W}" height="${FOOTER_H}" fill="#002868"/>
  <rect y="${H - FOOTER_H}" width="${W}" height="2" fill="#BF0A30"/>
  <text x="${W / 2}" y="${H - 11}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="8" font-weight="700" fill="#C8A061" letter-spacing="0.5">${escapeXml(LETTER_FOOTER_MOTTO)}</text>
  `
      : ""
  }
</svg>`;
}

function buildSidebarOnlySvg(opts: {
  members: Member[];
  fonts: FontSet;
}): string {
  const W = FIRST_SIDEBAR_W;
  const H = FIRST_BODY_H;

  const { svg: sideLines } = buildSidebarMemberLines({
    members: opts.members,
    contentX: 11,
    contentW: W - 11,
    startY: 20,
    maxY: H - 16,
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>
  <rect x="${W - 1}" y="0" width="1" height="${H}" fill="#dde3ef"/>
  <rect x="0" y="0" width="8" height="${H}" fill="#002868"/>
  <rect x="8" y="0" width="3" height="${H}" fill="#BF0A30"/>
  ${sideLines}
</svg>`;
}

function buildFirstPageFooterSvg(opts: { fonts: FontSet }): string {
  const W = PAGE_W;
  const H = FOOTER_H;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="#002868"/>
  <rect y="0" width="${W}" height="2" fill="#BF0A30"/>
  <text x="${W / 2}" y="${H - 11}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="8" font-weight="700" fill="#C8A061" letter-spacing="0.5">${escapeXml(LETTER_FOOTER_MOTTO)}</text>
</svg>`;
}

// ── CONTINUATION PAGE (compact header, full-width body) ──────────────────────

function buildContinuationSvg(opts: {
  confName: string;
  city: string;
  venue: string | null;
  dateRange: string;
  logoUri: string | null;
  sealUri: string | null;
  fonts: FontSet;
  showOfficeLabel: boolean;
  headerOnly?: boolean;
  footerOnly?: boolean;
}): string {
  const W = PAGE_W;
  const FOOTER_H = 32;

  if (opts.footerOnly) {
    const H = FOOTER_H;
    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>
  <rect width="${W}" height="${H}" fill="#002868"/>
  <rect y="0" width="${W}" height="2" fill="#BF0A30"/>
  <text x="${W / 2}" y="${H - 11}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="8" font-weight="700" fill="#C8A061" letter-spacing="0.5">${escapeXml(LETTER_FOOTER_MOTTO)}</text>
</svg>`;
  }

  const H = opts.headerOnly ? CONTINUATION_HEADER_H : PAGE_H;
  const titleBarY = CONTINUATION_STRIPES_H;
  const titleY = titleBarY + 24;
  const officeY = titleBarY + 24;
  const titleBottom = titleBarY + CONTINUATION_TITLEBAR_H;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>

  <!-- Page background -->
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>

  <!-- Top stripes -->
  ${flagStripes(W, CONTINUATION_STRIPES_H)}

  <!-- Title bar -->
  <rect y="${titleBarY}" width="${W}" height="${CONTINUATION_TITLEBAR_H}" fill="#FFFFFF"/>
  <text x="22" y="${titleY}" text-anchor="start" font-family="H,Arial,sans-serif" font-size="10" font-weight="700" fill="#002868">${escapeXml(LETTER_COMPOSER_HEADER_PRIMARY_LINE)}</text>
  ${
    opts.showOfficeLabel
      ? `<text x="${W - 22}" y="${officeY}" text-anchor="end" font-family="S,Arial,sans-serif" font-size="9" fill="#777777" font-style="italic">${escapeXml(LETTERHEAD_CONFIG.defaultOfficeLabel)}</text>`
      : ""
  }
  <rect y="${titleBottom - 2}" width="${W}" height="2" fill="#C8A061"/>

  ${
    !opts.headerOnly
      ? `
  <!-- Footer -->
  <rect y="${H - FOOTER_H}" width="${W}" height="${FOOTER_H}" fill="#002868"/>
  <rect y="${H - FOOTER_H}" width="${W}" height="2" fill="#BF0A30"/>
  <text x="${W / 2}" y="${H - 11}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="8" font-weight="700" fill="#C8A061" letter-spacing="0.5">${escapeXml(LETTER_FOOTER_MOTTO)}</text>
  `
      : ""
  }
</svg>`;
}

function resolveLetterheadFilename(
  mode: string,
  format: string,
  confId: string,
): string {
  const part = LETTERHEAD_DOWNLOAD_PARTS.find((p) => p.mode === mode);
  const base = part?.filenameBase ?? `lsuic-letterhead-${mode}`;
  return `${base}-${confId}.${format === "svg" ? "svg" : "png"}`;
}

function basePngWidthForMode(mode: string): number {
  return mode === "sidebar" ? FIRST_SIDEBAR_W : PAGE_W;
}

function parsePngScale(raw: string | null, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(6, Math.round(n)));
}

function parseShowOfficeLabel(raw: string | null): boolean {
  if (!raw) return true;
  const normalized = raw.trim().toLowerCase();
  return !(
    normalized === "0" ||
    normalized === "false" ||
    normalized === "off" ||
    normalized === "no"
  );
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;

    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "page";
    const format = url.searchParams.get("format") ?? "png";
    const asDownload = url.searchParams.get("download") === "1";
    const showOfficeLabel = parseShowOfficeLabel(
      url.searchParams.get("officeLabel"),
    );
    const pngScale = parsePngScale(
      url.searchParams.get("scale"),
      asDownload ? 4 : 1,
    );

    const [event, membersRows] = await Promise.all([
      prisma.confEvent.findUnique({
        where: { id: confId },
        select: {
          name: true,
          city: true,
          venue: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.confMember.findMany({
        where: {
          confId,
          isActive: true,
          role: { in: CONFERENCE_LETTER_ROSTER_ROLES },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        select: {
          name: true,
          role: true,
          title: true,
          city: true,
          phone: true,
          committeeScope: true,
        },
      }),
    ]);

    const members = membersRows.map((m) => {
      const fb = getBootstrapMemberContactFallback(m.name);
      return {
        ...m,
        phone: (m.phone ?? "").trim() || fb?.phone || null,
        city: (m.city ?? "").trim() || fb?.city || null,
      };
    });

    if (!event) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    const [logoUri, sealUri, fonts] = await Promise.all([
      loadLogo(),
      loadSeal(),
      loadFonts(),
    ]);

    const dateRange = formatDateRange(
      new Date(event.startsAt),
      new Date(event.endsAt),
    );

    let svg: string;
    if (mode === "sidebar") {
      svg = buildSidebarOnlySvg({ members, fonts });
    } else if (mode === "footer") {
      svg = buildFirstPageFooterSvg({ fonts });
    } else if (mode === "continuation-header") {
      svg = buildContinuationSvg({
        confName: event.name,
        city: event.city,
        venue: event.venue,
        dateRange,
        logoUri,
        sealUri,
        fonts,
        showOfficeLabel,
        headerOnly: true,
      });
    } else if (mode === "continuation-footer") {
      svg = buildContinuationSvg({
        confName: event.name,
        city: event.city,
        venue: event.venue,
        dateRange,
        logoUri,
        sealUri,
        fonts,
        showOfficeLabel,
        footerOnly: true,
      });
    } else if (mode === "continuation") {
      svg = buildContinuationSvg({
        confName: event.name,
        city: event.city,
        venue: event.venue,
        dateRange,
        logoUri,
        sealUri,
        fonts,
        showOfficeLabel,
      });
    } else {
      svg = buildFirstPageSvg({
        headerOnly: mode === "header",
        showOfficeLabel,
        confName: event.name,
        city: event.city,
        venue: event.venue,
        dateRange,
        members,
        logoUri,
        sealUri,
        fonts,
      });
    }

    const filename = resolveLetterheadFilename(mode, format, confId);
    const disposition = asDownload ? "attachment" : "inline";

    if (format === "svg") {
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Content-Disposition": `${disposition}; filename="${filename}"`,
        },
      });
    }

    // Convert SVG → PNG via resvg-js
    const { Resvg } = await import("@resvg/resvg-js");
    const fontsDir = path.join(process.cwd(), "public", "conf", "fonts");
    const resvg = new Resvg(svg, {
      background: mode === "sidebar" ? "transparent" : "white",
      fitTo: {
        mode: "width",
        value: Math.round(basePngWidthForMode(mode) * pngScale),
      },
      font: {
        fontDirs: [fontsDir],
        loadSystemFonts: true,
        defaultFontFamily: "Poppins",
      },
    });
    const pngData = resvg.render();
    const pngBuffer = Buffer.from(pngData.asPng());

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /letterhead error:", error);
    return NextResponse.json(
      { error: "Failed to generate letterhead" },
      { status: 500 },
    );
  }
}
