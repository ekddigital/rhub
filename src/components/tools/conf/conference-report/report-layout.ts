import { BOOKLET_A4 } from "../booklet/constants";
import {
  REPORT_BODY,
  REPORT_CONTINUATION,
  REPORT_LIST_ITEM,
  REPORT_PHOTO,
  REPORT_SECTION_TITLE,
  REPORT_SUBSECTION,
  REPORT_TABLE,
  REPORT_TOC,
} from "./report-typography";

/** Report A4Page content padding (top + bottom). */
export const REPORT_CONTENT_PADDING_Y = 18 + 10;

/** Header (~61px) + footer (~33px) + content padding. */
export const REPORT_CONTENT_HEIGHT =
  BOOKLET_A4.height - 61 - 33 - REPORT_CONTENT_PADDING_Y;

/** Interior content width inside horizontal padding (40px each side). */
export const REPORT_CONTENT_WIDTH = BOOKLET_A4.width - 80;

export const REPORT_SECTION_TITLE_BLOCK =
  REPORT_SECTION_TITLE.marginBottom +
  REPORT_SECTION_TITLE.paddingBottom +
  2 +
  Math.ceil(REPORT_SECTION_TITLE.fontSize * 1.2);

export const REPORT_CONTINUATION_BLOCK =
  Math.ceil(REPORT_CONTINUATION.fontSize * 1.2) + 8;

export const REPORT_BODY_LINE_HEIGHT_PX = Math.ceil(
  REPORT_BODY.fontSize * REPORT_BODY.lineHeight,
);

export const REPORT_BODY_PARAGRAPH_MARGIN = 10;

export const REPORT_FLYER_CAPTION_BLOCK =
  Math.ceil(REPORT_PHOTO.caption.fontSize * REPORT_PHOTO.caption.lineHeight) + 3;

export const REPORT_PHOTO_CAPTION_BLOCK = REPORT_FLYER_CAPTION_BLOCK;

/** Grid gaps for image galleries. */
export const REPORT_IMAGE_GRID_GAP_X = 8;
export const REPORT_IMAGE_GRID_GAP_Y = 6;

/** Portrait pre-conference flyers (1024×1536). */
export const FLYER_PORTRAIT_ASPECT = 1024 / 1536;

/** Landscape fundraising flyer (1515×1024). */
export const FLYER_LANDSCAPE_ASPECT = 1515 / 1024;

export type ReportPageChrome =
  | "none"
  | "sectionTitle"
  | "continuation";

/** Usable vertical space inside ReportA4Page content area. */
export function reportUsableHeight(chrome: ReportPageChrome = "none"): number {
  let h = REPORT_CONTENT_HEIGHT;
  if (chrome === "sectionTitle") h -= REPORT_SECTION_TITLE_BLOCK;
  if (chrome === "continuation") h -= REPORT_CONTINUATION_BLOCK;
  return h;
}

/** Estimate rendered height for one body paragraph at interior width. */
export function estimateBodyParagraphHeight(text: string): number {
  const charsPerLine = Math.floor(REPORT_CONTENT_WIDTH / 7.8);
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return lines * REPORT_BODY_LINE_HEIGHT_PX + REPORT_BODY_PARAGRAPH_MARGIN;
}

export function estimateBodyParagraphsHeight(paragraphs: readonly string[]): number {
  return paragraphs.reduce((sum, p) => sum + estimateBodyParagraphHeight(p), 0);
}

export type FlyerItem = {
  src: string;
  caption: string;
  aspectRatio: number;
};

export type FlyerGridLayout = {
  cols: number;
  rows: number;
  cellWidth: number;
  imageHeight: number;
  captionHeight: number;
};

/** Pick column count for a flyer batch (portrait-heavy → 2 cols for readability). */
export function flyerGridCols(flyers: readonly FlyerItem[]): number {
  const landscapeCount = flyers.filter((f) => f.aspectRatio > 1).length;
  return landscapeCount >= flyers.length / 2 ? 2 : 2;
}

/** Compute grid cell geometry so images keep aspect ratio and fill available height. */
export function computeFlyerGridLayout(
  flyerCount: number,
  availableHeight: number,
  cols: number,
  aspectRatio: number = FLYER_PORTRAIT_ASPECT,
): FlyerGridLayout {
  const rows = Math.max(1, Math.ceil(flyerCount / cols));
  const gapY = REPORT_IMAGE_GRID_GAP_Y;
  const gapX = REPORT_IMAGE_GRID_GAP_X;
  const captionHeight = REPORT_FLYER_CAPTION_BLOCK;

  const cellWidth =
    (REPORT_CONTENT_WIDTH - gapX * Math.max(0, cols - 1)) / cols;
  const rowBudget =
    (availableHeight - gapY * Math.max(0, rows - 1)) / rows;
  const maxImageHeightFromWidth = cellWidth / aspectRatio;
  const imageHeight = Math.min(
    maxImageHeightFromWidth,
    Math.max(80, rowBudget - captionHeight),
  );

  return {
    cols,
    rows,
    cellWidth,
    imageHeight,
    captionHeight,
  };
}

