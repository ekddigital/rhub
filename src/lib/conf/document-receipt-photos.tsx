/**
 * Shared receipt-photo grid for conference document exports (budget, payments).
 */

import React from "react";
import {
  DOCUMENT_COLORS as C,
  PAGE_LAYOUT,
  PAGE_METRICS,
} from "./document-constants";

export interface ReceiptPhotoEntry {
  id: string;
  imageUrl: string | null;
  fileName: string;
  captionLine1?: string;
  captionLine2?: string;
  isImage: boolean;
}

/** Typical mobile payment screenshot (portrait 9:16). */
export const RECEIPT_PORTRAIT_ASPECT = 9 / 16;

/** Interior content width (page width minus horizontal padding). */
export const RECEIPT_CONTENT_WIDTH = PAGE_LAYOUT.width - 48;

/** Max receipts per page — 2×3 grid (portrait screenshots). */
export const RECEIPTS_PER_PAGE_MAX = 6;

/** @deprecated Use RECEIPTS_PER_PAGE_MAX */
export const RECEIPTS_PER_PAGE = RECEIPTS_PER_PAGE_MAX;

/** Buffer so grid content never sits flush against the page footer. */
export const RECEIPT_PAGE_SAFETY_MARGIN = 12;

/** "Receipt Photos" title on dedicated pages (13px type + 12px margin-bottom). */
export const RECEIPT_SECTION_TITLE_BLOCK = Math.ceil(13 * 1.2) + 12;

/** Title block on the last table page (12px top + title + 12px bottom). */
export const RECEIPT_LAST_PAGE_TITLE_BLOCK =
  12 + Math.ceil(13 * 1.2) + 12;

/** Measured block heights (px) for pagination — matches rendered chrome. */
export const RECEIPT_GRID_METRICS = {
  /** @deprecated Prefer RECEIPT_SECTION_TITLE_BLOCK */
  headingH: RECEIPT_SECTION_TITLE_BLOCK,
  marginTop: 12,
  /** Two caption lines + vertical padding (8px × 2). */
  captionBlockH: 48,
  rowGap: 10,
  columnGap: 10,
  columns: 2,
  borderH: 2,
} as const;

export type ReceiptGridLayout = {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  imageHeight: number;
  captionHeight: number;
  blockHeight: number;
};

function gapTotal(rows: number, gap: number): number {
  return Math.max(0, rows - 1) * gap;
}

/** Compute grid cell geometry so images keep aspect ratio within available height. */
export function computeReceiptGridLayout(
  receiptCount: number,
  gridAvailableHeight: number,
  cols: number = RECEIPT_GRID_METRICS.columns,
  aspectRatio: number = RECEIPT_PORTRAIT_ASPECT,
): ReceiptGridLayout {
  const rows = Math.max(1, Math.ceil(receiptCount / cols));
  const gapY = RECEIPT_GRID_METRICS.rowGap;
  const gapX = RECEIPT_GRID_METRICS.columnGap;
  const captionHeight = RECEIPT_GRID_METRICS.captionBlockH;

  const cellWidth =
    (RECEIPT_CONTENT_WIDTH - gapX * Math.max(0, cols - 1)) / cols;
  const rowBudget =
    (gridAvailableHeight - gapY * Math.max(0, rows - 1)) / rows;
  const maxImageHeightFromWidth = cellWidth / aspectRatio;
  const imageBudget = rowBudget - captionHeight - RECEIPT_GRID_METRICS.borderH;
  const imageHeight = Math.min(
    maxImageHeightFromWidth,
    Math.max(0, imageBudget),
  );
  const cellHeight =
    imageHeight + captionHeight + RECEIPT_GRID_METRICS.borderH;
  const blockHeight =
    cellHeight * rows + gapTotal(rows, RECEIPT_GRID_METRICS.rowGap);

  return {
    cols,
    rows,
    cellWidth,
    cellHeight,
    imageHeight,
    captionHeight,
    blockHeight,
  };
}

export type ReceiptGridHeightOpts = {
  /** Section title height (0 when title is rendered outside the measured block). */
  sectionTitlePx?: number;
  /** Extra margin above the section title. */
  marginTopPx?: number;
  /** Safety buffer above the page footer. */
  safetyMarginPx?: number;
  /** @deprecated Use sectionTitlePx */
  includeHeading?: boolean;
  /** @deprecated Use marginTopPx */
  marginTop?: number;
};

function resolveReceiptGridHeightOpts(
  opts?: ReceiptGridHeightOpts,
): Required<
  Pick<ReceiptGridHeightOpts, "sectionTitlePx" | "marginTopPx" | "safetyMarginPx">
> {
  if (opts?.sectionTitlePx !== undefined) {
    return {
      sectionTitlePx: opts.sectionTitlePx,
      marginTopPx: opts.marginTopPx ?? 0,
      safetyMarginPx: opts.safetyMarginPx ?? RECEIPT_PAGE_SAFETY_MARGIN,
    };
  }

  const includeHeading = opts?.includeHeading ?? true;
  return {
    sectionTitlePx: includeHeading ? RECEIPT_GRID_METRICS.headingH : 0,
    marginTopPx:
      opts?.marginTopPx ??
      (includeHeading ? RECEIPT_GRID_METRICS.marginTop : 0),
    safetyMarginPx: opts?.safetyMarginPx ?? RECEIPT_PAGE_SAFETY_MARGIN,
  };
}

