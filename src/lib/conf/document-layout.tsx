/**
 * Reusable document layout shell for conference documents.
 * Provides letterhead, table rendering, and print-ready formatting.
 * Used by: letters, budgets, payments, reports.
 */

import React from "react";
import {
  DOCUMENT_COLORS as C,
  LIBERIAN_FLAG_STRIPES as FLAG_STRIPES_11,
  LETTERHEAD_SECTIONS,
  PAGE_DIMENSIONS,
  TABLE_STYLES,
  FONTS,
  FONT_SIZES,
} from "./document-constants";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DocumentLayoutProps {
  /** Conference information for header */
  confInfo?: {
    name: string;
    city: string;
    venue?: string;
    startsAt: string;
    endsAt: string;
  };

  /** Office label (e.g., "Office of the Conference Chairman") */
  officeLabel?: string;

  /** Committee members to display in left sidebar */
  members?: Array<{
    id: string;
    name: string;
    role: string;
    title?: string | null;
    city?: string | null;
    phone?: string | null;
    committeeScope?: string | null;
  }>;

  /** Main document content */
  children: React.ReactNode;

  /** Whether rendering for print (affects styling) */
  forPrint?: boolean;

  /** Additional CSS classes */
  className?: string;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number | string; // as % or px
  align?: "left" | "center" | "right";
  format?: (value: unknown) => React.ReactNode;
}

export interface DocumentTableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  caption?: string;
  forPrint?: boolean;
}

// ── Document Layout Component ────────────────────────────────────────────────

