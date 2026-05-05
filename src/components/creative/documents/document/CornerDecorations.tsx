"use client";

/**
 * Letterhead Page Frame
 * Matches the EKD Digital letterhead template.
 *
 * The design is a gold border frame with DIAGONAL ENDINGS:
 * - Top bar: full width, inner corners have diagonal cuts going inward
 * - Left strip: full height, with a small diagonal accent ~75% down
 * - Right panel (first page only): from top, ends with a diagonal cut
 * - Bottom band: full width, clean
 * - All inner border endings terminate at a diagonal angle (not straight)
 */

import React from "react";
import { COMPANY, LETTERHEAD } from "@/lib/creative/documents/constants";

const GOLD = LETTERHEAD.goldColor;
const BLACK = LETTERHEAD.primaryColor;

/* Page dimensions at 96 DPI */
const PW = 794;
const PH = 1123;

/* Frame border dimensions — FULL-BLEED + EXTRA-THICK
   Gold borders extend to the very edge AND are thicker than needed.
   This creates a generous "sacrificial zone": if a printer clips the
   edges, it only loses gold — never text. All text on/near borders
   is pushed well inward from the edges via padding. */
const TOP_H = 36; // top gold bar — thick enough to protect text below
const LEFT_W = 34; // left gold strip — wide enough to protect content
const RIGHT_W = 28; // right panel width (first page only)
const RIGHT_END = 220; // right panel ends at this Y (extended)
const BOT_H = 52; // bottom gold band — tall enough to protect footer text
const DIAG = 45; // diagonal cut length at inner border endings

/* ================================================================
   PAGE FRAME — Single SVG with diagonal-ended borders
   ================================================================ */
interface PageFrameProps {
  isFirstPage?: boolean;
}

export function PageFrame({ isFirstPage = false }: PageFrameProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <svg
        width={PW}
        height={PH}
        viewBox={`0 0 ${PW} ${PH}`}
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        {/* ── TOP BAR ──
            Full width gold bar at the very top edge of the page. */}
        <rect x={0} y={0} width={PW} height={TOP_H} fill={GOLD} />

        {/* ── LEFT STRIP ──
            Full height gold strip at the very left edge of the page. */}
        <rect x={0} y={0} width={LEFT_W} height={PH} fill={GOLD} />

        {/* ── RIGHT PANEL (first page only) ──
            Gold panel on right side from top, ending with a diagonal cut */}
        {isFirstPage && (
          <polygon
            points={`
              ${PW - RIGHT_W},${0}
              ${PW},${0}
              ${PW},${RIGHT_END}
              ${PW - RIGHT_W},${RIGHT_END - DIAG}
            `}
            fill={GOLD}
          />
        )}

        {/* If first page, cut the top bar's bottom-right corner diagonally */}
        {isFirstPage && (
          <polygon
            points={`
              ${PW - RIGHT_W - DIAG},${TOP_H}
              ${PW - RIGHT_W},${TOP_H}
              ${PW - RIGHT_W},${TOP_H + DIAG}
            `}
            fill="white"
          />
        )}

        {/* ── BOTTOM BAND ──
            Gold band at the very bottom edge of the page. */}
        <rect x={0} y={PH - BOT_H} width={PW} height={BOT_H} fill={GOLD} />

        {/* ── LEFT SIDE DIAGONAL ACCENT (~75% down) ──
            Small gold + black diagonal stripes extending from left strip */}
        <polygon
          points={`
            ${0},${790}
            ${LEFT_W + 16},${790 + 12}
            ${LEFT_W + 16},${790 + 52}
            ${0},${790 + 64}
          `}
          fill={GOLD}
        />
        <polygon
          points={`
            ${0},${790 + 10}
            ${LEFT_W + 10},${790 + 18}
            ${LEFT_W + 10},${790 + 44}
            ${0},${790 + 52}
          `}
          fill={BLACK}
        />
      </svg>
    </div>
  );
}

/* ================================================================
   TOP-RIGHT BANNER TEXT
   White registration text overlaid on the gold top bar (first page)
   ================================================================ */
export function TopRightBanner() {
  return (
    <div
      style={{
        position: "absolute",
        top: "0px",
        right: 0,
        height: `${TOP_H}px`,
        paddingRight: `${RIGHT_W + 22}px`,
        paddingTop: "8px",
        display: "flex",
        alignItems: "center",
        zIndex: 6,
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: "11px",
        fontWeight: 500,
        color: "#FFFFFF",
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      Business Reg. No. {COMPANY.registrationNo} | TIN: {COMPANY.tinNo}
    </div>
  );
}

/* ================================================================
   Combined export (backward-compatible)
   ================================================================ */
export function CornerDecorations() {
  return (
    <>
      <PageFrame isFirstPage />
      <TopRightBanner />
    </>
  );
}
