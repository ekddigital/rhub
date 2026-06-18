import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  BOOKLET_DOWNLOAD_PARTS,
  type BookletDownloadPart,
} from "@/lib/conf/booklet-download-catalog";
import {
  BOOKLET_PAGE_W,
  basePngWidthForMode,
  buildBookletBackCoverSvg,
  buildBookletCoverSvg,
  buildBookletInteriorReferenceSvg,
  buildBookletPageFooterSvg,
  buildBookletPageHeaderSvg,
  buildBookletSectionDividerSvg,
  buildBookletTocReferenceSvg,
  type BookletAssetContext,
  type FontSet,
} from "@/lib/conf/booklet-asset-svg";

// GET /api/conf/[confId]/booklet/assets
// Returns SVG, PNG, or original static files for booklet design assets.
// Query params:
//   ?mode=cover|back-cover|page-header|page-footer|interior-reference|section-divider|toc-reference|static
//   ?asset=lsuic-logo|…           — required when mode=static
//   ?format=svg|png|source
//   ?download=1
//   ?scale=4                      — PNG raster scale (generated assets)

export const BOOKLET_STATIC_ASSETS: Record<
  string,
  { publicPath: string; mime: string; ext: string }
> = {
  "lsuic-logo": {
    publicPath: "conf/lsuic_logo.png",
    mime: "image/png",
    ext: "png",
  },
  "liberia-seal": {
    publicPath: "conf/liberia-seal.svg",
    mime: "image/svg+xml",
    ext: "svg",
  },
  "placeholder-delegate": {
    publicPath: "conf/placeholder-delegate.svg",
    mime: "image/svg+xml",
    ext: "svg",
  },
  "city-evening": {
    publicPath: "conf/assets/jinan_city/evening_view_portrait.png",
    mime: "image/png",
    ext: "png",
  },
  "hotel-entrance": {
    publicPath: "conf/assets/hotel/main_entrance_view.png",
    mime: "image/png",
    ext: "png",
  },
  "hotel-conference-hall": {
    publicPath: "conf/assets/hotel/conference_hall.jpg",
    mime: "image/jpeg",
    ext: "jpg",
  },
  "city-day": {
    publicPath: "conf/assets/jinan_city/day_view_landscape.png",
    mime: "image/png",
    ext: "png",
  },
};

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

async function loadPhoto(publicPath: string, mime: string): Promise<string | null> {
  const buf = await readPublicFile(...publicPath.split("/"));
  if (buf) return toDataUri(buf, mime);
  return null;
}

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

function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", opts);
  return (
    fmt(start, { month: "long", day: "numeric" }) +
    " – " +
    fmt(end, { month: "long", day: "numeric", year: "numeric" })
  );
}

function parsePngScale(raw: string | null, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(6, Math.round(n)));
}

function resolveFilename(
  part: BookletDownloadPart | undefined,
  format: string,
  confId: string,
  ext?: string,
): string {
  const base = part?.filenameBase ?? "lsuic-booklet-asset";
  if (format === "svg") return `${base}-${confId}.svg`;
  if (ext) return `${base}-${confId}.${ext}`;
  return `${base}-${confId}.${format === "png" ? "png" : "bin"}`;
}

function findGeneratedPart(mode: string): BookletDownloadPart | undefined {
  return BOOKLET_DOWNLOAD_PARTS.find(
    (p) => p.kind === "generated" && p.mode === mode,
  );
}

