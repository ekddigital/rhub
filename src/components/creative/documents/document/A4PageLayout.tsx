"use client";

/**
 * A4PageLayout
 * Enforces exact A4 pixel dimensions (794×1123 at 96 DPI) and
 * renders header / content / footer chrome around arbitrary children.
 *
 * Design elements (always present):
 * - Left gold vertical strip with black diagonal accent
 * - Bottom gold band with angular cuts
 * - Top-right registration banner (first page only)
 *
 * Header differentiation:
 * - First page: Large logo emblem + company name + contact info
 * - Subsequent pages: Simple gold-line header with company name
 */

import React from "react";
import { A4, MARGINS } from "@/lib/creative/documents/constants";
import { FirstPageHeader } from "./FirstPageHeader";
import { SubsequentPageHeader } from "./SubsequentPageHeader";
import { Footer, type PageNumberStyle } from "./Footer";
import { PageFrame, TopRightBanner } from "./CornerDecorations";

interface A4PageLayoutProps {
  children: React.ReactNode;
  pageNumber: number;
  totalPages: number;
  /** Whether this is the first page of the document */
  isFirstPage?: boolean;
  /** Show letterhead header chrome */
  showHeader?: boolean;
  /** Show footer chrome */
  showFooter?: boolean;
  /** Show decorative elements (gold strip, bottom band, etc) */
  showDecorations?: boolean;
  /** Margin preset */
  margins?: "standard" | "narrow" | "wide";
  /** Optional className for the content area */
  contentClassName?: string;
  /** Optional ref for the content area (measurement) */
  contentRef?: React.Ref<HTMLDivElement>;
  /** Page number display style: 'none' for cover, 'roman' for TOC, 'arabic' for body */
  numberStyle?: PageNumberStyle;
}

export function A4PageLayout({
  children,
  pageNumber,
  totalPages,
  isFirstPage = false,
  showHeader = true,
  showFooter = true,
  showDecorations = true,
  margins = "standard",
  contentClassName,
  contentRef,
  numberStyle = "arabic",
}: A4PageLayoutProps) {
  const m = MARGINS[margins];
  const mmToPx = (mm: number) => Math.round(mm * 3.7795);

  // Left padding must clear the thick left gold strip (34px) + comfortable gap
  const leftPad = showDecorations ? 68 : mmToPx(m.left);
  // Right padding matches left for symmetrical margins
  const rightPad = showDecorations ? 68 : mmToPx(m.right);

  return (
    <div
      className="a4-page relative bg-white shadow-lg"
      style={{
        width: `${A4.px96.width}px`,
        height: `${A4.px96.height}px`,
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Times New Roman', Times, serif",
        color: "#1F1C18",
        boxSizing: "border-box",
      }}
    >
      {/* Page frame — single SVG with all gold/black border elements */}
      {showDecorations && (
        <>
          <PageFrame isFirstPage={isFirstPage} />
          {isFirstPage && <TopRightBanner />}
        </>
      )}

      {/* Page layout: column flex */}
      <div
        className="flex flex-col"
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          zIndex: 3,
        }}
      >
        {/* Header chrome */}
        {showHeader && (
          <div style={{ flexShrink: 0 }}>
            {isFirstPage ? <FirstPageHeader /> : <SubsequentPageHeader />}
          </div>
        )}

        {/* Content area */}
        <div
          className={contentClassName}
          ref={contentRef}
          style={{
            flex: 1,
            overflow: "hidden",
            paddingLeft: `${leftPad}px`,
            paddingRight: `${rightPad}px`,
            paddingTop: showHeader ? "8px" : `${mmToPx(m.top)}px`,
            paddingBottom: "0px",
          }}
        >
          {children}
        </div>

        {/* Gold divider line — clear visual boundary between content & footer.
            Content must stop ABOVE this line. The line sits just above the
            gold band footer, matching the header gold line style. */}
        {showFooter && showDecorations && (
          <div
            className="footer-gold-line"
            style={{
              flexShrink: 0,
              height: "10px",
              paddingLeft: `${leftPad}px`,
              paddingRight: `${rightPad}px`,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "2px",
                backgroundColor: "#C8A061",
              }}
            />
          </div>
        )}

        {/* Footer chrome */}
        {showFooter && (
          <div style={{ flexShrink: 0 }}>
            <Footer
              pageNumber={pageNumber}
              totalPages={totalPages}
              numberStyle={numberStyle}
            />
          </div>
        )}
      </div>
    </div>
  );
}
