"use client";

/**
 * Document Header — First Page
 * Matches the EKD Digital letterhead template:
 *
 * Layout:
 * - Top-right: Angular gold banner with reg info (handled by CornerDecorations)
 * - Left: Large circular gold emblem with {EKD} logo
 * - Center-left: Company name + address
 * - Right: Contact info (email, website, phone)
 *
 * The left gold vertical strip is handled by CornerDecorations.
 * This component handles only the header content area.
 */

import React from "react";
import { COMPANY, LETTERHEAD } from "@/lib/creative/documents/constants";

interface FirstPageHeaderProps {
  /** Override logo path */
  logo?: string;
}

export function FirstPageHeader({ logo }: FirstPageHeaderProps) {
  /*
   * SPACING CALCULATION (full-bleed + thick frame, print-safe text):
   * ─────────────────────────────────────────────────────────
   * Gold frame: TOP_H=36px at y=0, LEFT_W=34px at x=0
   * Gold extends to the page edges; TEXT stays well inset.
   *
   * Logo:
   *   top  = 42px  (36 top bar + 6 gap)
   *   left = 40px  (34 left strip + 6 gap)
   *   size = 100×100px
   *
   * Text block:
   *   left = 40 + 100 + 14 = 154px  (clears logo + gap)
   *   top  = 44px  (36 top bar + 8 gap)
   *   right = 64px
   *
   * Total header min-height: 42 + 100 + 14 = 156px
   */
  return (
    <div
      className="document-header-first"
      style={{
        width: "100%",
        position: "relative",
        minHeight: "156px",
      }}
    >
      {/* Logo — regular <img> for reliable html2canvas PDF capture */}
      <div
        style={{
          position: "absolute",
          top: "42px",
          left: "40px",
          width: "100px",
          height: "100px",
          zIndex: 10,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo || COMPANY.logo}
          alt={COMPANY.name}
          width={100}
          height={100}
          style={{
            display: "block",
            width: "100px",
            height: "100px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Header text content — padded to clear logo & gold frame borders */}
      <div
        className="flex justify-between items-start"
        style={{
          paddingLeft: "154px",
          paddingTop: "44px",
          paddingRight: "64px",
          paddingBottom: "8px",
        }}
      >
        {/* Company Name + Address */}
        <div>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: LETTERHEAD.goldColor,
              fontFamily: "'Times New Roman', Times, serif",
              letterSpacing: "0.04em",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {COMPANY.name}
          </h1>
          <p
            style={{
              fontSize: "11px",
              color: "#555",
              fontFamily: "'Times New Roman', Times, serif",
              margin: "5px 0 0 0",
              lineHeight: 1.6,
              fontWeight: 400,
            }}
          >
            {COMPANY.address}
            <br />
            {COMPANY.addressLine2}
          </p>
        </div>

        {/* Contact Info */}
        <div
          className="text-right"
          style={{
            fontSize: "11px",
            color: "#555",
            fontFamily: "'Times New Roman', Times, serif",
            lineHeight: 2,
            flexShrink: 0,
            paddingLeft: "16px",
          }}
        >
          <p style={{ margin: 0 }}>
            <a
              href={`mailto:${COMPANY.email}`}
              style={{ color: LETTERHEAD.goldColor, textDecoration: "none" }}
            >
              {COMPANY.email}
            </a>
            {" | "}
            <a
              href={COMPANY.websiteUrl}
              style={{ color: LETTERHEAD.goldColor, textDecoration: "none" }}
            >
              {COMPANY.website}
            </a>
          </p>
          <p style={{ margin: 0 }}>
            {COMPANY.phone.liberia} | {COMPANY.phone.china}
          </p>
        </div>
      </div>
    </div>
  );
}
