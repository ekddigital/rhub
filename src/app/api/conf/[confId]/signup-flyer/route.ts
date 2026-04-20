import { type NextRequest } from "next/server";
import { CONF_2026 } from "@/lib/conf/config";
import {
  escapeXml,
  guessMime,
  toDataUri,
  readPublicFile,
  loadLogoDataUri,
  loadFlyerFonts,
  buildFontFaceBlock,
  buildLogoLayer,
  renderResvgPng,
} from "@/lib/conf/svg-assets";

// ── Types ────────────────────────────────────────────────────────────────────

interface SignupFlyerState {
  conferenceTag: string;
  title: string;
  subtitle: string;
  steps: string[];
  signupLink: string;
  paymentInstruction?: string;
  verificationNote?: string;
  footer: string;
  website: string;
  motto: string;
}

// ── Layout constants (1080×1080 viewBox) ─────────────────────────────────────

const HEADER_H = 80;
const HERO_Y = HEADER_H; // 80
const HERO_H = 216;
const STRIPE_Y = HERO_Y + HERO_H; // 296
const STRIPE_H = 12;
const THEME_Y = STRIPE_Y + STRIPE_H; // 308
const THEME_H = 82;
const CONTENT_Y = THEME_Y + THEME_H; // 390
const LINK_Y = 988;
const LINK_H = 40;
const FOOTER_Y = LINK_Y + LINK_H; // 1028
const FOOTER_H = 52; // 1028 + 52 = 1080

// Steps sub-layout (within content area, left column)
const STEP_X = 40;
const STEP_W = 622;
const STEP_H = 80;
const STEP_GAP = 14;
const STEPS_LABEL_Y = CONTENT_Y + 26; // 416
const STEPS_START_Y = STEPS_LABEL_Y + 20; // 436

// QR panel (right column)
const QR_X = 678;
const QR_Y = CONTENT_Y + 8; // 398
const QR_W = 362;
const QR_H = LINK_Y - QR_Y - 8; // ~582

// ── Helpers ──────────────────────────────────────────────────────────────────

function wrapStep(text: string, maxCharsPerLine = 38): string[] {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
    if (lines.length >= 2) break;
  }
  if (line && lines.length < 2) lines.push(line);
  return lines.slice(0, 2);
}

function buildStepBox(step: string, index: number): string {
  const y = STEPS_START_Y + index * (STEP_H + STEP_GAP);
  const cy = y + STEP_H / 2;
  const lines = wrapStep(step);
  const lineH = 22;
  const totalH = lines.length * lineH;
  const textStartY = cy - totalH / 2 + lineH * 0.75;

  const textEls = lines
    .map(
      (l, i) =>
        `<text x="98" y="${Math.round(textStartY + i * lineH)}" font-size="17" font-family="Poppins,sans-serif" font-weight="600" fill="#0B1E78">${escapeXml(l)}</text>`,
    )
    .join("\n  ");

  return `
  <rect x="${STEP_X}" y="${y}" width="${STEP_W}" height="${STEP_H}" rx="10" fill="#FFFFFF" stroke="#CCDAEF" stroke-width="1.5"/>
  <circle cx="70" cy="${cy}" r="17" fill="#0B1E78"/>
  <text x="70" y="${cy + 6}" text-anchor="middle" font-size="14" font-family="Oswald,sans-serif" font-weight="700" fill="#FFFFFF">${index + 1}</text>
  ${textEls}`;
}

function clampUrl(url: string, maxLen = 58): string {
  if (!url || url.length <= maxLen) return url;
  return `${url.slice(0, maxLen - 3)}...`;
}

