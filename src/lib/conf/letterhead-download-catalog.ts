/**
 * User-facing catalog for downloadable LSUIC conference letterhead pieces.
 * Each entry maps to GET /api/conf/[confId]/letterhead?mode=…&format=png|svg&download=1
 */

export type LetterheadPartGroup = "first-page" | "continuation" | "full-layout";

export type LetterheadDownloadPart = {
  id: string;
  /** Short label shown on download cards */
  title: string;
  /** Plain-language hint for Word / Google Docs assembly */
  description: string;
  group: LetterheadPartGroup;
  /** API `mode` query value */
  mode: string;
  /** Base filename without extension (conference id appended by API) */
  filenameBase: string;
};

export const LETTERHEAD_DOWNLOAD_PARTS: LetterheadDownloadPart[] = [
  {
    id: "first-header",
    title: "Header band (page 1)",
    description:
      "Top of page 1: Liberian flag stripes, LSUIC logo, conference title, contact lines, and office line. Place at the top of your document.",
    group: "first-page",
    mode: "header",
    filenameBase: "lsuic-letterhead-01-header-band",
  },
  {
    id: "first-sidebar",
    title: "Left sidebar (page 1)",
    description:
      "Navy committee roster column for page 1. Align to the left margin; leave the main body area blank for your text.",
    group: "first-page",
    mode: "sidebar",
    filenameBase: "lsuic-letterhead-01-sidebar-committee",
  },
  {
    id: "first-footer",
    title: "Footer strip (page 1)",
    description:
      "Bottom motto bar for page 1. Anchor at the bottom of the page.",
    group: "first-page",
    mode: "footer",
    filenameBase: "lsuic-letterhead-01-footer-motto",
  },
  {
    id: "first-full",
    title: "Full page 1 layout (reference)",
    description:
      "Complete A4 page 1 template with header, sidebar, and footer — use as a visual guide or background.",
    group: "full-layout",
    mode: "page",
    filenameBase: "lsuic-letterhead-01-full-page-reference",
  },
  {
    id: "continuation-header",
    title: "Header band (pages 2+)",
    description:
      "Compact header for continuation pages. Place at the top of page 2 and following pages.",
    group: "continuation",
    mode: "continuation-header",
    filenameBase: "lsuic-letterhead-02plus-header-band",
  },
  {
    id: "continuation-footer",
    title: "Footer strip (pages 2+)",
    description:
      "Compact footer for continuation pages. Anchor at the bottom of pages 2+.",
    group: "continuation",
    mode: "continuation-footer",
    filenameBase: "lsuic-letterhead-02plus-footer",
  },
  {
    id: "continuation-full",
    title: "Full continuation layout (reference)",
    description:
      "Complete A4 continuation template — header and footer with open body area.",
    group: "full-layout",
    mode: "continuation",
    filenameBase: "lsuic-letterhead-02plus-full-page-reference",
  },
];

export const LETTERHEAD_PART_GROUP_LABELS: Record<LetterheadPartGroup, string> =
  {
    "first-page": "Page 1 — assemble these pieces",
    continuation: "Pages 2 and onward",
    "full-layout": "Full-page references",
  };

const LETTERHEAD_ASSET_VERSION = "2026-05-27-contacts-fix";

export function buildLetterheadAssetUrl(
  confId: string,
  part: LetterheadDownloadPart,
  opts?: {
    format?: "png" | "svg";
    download?: boolean;
    scale?: number;
    showOfficeLabel?: boolean;
  },
): string {
  const format = opts?.format ?? "png";
  const params = new URLSearchParams({
    mode: part.mode,
    format,
    filename: part.filenameBase,
    v: LETTERHEAD_ASSET_VERSION,
    officeLabel: opts?.showOfficeLabel === false ? "0" : "1",
  });
  if (
    typeof opts?.scale === "number" &&
    Number.isFinite(opts.scale) &&
    opts.scale > 0
  ) {
    params.set("scale", String(Math.round(opts.scale)));
  }
  if (opts?.download !== false) params.set("download", "1");
  return `/api/conf/${encodeURIComponent(confId)}/letterhead?${params.toString()}`;
}