function buildSvgForMode(mode: string, ctx: BookletAssetContext): string {
  switch (mode) {
    case "cover":
      return buildBookletCoverSvg(ctx);
    case "back-cover":
      return buildBookletBackCoverSvg(ctx);
    case "page-header":
      return buildBookletPageHeaderSvg(ctx);
    case "page-footer":
      return buildBookletPageFooterSvg(ctx);
    case "interior-reference":
      return buildBookletInteriorReferenceSvg(ctx);
    case "section-divider":
      return buildBookletSectionDividerSvg(ctx);
    case "toc-reference":
      return buildBookletTocReferenceSvg(ctx);
    default:
      throw new Error(`Unknown booklet asset mode: ${mode}`);
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;

    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const mode = url.searchParams.get("mode") ?? "cover";
    const format = url.searchParams.get("format") ?? "png";
    const asDownload = url.searchParams.get("download") === "1";
    const pngScale = parsePngScale(
      url.searchParams.get("scale"),
      asDownload ? 4 : 1,
    );
    const disposition = asDownload ? "attachment" : "inline";

    if (mode === "static") {
      const assetKey = url.searchParams.get("asset");
      if (!assetKey || !BOOKLET_STATIC_ASSETS[assetKey]) {
        return NextResponse.json(
          { error: "Unknown static booklet asset" },
          { status: 400 },
        );
      }

      const spec = BOOKLET_STATIC_ASSETS[assetKey];
      const buf = await readPublicFile(...spec.publicPath.split("/"));
      if (!buf) {
        return NextResponse.json(
          { error: "Static asset file not found" },
          { status: 404 },
        );
      }

      const part = BOOKLET_DOWNLOAD_PARTS.find((p) => p.assetKey === assetKey);
      const filename = resolveFilename(part, "source", confId, spec.ext);

      return new NextResponse(new Uint8Array(buf), {
        headers: {
          "Content-Type": spec.mime,
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Content-Disposition": `${disposition}; filename="${filename}"`,
        },
      });
    }

    const part = findGeneratedPart(mode);
    const [event, booklet, logoUri, sealUri, fonts] = await Promise.all([
      prisma.confEvent.findUnique({
        where: { id: confId },
        select: {
          name: true,
          year: true,
          city: true,
          venue: true,
          startsAt: true,
          endsAt: true,
        },
      }),
      prisma.confBooklet.findUnique({
        where: { confId },
        select: { title: true, subtitle: true, theme: true },
      }),
      loadLogo(),
      loadSeal(),
      loadFonts(),
    ]);

    if (!event) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    const citySpec = BOOKLET_STATIC_ASSETS["city-evening"];
    const hotelSpec = BOOKLET_STATIC_ASSETS["hotel-entrance"];
    const [cityPhotoUri, hotelPhotoUri] = await Promise.all([
      loadPhoto(citySpec.publicPath, citySpec.mime),
      loadPhoto(hotelSpec.publicPath, hotelSpec.mime),
    ]);

    const ctx: BookletAssetContext = {
      confName: event.name,
      confYear: event.year,
      city: event.city,
      venue: event.venue,
      dateRange: formatDateRange(
        new Date(event.startsAt),
        new Date(event.endsAt),
      ),
      bookletTitle: booklet?.title ?? event.name,
      bookletSubtitle: booklet?.subtitle ?? null,
      theme: booklet?.theme ?? null,
      logoUri,
      sealUri,
      cityPhotoUri,
      hotelPhotoUri,
      fonts,
    };

    const svg = buildSvgForMode(mode, ctx);
    const filename = resolveFilename(part, format, confId);

    if (format === "svg") {
      return new NextResponse(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Content-Disposition": `${disposition}; filename="${filename}"`,
        },
      });
    }

    const { Resvg } = await import("@resvg/resvg-js");
    const fontsDir = path.join(process.cwd(), "public", "conf", "fonts");
    const resvg = new Resvg(svg, {
      background: "white",
      fitTo: {
        mode: "width",
        value: Math.round(basePngWidthForMode(mode) * pngScale),
      },
      font: {
        fontDirs: [fontsDir],
        loadSystemFonts: true,
        defaultFontFamily: "Poppins",
      },
    });
    const pngData = resvg.render();
    const pngBuffer = Buffer.from(pngData.asPng());

    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "Content-Disposition": `${disposition}; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("GET /booklet/assets error:", error);
    return NextResponse.json(
      { error: "Failed to generate booklet asset" },
      { status: 500 },
    );
  }
}
