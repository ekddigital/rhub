/**
 * Shared receipt-photo grid for conference document exports (budget, payments).
 */

import React from "react";
import { DOCUMENT_COLORS as C, PAGE_LAYOUT } from "./document-constants";

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

/** Max receipts per page — 2×2 keeps portrait screenshots readable. */
export const RECEIPTS_PER_PAGE_MAX = 4;

/** @deprecated Use RECEIPTS_PER_PAGE_MAX */
export const RECEIPTS_PER_PAGE = RECEIPTS_PER_PAGE_MAX;

/** Measured block heights (px) for pagination — matches rendered chrome. */
export const RECEIPT_GRID_METRICS = {
  headingH: 37,
  marginTop: 12,
  captionBlockH: 36,
  rowGap: 10,
  columnGap: 10,
  columns: 2,
  borderH: 2,
} as const;

export type ReceiptGridLayout = {
  cols: number;
  rows: number;
  cellWidth: number;
  imageHeight: number;
  captionHeight: number;
};

function gapTotal(rows: number, gap: number): number {
  return Math.max(0, rows - 1) * gap;
}

/** Compute grid cell geometry so images keep aspect ratio and fill available height. */
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
  const imageHeight = Math.min(
    maxImageHeightFromWidth,
    Math.max(120, rowBudget - captionHeight - RECEIPT_GRID_METRICS.borderH),
  );

  return {
    cols,
    rows,
    cellWidth,
    imageHeight,
    captionHeight,
  };
}

/** Vertical space available for the grid after page chrome (heading, margins). */
export function receiptGridAvailableHeight(
  pageAvailablePx: number,
  opts?: {
    includeHeading?: boolean;
    marginTop?: number;
  },
): number {
  const includeHeading = opts?.includeHeading ?? true;
  const marginTop =
    opts?.marginTop ??
    (includeHeading ? RECEIPT_GRID_METRICS.marginTop : 0);
  const headingH = includeHeading ? RECEIPT_GRID_METRICS.headingH : 0;
  return Math.max(0, pageAvailablePx - headingH - marginTop);
}

/** Estimate rendered height of the receipt grid (excluding page heading). */
export function estimateReceiptPhotosBlockH(
  count: number,
  gridAvailableHeight: number,
): number {
  if (count <= 0 || gridAvailableHeight <= 0) return 0;
  const layout = computeReceiptGridLayout(count, gridAvailableHeight);
  const cellH =
    layout.imageHeight + layout.captionHeight + RECEIPT_GRID_METRICS.borderH;
  return cellH * layout.rows + gapTotal(layout.rows, RECEIPT_GRID_METRICS.rowGap);
}

/** Max receipt thumbnails that fit on a page with optional heading chrome. */
export function maxReceiptsThatFit(
  pageAvailablePx: number,
  opts?: {
    includeHeading?: boolean;
    marginTop?: number;
  },
): number {
  const gridBudget = receiptGridAvailableHeight(pageAvailablePx, opts);
  if (gridBudget <= 0) return 0;

  for (let count = RECEIPTS_PER_PAGE_MAX; count >= 1; count -= 1) {
    if (estimateReceiptPhotosBlockH(count, gridBudget) <= gridBudget + 1) {
      return count;
    }
  }
  return 1;
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
  receiptOnlyPageAvailablePx: number,
): {
  lastPageReceipts: ReceiptPhotoEntry[];
  extraPages: ReceiptPhotoEntry[][];
} {
  if (entries.length === 0) {
    return { lastPageReceipts: [], extraPages: [] };
  }

  const onLast = maxReceiptsThatFit(lastTablePageRemainingPx, {
    includeHeading: true,
    marginTop: RECEIPT_GRID_METRICS.marginTop,
  });
  const lastPageReceipts = entries.slice(0, onLast);
  const remaining = entries.slice(onLast);

  if (remaining.length === 0) {
    return { lastPageReceipts, extraPages: [] };
  }

  const extraPages: ReceiptPhotoEntry[][] = [];
  let pos = 0;
  while (pos < remaining.length) {
    const cap = Math.max(
      1,
      maxReceiptsThatFit(receiptOnlyPageAvailablePx, {
        includeHeading: true,
        marginTop: 0,
      }),
    );
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
    Math.max(availableHeight, 120),
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))`,
        gap: RECEIPT_GRID_METRICS.rowGap,
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
          }}
        >
          {entry.isImage && entry.imageUrl ? (
            <div
              style={{
                width: "100%",
                height: layout.imageHeight,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={entry.imageUrl}
                alt={entry.fileName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  width: "auto",
                  height: "auto",
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
                minHeight: layout.captionHeight,
              }}
            >
              {entry.captionLine1 && (
                <div style={{ fontWeight: 700, marginBottom: 2, color: C.navy }}>
                  {entry.captionLine1}
                </div>
              )}
              {entry.captionLine2 && <div>{entry.captionLine2}</div>}
              {!entry.captionLine2 && entry.fileName && (
                <div style={{ wordBreak: "break-word" }}>{entry.fileName}</div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
