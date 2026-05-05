"use client";

/**
 * Document Footer
 * Page number displayed above the bottom gold band.
 * The wide gold band with angular cuts is handled by CornerDecorations (BottomBand).
 * The footer only renders the page number text.
 */

import React from "react";
import { COMPANY } from "@/lib/creative/documents/constants";

/**
 * Page numbering style:
 * - 'none'   → no page number (used for cover page)
 * - 'roman'  → lowercase Roman numerals i, ii, iii… (used for TOC pages)
 * - 'arabic' → standard 1, 2, 3… (used for body content pages)
 */
export type PageNumberStyle = "none" | "roman" | "arabic";

function toRoman(n: number): string {
  const lookup: [number, string][] = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let result = "";
  let remaining = n;
  for (const [value, numeral] of lookup) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  return result;
}

function formatPageNumber(n: number, style: PageNumberStyle): string {
  if (style === "roman") return toRoman(n);
  return String(n);
}

interface FooterProps {
  pageNumber: number;
  totalPages: number;
  /** Controls how the page number is displayed. Defaults to 'arabic'. */
  numberStyle?: PageNumberStyle;
}

export function Footer({
  pageNumber,
  totalPages,
  numberStyle = "arabic",
}: FooterProps) {
  /*
   * SPACING CALCULATION (FULL-BLEED + THICK FRAME):
   * Bottom gold band: 52px tall, at the very bottom edge (y = PH - 52)
   * Footer height: 52px — sits within the gold band
   * Content is white text on gold background
   * Padding: 48px left, 40px right, 16px bottom
   * Print safety: paddingBottom pushes text ~30px+ from the page
   * bottom edge. Even aggressive printers won't clip the text.
   */
  return (
    <div
      className="document-footer"
      style={{
        width: "100%",
        height: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: "48px",
        paddingRight: "40px",
        paddingBottom: "16px",
        position: "relative",
        zIndex: 5,
      }}
    >
      {/* Company name — left side */}
      <span
        style={{
          color: "#FFFFFF",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "9.5px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
        }}
      >
        {COMPANY.name}
      </span>

      {/* Page number — right side (hidden for cover, Roman for TOC, Arabic for body) */}
      {numberStyle !== "none" && (
        <span
          style={{
            color: "#FFFFFF",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "9px",
            fontWeight: 400,
            letterSpacing: "0.03em",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ opacity: 0.75 }}>Page</span>
          <span style={{ fontWeight: 700, fontSize: "11px" }}>
            {formatPageNumber(pageNumber, numberStyle)}
          </span>
          <span style={{ opacity: 0.5, fontSize: "8px" }}>of</span>
          <span style={{ fontWeight: 700, fontSize: "11px" }}>
            {formatPageNumber(totalPages, numberStyle)}
          </span>
        </span>
      )}
    </div>
  );
}