/** Vertical space available for the grid after page chrome (heading, margins, safety). */
export function receiptGridAvailableHeight(
  pageAvailablePx: number,
  opts?: ReceiptGridHeightOpts,
): number {
  const { sectionTitlePx, marginTopPx, safetyMarginPx } =
    resolveReceiptGridHeightOpts(opts);
  return Math.max(
    0,
    pageAvailablePx - marginTopPx - sectionTitlePx - safetyMarginPx,
  );
}

/** Usable height for a dedicated receipt-only page (full content column). */
export function receiptOnlyPageAvailablePx(): number {
  return PAGE_METRICS.contentH;
}

/** Estimate rendered height of the receipt grid (excluding page heading). */
export function estimateReceiptPhotosBlockH(
  count: number,
  gridAvailableHeight: number,
): number {
  if (count <= 0 || gridAvailableHeight <= 0) return 0;
  return computeReceiptGridLayout(count, gridAvailableHeight).blockHeight;
}

/** Max receipt thumbnails that fit on a page with optional heading chrome. */
export function maxReceiptsThatFit(
  pageAvailablePx: number,
  opts?: ReceiptGridHeightOpts,
): number {
  const gridBudget = receiptGridAvailableHeight(pageAvailablePx, opts);
  if (gridBudget <= 0) return 0;

  for (let count = RECEIPTS_PER_PAGE_MAX; count >= 1; count -= 1) {
    if (estimateReceiptPhotosBlockH(count, gridBudget) <= gridBudget) {
      return count;
    }
  }
  return 0;
}

export function chunkReceiptPhotos<T>(
  items: T[],
  perPage = RECEIPTS_PER_PAGE_MAX,
): T[][] {
  if (items.length === 0) return [];
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    chunks.push(items.slice(i, i + perPage));
  }
  return chunks;
}

/**
 * Place receipt photos on the last table page when trailing space allows,
 * otherwise spill to dedicated receipt pages (measured, not fixed chunk size).
 */
export function allocateReceiptPhotoPages(
  entries: ReceiptPhotoEntry[],
  lastTablePageRemainingPx: number,
  receiptOnlyPageAvailablePxValue: number,
): {
  lastPageReceipts: ReceiptPhotoEntry[];
  extraPages: ReceiptPhotoEntry[][];
} {
  if (entries.length === 0) {
    return { lastPageReceipts: [], extraPages: [] };
  }

  const lastPageOpts: ReceiptGridHeightOpts = {
    sectionTitlePx: RECEIPT_LAST_PAGE_TITLE_BLOCK,
    marginTopPx: 0,
  };
  const receiptPageOpts: ReceiptGridHeightOpts = {
    sectionTitlePx: RECEIPT_SECTION_TITLE_BLOCK,
    marginTopPx: 0,
  };

  const onLast = maxReceiptsThatFit(lastTablePageRemainingPx, lastPageOpts);
  const lastPageReceipts = onLast > 0 ? entries.slice(0, onLast) : [];
  const remaining =
    onLast > 0 ? entries.slice(onLast) : entries;

  if (remaining.length === 0) {
    return { lastPageReceipts, extraPages: [] };
  }

  const extraPages: ReceiptPhotoEntry[][] = [];
  let pos = 0;
  while (pos < remaining.length) {
    const cap = maxReceiptsThatFit(
      receiptOnlyPageAvailablePxValue,
      receiptPageOpts,
    );
    if (cap <= 0) {
      extraPages.push(remaining.slice(pos, pos + 1));
      pos += 1;
      continue;
    }
    extraPages.push(remaining.slice(pos, pos + cap));
    pos += cap;
  }

  return { lastPageReceipts, extraPages };
}

export function DocumentReceiptPhotosGrid({
  entries,
  availableHeight,
}: {
  entries: ReceiptPhotoEntry[];
  /** Vertical space for the grid (heading chrome already subtracted). */
  availableHeight: number;
}) {
  const layout = computeReceiptGridLayout(
    entries.length,
    Math.max(0, availableHeight),
  );
  const cellHeight = layout.cellHeight;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${layout.rows}, ${cellHeight}px)`,
        columnGap: RECEIPT_GRID_METRICS.columnGap,
        rowGap: RECEIPT_GRID_METRICS.rowGap,
        maxHeight: availableHeight,
        overflow: "hidden",
        paddingBottom: 4,
        alignContent: "start",
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            border: "1px solid #d9dfeb",
            borderRadius: 6,
            overflow: "hidden",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            height: cellHeight,
            minHeight: 0,
          }}
        >
          {entry.isImage && entry.imageUrl ? (
            <div
              style={{
                width: "100%",
                height: layout.imageHeight,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.imageUrl}
                alt={entry.fileName}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: "100%",
                height: layout.imageHeight,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f3f4f6",
              }}
            >
              <span style={{ fontSize: 10, color: "#666" }}>Document file</span>
            </div>
          )}
          {(entry.captionLine1 || entry.captionLine2 || entry.fileName) && (
            <div
              style={{
                padding: "8px 10px",
                fontSize: 9.5,
                color: "#555",
                height: layout.captionHeight,
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {entry.captionLine1 && (
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 2,
                    color: C.navy,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.captionLine1}
                </div>
              )}
              {entry.captionLine2 && (
                <div
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.captionLine2}
                </div>
              )}
              {!entry.captionLine2 && entry.fileName && (
                <div
                  style={{
                    wordBreak: "break-word",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.fileName}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