async function loadHallImage(): Promise<string | null> {
  const buf = await readPublicFile("conf", "assets/hotel/conference_hall.jpg");
  if (!buf) return null;
  return toDataUri(buf, guessMime("conference_hall.jpg"));
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ confId: string }> },
) {
  await params; // not used but avoids unused-var warnings

  try {
    const body = (await req.json()) as {
      state?: SignupFlyerState;
      download?: boolean;
    };
    const signup = body.state;

    if (!signup) {
      return new Response(JSON.stringify({ error: "Missing state" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const [logoUri, fonts, hallUri] = await Promise.all([
      loadLogoDataUri(),
      loadFlyerFonts(),
      loadHallImage(),
    ]);

    const fontStyleBlock = buildFontFaceBlock(fonts);

    // Logo in header — smaller circle (R=28)
    const logoLayer = buildLogoLayer(50, HEADER_H / 2, 28, logoUri, {
      clipId: "hdrLogoClip",
      ringExtra: 3,
      strokeWidth: 2,
      scale: 1.05,
      offsetY: 3,
    });

    const dateTag = `${CONF_2026.city.toUpperCase()} \u00b7 JULY ${new Date(CONF_2026.startsAt).getUTCFullYear()}`;

    const heroImageLayer = hallUri
      ? `<image href="${escapeXml(hallUri)}" x="0" y="${HERO_Y}" width="1080" height="${HERO_H}" preserveAspectRatio="xMidYMid slice" clip-path="url(#heroClip)"/>`
      : `<rect x="0" y="${HERO_Y}" width="1080" height="${HERO_H}" fill="#1A3570"/>`;

    const stepsLayer = (signup.steps ?? [])
      .slice(0, 3)
      .map((s, i) => buildStepBox(s, i))
      .join("");

    const safeFooter = escapeXml(signup.footer ?? "");
    const safeLink = escapeXml(clampUrl(signup.signupLink ?? ""));
    const safeWebsite = escapeXml(signup.website ?? "");
    const safeMotto = escapeXml(signup.motto ?? "");
    const safeTitle = escapeXml(signup.title ?? "");
    const safeSubtitle = escapeXml(signup.subtitle ?? "");
    const safeTag = escapeXml((signup.conferenceTag ?? "").toUpperCase());

    // QR inner boxes
    const qrInnerX = QR_X + 22;
    const qrInnerW = QR_W - 44;
    const signupQrY = QR_Y + 50;
    const signupQrH = 210;
    const paymentQrY = signupQrY + signupQrH + 18;
    const paymentQrH = 210;
    const footerTextY = paymentQrY + paymentQrH + 44;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs>
    ${fontStyleBlock}
    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#021033" stop-opacity="0.08"/>
      <stop offset="55%" stop-color="#021033" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#071B4D" stop-opacity="0.96"/>
    </linearGradient>
    <clipPath id="heroClip">
      <rect x="0" y="${HERO_Y}" width="1080" height="${HERO_H}"/>
    </clipPath>
  </defs>

  <!-- ── Header ── -->
  <rect width="1080" height="${HEADER_H}" fill="#0B1E78"/>
  ${logoLayer}
  <text x="94" y="31" font-size="13" font-family="Oswald,sans-serif" font-weight="700" fill="#FFFFFF">LIBERIAN STUDENT UNION IN CHINA</text>
  <text x="94" y="54" font-size="9.5" font-family="Poppins,sans-serif" fill="#C8A061">2026 National Conference</text>
  <text x="1040" y="29" text-anchor="end" font-size="11" font-family="Oswald,sans-serif" font-weight="700" fill="#C8A061">DELEGATE REGISTRATION</text>
  <text x="1040" y="52" text-anchor="end" font-size="9.5" font-family="Poppins,sans-serif" fill="rgba(255,255,255,0.70)">${dateTag}</text>

  <!-- ── Hero ── -->
  ${heroImageLayer}
  <rect x="0" y="${HERO_Y}" width="1080" height="${HERO_H}" fill="url(#heroGrad)"/>
  <text x="40" y="${HERO_Y + 80}" font-size="11" font-family="Oswald,sans-serif" font-weight="700" fill="#C8A061" letter-spacing="2">${safeTag}</text>
  <text x="40" y="${HERO_Y + 142}" font-size="58" font-family="Oswald,sans-serif" font-weight="700" fill="#FFFFFF">${safeTitle}</text>
  <text x="40" y="${HERO_Y + 178}" font-size="15" font-family="Poppins,sans-serif" fill="rgba(255,255,255,0.85)">${safeSubtitle}</text>

  <!-- ── Liberia flag stripe ── -->
  <rect x="0" y="${STRIPE_Y}" width="360" height="${STRIPE_H}" fill="#C8102E"/>
  <rect x="360" y="${STRIPE_Y}" width="360" height="${STRIPE_H}" fill="#FFFFFF"/>
  <rect x="720" y="${STRIPE_Y}" width="360" height="${STRIPE_H}" fill="#0B1E78"/>

  <!-- ── Theme banner ── -->
  <rect x="0" y="${THEME_Y}" width="1080" height="${THEME_H}" fill="#071B4D"/>
  <text x="540" y="${THEME_Y + 46}" text-anchor="middle" font-size="22" font-family="Oswald,sans-serif" font-weight="700" fill="#FFFFFF">${escapeXml(CONF_2026.theme)}</text>
  <text x="540" y="${THEME_Y + 70}" text-anchor="middle" font-size="14" font-family="'Great Vibes',Georgia,serif" fill="#C8A061">${escapeXml(CONF_2026.subTheme)}</text>

  <!-- ── Content background ── -->
  <rect x="0" y="${CONTENT_Y}" width="1080" height="${LINK_Y - CONTENT_Y}" fill="#F0F5FF"/>

  <!-- ── Left: How to register ── -->
  <text x="${STEP_X}" y="${STEPS_LABEL_Y}" font-size="11" font-family="Oswald,sans-serif" font-weight="700" fill="#0B1E78" letter-spacing="1.5">HOW TO REGISTER</text>
  ${stepsLayer}

  <!-- ── Right: QR panel ── -->
  <rect x="${QR_X}" y="${QR_Y}" width="${QR_W}" height="${QR_H}" rx="14" fill="#FFFFFF" stroke="#CCDAEF" stroke-width="1.5"/>
  <text x="${QR_X + 22}" y="${QR_Y + 32}" font-size="11" font-family="Oswald,sans-serif" font-weight="700" fill="#0B1E78" letter-spacing="1.5">SCAN TO REGISTER</text>
  <!-- Signup QR -->
  <rect x="${qrInnerX}" y="${signupQrY}" width="${qrInnerW}" height="${signupQrH}" rx="10" fill="#F0F5FF" stroke="#CCDAEF" stroke-width="1.5" stroke-dasharray="8 4"/>
  <text x="${qrInnerX + qrInnerW / 2}" y="${signupQrY + signupQrH / 2 + 6}" text-anchor="middle" font-size="16" font-family="Poppins,sans-serif" font-weight="600" fill="#0B1E78">Signup QR</text>
  <!-- Payment QR -->
  <rect x="${qrInnerX}" y="${paymentQrY}" width="${qrInnerW}" height="${paymentQrH}" rx="10" fill="#F0F5FF" stroke="#CCDAEF" stroke-width="1.5" stroke-dasharray="8 4"/>
  <text x="${qrInnerX + qrInnerW / 2}" y="${paymentQrY + paymentQrH / 2 + 6}" text-anchor="middle" font-size="16" font-family="Poppins,sans-serif" font-weight="600" fill="#0B1E78">Payment QR</text>
  <!-- Footer text in QR panel -->
  <text x="${QR_X + QR_W / 2}" y="${footerTextY}" text-anchor="middle" font-size="12" font-family="Poppins,sans-serif" font-weight="700" fill="#C8102E">${safeFooter}</text>

  <!-- ── Signup link bar ── -->
  <rect x="40" y="${LINK_Y}" width="1000" height="${LINK_H}" rx="8" fill="#FFFFFF" stroke="#CBD8EF" stroke-width="1.5"/>
  <text x="62" y="${LINK_Y + 26}" font-size="16" font-family="Poppins,sans-serif" fill="#0B4FD9">${safeLink}</text>

  <!-- ── Footer ── -->
  <rect x="0" y="${FOOTER_Y}" width="1080" height="${FOOTER_H}" fill="#071B4D"/>
  <text x="40" y="${FOOTER_Y + 32}" font-size="13" font-family="Poppins,sans-serif" fill="rgba(255,255,255,0.50)">${safeWebsite}</text>
  <text x="1040" y="${FOOTER_Y + 32}" text-anchor="end" font-size="13" font-family="Poppins,sans-serif" font-weight="700" fill="#C8A061" font-style="italic">${safeMotto}</text>
</svg>`;

    const pngBytes = await renderResvgPng(svg, 3240);
    const shouldDownload = body.download === true;
    const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");

    return new Response(pngBytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
        "content-disposition": `${shouldDownload ? "attachment" : "inline"}; filename="lsuic-signup-flyer-${ts}.png"`,
      },
    });
  } catch (err) {
    console.error("Signup flyer render error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to render signup flyer" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
