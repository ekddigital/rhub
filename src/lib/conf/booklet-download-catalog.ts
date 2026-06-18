/**
 * User-facing catalog for downloadable LSUIC conference booklet assets.
 * Generated pieces: GET /api/conf/[confId]/booklet/assets?mode=…&format=png|svg&download=1
 * Static pieces:    GET /api/conf/[confId]/booklet/assets?mode=static&asset=…&download=1
 */

export type BookletPartGroup =
  | "cover-pages"
  | "interior-chrome"
  | "section-dividers"
  | "brand-logos"
  | "source-photos";

export type BookletAssetKind = "generated" | "static";

export type BookletDownloadPart = {
  id: string;
  title: string;
  description: string;
  group: BookletPartGroup;
  kind: BookletAssetKind;
  /** API `mode` for generated assets */
  mode?: string;
  /** Static asset key (see BOOKLET_STATIC_ASSETS in route) */
  assetKey?: string;
  /** File extension for static asset downloads */
  staticExt?: string;
  filenameBase: string;
  /** Download formats shown in the kit */
  formats: Array<"png" | "svg" | "source">;
  /** Asset design still pending — kit shows a TBD badge */
  tbd?: boolean;
};

export const BOOKLET_DOWNLOAD_PARTS: BookletDownloadPart[] = [
  {
    id: "cover",
    title: "Cover page",
    description:
      "Full A4 front cover with LSUIC branding, conference title, theme, dates, and venue — matches the live booklet preview.",
    group: "cover-pages",
    kind: "generated",
    mode: "cover",
    filenameBase: "lsuic-booklet-01-cover",
    formats: ["png", "svg"],
  },
  {
    id: "back-cover",
    title: "Back cover",
    description:
      "Closing page with venue photo, thank-you message, and LSUIC footer branding.",
    group: "cover-pages",
    kind: "generated",
    mode: "back-cover",
    filenameBase: "lsuic-booklet-back-cover",
    formats: ["png", "svg"],
  },
  {
    id: "interior-header",
    title: "Interior page header",
    description:
      "Flag stripe bar + LSUIC masthead row used at the top of interior booklet pages. Place at the top margin in layout tools.",
    group: "interior-chrome",
    kind: "generated",
    mode: "page-header",
    filenameBase: "lsuic-booklet-interior-header",
    formats: ["png", "svg"],
  },
  {
    id: "interior-footer",
    title: "Interior page footer",
    description:
      "Page number circle and conference footer strip for interior pages. Anchor at the bottom of each page.",
    group: "interior-chrome",
    kind: "generated",
    mode: "page-footer",
    filenameBase: "lsuic-booklet-interior-footer",
    formats: ["png", "svg"],
  },
  {
    id: "interior-reference",
    title: "Interior page layout (reference)",
    description:
      "Full A4 interior template with header, open body area, and footer — use as a visual guide or background.",
    group: "interior-chrome",
    kind: "generated",
    mode: "interior-reference",
    filenameBase: "lsuic-booklet-interior-full-reference",
    formats: ["png", "svg"],
  },
  {
    id: "section-divider",
    title: "Section divider (template)",
    description:
      "Placeholder full-page section opener — replace with final artwork when section dividers are designed.",
    group: "section-dividers",
    kind: "generated",
    mode: "section-divider",
    filenameBase: "lsuic-booklet-section-divider-template",
    formats: ["png", "svg"],
    tbd: true,
  },
  {
    id: "toc-reference",
    title: "Table of contents (reference)",
    description:
      "Placeholder TOC layout shell — final TOC is generated dynamically in the Booklet Builder.",
    group: "section-dividers",
    kind: "generated",
    mode: "toc-reference",
    filenameBase: "lsuic-booklet-toc-reference",
    formats: ["png", "svg"],
    tbd: true,
  },
  {
    id: "logo-lsuic",
    title: "LSUIC logo",
    description: "Official LSUIC emblem used on cover, headers, and interior pages.",
    group: "brand-logos",
    kind: "static",
    assetKey: "lsuic-logo",
    staticExt: "png",
    filenameBase: "lsuic-logo",
    formats: ["source"],
  },
  {
    id: "logo-liberia-seal",
    title: "Republic of Liberia seal",
    description: "National seal paired with the LSUIC logo on the cover.",
    group: "brand-logos",
    kind: "static",
    assetKey: "liberia-seal",
    staticExt: "svg",
    filenameBase: "liberia-seal",
    formats: ["source"],
  },
  {
    id: "placeholder-delegate",
    title: "Delegate photo placeholder",
    description:
      "Silhouette placeholder for delegates who have not uploaded a booklet photo.",
    group: "brand-logos",
    kind: "static",
    assetKey: "placeholder-delegate",
    staticExt: "svg",
    filenameBase: "placeholder-delegate",
    formats: ["source"],
  },
  {
    id: "photo-city-evening",
    title: "Jinan city (evening portrait)",
    description: "Cover background photo — evening skyline portrait orientation.",
    group: "source-photos",
    kind: "static",
    assetKey: "city-evening",
    staticExt: "png",
    filenameBase: "jinan-city-evening-portrait",
    formats: ["source"],
  },
  {
    id: "photo-hotel-entrance",
    title: "Conference venue entrance",
    description: "Hotel main entrance photo used on the back cover strip.",
    group: "source-photos",
    kind: "static",
    assetKey: "hotel-entrance",
    staticExt: "png",
    filenameBase: "conference-venue-entrance",
    formats: ["source"],
  },
  {
    id: "photo-hotel-hall",
    title: "Conference hall",
    description: "Interior conference hall photo for supplementary print layouts.",
    group: "source-photos",
    kind: "static",
    assetKey: "hotel-conference-hall",
    staticExt: "jpg",
    filenameBase: "conference-hall",
    formats: ["source"],
  },
  {
    id: "photo-city-day",
    title: "Jinan city (day landscape)",
    description: "Daytime cityscape for optional section backgrounds or marketing.",
    group: "source-photos",
    kind: "static",
    assetKey: "city-day",
    staticExt: "png",
    filenameBase: "jinan-city-day-landscape",
    formats: ["source"],
  },
];

export const BOOKLET_PART_GROUP_LABELS: Record<BookletPartGroup, string> = {
  "cover-pages": "Cover & back cover",
  "interior-chrome": "Interior page chrome",
  "section-dividers": "Section dividers & TOC",
  "brand-logos": "Logos & placeholders",
  "source-photos": "Source photography",
};

const BOOKLET_ASSET_VERSION = "2026-06-18-v1";

export function buildBookletAssetUrl(
  confId: string,
  part: BookletDownloadPart,
  opts?: {
    format?: "png" | "svg" | "source";
    download?: boolean;
    scale?: number;
  },
): string {
  const params = new URLSearchParams({
    filename: part.filenameBase,
    v: BOOKLET_ASSET_VERSION,
  });

  if (part.kind === "static") {
    params.set("mode", "static");
    if (part.assetKey) params.set("asset", part.assetKey);
  } else {
    params.set("mode", part.mode ?? part.id);
    params.set("format", opts?.format ?? "png");
  }

  if (
    typeof opts?.scale === "number" &&
    Number.isFinite(opts.scale) &&
    opts.scale > 0
  ) {
    params.set("scale", String(Math.round(opts.scale)));
  }

  if (opts?.download !== false) params.set("download", "1");

  return `/api/conf/${encodeURIComponent(confId)}/booklet/assets?${params.toString()}`;
}
