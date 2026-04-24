import { prisma } from "@/lib/prisma";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import { CONF_2026 } from "@/lib/conf/config";
import {
  escapeXml,
  toDataUri,
  readPublicFile,
  loadFlyerFonts,
  buildFontFaceBlock,
  buildLogoLayer,
  renderResvgPng,
} from "@/lib/conf/svg-assets";

const CITY_BACKDROP_CANDIDATES = [
  "assets/jinan_city/day_view_landscape.png",
  "assets/jinan_city/morning_view_landscape.png",
  "assets/hotel/main_entrance_view.png",
] as const;

type EmbeddedFonts = Awaited<ReturnType<typeof loadFlyerFonts>>;

let embeddedFontsPromise: Promise<EmbeddedFonts> | null = null;

const LIBERIA_INDEPENDENCE_YEAR = 1847;
const LSUIC_CONFERENCE_EDITION = 20;

function clampText(input: string, maxChars: number) {
  const value = input.trim();
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 3)).trimEnd()}...`;
}

function wrapTextLines(
  input: string,
  maxCharsPerLine: number,
  maxLines: number,
) {
  if (maxCharsPerLine < 1 || maxLines < 1) return [];

  const words = input.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  const lines: string[] = [];
  let currentLine = "";
  let nextWordIndex = 0;

  while (nextWordIndex < words.length && lines.length < maxLines) {
    const nextWord = words[nextWordIndex];
    const candidate = currentLine ? `${currentLine} ${nextWord}` : nextWord;

    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
      nextWordIndex += 1;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
      continue;
    }

    lines.push(clampText(nextWord, maxCharsPerLine));
    nextWordIndex += 1;
  }

  if (lines.length < maxLines && currentLine) {
    lines.push(currentLine);
  }

  if (nextWordIndex < words.length && lines.length > 0) {
    const lastIndex = lines.length - 1;
    const linePrefix = clampText(
      lines[lastIndex],
      Math.max(4, maxCharsPerLine - 3),
    );
    lines[lastIndex] = `${linePrefix.replace(/\.\.\.$/, "")}...`;
  }

  return lines;
}

function normalizeConfAssetPath(assetPath: string) {
  return assetPath.replace(/^\/+/, "");
}

function guessMimeType(fileNameOrUrl: string) {
  const value = fileNameOrUrl.toLowerCase();
  if (value.endsWith(".png")) return "image/png";
  if (value.endsWith(".jpg") || value.endsWith(".jpeg")) return "image/jpeg";
  if (value.endsWith(".webp")) return "image/webp";
  if (value.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

function formatConferenceDateRange(start: Date | null, end: Date | null) {
  if (!start || !end) return null;

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const monthLong = new Intl.DateTimeFormat("en-US", { month: "long" });

  if (sameMonth) {
    return `${monthLong.format(start).toUpperCase()} ${start.getDate()}-${end.getDate()}, ${end.getFullYear()}`;
  }

  if (sameYear) {
    return `${monthLong.format(start).toUpperCase()} ${start.getDate()} - ${monthLong.format(end).toUpperCase()} ${end.getDate()}, ${end.getFullYear()}`;
  }

  return `${monthLong.format(start).toUpperCase()} ${start.getDate()}, ${start.getFullYear()} - ${monthLong.format(end).toUpperCase()} ${end.getDate()}, ${end.getFullYear()}`;
}

function formatConferenceWeekdayRange(start: Date | null, end: Date | null) {
  if (!start || !end) return null;

  const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" });
  return `${weekday.format(start).toUpperCase()} - ${weekday.format(end).toUpperCase()}`;
}

async function loadPublicConfImageDataUri(candidates: readonly string[]) {
  for (const assetPath of candidates) {
    const normalized = normalizeConfAssetPath(assetPath);
    const buf = await readPublicFile("conf", normalized);
    if (buf) return toDataUri(buf, guessMimeType(normalized));
  }
  return null;
}

async function loadLogoDataUri() {
  // Re-use the shared LOGO_CANDIDATES from svg-assets, strip the "conf/" prefix
  // since loadPublicConfImageDataUri already prepends "conf/".
  const candidates = [
    "lsuic-logo-primary.png",
    "lsuic_logo.png",
    "lsuic_logo_white_bg.png",
  ] as const;
  return loadPublicConfImageDataUri(candidates);
}

async function loadCityBackdropDataUri() {
  return loadPublicConfImageDataUri(CITY_BACKDROP_CANDIDATES);
}

async function loadEmbeddedFonts() {
  if (!embeddedFontsPromise) {
    embeddedFontsPromise = loadFlyerFonts();
  }
  return embeddedFontsPromise;
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
      select: { year: true, startsAt: true, endsAt: true },
    });

    const confYear = event?.year || new Date().getFullYear();

    const origin = requestUrl.origin;
    const photoUrl = resolveStoredAssetUrl(delegate.bookletPhotoPath, origin);
    const logoDataUri = await loadLogoDataUri();
    const cityBackdropDataUri = await loadCityBackdropDataUri();
    const embeddedFonts = await loadEmbeddedFonts();
    const photoDataUri = await fetchImageAsDataUri(photoUrl);

    const splitName = delegate.name.trim().split(/\s+/).filter(Boolean);
    const firstName = escapeXml(clampText(splitName[0] || delegate.name, 18));
    const familyName = escapeXml(
      clampText(
        splitName.slice(1).join(" ") || splitName[0] || delegate.name,
        24,
      ),
    );
    const cityHeadingRaw = clampText(
      (delegate.city || "Jinan").toUpperCase(),
      14,
    );
    const cityHeading = escapeXml(cityHeadingRaw);
    const cardSubtitle = escapeXml(
      `LSUIC 20TH NATIONAL CONFERENCE • ${confYear}`,
    );
    const dateRangeLabel = escapeXml(
      formatConferenceDateRange(
        event?.startsAt ?? null,
        event?.endsAt ?? null,
      ) || `JULY 24-27, ${confYear}`,
    );
    const weekdayRangeLabel = escapeXml(
      formatConferenceWeekdayRange(
        event?.startsAt ?? null,
        event?.endsAt ?? null,
      ) || "THURSDAY - SUNDAY",
    );
    const themeLine = escapeXml(CONF_2026.theme);
    const subThemeLine = escapeXml(CONF_2026.subTheme
      .replace(", and ", " · ")
      .replace(", ", " · "));
    const delegateStatementLines = [
      escapeXml(`OF LSUIC ${confYear} CONFERENCE,`),
      escapeXml(`AND I WILL BE IN ${cityHeadingRaw}`),
    ];
    const scoreLine = escapeXml(
      `LSUIC @ ${LSUIC_CONFERENCE_EDITION}, LIB @ ${Math.max(0, confYear - LIBERIA_INDEPENDENCE_YEAR)}`,
    );
    const committeeLineRaw = `${cityHeadingRaw} ${confYear} CONFERENCE COMMITTEE`;
    const committeeLines = wrapTextLines(committeeLineRaw, 40, 2).map((line) =>
      escapeXml(line),
    );
    const universityLines = wrapTextLines(
      clampText(
        (
          delegate.university || "Liberian Student Union in China"
        ).toUpperCase(),
        42,
      ),
      26,
      2,
    ).map((line) => escapeXml(line));
    const delegateCodeLabel = escapeXml(
      clampText(delegate.delegateCode || "N/A", 20),
    );
    const encodedConfId = encodeURIComponent(confId);
    const encodedDelegateId = encodeURIComponent(delegateId);
    const downloadBasePath = `/api/conf/${encodedConfId}/delegates/${encodedDelegateId}/flyer`;
    const downloadPngUrl = escapeXml(
      `${downloadBasePath}?format=png&download=1`,
    );
    const downloadSvgUrl = escapeXml(`${downloadBasePath}?download=1`);

    const fontStyleBlock = buildFontFaceBlock(embeddedFonts);

    const backdropLayer = cityBackdropDataUri
      ? `<image href="${escapeXml(cityBackdropDataUri)}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice" opacity="0.24"/>`
      : `<g>
  <circle cx="120" cy="140" r="220" fill="#5DA6FF" fill-opacity="0.2"/>
  <circle cx="960" cy="1210" r="260" fill="#7BC5FF" fill-opacity="0.16"/>
