"use client";

/**
 * Shared letter preview chrome for Letter Composer — keeps footer / attachment
 * layout aligned with `/api/conf/[confId]/letterhead` and avoids duplicating large
 * JSX blocks inside `letter-composer-shell.tsx`.
 */

import { LETTERHEAD_CONFIG } from "@/lib/conf/letterhead-config";

export const LP = {
  PAGE_W: 794,
  PAGE_H: 1123,
  FOOTER_H: 32,
  navy: "#002868",
  red: "#BF0A30",
  gold: "#C8A061",
  white: "#FFFFFF",
  muted: "#777777",
} as const;

export const LP_FLAG_STRIPES_11 = [
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
  "#FFFFFF",
  "#BF0A30",
] as const;

export function letterPreviewPageChrome(forPrint: boolean) {
  return {
    width: LP.PAGE_W,
    minHeight: LP.PAGE_H,
    height: LP.PAGE_H,
    maxHeight: LP.PAGE_H,
    overflow: "hidden" as const,
    flexShrink: 0 as const,
    boxShadow: forPrint ? ("none" as const) : ("0 4px 32px rgba(0,0,0,0.18)" as const),
    outline: forPrint ? ("none" as const) : ("1px solid rgba(0,0,0,0.06)" as const),
  };
}

export function LetterPreviewFooter({
  pageNum,
  totalPages,
}: {
  pageNum: number;
  totalPages: number;
}) {
  return (
    <div
      style={{
        height: LP.FOOTER_H,
        background: LP.navy,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div style={{ height: 2, background: LP.red, width: "100%" }} />
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 14px",
          gap: 8,
        }}
      >
        <div style={{ width: 44, flexShrink: 0 }} />
        <div
          style={{
            fontSize: 7.5,
            fontWeight: 700,
            color: LP.gold,
            letterSpacing: "0.35px",
            textAlign: "center",
            lineHeight: 1.35,
            flex: 1,
            minWidth: 0,
          }}
        >
          {LETTERHEAD_CONFIG.motto}
        </div>
        <div
          style={{
            fontSize: 8,
            color: LP.gold,
            opacity: 0.85,
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
            textAlign: "right",
            whiteSpace: "nowrap",
          }}
        >
          Page {pageNum} of {totalPages}
        </div>
      </div>
    </div>
  );
}

/** Fundraising letters append the conference countdown flyer (GET PNG — matches dashboard export). */
export function LetterPromotionalFlyerAttachmentPage({
  confId,
  pageNum,
  totalPages,
  forPrint,
}: {
  confId: string;
  pageNum: number;
  totalPages: number;
  forPrint?: boolean;
}) {
  const flyerSrc = `/api/conf/${encodeURIComponent(confId)}/countdown-flyer?format=png`;

  return (
    <div
      className="letter-page letter-flyer-attachment-page"
      style={{
        ...letterPreviewPageChrome(Boolean(forPrint)),
        background: LP.white,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", height: 14, flexShrink: 0 }}>
        {LP_FLAG_STRIPES_11.map((color, i) => (
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

      <div
        style={{
          flexShrink: 0,
          padding: "12px 28px",
          borderBottom: `2px solid ${LP.gold}`,
          background: LP.white,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: LP.navy,
            letterSpacing: "0.04em",
          }}
        >
          Conference countdown flyer
        </div>
        <div style={{ fontSize: 8.5, color: LP.muted, marginTop: 4 }}>
          Promotional artwork for this conference (same PNG as Flyer Studio /
          dashboard). Shown on the page after your letter for fundraising
          correspondence.
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 28px",
          background: "#fafbfd",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={flyerSrc}
          alt="Conference countdown flyer"
          className="letter-embedded-flyer"
          style={{
            maxWidth: LP.PAGE_W - 56,
            width: "100%",
            height: "auto",
            objectFit: "contain",
            borderRadius: 8,
            boxShadow: forPrint ? "none" : "0 2px 12px rgba(0,40,104,0.08)",
          }}
        />
      </div>

      <LetterPreviewFooter pageNum={pageNum} totalPages={totalPages} />
    </div>
  );
}