/** Max flyers per page — 2×2 keeps portrait posters readable at ~480px image height. */
export const FLYERS_PER_PAGE_MAX = 4;

export function maxFlyersPerPage(
  availableHeight: number,
  cols: number = 2,
  aspectRatio: number = FLYER_PORTRAIT_ASPECT,
): number {
  for (let count = FLYERS_PER_PAGE_MAX; count >= 1; count -= 1) {
    const layout = computeFlyerGridLayout(count, availableHeight, cols, aspectRatio);
    const rowHeight = layout.imageHeight + layout.captionHeight;
    const totalHeight =
      rowHeight * layout.rows + gapTotal(layout.rows, REPORT_IMAGE_GRID_GAP_Y);
    if (totalHeight <= availableHeight + 1) return count;
  }
  return 1;
}

function gapTotal(rows: number, gap: number): number {
  return Math.max(0, rows - 1) * gap;
}

export type PreConferencePagePlan = {
  pageIndex: number;
  showSectionTitle: boolean;
  paragraphs: readonly string[];
  flyers: readonly FlyerItem[];
};

/** Paginate §3 intro text and flyer gallery across balanced pages. */
export function buildPreConferencePagePlans(
  paragraphs: readonly string[],
  flyers: readonly FlyerItem[],
): PreConferencePagePlan[] {
  const pages: PreConferencePagePlan[] = [];
  const cols = 2;

  const textOnlyHeight =
    REPORT_SECTION_TITLE_BLOCK + estimateBodyParagraphsHeight(paragraphs);
  const textPageSlack = reportUsableHeight("none") - textOnlyHeight;

  let paragraphSplit = paragraphs.length;
  let firstPageFlyers: FlyerItem[] = [];

  if (textPageSlack > 200 && flyers.length > 0) {
    const flyerBudget = textPageSlack - 8;
    const fitOnFirst = maxFlyersPerPage(flyerBudget, cols);
    if (fitOnFirst >= 2) {
      firstPageFlyers = flyers.slice(0, Math.min(fitOnFirst, 2)) as FlyerItem[];
    }
  }

  pages.push({
    pageIndex: 0,
    showSectionTitle: true,
    paragraphs,
    flyers: firstPageFlyers,
  });

  let remainingFlyers = flyers.slice(firstPageFlyers.length);
  let pageIndex = 1;

  while (remainingFlyers.length > 0) {
    const available = reportUsableHeight("none");
    const batchSize = maxFlyersPerPage(available, cols);
    const batch = remainingFlyers.slice(0, batchSize);
    remainingFlyers = remainingFlyers.slice(batchSize);

    pages.push({
      pageIndex: pageIndex++,
      showSectionTitle: false,
      paragraphs: [],
      flyers: batch,
    });
  }

  return pages;
}

export type PhotoGridLayout = {
  cols: number;
  rows: number;
  imageHeight: number;
};

/** 2×3 grid for six photos; 2×2 for four; scales row height to fill the page. */
export function computePhotoGridLayout(
  photoCount: number,
  availableHeight: number,
): PhotoGridLayout {
  const cols = photoCount <= 4 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(photoCount / cols));
  const gapY = REPORT_IMAGE_GRID_GAP_Y;
  const caption = REPORT_PHOTO_CAPTION_BLOCK;
  const rowBudget =
    (availableHeight - gapY * Math.max(0, rows - 1)) / rows;
  const imageHeight = Math.max(100, rowBudget - caption);

  return { cols, rows, imageHeight };
}

export function photoGridAvailableHeight(
  showSectionTitle: boolean,
  showContinuation: boolean,
): number {
  let chrome: ReportPageChrome = "none";
  if (showSectionTitle) chrome = "sectionTitle";
  else if (showContinuation) chrome = "continuation";
  return reportUsableHeight(chrome);
}

/**
 * Attendance table body row height — measured from rendered cells
 * (5px vertical padding × 2 + 13.5px type line box + 1px border).
 * Underestimating this caused overflow:hidden to clip ~8 rows per page.
 */
export const REPORT_ATTENDANCE_ROW_HEIGHT = 31;
export const REPORT_ATTENDANCE_HEADER_HEIGHT = 26;