</g>`;

    // Logo: clip r=70 (matches white ring interior), zoom 1.10, offset 5px down
    const logoLayer = buildLogoLayer(898, 160, 70, logoDataUri, { clipId: "logoClip", strokeWidth: 3 });

    const photoLayer = photoDataUri
      ? `<g>
  <rect x="646" y="560" width="252" height="398" rx="26" fill="#EEF2FA"/>
  <image href="${escapeXml(photoDataUri)}" x="646" y="560" width="252" height="398" preserveAspectRatio="xMidYMid meet" clip-path="url(#photoClip)"/>
  <g clip-path="url(#photoClip)">
    <rect x="646" y="560" width="76" height="398" fill="url(#photoSideFadeLeft)"/>
    <rect x="822" y="560" width="76" height="398" fill="url(#photoSideFadeRight)"/>
  </g>
</g>`
      : `<g>
  <rect x="646" y="560" width="252" height="398" rx="26" fill="#E9F0FF"/>
  <text x="772" y="768" text-anchor="middle" font-size="30" font-family="Segoe UI, Arial, sans-serif" font-weight="600" fill="#35559B">Photo unavailable</text>
</g>`;

    const delegateStatementLayer = delegateStatementLines
      .map(
        (line, index) =>
          `<text x="190" y="${846 + index * 30}" font-size="20" font-family="Poppins,Segoe UI,Arial,sans-serif" fill="#2D3D5D">${line}</text>`,
      )
      .join("");

    const committeeLayer = committeeLines
      .map(
        (line, index) =>
          `<text x="190" y="${1080 + index * 26}" font-size="19" font-family="Poppins,Segoe UI,Arial,sans-serif" fill="#1E2F5E">${line}</text>`,
      )
      .join("");

    const universityLayer = universityLines
      .map(
        (line, index) =>
          `<text x="772" y="${1086 + index * 26}" text-anchor="middle" font-size="17" font-family="Poppins,Segoe UI,Arial,sans-serif" fill="#1E2F5E">${line}</text>`,
      )
      .join("");

    const downloadControlsLayer = shouldDownload
      ? ""
      : `<a href="${downloadPngUrl}">
    <rect x="804" y="288" width="68" height="34" rx="9" fill="#C8102E"/>
    <text x="838" y="311" text-anchor="middle" font-size="18" font-family="Oswald,Segoe UI,Arial,sans-serif" fill="#FFFFFF">PNG</text>
  </a>
  <a href="${downloadSvgUrl}">
    <rect x="878" y="288" width="68" height="34" rx="9" fill="#0B1E78"/>
    <text x="912" y="311" text-anchor="middle" font-size="18" font-family="Oswald,Segoe UI,Arial,sans-serif" fill="#FFFFFF">SVG</text>
  </a>`;

    const heroLayer = cityBackdropDataUri
      ? `<image href="${escapeXml(cityBackdropDataUri)}" x="110" y="116" width="860" height="356" preserveAspectRatio="xMidYMid slice" clip-path="url(#heroClip)"/>`
      : `<rect x="110" y="116" width="860" height="356" rx="30" fill="#183C8F"/>`;

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    ${fontStyleBlock}
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
    <linearGradient id="photoSideFadeLeft" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#DBE3F2" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#DBE3F2" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="photoSideFadeRight" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%" stop-color="#DBE3F2" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#DBE3F2" stop-opacity="0"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#081C5F" flood-opacity="0.35"/>
    </filter>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#142D70" flood-opacity="0.24"/>
    </filter>
    <clipPath id="heroClip">
      <rect x="110" y="116" width="860" height="356" rx="30"/>
    </clipPath>
    <clipPath id="photoClip">
      <rect x="646" y="560" width="252" height="398" rx="26"/>
    </clipPath>
  </defs>

  <!-- Full canvas background layers -->
  <rect width="1080" height="1350" fill="url(#bg)"/>
  ${backdropLayer}
  <rect width="1080" height="1350" fill="url(#overlay)"/>

  <!-- Main white card container -->
  <g filter="url(#cardShadow)">
    <rect x="74" y="78" width="932" height="1194" rx="46" fill="#FFFFFF" fill-opacity="0.97"/>
  </g>

  <!-- Hero/city-view section -->
  ${heroLayer}
  <rect x="110" y="116" width="860" height="356" rx="30" fill="url(#heroShade)"/>

  <!-- Top union title bar + logo -->
  <rect x="110" y="116" width="860" height="70" rx="24" fill="#0B1E78"/>
  <text x="540" y="161" text-anchor="middle" font-size="38" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#FFFFFF">Liberian Student Union in China</text>
  ${logoLayer}

  <!-- Hero subtitle + theme headline -->
  <text x="540" y="206" text-anchor="middle" font-size="22" font-family="Poppins,Segoe UI,Arial,sans-serif" font-weight="600" fill="#E7EEFF">${cardSubtitle}</text>
  ${downloadControlsLayer}
  <text x="540" y="408" text-anchor="middle" font-size="52" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#FFFFFF" letter-spacing="1">${themeLine}</text>
  <text x="540" y="448" text-anchor="middle" font-size="18" font-family="'Great Vibes',Georgia,serif" fill="#C8A061" opacity="0.95">${subThemeLine}</text>

  <!-- <rect x="130" y="466" width="820" height="12" fill="#C8102E"/> -->
  <!-- <rect x="130" y="478" width="820" height="8" fill="#FFFFFF"/> -->
  <!-- <rect x="130" y="486" width="820" height="12" fill="#003893"/> -->

  <g filter="url(#softShadow)">
    <rect x="138" y="508" width="804" height="756" rx="36" fill="#F4F8FF" stroke="#D0DCEB" stroke-width="3"/>
  </g>
  <!-- Left accent guide line -->
  <rect x="162" y="538" width="8" height="696" rx="4" fill="#C8102E"/>
  <!-- Right photo/details panel -->
  <rect x="624" y="536" width="296" height="700" rx="28" fill="#EAF1FF" stroke="#CBD8EF" stroke-width="2"/>
  ${photoLayer}

  <!-- Left profile identity block -->
  <text x="190" y="586" font-size="22" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#0E2A76">NATIONAL DELEGATE PROFILE</text>
  <text x="190" y="636" font-size="54" font-family="Poppins,Segoe UI,Arial,sans-serif" fill="#101827">I am</text>
  <text x="190" y="704" font-size="74" font-family="'Great Vibes',Segoe Script,cursive" fill="#0B4FD9">${firstName}</text>
  <text x="190" y="760" font-size="55" font-family="Poppins,Segoe UI,Arial,sans-serif" font-weight="700" fill="#0D2A73">${familyName}</text>
  <text x="190" y="812" font-size="36.5" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#0B2E9B">CONFIRMED DELEGATE</text>

  <!-- Delegate statement + conference date details -->
  ${delegateStatementLayer}
  <rect x="190" y="880" width="392" height="2" fill="#D0DBEE"/>
  <text x="190" y="914" font-size="18" font-family="Poppins,Segoe UI,Arial,sans-serif" font-weight="700" fill="#103580">CONFERENCE DATES</text>
  <text x="190" y="952" font-size="24" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#0E327F">${dateRangeLabel}</text>
  <text x="190" y="982" font-size="18" font-family="Poppins,Segoe UI,Arial,sans-serif" fill="#28417B">${weekdayRangeLabel}</text>
  <text x="190" y="1038" font-size="38" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#C8102E">${scoreLine}</text>
  ${committeeLayer}

  <!-- Right-side delegate metadata -->
  <text x="772" y="998" text-anchor="middle" font-size="17" font-family="Poppins,Segoe UI,Arial,sans-serif" font-weight="700" fill="#103580">DELEGATE CODE</text>
  <text x="772" y="1038" text-anchor="middle" font-size="32" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#0E327F">${delegateCodeLabel}</text>
  ${universityLayer}
  <rect x="662" y="1124" width="220" height="2" fill="#C6D4EE"/>
  <text x="772" y="1160" text-anchor="middle" font-size="30" font-family="Oswald,Segoe UI,Arial,sans-serif" font-weight="700" fill="#C8102E">${cityHeading} ${confYear}</text>
  <text x="772" y="1190" text-anchor="middle" font-size="16" font-family="Poppins,Segoe UI,Arial,sans-serif" font-weight="700" fill="#1E2F5E">LSUIC NATIONAL CONFERENCE</text>

  <!-- Footer info bars -->
  <rect x="130" y="1288" width="820" height="28" rx="12" fill="#C8102E"/>
  <text x="540" y="1308" text-anchor="middle" font-size="18" font-family="Poppins,Segoe UI,Arial,sans-serif" fill="#FFFFFF">Website: https://www.lsuic.org | Email: info@lsuic.org</text>

  <rect x="130" y="1320" width="820" height="24" rx="12" fill="#0B1E78"/>
  <text x="540" y="1338" text-anchor="middle" font-size="17" font-family="Poppins,Segoe UI,Arial,sans-serif" font-weight="700" fill="#D7E4FF">Motto: Excellence Through Hard Work</text>
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
        const pngBytes = await renderResvgPng(svg, 2160);

        return new Response(pngBytes.buffer as ArrayBuffer, {
          status: 200,
          headers: {
            "content-type": "image/png",
            "cache-control": "no-store",
            "content-disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${safeCode}-delegate-card.png"`,
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
