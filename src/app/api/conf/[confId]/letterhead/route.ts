import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/letterhead
// Returns SVG or PNG of the LSUIC conference committee letterhead.
// Query params:
//   ?mode=page         — full A4 first page with sidebar (default)
//   ?mode=header       — header-only strip (~190px tall)
//   ?mode=continuation — A4 continuation page with compact header
//   ?format=svg        — return raw SVG (debug)
//   ?format=png        — return PNG (default)

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
  TREASURER: "Treasurer",
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

// ── FIRST PAGE (full A4 with sidebar, OR header-only strip) ──────────────────

function buildFirstPageSvg(opts: {
  headerOnly: boolean;
  confName: string;
  city: string;
  venue: string | null;
  dateRange: string;
  members: Member[];
  logoUri: string | null;
  sealUri: string | null;
  fonts: FontSet;
}): string {
  const W = 794; // A4 @ 96 dpi
  const STRIPE_H = 14; // Liberian flag stripes
  const LOGO_ROW_H = 136; // logo / text / seal row
  const INFO_ROW_H = 40; // gold line + "Office of…" + navy bar
  const HEADER_H = STRIPE_H + LOGO_ROW_H + INFO_ROW_H; // 190
  const H = opts.headerOnly ? HEADER_H : 1123;
  const FOOTER_H = 32;
  const SIDEBAR_W = 185;

  // Logo geometry
  const logoR = 52;
  const logoCX = 18 + logoR; // 70
  const logoCY = STRIPE_H + 18 + logoR; // 84

  // Seal geometry (right-side mirror)
  const sealR = 50;
  const sealCX = W - 18 - sealR; // 726
  const sealCY = logoCY;

  // Center text column
  const textL = logoCX + logoR + 14; // 136
  const textR = sealCX - sealR - 14; // 662
  const textCX = (textL + textR) / 2; // 399

  // Y positions for text lines (absolute from SVG top)
  const t1 = STRIPE_H + 22; // org name
  const t2 = t1 + 22; // conf name
  const t3 = t2 + 18; // venue line 1
  const t4 = t3 + 15; // city / country
  const t5 = t4 + 14; // date range
  const t6 = t5 + 16; // email

  // Separator positions
  const goldY = STRIPE_H + LOGO_ROW_H; // 150
  const officeY = goldY + 24; // "Office of…" baseline
  const navyY = HEADER_H - 7; // 183

  // ── Sidebar members ──────────────────────────────────────────────────────
  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
  const sorted = [
    ...KEY_ORDER.map((r) => opts.members.find((m) => m.role === r)).filter(
      Boolean,
    ),
    ...opts.members.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as Member[];

  const sidePad = 10;
  let sideLines = "";
  let sy = HEADER_H + 20;

  // "CONFERENCE COMMITTEE" label
  sideLines += `<text x="${sidePad}" y="${sy}" font-family="H,Arial,sans-serif" font-size="7" font-weight="700" fill="#C8A061" letter-spacing="1">${escapeXml("CONFERENCE COMMITTEE")}</text>`;
  sy += 10;
  sideLines += `<line x1="${sidePad}" y1="${sy}" x2="${SIDEBAR_W - sidePad}" y2="${sy}" stroke="#C8A061" stroke-width="0.8"/>`;
  sy += 12;

  for (const m of sorted) {
    if (sy > H - FOOTER_H - 16) break;
    const label = memberRoleLabel(m.role, m.title, m.committeeScope);

    sideLines += `<text x="${sidePad}" y="${sy}" font-family="S,Arial,sans-serif" font-size="8.5" font-weight="600" fill="#FFFFFF" font-style="italic">${escapeXml(m.name)}</text>`;
    sy += 12;

    if (label) {
      sideLines += `<text x="${sidePad}" y="${sy}" font-family="B,Arial,sans-serif" font-size="7.5" fill="#C8A061">${escapeXml(label)}</text>`;
      sy += 12;
    }

    if (m.city) {
      sideLines += `<text x="${sidePad}" y="${sy}" font-family="B,Arial,sans-serif" font-size="7" fill="#88A4C8">${escapeXml(m.city + ", China")}</text>`;
      sy += 11;
    }

    if (m.phone) {
      sideLines += `<text x="${sidePad}" y="${sy}" font-family="S,Arial,sans-serif" font-size="7" font-weight="600" fill="#FFFFFF">${escapeXml(m.phone)}</text>`;
      sy += 11;
    }

    sy += 3;
    sideLines += `<line x1="${sidePad}" y1="${sy}" x2="${SIDEBAR_W - sidePad}" y2="${sy}" stroke="#1a3568" stroke-width="0.5"/>`;
    sy += 9;
  }

  // ── Logo block ───────────────────────────────────────────────────────────
  const logoBlock = opts.logoUri
    ? `<clipPath id="lc"><circle cx="${logoCX}" cy="${logoCY}" r="${logoR - 2}"/></clipPath>
       <circle cx="${logoCX}" cy="${logoCY}" r="${logoR}" fill="#fff" stroke="#C8A061" stroke-width="2.5"/>
       <image href="${escapeXml(opts.logoUri)}" x="${logoCX - logoR + 2}" y="${logoCY - logoR + 2}" width="${(logoR - 2) * 2}" height="${(logoR - 2) * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#lc)"/>`
    : `<circle cx="${logoCX}" cy="${logoCY}" r="${logoR}" fill="#fff" stroke="#C8A061" stroke-width="2.5"/>
       <text x="${logoCX}" y="${logoCY + 5}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="14" font-weight="700" fill="#002868">LSUIC</text>`;

  // ── Seal block ───────────────────────────────────────────────────────────
  const sealBlock = opts.sealUri
    ? `<clipPath id="sc"><circle cx="${sealCX}" cy="${sealCY}" r="${sealR - 1}"/></clipPath>
       <circle cx="${sealCX}" cy="${sealCY}" r="${sealR}" fill="#fff" stroke="#C8A061" stroke-width="2"/>
       <image href="${escapeXml(opts.sealUri)}" x="${sealCX - sealR + 1}" y="${sealCY - sealR + 1}" width="${(sealR - 1) * 2}" height="${(sealR - 1) * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#sc)"/>`
    : `<circle cx="${sealCX}" cy="${sealCY}" r="${sealR}" fill="#FFFFF8" stroke="#C8A061" stroke-width="2"/>
       <text x="${sealCX}" y="${sealCY - 4}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="7" fill="#002868">REPUBLIC OF</text>
       <text x="${sealCX}" y="${sealCY + 8}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="7" fill="#002868">LIBERIA</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>

  <!-- Page background -->
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>

  <!-- ── Liberian flag stripes (11) ── -->
  ${flagStripes(W, STRIPE_H)}

  <!-- ── Header logo row ── -->
  <rect y="${STRIPE_H}" width="${W}" height="${LOGO_ROW_H}" fill="#FFFFFF"/>

  <!-- LSUIC Logo (left) -->
  ${logoBlock}

  <!-- Org name + conference info (centered between logo and seal) -->
  <text x="${textCX}" y="${t1}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="15.5" font-weight="700" fill="#002868" letter-spacing="0.4">${escapeXml("LIBERIAN STUDENT UNION IN CHINA (LSUIC)")}</text>
  <text x="${textCX}" y="${t2}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="10.5" font-weight="600" fill="#C8A061">${escapeXml(opts.confName)}</text>
  <text x="${textCX}" y="${t3}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="8.5" fill="#555555">${escapeXml(opts.venue ?? opts.city)}</text>
  <text x="${textCX}" y="${t4}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="8.5" fill="#555555">${escapeXml(opts.city + ", Shandong Province, P.R. China")}</text>
  <text x="${textCX}" y="${t5}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="8.5" fill="#555555">${escapeXml(opts.dateRange)}</text>
  <text x="${textCX}" y="${t6}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="8" fill="#777777">${escapeXml("Email: ekd@ekddigital.com  |  harrisbowulom@gmail.com")}</text>

  <!-- Liberia National Seal (right) -->
  ${sealBlock}

  <!-- ── Info row ── -->
  <!-- Gold separator line -->
  <rect y="${goldY}" width="${W}" height="2.5" fill="#C8A061"/>

  <!-- "Office of the Conference Chairman" (italic, right-aligned) -->
  <text x="${W - 22}" y="${officeY}" text-anchor="end" font-family="S,Arial,sans-serif" font-size="10" font-weight="600" fill="#002868" font-style="italic">${escapeXml("Office of the Conference Chairman")}</text>

  <!-- Navy separator bar -->
  <rect y="${navyY}" width="${W}" height="7" fill="#002868"/>
  <!-- Thin red accent below navy -->
  <rect y="${navyY + 7}" width="${W}" height="3" fill="#BF0A30"/>

  ${
    !opts.headerOnly
      ? `
  <!-- ── Left sidebar (dark navy) ── -->
  <rect x="0" y="${HEADER_H}" width="${SIDEBAR_W}" height="${H - HEADER_H - FOOTER_H}" fill="#001A4E"/>
  <!-- Gold right-edge accent strip -->
  <rect x="${SIDEBAR_W - 1.5}" y="${HEADER_H}" width="1.5" height="${H - HEADER_H - FOOTER_H}" fill="#C8A061"/>

  <!-- Sidebar members -->
  ${sideLines}

  <!-- ── Footer ── -->
  <rect y="${H - FOOTER_H}" width="${W}" height="${FOOTER_H}" fill="#002868"/>
  <rect y="${H - FOOTER_H}" width="${W}" height="3" fill="#BF0A30"/>
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="8" font-weight="700" fill="#C8A061" letter-spacing="0.5">${escapeXml('Motto: "Excellence Through Hard Work"')}</text>
  `
      : ""
  }
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
}): string {
  const W = 794;
  const H = 1123;
  const STRIPE_H = 8;
  const ROW_H = 56; // compact logo/name row
  const HEADER_H = STRIPE_H + ROW_H + 2 + 4; // stripes + row + gold + navy = 70
  const FOOTER_H = 24;

  // Small logo/seal
  const logoR = 22;
  const logoCX = 14 + logoR;
  const logoCY = STRIPE_H + ROW_H / 2;

  const sealR = 20;
  const sealCX = W - 14 - sealR;
  const sealCY = logoCY;

  const textL = logoCX + logoR + 10;
  const textR = sealCX - sealR - 10;
  const textCX = (textL + textR) / 2;
  const textY1 = logoCY - 13;
  const textY2 = logoCY + 2;
  const textY3 = logoCY + 16;

  const logoBlock = opts.logoUri
    ? `<clipPath id="lcc"><circle cx="${logoCX}" cy="${logoCY}" r="${logoR - 1}"/></clipPath>
       <circle cx="${logoCX}" cy="${logoCY}" r="${logoR}" fill="#fff" stroke="#C8A061" stroke-width="1.5"/>
       <image href="${escapeXml(opts.logoUri)}" x="${logoCX - logoR + 2}" y="${logoCY - logoR + 2}" width="${(logoR - 2) * 2}" height="${(logoR - 2) * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#lcc)"/>`
    : `<circle cx="${logoCX}" cy="${logoCY}" r="${logoR}" fill="#fff" stroke="#C8A061" stroke-width="1.5"/>
       <text x="${logoCX}" y="${logoCY + 4}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="9" fill="#002868">LSUIC</text>`;

  const sealBlock = opts.sealUri
    ? `<clipPath id="scc"><circle cx="${sealCX}" cy="${sealCY}" r="${sealR - 1}"/></clipPath>
       <circle cx="${sealCX}" cy="${sealCY}" r="${sealR}" fill="#fff" stroke="#C8A061" stroke-width="1.5"/>
       <image href="${escapeXml(opts.sealUri)}" x="${sealCX - sealR + 1}" y="${sealCY - sealR + 1}" width="${(sealR - 1) * 2}" height="${(sealR - 1) * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#scc)"/>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock(opts.fonts)}</defs>

  <!-- Page background -->
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>

  <!-- Flag stripes (compact) -->
  ${flagStripes(W, STRIPE_H)}

  <!-- Compact header row -->
  <rect y="${STRIPE_H}" width="${W}" height="${ROW_H}" fill="#FFFFFF"/>

  ${logoBlock}

  <text x="${textCX}" y="${textY1}" text-anchor="middle" font-family="H,Arial,sans-serif" font-size="11" font-weight="700" fill="#002868">${escapeXml("LIBERIAN STUDENT UNION IN CHINA (LSUIC)")}</text>
  <text x="${textCX}" y="${textY2}" text-anchor="middle" font-family="S,Arial,sans-serif" font-size="9" fill="#C8A061">${escapeXml(opts.confName)}</text>
  <text x="${textCX}" y="${textY3}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="7.5" fill="#777777" font-style="italic">${escapeXml("Office of the Conference Chairman")}</text>

  ${sealBlock}

  <!-- Gold separator -->
  <rect y="${STRIPE_H + ROW_H}" width="${W}" height="2" fill="#C8A061"/>
  <!-- Navy separator -->
  <rect y="${STRIPE_H + ROW_H + 2}" width="${W}" height="4" fill="#002868"/>

  <!-- Footer -->
  <rect y="${H - FOOTER_H}" width="${W}" height="${FOOTER_H}" fill="#002868"/>
  <rect y="${H - FOOTER_H}" width="${W}" height="2" fill="#BF0A30"/>
  <text x="${W / 2}" y="${H - 8}" text-anchor="middle" font-family="B,Arial,sans-serif" font-size="7" fill="#C8A061">${escapeXml("LIBERIAN STUDENT UNION IN CHINA (LSUIC)  ·  " + opts.confName)}</text>
</svg>`;
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
    const mode = (url.searchParams.get("mode") ?? "page") as
      | "header"
      | "page"
      | "continuation";
    const format = url.searchParams.get("format") ?? "png";

    const [event, members] = await Promise.all([
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
        where: { confId, isActive: true },
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
    if (mode === "continuation") {
      svg = buildContinuationSvg({
        confName: event.name,
        city: event.city,
        venue: event.venue,
        dateRange,
        logoUri,
        sealUri,
        fonts,
      });
    } else {
      svg = buildFirstPageSvg({
        headerOnly: mode === "header",
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

    if (format === "svg") {
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // Convert SVG → PNG via resvg-js
    const { Resvg } = await import("@resvg/resvg-js");
    const resvg = new Resvg(svg, { background: "white" });
    const pngData = resvg.render();
    const pngBuffer = Buffer.from(pngData.asPng());

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": `inline; filename="letterhead-${mode}-${confId}.png"`,
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