/** Source citation block below the table on the first attendance page. */
export const REPORT_ATTENDANCE_SOURCE_BLOCK = estimateBodyParagraphHeight(
  "Source: Official Jinan 2026 registration and fees register (conference-attendance.xlsx).",
);

export function attendanceRowsForPage(
  isFirstPage: boolean,
  options?: { includeSourceBlock?: boolean },
): number {
  const chrome: ReportPageChrome = isFirstPage ? "sectionTitle" : "continuation";
  let available = reportUsableHeight(chrome);
  if (isFirstPage && options?.includeSourceBlock) {
    available -= REPORT_ATTENDANCE_SOURCE_BLOCK;
  }
  return Math.max(
    10,
    Math.floor(
      (available - REPORT_ATTENDANCE_HEADER_HEIGHT) / REPORT_ATTENDANCE_ROW_HEIGHT,
    ),
  );
}

/** Variable-size attendance chunks — first page fits section title + source note. */
export function chunkAttendanceVariable<T>(rows: readonly T[]): T[][] {
  if (rows.length === 0) return [];

  const chunks: T[][] = [];
  let offset = 0;
  let isFirst = true;

  while (offset < rows.length) {
    const size = attendanceRowsForPage(isFirst, {
      includeSourceBlock: isFirst,
    });
    chunks.push(rows.slice(offset, offset + size) as T[]);
    offset += size;
    isFirst = false;
  }

  const totalChunked = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  if (totalChunked !== rows.length) {
    throw new Error(
      `Attendance pagination error: chunked ${totalChunked} rows but source has ${rows.length}`,
    );
  }

  return chunks;
}

export const REPORT_SUBSECTION_TITLE_BLOCK =
  REPORT_SUBSECTION.fontSize + 6;

export const REPORT_TABLE_HEADER_HEIGHT = 26;

/** Conservative margin so measured pagination stays below ReportA4Page overflow clip. */
export const REPORT_LAYOUT_SAFETY_MARGIN = 64;

/** Estimate height for a bulleted list item at interior width. */
export function estimateReportListItemHeight(text: string): number {
  const charsPerLine = Math.floor(REPORT_CONTENT_WIDTH / 7.2);
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return (
    lines * Math.ceil(REPORT_LIST_ITEM.fontSize * REPORT_LIST_ITEM.lineHeight) + 5
  );
}

/** §17 capability bullet — indented list with reduced wrap width. */
export function estimateRhubCapabilityItemHeight(text: string): number {
  const indentPx = 18;
  const charsPerLine = Math.floor((REPORT_CONTENT_WIDTH - indentPx) / 6.6);
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return (
    lines * Math.ceil(REPORT_LIST_ITEM.fontSize * REPORT_LIST_ITEM.lineHeight) + 6
  );
}

/** Platform access table row — label, description, and URL column wrapping. */
export function estimateRhubLinkRowHeight(
  label: string,
  description: string,
  url: string,
): number {
  const labelColWidth = Math.floor(REPORT_CONTENT_WIDTH * 0.48);
  const urlColWidth = REPORT_CONTENT_WIDTH - labelColWidth;
  const labelCharsPerLine = Math.floor(labelColWidth / 6.8);
  const labelLines = Math.max(1, Math.ceil(label.length / labelCharsPerLine));
  const descLines = Math.max(
    1,
    Math.ceil(description.length / labelCharsPerLine),
  );
  const urlCharsPerLine = Math.floor(urlColWidth / 6.2);
  const urlLines = Math.max(1, Math.ceil(url.length / urlCharsPerLine));
  const lineHeight = Math.ceil(REPORT_TABLE.fontSize * 1.35);
  const padding = 12;
  return padding + Math.max(labelLines + descLines, urlLines) * lineHeight + 6;
}

/** Scale a portrait image to fit the remaining height on a report page. */
export function computeEmbeddedPortraitImageHeight(
  aspectHeightOverWidth: number,
  availableHeight: number,
): number {
  const naturalHeight = REPORT_CONTENT_WIDTH * aspectHeightOverWidth;
  return Math.max(120, Math.min(naturalHeight, availableHeight));
}

const SOUVENIR_INVOICE_INTRO =
  "The proforma invoice below records the conference souvenir procurement from JAPIX ARC — flag pins, delegate tags, wristbands, pens, keychains, notepads, tote bags, and banner — totaling ¥2,645.00, matching the Conference souvenir budget line in the table above.";

const SOUVENIR_INVOICE_ASPECT = 1712 / 1202;

