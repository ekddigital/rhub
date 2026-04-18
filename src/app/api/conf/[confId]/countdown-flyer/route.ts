import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";

// ── Helpers (reused from delegate flyer pattern) ──────────────────────────────

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function guessMime(fileName: string) {
  const f = fileName.toLowerCase();
  if (f.endsWith(".png")) return "image/png";
  if (f.endsWith(".jpg") || f.endsWith(".jpeg")) return "image/jpeg";
  if (f.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
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

const LOGO_CANDIDATES = [
  "conf/lsuic-logo-primary.png",
  "conf/lsuic_logo.png",
  "conf/Liberian Student Union emblem in China.png",
];

const BACKDROP_CANDIDATES = [
  "conf/assets/jinan_city/day_view_landscape.png",
  "conf/assets/hotel/main_entrance_view.png",
];

type Fonts = { headline: string; body: string; script: string } | null;

let fontsCache: Promise<Fonts> | null = null;

async function loadFonts(): Promise<Fonts> {
  if (!fontsCache) {
    fontsCache = (async () => {
      const readFont = async (name: string) => {
        const buf = await readPublicFile("conf", "fonts", name);
        return buf ? toDataUri(buf, "font/ttf") : null;
      };
      const [headline, body, script] = await Promise.all([
        readFont("Oswald-Bold.ttf"),
        readFont("Poppins-Bold.ttf"),
        readFont("GreatVibes-Regular.ttf"),
      ]);
      if (!headline || !body) return null;
      return { headline, body, script: script ?? headline };
    })();
  }
  return fontsCache;
}



async function loadAsset(candidates: string[]) {
  for (const c of candidates) {
    const buf = await readPublicFile(c);
    if (buf) return toDataUri(buf, guessMime(c));
  }
  return null;
}

// ── Day calculation ───────────────────────────────────────────────────────────

function daysUntil(target: Date): number {
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = Math.ceil(
    (target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0)) / msPerDay,
  );
  return Math.max(0, diff);
}

// ── SVG template ─────────────────────────────────────────────────────────────

function buildCountdownSvg(opts: {
  days: number;
  confName: string;
  dateLabel: string;
  venueLabel: string;
  logoUri: string | null;
  backdropUri: string | null;
  fonts: Fonts;
  today: string;
}) {
  const {
    days,
    confName,
    dateLabel,
    venueLabel,
    logoUri,
    backdropUri,
    fonts,
    today,
  } = opts;

  const subLabel =
    days === 0 ? "The conference is today!" : days === 1 ? "TO GO" : "TO GO";

  const fontBlock = fonts
    ? `<style>
      @font-face { font-family:'H'; src:url('${fonts.headline}') format('truetype'); font-weight:700; }
      @font-face { font-family:'B'; src:url('${fonts.body}') format('truetype'); font-weight:700; }
      @font-face { font-family:'S'; src:url('${fonts.script}') format('truetype'); font-weight:400; }
    </style>`
    : "";

  const backdropLayer = backdropUri
    ? `<image href="${escapeXml(backdropUri)}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMidYMid slice" opacity="0.18"/>`
    : "";

  const logoLayer = logoUri
    ? `<clipPath id="lc"><circle cx="540" cy="148" r="72"/></clipPath>
       <circle cx="540" cy="148" r="74" fill="#FFFFFF" fill-opacity="0.92" stroke="#C8A061" stroke-width="3"/>
       <image href="${escapeXml(logoUri)}" x="468" y="76" width="144" height="144" preserveAspectRatio="xMidYMid meet" clip-path="url(#lc)"/>`
    : `<circle cx="540" cy="148" r="74" fill="#FFFFFF" fill-opacity="0.92" stroke="#C8A061" stroke-width="3"/>
       <text x="540" y="162" text-anchor="middle" font-family="H,Segoe UI,Arial,sans-serif" font-size="28" font-weight="700" fill="#0A2C8B">LSUIC</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    ${fontBlock}
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#182e5f"/>
      <stop offset="60%" stop-color="#0A1F4A"/>
      <stop offset="100%" stop-color="#1F1C18"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#C8A061"/>
      <stop offset="100%" stop-color="#D4AF6A"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C8A061" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#C8A061" stop-opacity="0"/>
    </linearGradient>
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="18" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <filter id="gf" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="32"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bg)"/>
  ${backdropLayer}

  <!-- Gold radial glow behind number -->
  <ellipse cx="540" cy="540" rx="320" ry="320" fill="#C8A061" opacity="0.07" filter="url(#gf)"/>

  <!-- Outer decorative ring -->
  <circle cx="540" cy="540" r="350" fill="none" stroke="#C8A061" stroke-width="2" stroke-opacity="0.25" stroke-dasharray="12 8"/>
  <circle cx="540" cy="540" r="320" fill="none" stroke="#C8A061" stroke-width="1" stroke-opacity="0.15"/>

  <!-- Gold top accent line -->
  <rect x="160" y="42" width="760" height="3" rx="2" fill="url(#ring)"/>
  <!-- Gold bottom accent line -->
  <rect x="160" y="1035" width="760" height="3" rx="2" fill="url(#ring)"/>

  <!-- Logo -->
  ${logoLayer}

  <!-- Conference name -->
  <text x="540" y="254" text-anchor="middle"
    font-family="H,Oswald,Segoe UI,Arial,sans-serif" font-size="26" font-weight="700"
    fill="#C8A061" letter-spacing="4">${escapeXml(confName.toUpperCase())}</text>

  <!-- Big countdown number -->
  <text x="540" y="590" text-anchor="middle"
    font-family="H,Oswald,Segoe UI,Arial,sans-serif" font-size="${days >= 100 ? 220 : 260}" font-weight="700"
    fill="#FFFFFF" filter="url(#ds)">${days === 0 ? "🎉" : String(days)}</text>

  <!-- TO GO label -->
  <text x="540" y="660" text-anchor="middle"
    font-family="H,Oswald,Segoe UI,Arial,sans-serif" font-size="52" font-weight="700"
    fill="#C8A061" letter-spacing="8">${escapeXml(subLabel)}</text>

  <!-- Divider dots -->
  <circle cx="500" cy="704" r="4" fill="#C8A061" opacity="0.6"/>
  <circle cx="540" cy="704" r="4" fill="#C8A061"/>
  <circle cx="580" cy="704" r="4" fill="#C8A061" opacity="0.6"/>

  <!-- Date label -->
  <text x="540" y="766" text-anchor="middle"
    font-family="B,Poppins,Segoe UI,Arial,sans-serif" font-size="28" font-weight="700"
    fill="#FFFFFF" opacity="0.85">${escapeXml(dateLabel)}</text>

  <!-- Venue label -->
  <text x="540" y="810" text-anchor="middle"
    font-family="B,Poppins,Segoe UI,Arial,sans-serif" font-size="20"
    fill="#C8A061" opacity="0.7">${escapeXml(venueLabel)}</text>

  <!-- Maroon EKD tag line -->
  <rect x="390" y="870" width="300" height="44" rx="10" fill="#8E0E00" opacity="0.85"/>
  <text x="540" y="898" text-anchor="middle"
    font-family="B,Poppins,Segoe UI,Arial,sans-serif" font-size="18" font-weight="700"
    fill="#FFFFFF">LSUIC CONFERENCE 2026</text>

  <!-- Generated date watermark -->
  <text x="540" y="1010" text-anchor="middle"
    font-family="B,Poppins,Segoe UI,Arial,sans-serif" font-size="14"
    fill="#FFFFFF" opacity="0.3">Generated ${escapeXml(today)} · ekddigital.com</text>
</svg>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  const { confId } = await params;
  const url = new URL(req.url);
  const wantsPng = url.searchParams.get("format") === "png";
  const download = ["1", "true", "yes"].includes(
    (url.searchParams.get("download") ?? "").toLowerCase(),
  );

  const event = await prisma.confEvent.findUnique({
    where: { id: confId },
    select: { name: true, year: true, startsAt: true, endsAt: true },
  });

  const startsAt = event?.startsAt ?? new Date(`${event?.year ?? 2026}-07-23`);
  const days = daysUntil(new Date(startsAt));

  const dateLabel =
    event?.startsAt && event?.endsAt
      ? `${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(event.startsAt)} – ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(event.endsAt)}`
      : "July 23–27, 2026";

  const [logoUri, backdropUri, fonts] = await Promise.all([
    loadAsset(LOGO_CANDIDATES),
    loadAsset(BACKDROP_CANDIDATES),
    loadFonts(),
  ]);

  const today = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const svg = buildCountdownSvg({
    days,
    confName: event?.name ?? "LSUIC National Conference",
    dateLabel,
    venueLabel: "Arcadia Spa Golf Hotel · Jinan, Shandong",
    logoUri,
    backdropUri,
    fonts,
    today,
  });

  if (wantsPng) {
    const { Resvg } = await import("@resvg/resvg-js");
    const fontsDir = path.join(process.cwd(), "public", "conf", "fonts");
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1080 },
      font: {
        fontDirs: [fontsDir],
        loadSystemFonts: false,
        defaultFontFamily: "Oswald",
      },
    });
    const png = resvg.render().asPng();
    return new Response(new Uint8Array(png), {
      headers: {
        "content-type": "image/png",
        ...(download
          ? {
              "content-disposition": `attachment; filename="countdown-${days}days-${new Date().toISOString().slice(0, 10)}.png"`,
            }
          : {}),
        "cache-control": "no-store",
      },
    });
  }

  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml",
      ...(download
        ? { "content-disposition": "attachment; filename=countdown.svg" }
        : {}),
      "cache-control": "no-store",
    },
  });
}
