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
    const wantsPng =
      (requestUrl.searchParams.get("format") || "svg").toLowerCase() === "png";

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

    const fullName = escapeXml(clampText(delegate.name, 34));
    const splitName = delegate.name.trim().split(/\s+/).filter(Boolean);
    const firstName = escapeXml(clampText(splitName[0] || delegate.name, 18));
    const familyName = escapeXml(
      clampText(
        splitName.slice(1).join(" ") || splitName[0] || delegate.name,
        24,
      ),
    );
    const city = escapeXml(clampText(delegate.city || "Jinan, China", 30));
    const cityHeading = escapeXml(
      clampText((delegate.city || "Jinan").toUpperCase(), 14),
    );
    const university = escapeXml(
      clampText(delegate.university || "LSUIC Delegate", 44),
    );
    const code = escapeXml(delegate.delegateCode || "PENDING-CODE");
    const cardSubtitle = escapeXml(
      `LSUIC 20TH NATIONAL CONFERENCE • ${confYear}`,
    );
    const encodedConfId = encodeURIComponent(confId);
    const encodedDelegateId = encodeURIComponent(delegateId);
    const downloadBasePath = `/api/conf/${encodedConfId}/delegates/${encodedDelegateId}/flyer`;
    const downloadPngUrl = escapeXml(
      `${downloadBasePath}?format=png&download=1`,
    );
    const downloadSvgUrl = escapeXml(
      `${downloadBasePath}?download=1`,
    );

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
      ? `<image href="${escapeXml(photoDataUri)}" x="184" y="486" width="712" height="508" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>`
      : `<g>
  <rect x="184" y="486" width="712" height="508" rx="30" fill="#E9F0FF"/>
  <text x="540" y="760" text-anchor="middle" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#35559B">Photo unavailable</text>
</g>`;

    const heroLayer = cityBackdropDataUri
      ? `<image href="${escapeXml(cityBackdropDataUri)}" x="110" y="116" width="860" height="356" preserveAspectRatio="xMidYMid slice" clip-path="url(#heroClip)"/>`
      : `<rect x="110" y="116" width="860" height="356" rx="30" fill="#183C8F"/>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&amp;family=Poppins:wght@400;500;600;700;800&amp;display=swap');
    </style>
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
    <linearGradient id="heroShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#021033" stop-opacity="0.24"/>
      <stop offset="70%" stop-color="#021033" stop-opacity="0.56"/>
      <stop offset="100%" stop-color="#021033" stop-opacity="0.82"/>
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
    <clipPath id="heroClip">
      <rect x="110" y="116" width="860" height="356" rx="30"/>
    </clipPath>
    <clipPath id="photoClip">
      <rect x="184" y="486" width="712" height="508" rx="30"/>
    </clipPath>
  </defs>

  <rect width="1080" height="1350" fill="url(#bg)"/>
  ${backdropLayer}
  <rect width="1080" height="1350" fill="url(#overlay)"/>

  <g filter="url(#cardShadow)">
    <rect x="74" y="78" width="932" height="1194" rx="46" fill="#FFFFFF" fill-opacity="0.97"/>
  </g>

  ${heroLayer}
  <rect x="110" y="116" width="860" height="356" rx="30" fill="url(#heroShade)"/>

  <rect x="110" y="116" width="860" height="70" rx="24" fill="#0B1E78"/>
  <text x="140" y="161" font-size="40" font-family="Oswald, Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#FFFFFF">Liberian Student Union in China</text>
  ${logoLayer}

  <text x="130" y="258" font-size="66" font-family="Oswald, Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#FFFFFF" letter-spacing="2">CONFIRMED DELEGATE</text>
  <text x="130" y="304" font-size="28" font-family="Poppins, Segoe UI, Arial, sans-serif" font-weight="600" fill="#E7EEFF">${cardSubtitle}</text>
  <text x="130" y="340" font-size="22" font-family="Poppins, Segoe UI, Arial, sans-serif" font-weight="500" fill="#F6F8FF">${cityHeading}, CHINA • OFFICIAL PARTICIPANT CARD</text>
  <a href="${downloadPngUrl}">
    <rect x="804" y="288" width="68" height="34" rx="9" fill="#C8102E"/>
    <text x="838" y="311" text-anchor="middle" font-size="18" font-family="Oswald, Montserrat, Segoe UI, Arial, sans-serif" fill="#FFFFFF">PNG</text>
  </a>
  <a href="${downloadSvgUrl}">
    <rect x="878" y="288" width="68" height="34" rx="9" fill="#0B1E78"/>
    <text x="912" y="311" text-anchor="middle" font-size="18" font-family="Oswald, Montserrat, Segoe UI, Arial, sans-serif" fill="#FFFFFF">SVG</text>
  </a>
  <text x="130" y="430" font-size="100" font-family="Oswald, Montserrat, Segoe UI, Arial, sans-serif" font-weight="700" fill="#FFFFFF" letter-spacing="2">${cityHeading} ${confYear}</text>

  <rect x="130" y="438" width="820" height="12" fill="#C8102E"/>
  <rect x="130" y="450" width="820" height="8" fill="#FFFFFF"/>
  <rect x="130" y="458" width="820" height="12" fill="#003893"/>

  <g filter="url(#softShadow)">
    <rect x="166" y="468" width="748" height="544" rx="36" fill="#F4F8FF" stroke="#D0DCEB" stroke-width="3"/>
  </g>
  ${photoLayer}

  <text x="540" y="1060" text-anchor="middle" font-size="84" font-family="Brush Script MT, Snell Roundhand, Segoe Script, cursive" fill="#0B4FD9">${firstName}</text>
  <text x="540" y="1122" text-anchor="middle" font-size="62" font-family="Poppins, Montserrat, Segoe UI, Arial, sans-serif" font-weight="800" fill="#0D2A73">${familyName}</text>
  <text x="540" y="1158" text-anchor="middle" font-size="20" font-family="Poppins, Segoe UI, Arial, sans-serif" fill="#516289">${fullName}</text>
  <text x="540" y="1190" text-anchor="middle" font-size="38" font-family="Poppins, Segoe UI, Arial, sans-serif" font-weight="600" fill="#3E4D6C">${university}</text>
  <text x="540" y="1218" text-anchor="middle" font-size="27" font-family="Poppins, Segoe UI, Arial, sans-serif" fill="#2D3D5D">${city} | ${code}</text>

  <rect x="130" y="1228" width="820" height="48" rx="16" fill="#C8102E"/>
  <text x="540" y="1260" text-anchor="middle" font-size="25" font-family="Poppins, Segoe UI, Arial, sans-serif" fill="#FFFFFF">Website: https://www.lsuic.org | Email: info@lsuic.org</text>

  <rect x="130" y="1278" width="820" height="44" rx="16" fill="#0B1E78"/>
  <text x="540" y="1308" text-anchor="middle" font-size="30" font-family="Poppins, Segoe UI, Arial, sans-serif" font-weight="700" fill="#D7E4FF">Motto: Excellence Through Hard Work</text>
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

    if (wantsPng) {
      try {
        const sharp = (await import("sharp")).default;
        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
        const pngBytes = new Uint8Array(pngBuffer);

        return new Response(pngBytes, {
          status: 200,
          headers: {
            "content-type": "image/png",
            "cache-control": "no-store",
            "content-disposition": `${shouldDownload ? "attachment" : "inline"}; filename=\"${safeCode}-delegate-card.png\"`,
          },
        });
      } catch (pngError) {
        console.error("Failed to render delegate card PNG:", pngError);
        return new Response(
          JSON.stringify({ error: "Failed to generate PNG delegate card" }),
          {
            status: 500,
            headers: { "content-type": "application/json" },
          },
        );
      }
    }

    return new Response(svg, {
      status: 200,
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "no-store",
        "content-disposition": `${shouldDownload ? "attachment" : "inline"}; filename=\"${safeCode}-delegate-card.svg\"`,
      },
    });
  } catch (error) {
    console.error("Failed to build delegate card:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate delegate card" }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
