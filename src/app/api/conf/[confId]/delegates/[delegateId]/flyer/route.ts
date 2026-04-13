import { prisma } from "@/lib/prisma";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { getLiberiaIndependenceAnniversary } from "@/lib/conf/delegate-utils";
import { readFile } from "node:fs/promises";
import path from "node:path";

const LOGO_CANDIDATES = [
  "lsuic-logo-primary.png",
  "lsuic_logo.png",
  "Liberian Student Union emblem in China.png",
] as const;

const CITY_BACKDROP_CANDIDATES = [
  "assets/jinan_city/day_view_landscape.png",
  "assets/jinan_city/morning_view_landscape.png",
  "assets/hotel/main_entrance_view.png",
] as const;

function clampText(input: string, maxChars: number) {
  const value = input.trim();
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function normalizeConfAssetPath(assetPath: string) {
  return assetPath.replace(/^\/+/, "");
}

function escapeXml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function guessMimeType(fileNameOrUrl: string) {
  const value = fileNameOrUrl.toLowerCase();
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".jpg") || value.endsWith(".jpeg")) return "image/jpeg";
  if (value.endsWith(".webp")) return "image/webp";
  if (value.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function toDataUri(data: ArrayBuffer | Buffer, mimeType: string) {
  const binary =
    data instanceof ArrayBuffer
      ? Buffer.from(new Uint8Array(data))
      : Buffer.from(data);
  const base64 = binary.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function formatOrdinal(value: number) {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) {
    return `${value}th`;
  }

  const mod10 = value % 10;
  if (mod10 === 1) return `${value}st`;
  if (mod10 === 2) return `${value}nd`;
  if (mod10 === 3) return `${value}rd`;
  return `${value}th`;
}

async function loadPublicConfImageDataUri(candidates: readonly string[]) {
  for (const assetPath of candidates) {
    try {
      const normalized = normalizeConfAssetPath(assetPath);
      const filePath = path.join(process.cwd(), "public", "conf", normalized);
      const data = await readFile(filePath);
      return toDataUri(data, guessMimeType(normalized));
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

async function loadLogoDataUri() {
  return loadPublicConfImageDataUri(LOGO_CANDIDATES);
}

async function loadCityBackdropDataUri() {
  return loadPublicConfImageDataUri(CITY_BACKDROP_CANDIDATES);
}

async function fetchImageAsDataUri(imageUrl: string) {
  try {
    const response = await fetch(imageUrl, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const headerMime = response.headers
      .get("content-type")
      ?.split(";")[0]
      ?.trim();
    if (headerMime && !headerMime.startsWith("image/")) {
      return null;
    }

    const mimeType = headerMime || guessMimeType(imageUrl);
    const bytes = await response.arrayBuffer();
    return toDataUri(bytes, mimeType);
  } catch {
    return null;
  }
}

// GET /api/conf/[confId]/delegates/[delegateId]/flyer
export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ confId: string; delegateId: string }>;
  },
) {
  try {
    const { confId, delegateId } = await params;

    const delegate = await prisma.confDelegate.findUnique({
      where: { id: delegateId },
      select: {
        id: true,
        confId: true,
        name: true,
        city: true,
        university: true,
        delegateCode: true,
        bookletPhotoPath: true,
        feePaid: true,
        flyerIssuedAt: true,
      },
    });

    if (!delegate || delegate.confId !== confId) {
      return new Response(JSON.stringify({ error: "Delegate not found" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    if (!delegate.feePaid || !delegate.bookletPhotoPath) {
      return new Response(
        JSON.stringify({
          error:
            "Flyer is available only after fee confirmation and booklet photo upload",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const event = await prisma.confEvent.findUnique({
      where: { id: confId },
      select: { year: true },
    });

    const confYear = event?.year || new Date().getFullYear();
    const liberiaAnniversary = getLiberiaIndependenceAnniversary(confYear);

    const origin = new URL(req.url).origin;
    const photoUrl = resolveStoredAssetUrl(delegate.bookletPhotoPath, origin);
    const logoDataUri = await loadLogoDataUri();
    const cityBackdropDataUri = await loadCityBackdropDataUri();
    const photoDataUri = await fetchImageAsDataUri(photoUrl);

    const name = escapeXml(clampText(delegate.name, 34));
    const city = escapeXml(clampText(delegate.city || "Jinan, China", 30));
    const university = escapeXml(
      clampText(delegate.university || "LSUIC Delegate", 44),
    );
    const code = escapeXml(delegate.delegateCode || "PENDING-CODE");
    const flyerTitle = escapeXml(`LSUIC ${confYear} Delegate Flyer`);
    const flyerSubtitle = escapeXml(
      `Celebrating LSUIC 20th Conference and Liberia's ${formatOrdinal(liberiaAnniversary)} Independence`,
    );
    const independenceDateLabel = escapeXml(`July 26, ${confYear}`);

    const backdropLayer = cityBackdropDataUri
      ? `<image href="${escapeXml(cityBackdropDataUri)}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" opacity="0.24"/>`
      : `<g>
  <circle cx="120" cy="140" r="220" fill="#5DA6FF" fill-opacity="0.2"/>
  <circle cx="960" cy="1210" r="260" fill="#7BC5FF" fill-opacity="0.16"/>
</g>`;

    const logoLayer = logoDataUri
      ? `<g>
  <circle cx="898" cy="160" r="74" fill="#FFFFFF" fill-opacity="0.96"/>
  <circle cx="898" cy="160" r="74" fill="none" stroke="#C8A061" stroke-width="3"/>
  <image href="${escapeXml(logoDataUri)}" x="840" y="102" width="116" height="116" preserveAspectRatio="xMidYMid meet" clip-path="url(#logoClip)"/>
</g>`
      : `<g>
  <circle cx="898" cy="160" r="74" fill="#FFFFFF" fill-opacity="0.96"/>
  <circle cx="898" cy="160" r="74" fill="none" stroke="#C8A061" stroke-width="3"/>
  <text x="898" y="171" text-anchor="middle" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#0A2C8B">LSUIC</text>
</g>`;

    const photoLayer = photoDataUri
      ? `<image href="${escapeXml(photoDataUri)}" x="184" y="418" width="712" height="524" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
      : `<g>
  <rect x="184" y="418" width="712" height="524" rx="30" fill="#E9F0FF"/>
  <text x="540" y="690" text-anchor="middle" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#35559B">Photo unavailable</text>
</g>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0A1B56"/>
      <stop offset="58%" stop-color="#0B4FD9"/>
      <stop offset="100%" stop-color="#0C6AD8"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#061033" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#061033" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#061033" stop-opacity="0.62"/>
    </linearGradient>
    <linearGradient id="goldBand" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FDE6A8"/>
      <stop offset="50%" stop-color="#F5C765"/>
      <stop offset="100%" stop-color="#DDA842"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#081C5F" flood-opacity="0.35"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#142D70" flood-opacity="0.24"/>
    </filter>
    <clipPath id="logoClip">
      <circle cx="898" cy="160" r="58"/>
    </clipPath>
    <clipPath id="photoClip">
      <rect x="184" y="418" width="712" height="524" rx="30"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1350" fill="url(#bg)"/>
  ${backdropLayer}
  <rect width="1080" height="1350" fill="url(#overlay)"/>

  <g filter="url(#cardShadow)">
    <rect x="74" y="78" width="932" height="1194" rx="46" fill="#FFFFFF" fill-opacity="0.97"/>
  </g>

  <rect x="110" y="116" width="860" height="88" rx="24" fill="#0B1E78"/>
  <text x="140" y="170" font-size="32" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#FFFFFF">Liberian Student Union in China</text>
  ${logoLayer}

  <text x="130" y="264" font-size="40" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#8E0E00">${flyerTitle}</text>
  <text x="130" y="312" font-size="28" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="500" fill="#0B1E78">${flyerSubtitle}</text>

  <rect x="130" y="348" width="820" height="24" rx="12" fill="url(#goldBand)"/>
  <text x="540" y="365" text-anchor="middle" font-size="17" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#172554">#LSUIC  #Jinan2026</text>
  <text x="540" y="392" text-anchor="middle" font-size="18" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#8E0E00">Special Celebration: Liberia Independence Day | ${independenceDateLabel}</text>

  <g filter="url(#softShadow)">
    <rect x="166" y="400" width="748" height="560" rx="36" fill="#F4F8FF" stroke="#D0DCEB" stroke-width="3"/>
  </g>
  ${photoLayer}

  <text x="540" y="1038" text-anchor="middle" font-size="60" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="800" fill="#0D2A73">${name}</text>
  <text x="540" y="1088" text-anchor="middle" font-size="33" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#3E4D6C">${university}</text>
  <text x="540" y="1130" text-anchor="middle" font-size="30" font-family="Segoe UI, Arial, sans-serif" fill="#2D3D5D">${city} | ${code}</text>
  <text x="540" y="1168" text-anchor="middle" font-size="24" font-family="Segoe UI, Arial, sans-serif" fill="#52627F">Arcadia Spa Golf International Hotel, Jinan</text>

  <rect x="130" y="1192" width="820" height="54" rx="16" fill="#8E0E00"/>
  <text x="540" y="1226" text-anchor="middle" font-size="26" font-family="Segoe UI, Arial, sans-serif" fill="#FFFFFF">Website: https://www.lsuic.org | Email: info@lsuic.org</text>

  <rect x="130" y="1254" width="820" height="54" rx="16" fill="#0B1E78"/>
  <text x="540" y="1289" text-anchor="middle" font-size="33" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#D7E4FF">Motto: Excellence Through Hard Work</text>
</svg>`;

    if (!delegate.flyerIssuedAt) {
      await prisma.confDelegate.update({
        where: { id: delegate.id },
        data: {
          flyerReady: true,
          flyerIssuedAt: new Date(),
        },
      });
    }

    const safeCode = (delegate.delegateCode || "delegate").replace(
      /[^A-Za-z0-9-]/g,
      "",
    );
    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": `inline; filename=\"${safeCode}-flyer.svg\"`,
      },
    });
  } catch (error) {
    console.error("Failed to build delegate flyer:", error);
    return new Response(JSON.stringify({ error: "Failed to generate flyer" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