/** Max invoice image height on the §12 souvenir page (section title + prose + caption). */
export function souvenirInvoiceMaxImageHeight(): number {
  const chrome =
    REPORT_SECTION_TITLE_BLOCK +
    REPORT_SUBSECTION_TITLE_BLOCK +
    estimateBodyParagraphHeight(SOUVENIR_INVOICE_INTRO) +
    REPORT_PHOTO_CAPTION_BLOCK +
    16;
  return computeEmbeddedPortraitImageHeight(
    SOUVENIR_INVOICE_ASPECT,
    reportUsableHeight("sectionTitle") - chrome,
  );
}

export type RhubPlatformBlock =
  | { kind: "intro"; index: number }
  | { kind: "platformAccessHeader" }
  | { kind: "platformAccessIntro" }
  | { kind: "linkRow"; index: number }
  | { kind: "capabilitiesHeader" }
  | { kind: "capability"; index: number }
  | { kind: "closing" };

export type RhubPlatformPagePlan = {
  pageIndex: number;
  showSectionTitle: boolean;
  blocks: readonly RhubPlatformBlock[];
};

export function estimateRhubPlatformBlockHeight(
  block: RhubPlatformBlock,
  introParagraphs: readonly string[],
  platformAccessIntro: string,
  linkRows: readonly { label: string; description: string; url: string }[],
  capabilities: readonly string[],
  closing: string,
): number {
  switch (block.kind) {
    case "intro":
      return estimateBodyParagraphHeight(introParagraphs[block.index] ?? "");
    case "platformAccessHeader":
      return REPORT_SUBSECTION_TITLE_BLOCK;
    case "platformAccessIntro":
      return estimateBodyParagraphHeight(platformAccessIntro);
    case "linkRow": {
      const row = linkRows[block.index];
      return row
        ? estimateRhubLinkRowHeight(row.label, row.description, row.url)
        : REPORT_TABLE_HEADER_HEIGHT;
    }
    case "capabilitiesHeader":
      return REPORT_SUBSECTION_TITLE_BLOCK + 12;
    case "capability":
      return estimateRhubCapabilityItemHeight(capabilities[block.index] ?? "");
    case "closing":
      return estimateBodyParagraphHeight(closing);
    default:
      return 0;
  }
}

function measureRhubPlatformPageHeight(
  blocks: readonly RhubPlatformBlock[],
  showSectionTitle: boolean,
  introParagraphs: readonly string[],
  platformAccessIntro: string,
  linkRows: readonly { label: string; description: string; url: string }[],
  capabilities: readonly string[],
  closing: string,
): number {
  let height = showSectionTitle
    ? REPORT_SECTION_TITLE_BLOCK
    : REPORT_CONTINUATION_BLOCK;
  let linkTableHeader = false;
  for (const block of blocks) {
    height += estimateRhubPlatformBlockHeight(
      block,
      introParagraphs,
      platformAccessIntro,
      linkRows,
      capabilities,
      closing,
    );
    if (block.kind === "linkRow" && !linkTableHeader) {
      height += REPORT_TABLE_HEADER_HEIGHT;
      linkTableHeader = true;
    }
  }
  return height;
}