export function DocumentLayout({
  confInfo,
  officeLabel = "Office of the Conference Chairman",
  members = [],
  children,
  forPrint = false,
  className = "",
}: DocumentLayoutProps) {
  const STRIPE_H = LETTERHEAD_SECTIONS.stripeHeight;
  const HEADER_H = LETTERHEAD_SECTIONS.headerHeight;
  const GOLD_BAR = LETTERHEAD_SECTIONS.goldBarHeight;
  const OFFICE_ROW = LETTERHEAD_SECTIONS.officeRowHeight;
  const NAVY_BAR = LETTERHEAD_SECTIONS.navyBarHeight;
  const RED_BAR = LETTERHEAD_SECTIONS.redBarHeight;
  const BODY_H = LETTERHEAD_SECTIONS.bodyHeight;
  const SIDEBAR_W = LETTERHEAD_SECTIONS.sidebarWidth;
  const PAGE_W = PAGE_DIMENSIONS.width;

  const dateRange = confInfo
    ? `${new Date(confInfo.startsAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })} – ${new Date(confInfo.endsAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`
    : "";

  const venue =
    confInfo?.venue ||
    `${confInfo?.city || "Jinan"}, Shandong Province, P.R. China`;

  return (
    <div
      className={className}
      style={{
        fontFamily: FONTS.body,
        color: "#333",
      }}
    >
      <div
        className="document-page"
        style={{
          width: PAGE_W,
          height: forPrint ? "auto" : "842px",
          background: C.white,
          display: "flex",
          flexDirection: "column",
          overflow: forPrint ? "visible" : "hidden",
          boxShadow: forPrint ? "none" : "0 4px 32px rgba(0,0,0,0.18)",
          margin: forPrint ? 0 : "20px auto",
        }}
      >
        {/* ── Liberian flag stripes ── */}
        <div style={{ display: "flex", height: STRIPE_H, flexShrink: 0 }}>
          {FLAG_STRIPES_11.map((color, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: color,
                borderBottom: color === "#FFFFFF" ? "0.5px solid #ddd" : "none",
              }}
            />
          ))}
        </div>

        {/* ── Header: logo | text | seal ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: HEADER_H,
            flexShrink: 0,
            background: C.white,
            padding: "10px 18px",
            gap: 12,
          }}
        >
          {/* LSUIC Logo */}
          <div
            style={{
              flexShrink: 0,
              width: 108,
              height: 108,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/lsuic_logo.png"
              alt="LSUIC"
              style={{ width: 108, height: 108, objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                if (el.parentElement)
                  el.parentElement.innerHTML =
                    '<span style="font-size:10px;font-weight:800;color:#002868;">LSUIC</span>';
              }}
            />
          </div>

          {/* Center text block */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "0.3px",
                lineHeight: 1.2,
              }}
            >
              LIBERIAN STUDENT UNION IN CHINA (LSUIC)
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.gold,
                marginTop: 4,
              }}
            >
              {confInfo?.name ?? "LSUIC 20th Anniversary National Conference"}
            </div>
            <div style={{ fontSize: 8.5, color: "#555", marginTop: 4 }}>
              {venue}
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>{dateRange}</div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
              Email: ekd@ekddigital.com · lsuic2006@gmail.com
            </div>
          </div>

          {/* Liberia National Seal */}
          <div
            style={{
              flexShrink: 0,
              width: 104,
              height: 104,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/liberia-seal.svg"
              alt="Liberia Seal"
              style={{ width: 104, height: 104, objectFit: "contain" }}
              onError={(e) => {
                const el = e.target as HTMLImageElement;
                el.style.display = "none";
                if (el.parentElement)
                  el.parentElement.innerHTML =
                    '<span style="font-size:7px;text-align:center;color:#002868;">REPUBLIC OF LIBERIA</span>';
              }}
            />
          </div>
        </div>

        {/* ── Gold separator ── */}
        <div style={{ height: GOLD_BAR, background: C.gold, flexShrink: 0 }} />

        {/* ── "Office of…" row ── */}
        <div
          style={{
            height: OFFICE_ROW,
            background: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 20px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: C.navy,
              fontStyle: "italic",
            }}
          >
            {officeLabel}
          </span>
        </div>

        {/* ── Navy + Red bars ── */}
        <div style={{ height: NAVY_BAR, background: C.navy, flexShrink: 0 }} />
        <div style={{ height: RED_BAR, background: C.red, flexShrink: 0 }} />

        {/* ── Body: sidebar + content ── */}
        <div
          style={{
            display: "flex",
            height: forPrint ? "auto" : BODY_H,
            flexShrink: 0,
            overflow: forPrint ? "visible" : "hidden",
          }}
        >
          {/* Left sidebar */}
          {members && members.length > 0 && (
            <div
              style={{
                width: SIDEBAR_W,
                background: C.white,
                flexShrink: 0,
                overflow: forPrint ? "visible" : "hidden",
                display: "flex",
                borderRight: "1px solid #dde3ef",
              }}
            >
              {/* Vertical accent strips */}
              <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
                <div style={{ width: 8, background: C.navy }} />
                <div style={{ width: 3, background: C.red }} />
              </div>

              {/* Member list */}
              <div
                style={{
                  flex: 1,
                  padding: "12px 8px 12px 9px",
                  overflowY: forPrint ? "visible" : "auto",
                }}
              >
                <div
                  style={{
                    fontSize: 7.5,
                    fontWeight: 800,
                    color: C.navy,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase",
                    textAlign: "center",
                    marginBottom: 5,
                  }}
                >
                  CONFERENCE COMMITTEE
                </div>
                <div
                  style={{
                    height: 1,
                    background: C.navy,
                    opacity: 0.25,
                    marginBottom: 9,
                  }}
                />
                {members.map((m) => (
                  <div
                    key={m.id}
                    style={{ marginBottom: 6, textAlign: "center" }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.navy,
                        fontStyle: "italic",
                        lineHeight: 1.25,
                        wordBreak: "break-word",
                      }}
                    >
                      {m.name}
                    </div>
                    <div
                      style={{
                        fontSize: 9.5,
                        color: C.navy,
                        fontStyle: "italic",
                        lineHeight: 1.3,
                        opacity: 0.8,
                      }}
                    >
                      {m.title || m.committeeScope || m.role}
                    </div>
                    {m.city && (
                      <div
                        style={{
                          fontSize: 9,
                          color: "#444",
                          fontStyle: "italic",
                          lineHeight: 1.3,
                        }}
                      >
                        {m.city}, China
                      </div>
                    )}
                    {m.phone && (
                      <div
                        style={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          color: C.navy,
                          fontStyle: "italic",
                          lineHeight: 1.4,
                          marginTop: 2,
                        }}
                      >
                        {m.phone}
                      </div>
                    )}
                    <div
                      style={{
                        height: 0.8,
                        background: C.navy,
                        opacity: 0.15,
                        marginTop: 6,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main content area */}
          <div
            style={{
              flex: 1,
              padding: "20px 18px",
              overflowY: forPrint ? "visible" : "auto",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Document Table Component ─────────────────────────────────────────────────

export function DocumentTable({
  columns,
  data,
  caption,
  forPrint = false,
}: DocumentTableProps) {
  const totalWidth = 100;
  const columnWidths = columns.map((col) => {
    if (typeof col.width === "number") return col.width;
    if (typeof col.width === "string") return parseFloat(col.width);
    return totalWidth / columns.length;
  });

  return (
    <div>
      {caption && (
        <h3
          style={{
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
            color: C.navy,
          }}
        >
          {caption}
        </h3>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: FONT_SIZES.tableBody,
          fontFamily: FONTS.body,
        }}
      >
        <thead>
          <tr style={{ background: TABLE_STYLES.headerBg }}>
            {columns.map((col, i) => (
              <th
                key={col.key}
                style={{
                  color: TABLE_STYLES.headerTextColor,
                  fontWeight: 600,
                  textAlign: col.align || "left",
                  padding: `${TABLE_STYLES.cellPadding / 2}px ${TABLE_STYLES.cellPadding / 2}px`,
                  borderBottom: `${TABLE_STYLES.borderWidth} solid ${TABLE_STYLES.borderColor}`,
                  width: `${columnWidths[i]}%`,
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              style={{
                background:
                  rowIdx % 2 === 0 ? TABLE_STYLES.rowBg : TABLE_STYLES.rowAltBg,
                minHeight: TABLE_STYLES.minRowHeight,
              }}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={`${rowIdx}-${col.key}`}
                  style={{
                    textAlign: col.align || "left",
                    padding: `${TABLE_STYLES.cellPadding / 2}px`,
                    borderBottom: `0.5px solid ${TABLE_STYLES.borderColor}`,
                    width: `${columnWidths[colIdx]}%`,
                  }}
                >
                  {col.format
                    ? col.format(row[col.key])
                    : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
