import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/letterhead
// Returns a PNG image of the conference committee letterhead.
// Query params:
//   ?mode=header   — header-only (~220px tall, A4-width)
//   ?mode=page     — full A4 page with header + blank body (default)
//   ?format=svg    — return raw SVG instead of PNG (for debug)

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

const LOGO_CANDIDATES = ["conf/lsuic_logo.png", "conf/logo_all_white_bg.png"];

async function loadLogo(): Promise<string | null> {
  for (const c of LOGO_CANDIDATES) {
    const buf = await readPublicFile(c);
    if (buf) return toDataUri(buf, "image/png");
  }
  const svgBuf = await readPublicFile("conf", "liberia-seal.svg");
  if (svgBuf) return toDataUri(svgBuf, "image/svg+xml");
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

// ── SVG builder ───────────────────────────────────────────────────────────────

type Member = {
  name: string;
  role: string;
  title: string | null;
  city: string | null;
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

function buildLetterheadSvg(opts: {
  headerOnly: boolean;
  confName: string;
  city: string;
  venue: string | null;
  dateRange: string;
  members: Member[];
  logoUri: string | null;
  fonts: FontSet;
}): string {
  const W = 794; // A4 at 96dpi
  const HEADER_H = 218;
  const H = opts.headerOnly ? HEADER_H : 1123;

  const fontBlock = opts.fonts
    ? `<style>
      @font-face { font-family: 'H'; src: url('${opts.fonts.heading}') format('truetype'); font-weight: 700; }
      @font-face { font-family: 'B'; src: url('${opts.fonts.body}') format('truetype'); }
      @font-face { font-family: 'S'; src: url('${opts.fonts.semibold}') format('truetype'); font-weight: 600; }
    </style>`
    : "";

  // Sidebar: key roles first, then others
  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
  const sorted = [
    ...KEY_ORDER.map((r) => opts.members.find((m) => m.role === r)).filter(
      Boolean,
    ),
    ...opts.members.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as Member[];

  const sideX = 556;
  const sidePad = 8;
  let sideLines = "";
  let sy = 28;

  for (const m of sorted.slice(0, 9)) {
    const label = memberRoleLabel(m.role, m.title, m.committeeScope);
    sideLines += `<text x="${sideX + sidePad}" y="${sy}" font-family="S,Helvetica,Arial,sans-serif" font-size="8" font-weight="600" fill="#1F1C18">${escapeXml(m.name)}</text>\n`;
    sy += 11;
    sideLines += `<text x="${sideX + sidePad}" y="${sy}" font-family="B,Helvetica,Arial,sans-serif" font-size="7.5" fill="#8E0E00">${escapeXml(label)}</text>\n`;
    sy += 10;
    if (m.city) {
      sideLines += `<text x="${sideX + sidePad}" y="${sy}" font-family="B,Helvetica,Arial,sans-serif" font-size="7" fill="#666666">${escapeXml(m.city)}</text>\n`;
      sy += 10;
    }
    sy += 3;
  }

  const logoBlock = opts.logoUri
    ? `<clipPath id="lc"><circle cx="70" cy="95" r="54"/></clipPath>
       <circle cx="70" cy="95" r="56" fill="#fff" stroke="#C8A061" stroke-width="2.5"/>
       <image href="${escapeXml(opts.logoUri)}" x="16" y="41" width="108" height="108" preserveAspectRatio="xMidYMid meet" clip-path="url(#lc)"/>`
    : `<circle cx="70" cy="95" r="56" fill="#fff" stroke="#C8A061" stroke-width="2.5"/>
       <text x="70" y="100" text-anchor="middle" font-family="H,sans-serif" font-size="14" font-weight="700" fill="#182e5f">LSUIC</text>`;

  const centerX = 145;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${fontBlock}</defs>

  <!-- Page background -->
  <rect width="${W}" height="${H}" fill="#FFFFFF"/>

  <!-- Gold top bar -->
  <rect width="${W}" height="7" fill="#C8A061"/>

  <!-- Navy bottom bar of header -->
  <rect y="${HEADER_H - 5}" width="${W}" height="5" fill="#182e5f"/>

  <!-- Sidebar background -->
  <rect x="${sideX}" y="7" width="${W - sideX}" height="${HEADER_H - 12}" fill="#F7F4EE"/>
  <rect x="${sideX}" y="7" width="1.5" height="${HEADER_H - 12}" fill="#C8A061"/>

  <!-- LSUIC Logo -->
  ${logoBlock}

  <!-- Organization name -->
  <text x="${centerX}" y="38" font-family="H,Helvetica,Arial,sans-serif" font-size="13" font-weight="700" fill="#1F1C18" letter-spacing="0.4">${escapeXml("LIBERIAN STUDENT UNION IN CHINA (LSUIC)")}</text>

  <!-- Conference name -->
  <text x="${centerX}" y="57" font-family="S,Helvetica,Arial,sans-serif" font-size="11.5" font-weight="600" fill="#C8A061">${escapeXml(opts.confName)}</text>

  <!-- Venue and date -->
  <text x="${centerX}" y="74" font-family="B,Helvetica,Arial,sans-serif" font-size="9" fill="#555555">${escapeXml((opts.venue ? opts.venue + ", " : "") + opts.city + ", China")}</text>
  <text x="${centerX}" y="89" font-family="B,Helvetica,Arial,sans-serif" font-size="9" fill="#555555">${escapeXml(opts.dateRange)}</text>

  <!-- Gold divider -->
  <line x1="${centerX}" y1="100" x2="${sideX - 12}" y2="100" stroke="#C8A061" stroke-width="1.2"/>

  <!-- "Office of..." subheading -->
  <text x="${(centerX + sideX - 12) / 2}" y="118" text-anchor="middle"
        font-family="H,Helvetica,Arial,sans-serif" font-size="11.5" font-weight="700"
        fill="#182e5f" letter-spacing="0.2">${escapeXml("Office of the Conference Chairman")}</text>

  <!-- Motto / tagline -->
  <text x="${centerX}" y="138" font-family="B,Helvetica,Arial,sans-serif" font-size="8" fill="#888888">${escapeXml('"Promoting Education, Unity and Development"  ·  Est. July 2008')}</text>

  <!-- Contact -->
  <text x="${centerX}" y="154" font-family="B,Helvetica,Arial,sans-serif" font-size="8" fill="#888888">${escapeXml("lusic2006@yahoo.com  |  lsuic2006@gmail.com")}</text>

  <!-- Sidebar header label -->
  <text x="${sideX + sidePad}" y="17" font-family="H,Helvetica,Arial,sans-serif" font-size="8.5" font-weight="700" fill="#182e5f" letter-spacing="0.4">${escapeXml("CONFERENCE COMMITTEE")}</text>

  <!-- Sidebar members -->
  ${sideLines}

  ${
    !opts.headerOnly
      ? `
  <!-- Body content area separator -->
  <line x1="60" y1="${HEADER_H + 30}" x2="${W - 60}" y2="${HEADER_H + 30}" stroke="#EEEEEE" stroke-width="0.5"/>

  <!-- Footer -->
  <rect y="${H - 28}" width="${W}" height="28" fill="#182e5f"/>
  <text x="${W / 2}" y="${H - 12}" text-anchor="middle" font-family="B,Helvetica,Arial,sans-serif" font-size="8" fill="#C8A061">${escapeXml("LIBERIAN STUDENT UNION IN CHINA (LSUIC)  ·  " + opts.confName)}</text>
  `
      : ""
  }
</svg>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;

    // Require participant-level access (any authenticated member of the conference)
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "page";
    const format = url.searchParams.get("format") ?? "png";
    const headerOnly = mode === "header";

    // Fetch conference and committee data
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

    const [logoUri, fonts] = await Promise.all([loadLogo(), loadFonts()]);

    const svg = buildLetterheadSvg({
      headerOnly,
      confName: event.name,
      city: event.city,
      venue: event.venue,
      dateRange: formatDateRange(
        new Date(event.startsAt),
        new Date(event.endsAt),
      ),
      members,
      logoUri,
      fonts,
    });

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
        "Content-Disposition": `inline; filename="letterhead-${confId}.png"`,
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
