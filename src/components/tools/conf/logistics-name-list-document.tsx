/**
 * Printable / PDF logistics name list with letterhead and document thumbnails.
 */

"use client";

import React, { useMemo } from "react";
import {
  DocumentLayout,
  normalizeConfInfo,
} from "@/lib/conf/document-layout";
import {
  DOCUMENT_COLORS as C,
  FONT_SIZES,
  formatDate,
} from "@/lib/conf/document-constants";
import type { LogisticsNameListEntry } from "@/lib/conf/logistics-name-list";
import { isDelegateFullyPaid } from "@/lib/conf/logistics-name-list";

const PLACEHOLDER_SVG = "/conf/placeholder-delegate.svg";
/** Prioritize readable document scans over max rows per page. */
const ROWS_PER_PAGE = 5;
const DOC_THUMB_HEIGHT = 140;

export type LogisticsNameListDocumentProps = {
  confInfo: {
    name: string;
    city: string;
    venue?: string | null;
    startsAt: string;
    endsAt: string;
  };
  entries: LogisticsNameListEntry[];
  generatedAt?: string;
  forPrint?: boolean;
  /** When set, only render these page indices (for off-screen PDF capture). */
  pageFilter?: number[] | null;
  /** Optional wrapper id — omit for on-screen preview; print shell sets the capture root. */
  rootId?: string;
};