/** Paginate §22 rhub platform content — greedy pack using reportUsableHeight. */
export function buildRhubPlatformPagePlans(
  introParagraphs: readonly string[],
  platformAccessIntro: string,
  linkRows: readonly { label: string; description: string; url: string }[],
  capabilities: readonly string[],
  closing: string,
): RhubPlatformPagePlan[] {
  const allBlocks: RhubPlatformBlock[] = [
    ...introParagraphs.map(
      (_, index): RhubPlatformBlock => ({ kind: "intro", index }),
    ),
    { kind: "platformAccessHeader" },
    { kind: "platformAccessIntro" },
    ...linkRows.map(
      (_, index): RhubPlatformBlock => ({ kind: "linkRow", index }),
    ),
    { kind: "capabilitiesHeader" },
    ...capabilities.map(
      (_, index): RhubPlatformBlock => ({ kind: "capability", index }),
    ),
    { kind: "closing" },
  ];

  const measurePage = (
    blocks: readonly RhubPlatformBlock[],
    showSectionTitle: boolean,
  ) =>
    measureRhubPlatformPageHeight(
      blocks,
      showSectionTitle,
      introParagraphs,
      platformAccessIntro,
      linkRows,
      capabilities,
      closing,
    );

  const pages: RhubPlatformPagePlan[] = [];
  let pending: RhubPlatformBlock[] = [];
  let showSectionTitle = true;

  const flushPage = () => {
    if (pending.length === 0) return;
    pages.push({
      pageIndex: pages.length,
      showSectionTitle,
      blocks: pending,
    });
    pending = [];
    showSectionTitle = false;
  };

  for (const block of allBlocks) {
    const candidate = [...pending, block];
    const chrome = showSectionTitle ? "sectionTitle" : "continuation";
    const budget =
      reportUsableHeight(chrome) - REPORT_LAYOUT_SAFETY_MARGIN;
    const height = measurePage(candidate, showSectionTitle);

    if (pending.length > 0 && height > budget) {
      flushPage();
      pending = [block];
      const nextBudget =
        reportUsableHeight("continuation") - REPORT_LAYOUT_SAFETY_MARGIN;
      const nextHeight = measurePage(pending, false);
      if (nextHeight > nextBudget) {
        throw new Error(
          `Rhub platform block "${block.kind}" exceeds one continuation page`,
        );
      }
    } else {
      pending = candidate;
    }
  }

  flushPage();

  const packed = pages.flatMap((page) => page.blocks);
  const introPacked = packed.filter((block) => block.kind === "intro").length;
  const capPacked = packed.filter((block) => block.kind === "capability").length;
  const hasClosing = packed.some((block) => block.kind === "closing");

  if (
    introPacked !== introParagraphs.length ||
    capPacked !== capabilities.length ||
    !hasClosing
  ) {
    throw new Error(
      `Rhub platform pagination error: packed ${introPacked}/${introParagraphs.length} intro paragraphs, ${capPacked}/${capabilities.length} capabilities, closing=${hasClosing}`,
    );
  }

  for (const page of pages) {
    const chrome = page.showSectionTitle ? "sectionTitle" : "continuation";
    const budget = reportUsableHeight(chrome);
    const height = measurePage(page.blocks, page.showSectionTitle);
    if (height > budget) {
      throw new Error(
        `Rhub platform page ${page.pageIndex + 1} exceeds budget: ${Math.round(height)}px > ${Math.round(budget)}px`,
      );
    }
  }

  return pages;
}

export type ReportTocLayoutEntry = {
  num?: number;
  title: string;
  isPartHeading?: boolean;
  isBookletEmbed?: boolean;
  isProgramDay?: boolean;
};

/** TOC page uses 20px more vertical padding than interior report pages. */
export const REPORT_TOC_EXTRA_PADDING_Y = 20;

export const REPORT_TOC_TITLE_BLOCK =
  REPORT_TOC.title.fontSize + 6 + 3 + 20;

export const REPORT_TOC_ENTRY_GAP = 2;

const REPORT_TOC_LINE_HEIGHT_PX = Math.ceil(
  REPORT_TOC.entry.fontSize * REPORT_TOC.entry.lineHeight,
);

/** Estimate one TOC row height (matches ConferenceReportTocPage padding). */
export function estimateReportTocEntryHeight(
  entry: ReportTocLayoutEntry,
): number {
  const verticalPadding = entry.isPartHeading ? 12 + 6 : 9 + 9;
  const label = entry.isPartHeading
    ? entry.title
    : entry.isBookletEmbed
      ? entry.title
      : `${entry.num}. ${entry.title}`;
  const titleColWidth = REPORT_CONTENT_WIDTH - 72 - 40 - 16;
  const charsPerLine = Math.floor(titleColWidth / 7.1);
  const lines = Math.max(1, Math.ceil(label.length / charsPerLine));
  return verticalPadding + lines * REPORT_TOC_LINE_HEIGHT_PX + REPORT_TOC_ENTRY_GAP;
}

/** Usable vertical space for TOC rows on a given TOC page index. */
export function reportTocUsableHeight(pageIndex: number): number {
  let height = REPORT_CONTENT_HEIGHT - REPORT_TOC_EXTRA_PADDING_Y;
  if (pageIndex === 0) height -= REPORT_TOC_TITLE_BLOCK;
  return height - REPORT_LAYOUT_SAFETY_MARGIN;
}

/** Paginate the table of contents across as many A4 pages as needed. */
export function chunkReportToc<T extends ReportTocLayoutEntry>(
  entries: readonly T[],
): T[][] {
  if (entries.length === 0) return [];

  const pages: T[][] = [];
  let current: T[] = [];
  let pageIndex = 0;
  let used = 0;
  const budget = () => reportTocUsableHeight(pageIndex);

  for (const entry of entries) {
    const entryHeight = estimateReportTocEntryHeight(entry);
    if (current.length > 0 && used + entryHeight > budget()) {
      pages.push(current);
      pageIndex += 1;
      current = [entry];
      used = entryHeight;
    } else {
      current.push(entry);
      used += entryHeight;
    }
  }

  if (current.length > 0) pages.push(current);
  return pages;
}
