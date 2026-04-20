/**
 * Shared SVG asset helpers for LSUIC conference flyers & cards.
 *
 * Single source of truth for:
 *   - Asset loading (logo, backdrop, fonts)
 *   - Logo SVG layer (clip, white circle, image with zoom + vertical offset)
 *   - @font-face block (real family names so resvg can resolve from fontDirs)
 *   - PNG rendering via resvg at any target resolution
 */

import { readFile } from "node:fs/promises";
import path from "node:path";

// ── XML / MIME utilities ──────────────────────────────────────────────────────

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function guessMime(fileName: string): string {
  const f = fileName.toLowerCase();
  if (f.endsWith(".png")) return "image/png";
  if (f.endsWith(".jpg") || f.endsWith(".jpeg")) return "image/jpeg";
  if (f.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export function toDataUri(data: Buffer | ArrayBuffer, mime: string): string {
  const buf =
    data instanceof ArrayBuffer
      ? Buffer.from(new Uint8Array(data))
      : Buffer.from(data);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

export async function readPublicFile(...parts: string[]): Promise<Buffer | null> {
  try {
    const fp = path.join(process.cwd(), "public", ...parts);
    return await readFile(fp);
  } catch {
    return null;
  }
}

export async function loadAsset(candidates: readonly string[]): Promise<string | null> {
  for (const c of candidates) {
    const buf = await readPublicFile(c);
    if (buf) return toDataUri(buf, guessMime(c));
  }
  return null;
}

// ── Asset candidates ──────────────────────────────────────────────────────────

export const LOGO_CANDIDATES = [
  "conf/lsuic-logo-primary.png",
  "conf/lsuic_logo.png",
  "conf/lsuic_logo_white_bg.png",
] as const;

export const BACKDROP_CANDIDATES = [
  "conf/assets/jinan_city/day_view_landscape.png",
  "conf/assets/hotel/main_entrance_view.png",
] as const;

export const loadLogoDataUri = () => loadAsset(LOGO_CANDIDATES);
export const loadBackdropDataUri = () => loadAsset(BACKDROP_CANDIDATES);

// ── Font loading & @font-face block ──────────────────────────────────────────

export type FlyerFonts = {
  /** Oswald-Bold — headlines */
  headline: string;
  /** Poppins-Bold */
  body: string;
  /** Poppins-Regular */
  bodyRegular: string;
  /** Poppins-SemiBold */
  bodySemiBold: string;
  /** GreatVibes-Regular — script / sub-theme */
  script: string;
};

let _fontsCache: Promise<FlyerFonts | null> | null = null;

export async function loadFlyerFonts(): Promise<FlyerFonts | null> {
  if (!_fontsCache) {
    _fontsCache = (async () => {
      const readFont = async (name: string) => {
        const buf = await readPublicFile("conf", "fonts", name);
        return buf ? toDataUri(buf, "font/ttf") : null;
      };

      const [headline, bodyRegular, bodySemiBold, body, script] =
        await Promise.all([
          readFont("Oswald-Bold.ttf"),
          readFont("Poppins-Regular.ttf"),
          readFont("Poppins-SemiBold.ttf"),
          readFont("Poppins-Bold.ttf"),
          readFont("GreatVibes-Regular.ttf"),
        ]);

      if (!headline || !body || !bodyRegular || !bodySemiBold) return null;

      return {
        headline,
        body,
        bodyRegular,
        bodySemiBold,
        script: script ?? headline,
      };
    })();
  }
  return _fontsCache;
}

/**
 * Returns an SVG <style> block with @font-face declarations using the real
 * family names ("Oswald", "Poppins", "Great Vibes").
 *
 * This is critical: resvg resolves fonts from fontDirs by the TTF's internal
 * family name — short aliases like 'H', 'B', 'S', 'CardHeadline' will NOT
 * match. Always use real names in both @font-face and font-family attributes.
 */
export function buildFontFaceBlock(fonts: FlyerFonts | null): string {
  if (!fonts) return "";
  return `<style>
    @font-face { font-family:'Oswald'; src:url('${fonts.headline}') format('truetype'); font-weight:700; }
    @font-face { font-family:'Poppins'; src:url('${fonts.bodyRegular}') format('truetype'); font-weight:400; }
    @font-face { font-family:'Poppins'; src:url('${fonts.bodySemiBold}') format('truetype'); font-weight:600; }
    @font-face { font-family:'Poppins'; src:url('${fonts.body}') format('truetype'); font-weight:700; }
    @font-face { font-family:'Great Vibes'; src:url('${fonts.script}') format('truetype'); font-weight:400; }
  </style>`;
}

// ── Logo SVG layer ────────────────────────────────────────────────────────────
//
// The LSUIC logo PNG (1024×1024) has its badge content centred slightly above
// the geometric centre of the file, leaving more whitespace at the bottom.
// We correct this by:
//   • Zooming the image 10% larger than the clip radius (fills edge-to-edge)
//   • Shifting the image 5px downward within the clip
//
// The clip circle, white backing ring, and gold border are always at (cx, cy).

export interface LogoLayerOptions {
  /** Pixels added to the backing ring beyond clip radius R (default 4) */
  ringExtra?: number;
  /** Gold ring stroke width (default 3.5) */
  strokeWidth?: number;
  /** Image zoom factor relative to clip R (default 1.10) */
  scale?: number;
  /** Pixels to shift the image downward inside the clip (default 5) */
  offsetY?: number;
  /** clipPath element id — must be unique per SVG (default "lsuicLogoClip") */
  clipId?: string;
}

export function buildLogoLayer(
  cx: number,
  cy: number,
  /** Clip circle radius (image is confined to this circle) */
  R: number,
  logoUri: string | null,
  opts: LogoLayerOptions = {},
): string {
  const ringExtra  = opts.ringExtra  ?? 4;
  const strokeWidth = opts.strokeWidth ?? 3.5;
  const scale      = opts.scale      ?? 1.10;
  const offsetY    = opts.offsetY    ?? 5;
  const clipId     = opts.clipId     ?? "lsuicLogoClip";

  const ringR = R + ringExtra;
  const imgR  = Math.round(R * scale);

  const circle = `<circle cx="${cx}" cy="${cy}" r="${ringR}" fill="#FFFFFF" stroke="#C8A061" stroke-width="${strokeWidth}"/>`;

  if (!logoUri) {
    return `${circle}
  <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-family="Oswald,sans-serif" font-size="${Math.round(R * 0.35)}" font-weight="700" fill="#0A2C8B">LSUIC</text>`;
  }

  return `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${R}"/></clipPath>
  ${circle}
  <image href="${escapeXml(logoUri)}" x="${cx - imgR}" y="${cy - imgR + offsetY}" width="${imgR * 2}" height="${imgR * 2}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})" image-rendering="optimizeQuality"/>`;
}

// ── PNG rendering ─────────────────────────────────────────────────────────────

/**
 * Renders an SVG string to PNG using @resvg/resvg-js.
 *
 * @param svg         SVG source string
 * @param targetWidth Render width in pixels. The height scales proportionally
 *                    from the SVG viewBox. Use 2× the logical size for Retina.
 */
export async function renderResvgPng(
  svg: string,
  targetWidth: number,
): Promise<Uint8Array> {
  const { Resvg } = await import("@resvg/resvg-js");
  const fontsDir = path.join(process.cwd(), "public", "conf", "fonts");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: targetWidth },
    font: {
      fontDirs: [fontsDir],
      loadSystemFonts: false,
      defaultFontFamily: "Oswald",
    },
  });
  return new Uint8Array(resvg.render().asPng());
}
