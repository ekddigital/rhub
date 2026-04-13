import { prisma } from "@/lib/prisma";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
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
    const requestUrl = new URL(req.url);
    const shouldDownload = ["1", "true", "yes"].includes(
      (requestUrl.searchParams.get("download") || "").toLowerCase(),
    );

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
            "Delegate card is available only after fee confirmation and booklet photo upload",
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

    const origin = requestUrl.origin;
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
    const cardSubtitle = escapeXml(`LSUIC 20TH NATIONAL CONFERENCE • ${confYear}`);

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
      <stop offset="0%" stop-color="#071B4D"/>
      <stop offset="54%" stop-color="#0A3A99"/>
      <stop offset="100%" stop-color="#0B56D2"/>
    </linearGradient>
    <linearGradient id="overlay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#041033" stop-opacity="0.62"/>
      <stop offset="45%" stop-color="#041033" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#041033" stop-opacity="0.66"/>
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
  <rect x="110" y="204" width="860" height="8" fill="#C8102E"/>
  <text x="140" y="170" font-size="32" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#FFFFFF">Liberian Student Union in China</text>
  ${logoLayer}

  <text x="130" y="266" font-size="58" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="800" fill="#C8102E">CONFIRMED DELEGATE</text>
  <text x="130" y="312" font-size="26" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="600" fill="#0B1E78">${cardSubtitle}</text>
  <text x="130" y="342" font-size="20" font-family="Segoe UI, Arial, sans-serif" font-weight="500" fill="#2D3D5D">Jinan, China • Official Participant Card</text>

  <rect x="130" y="356" width="820" height="12" fill="#C8102E"/>
  <rect x="130" y="368" width="820" height="8" fill="#FFFFFF"/>
  <rect x="130" y="376" width="820" height="12" fill="#003893"/>

  <g filter="url(#softShadow)">
    <rect x="166" y="400" width="748" height="560" rx="36" fill="#F4F8FF" stroke="#D0DCEB" stroke-width="3"/>
  </g>
  ${photoLayer}

  <text x="540" y="1032" text-anchor="middle" font-size="64" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="800" fill="#0D2A73">${name}</text>
  <text x="540" y="1082" text-anchor="middle" font-size="34" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#3E4D6C">${university}</text>
  <text x="540" y="1122" text-anchor="middle" font-size="30" font-family="Segoe UI, Arial, sans-serif" fill="#2D3D5D">${city}</text>

  <rect x="350" y="1142" width="380" height="46" rx="14" fill="#C8102E"/>
  <text x="540" y="1172" text-anchor="middle" font-size="24" font-family="Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#FFFFFF">${code}</text>
  <text x="540" y="1210" text-anchor="middle" font-size="24" font-family="Segoe UI, Arial, sans-serif" fill="#52627F">Arcadia Spa Golf International Hotel, Jinan</text>

  <rect x="130" y="1228" width="820" height="48" rx="16" fill="#C8102E"/>
  <text x="540" y="1260" text-anchor="middle" font-size="25" font-family="Segoe UI, Arial, sans-serif" fill="#FFFFFF">Website: https://www.lsuic.org | Email: info@lsuic.org</text>

  <rect x="130" y="1278" width="820" height="44" rx="16" fill="#0B1E78"/>
  <text x="540" y="1308" text-anchor="middle" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="700" fill="#D7E4FF">Motto: Excellence Through Hard Work</text>
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
        "content-disposition": `${shouldDownload ? "attachment" : "inline"}; filename=\"${safeCode}-delegate-card.svg\"`,
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