function chunkPages<T>(items: T[], size: number): T[][] {
  if (items.length === 0) return [[]];
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

const docThumbStyle = {
  width: "100%",
  height: DOC_THUMB_HEIGHT,
  borderRadius: 4,
} as const;

function DocThumb({
  src,
  label,
  missingLabel,
}: {
  src: string | null;
  label: string;
  missingLabel: string;
}) {
  if (!src) {
    return (
      <div
        style={{
          ...docThumbStyle,
          border: `1px dashed ${C.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontSize: 7,
          color: "#888",
          background: "#fafafa",
          padding: 4,
          lineHeight: 1.25,
        }}
      >
        {missingLabel}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      style={{
        ...docThumbStyle,
        objectFit: "contain",
        objectPosition: "top center",
        border: `1px solid ${C.divider}`,
        background: "#fff",
        display: "block",
      }}
      onError={(e) => {
        const el = e.target as HTMLImageElement;
        el.src = PLACEHOLDER_SVG;
        el.style.objectFit = "contain";
      }}
    />
  );
}

function NameCell({ row }: { row: LogisticsNameListEntry }) {
  const paid = isDelegateFullyPaid(row);

  return (
    <div style={{ lineHeight: 1.3 }}>
      <div
        style={{
          fontWeight: 600,
          wordBreak: "break-word",
        }}
      >
        {row.name}
      </div>
      <div
        style={{
          fontSize: 8,
          color: "#555",
          marginTop: 2,
          wordBreak: "break-all",
        }}
      >
        {row.passportNo || "—"}
      </div>
      {paid ? (
        <div style={{ fontSize: 7, color: "#047857", marginTop: 3 }}>Paid</div>
      ) : row.isManual ? (
        <div style={{ fontSize: 7, color: "#475569", marginTop: 3 }}>Manual</div>
      ) : null}
    </div>
  );
}

function RosterTable({
  rows,
  startIndex = 0,
}: {
  rows: LogisticsNameListEntry[];
  startIndex?: number;
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: FONT_SIZES.tableBody,
      }}
    >
      <thead>
        <tr style={{ background: C.navy, color: "#fff" }}>
          {["#", "Name", "Passport", "Visa", "Entry Stamp"].map((label) => (
            <th
              key={label}
              style={{
                padding: "5px 4px",
                textAlign: label === "#" ? "center" : "left",
                fontWeight: 600,
                fontSize: 8,
              }}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td
              colSpan={5}
              style={{
                padding: 24,
                textAlign: "center",
                color: "#777",
                borderBottom: `1px solid ${C.divider}`,
              }}
            >
              No delegates on the logistics name list yet.
            </td>
          </tr>
        ) : (
          rows.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  background: idx % 2 === 0 ? "#fff" : "#f8fafc",
                  verticalAlign: "top",
                }}
              >
                <td
                  style={{
                    padding: "5px 4px",
                    textAlign: "center",
                    borderBottom: `1px solid ${C.divider}`,
                    width: "4%",
                  }}
                >
                  {startIndex + idx + 1}
                </td>
                <td
                  style={{
                    padding: "5px 6px",
                    borderBottom: `1px solid ${C.divider}`,
                    width: "20%",
                  }}
                >
                  <NameCell row={row} />
                </td>
                <td
                  style={{
                    padding: "5px 4px",
                    borderBottom: `1px solid ${C.divider}`,
                    width: "25.3%",
                  }}
                >
                  <DocThumb
                    src={row.passportDocUrl}
                    label="Passport"
                    missingLabel="Passport — missing"
                  />
                </td>
                <td
                  style={{
                    padding: "5px 4px",
                    borderBottom: `1px solid ${C.divider}`,
                    width: "25.3%",
                  }}
                >
                  <DocThumb
                    src={row.visaDocUrl}
                    label="Visa"
                    missingLabel="Visa — missing"
                  />
                </td>
                <td
                  style={{
                    padding: "5px 4px",
                    borderBottom: `1px solid ${C.divider}`,
                    width: "25.3%",
                  }}
                >
                  <DocThumb
                    src={row.entryStampDocUrl}
                    label="Entry stamp"
                    missingLabel="Entry stamp — missing"
                  />
                </td>
              </tr>
            ))
        )}
      </tbody>
    </table>
  );
}

export function LogisticsNameListDocument({
  confInfo,
  entries,
  generatedAt,
  forPrint = false,
  pageFilter = null,
  rootId,
}: LogisticsNameListDocumentProps) {
  const normalizedConfInfo = normalizeConfInfo(confInfo);
  const generatedLabel = generatedAt
    ? formatDate(generatedAt)
    : formatDate(new Date().toISOString());

  const pages = useMemo(() => chunkPages(entries, ROWS_PER_PAGE), [entries]);
  const visiblePages = pageFilter
    ? pages.filter((_, idx) => pageFilter.includes(idx))
    : pages;

  return (
    <div {...(rootId ? { id: rootId } : {})}>
      {visiblePages.map((pageRows, pageIdx) => {
        const absolutePageIdx = pageFilter ? pageFilter[pageIdx] ?? pageIdx : pageIdx;
        const isFirst = absolutePageIdx === 0;
        return (
          <DocumentLayout
            key={`logistics-page-${absolutePageIdx}`}
            confInfo={normalizedConfInfo}
            officeLabel="Office of the Logistics Committee"
            hideCommitteeSidebar
            forPrint={forPrint}
            className={absolutePageIdx > 0 ? "mt-4" : ""}
            pageNumber={absolutePageIdx + 1}
            totalPages={pages.length}
          >
            {isFirst && (
              <div style={{ marginBottom: 8 }}>
                <h1
                  style={{
                    fontSize: FONT_SIZES.documentTitle,
                    fontWeight: 700,
                    color: C.navy,
                    marginBottom: 4,
                  }}
                >
                  Logistics Name List
                </h1>
                <p
                  style={{
                    fontSize: FONT_SIZES.caption,
                    color: "#555",
                    marginBottom: 4,
                  }}
                >
                  {confInfo.name}
                </p>
                <p style={{ fontSize: FONT_SIZES.caption, color: "#777" }}>
                  Generated {generatedLabel} · {entries.length} delegate
                  {entries.length === 1 ? "" : "s"}
                </p>
              </div>
            )}
            {!isFirst && (
              <p
                style={{
                  fontSize: 10,
                  color: "#777",
                  marginBottom: 6,
                }}
              >
                Logistics Name List (continued)
              </p>
            )}
            <RosterTable
              rows={pageRows}
              startIndex={absolutePageIdx * ROWS_PER_PAGE}
            />
          </DocumentLayout>
        );
      })}
    </div>
  );
}
