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
