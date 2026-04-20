import { prisma } from "@/lib/prisma";
import { CONF_2026 } from "@/lib/conf/config";
import {
  escapeXml,
  loadLogoDataUri,
  loadBackdropDataUri,
  loadFlyerFonts,
  buildFontFaceBlock,
  buildLogoLayer,
  renderResvgPng,
  type FlyerFonts,
} from "@/lib/conf/svg-assets";

// ── Day calculation ───────────────────────────────────────────────────────────

function daysUntil(target: Date): number {
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((t.getTime() - now.getTime()) / 86_400_000));
}

// Sub-theme displayed on flyer — pulled from single source of truth
const FLYER_SUB_THEME = CONF_2026.subTheme
  .replace(", and ", " · ")
  .replace(", ", " · ");

// ── SVG template ─────────────────────────────────────────────────────────────

function buildCountdownSvg(opts: {
  days: number;
  confName: string;
  dateLabel: string;
  venueLabel: string;
  logoUri: string | null;
  backdropUri: string | null;
  fonts: FlyerFonts | null;
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

  const subLabel = days === 0 ? "TODAY!" : "TO GO";
  const countdownDisplay = days === 0 ? "🎉" : String(days);
  const numFontSize = days >= 100 ? 220 : 260;

  // Logo geometry — larger circle for crisp rendering
  const LOGO_CX = 540;
  const LOGO_CY = 174;
  const LOGO_R = 96; // diameter 192 (was 144)
  const LOGO_RING_R = LOGO_R + 4; // 100

  const fontBlock = buildFontFaceBlock(fonts);

  const backdropLayer = backdropUri
    ? `<image href="${escapeXml(backdropUri)}" x="0" y="0" width="1080" height="1080" preserveAspectRatio="xMinYMid slice" opacity="0.15" image-rendering="optimizeQuality"/>`
    : "";

  // buildLogoLayer handles the clip, white ring, and image with correct zoom + vertical offset.
  const logoLayer = buildLogoLayer(LOGO_CX, LOGO_CY, LOGO_R, logoUri, { clipId: "lc" });

  // Derive positions relative to logo bottom
  const logoBtm = LOGO_CY + LOGO_RING_R; // 278

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
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="18" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <filter id="gf" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="32"/>
    </filter>
    <filter id="logoGlow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="0" stdDeviation="10" flood-color="#C8A061" flood-opacity="0.45"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1080" fill="url(#bg)"/>
  ${backdropLayer}

  <!-- Gold radial glow behind number -->
  <ellipse cx="540" cy="592" rx="300" ry="280" fill="#C8A061" opacity="0.06" filter="url(#gf)"/>

  <!-- Decorative rings -->
  <circle cx="540" cy="540" r="356" fill="none" stroke="#C8A061" stroke-width="1.5" stroke-opacity="0.2" stroke-dasharray="10 8"/>
  <circle cx="540" cy="540" r="328" fill="none" stroke="#C8A061" stroke-width="0.8" stroke-opacity="0.12"/>

  <!-- Gold accent lines -->
  <rect x="140" y="38" width="800" height="3" rx="2" fill="url(#ring)"/>
  <rect x="140" y="1039" width="800" height="3" rx="2" fill="url(#ring)"/>

  <!-- Logo gold glow ring -->
  <circle cx="${LOGO_CX}" cy="${LOGO_CY}" r="${LOGO_RING_R + 7}" fill="none" stroke="#C8A061" stroke-width="1.2" stroke-opacity="0.4" filter="url(#logoGlow)"/>

  <!-- Logo -->
  ${logoLayer}

  <!-- 20th Anniversary label -->
  <text x="540" y="${logoBtm + 28}" text-anchor="middle"
    font-family="Poppins,Segoe UI,Arial,sans-serif" font-size="13"
    fill="#C8A061" letter-spacing="3" opacity="0.92">✦  20TH ANNIVERSARY  ✦</text>

  <!-- Conference name -->
  <text x="540" y="${logoBtm + 52}" text-anchor="middle"
    font-family="Oswald,Segoe UI,Arial,sans-serif" font-size="22" font-weight="700"
    fill="#C8A061" letter-spacing="3">${escapeXml(confName.toUpperCase())}</text>

  <!-- Theme — "Jinan 2026: Legacy and Influence" -->
  <text x="540" y="${logoBtm + 94}" text-anchor="middle"
    font-family="Oswald,Segoe UI,Arial,sans-serif" font-size="30" font-weight="700"
    fill="#FFFFFF" opacity="1.0">${escapeXml(CONF_2026.theme)}</text>

  <!-- Sub-theme — script, gold -->
  <text x="540" y="${logoBtm + 128}" text-anchor="middle"
    font-family="'Great Vibes',Georgia,serif" font-size="17"
    fill="#C8A061" opacity="0.90">${escapeXml(FLYER_SUB_THEME)}</text>

  <!-- Big countdown number -->
  <text x="540" y="644" text-anchor="middle"
    font-family="Oswald,Segoe UI,Arial,sans-serif" font-size="${numFontSize}" font-weight="700"
    fill="#FFFFFF" filter="url(#ds)">${countdownDisplay}</text>

  <!-- TO GO label -->
  <text x="540" y="713" text-anchor="middle"
    font-family="Oswald,Segoe UI,Arial,sans-serif" font-size="52" font-weight="700"
    fill="#C8A061" letter-spacing="8">${escapeXml(subLabel)}</text>

  <!-- Divider dots -->
  <circle cx="500" cy="757" r="4" fill="#C8A061" opacity="0.5"/>
  <circle cx="540" cy="757" r="4" fill="#C8A061"/>
  <circle cx="580" cy="757" r="4" fill="#C8A061" opacity="0.5"/>

  <!-- Date label -->
  <text x="540" y="818" text-anchor="middle"
    font-family="Poppins,Segoe UI,Arial,sans-serif" font-size="28" font-weight="700"
    fill="#FFFFFF" opacity="0.95">${escapeXml(dateLabel)}</text>

  <!-- Venue label -->
  <text x="540" y="858" text-anchor="middle"
    font-family="Poppins,Segoe UI,Arial,sans-serif" font-size="19"
    fill="#C8A061" opacity="0.85">${escapeXml(venueLabel)}</text>

  <!-- Conference badge -->
  <rect x="370" y="886" width="340" height="46" rx="10" fill="#8E0E00" opacity="0.9"/>
  <text x="540" y="915" text-anchor="middle"
    font-family="Poppins,Segoe UI,Arial,sans-serif" font-size="18" font-weight="700"
    fill="#FFFFFF" letter-spacing="1">LSUIC CONFERENCE 2026</text>

  <!-- Generated date -->
  <text x="540" y="1013" text-anchor="middle"
    font-family="Poppins,Segoe UI,Arial,sans-serif" font-size="13"
    fill="#FFFFFF" opacity="0.22">Generated ${escapeXml(today)}</text>
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

  const [event] = await Promise.all([
    prisma.confEvent.findUnique({
      where: { id: confId },
      select: { name: true, year: true, startsAt: true, endsAt: true },
    }),
  ]);

  const event_ = event;

  const startsAt =
    event_?.startsAt ?? new Date(`${event_?.year ?? 2026}-07-23`);
  const days = daysUntil(new Date(startsAt));

  const dateLabel =
    event_?.startsAt && event_?.endsAt
      ? `${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(event_.startsAt)} \u2013 ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(event_.endsAt)}`
      : "July 23–27, 2026";

  const [logoUri, backdropUri, fonts] = await Promise.all([
    loadLogoDataUri(),
    loadBackdropDataUri(),
    loadFlyerFonts(),
  ]);

  const today = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const svg = buildCountdownSvg({
    days,
    confName: event_?.name ?? CONF_2026.name,
    dateLabel,
    venueLabel: CONF_2026.venueShort,
    logoUri,
    backdropUri,
    fonts,
    today,
  });

  if (wantsPng) {
    const png = await renderResvgPng(svg, 2160); // 2× for crisp Retina output
    return new Response(png.buffer as ArrayBuffer, {
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
