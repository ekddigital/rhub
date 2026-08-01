/**
 * Shared receipt-photo grid for conference document exports (budget, payments).
 */

import React from "react";
import { DOCUMENT_COLORS as C } from "./document-constants";

export interface ReceiptPhotoEntry {
  id: string;
  imageUrl: string | null;
  fileName: string;
  captionLine1?: string;
  captionLine2?: string;
  isImage: boolean;
}

export const RECEIPTS_PER_PAGE = 4;

/** Measured block heights (px) for pagination — matches DocumentReceiptPhotosGrid defaults. */
export const RECEIPT_GRID_METRICS = {
  headingH: 37,
  marginTop: 12,
  thumbnailHeight: 140,
  captionBlockH: 36,
  rowGap: 10,
  columns: 2,
} as const;

function receiptCellH(thumbnailHeight: number = RECEIPT_GRID_METRICS.thumbnailHeight) {
  return thumbnailHeight + RECEIPT_GRID_METRICS.captionBlockH + 2;
}

/** Estimate vertical space used by a receipt-photo grid block. */
export function estimateReceiptPhotosBlockH(
  count: number,
  opts?: {
    includeHeading?: boolean;
    thumbnailHeight?: number;
    marginTop?: number;
  },
): number {
  if (count <= 0) return 0;
  const {
    includeHeading = true,
    thumbnailHeight = RECEIPT_GRID_METRICS.thumbnailHeight,
    marginTop = RECEIPT_GRID_METRICS.marginTop,
  } = opts ?? {};
  const rows = Math.ceil(count / RECEIPT_GRID_METRICS.columns);
  const cellH = receiptCellH(thumbnailHeight);
  const gridH =
    rows * cellH + Math.max(0, rows - 1) * RECEIPT_GRID_METRICS.rowGap;
  return (
    marginTop + (includeHeading ? RECEIPT_GRID_METRICS.headingH : 0) + gridH
  );
}

/** Max receipt thumbnails that fit in `availablePx` (binary search on block height). */
export function maxReceiptsThatFit(
  availablePx: number,
  opts?: {
    includeHeading?: boolean;
    thumbnailHeight?: number;
    marginTop?: number;
  },
): number {
  if (availablePx <= 0) return 0;
  let lo = 0;
  let hi = 100;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (estimateReceiptPhotosBlockH(mid, opts) <= availablePx) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

export function chunkReceiptPhotos<T>(
  items: T[],
  perPage = RECEIPTS_PER_PAGE,
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
      maxReceiptsThatFit(receiptOnlyPageAvailablePx, { includeHeading: true }),
    );
    extraPages.push(remaining.slice(pos, pos + cap));
    pos += cap;
  }

  return { lastPageReceipts, extraPages };
}

export function DocumentReceiptPhotosGrid({
  entries,
  thumbnailHeight = 140,
}: {
  entries: ReceiptPhotoEntry[];
  thumbnailHeight?: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10,
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
          }}
        >
          {entry.isImage && entry.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.imageUrl}
              alt={entry.fileName}
              style={{
                width: "100%",
                height: thumbnailHeight,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: thumbnailHeight,
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
            <div style={{ padding: "8px 10px", fontSize: 9.5, color: "#555" }}>
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
