"use client";

/**
 * CoverPage
 * Professional document cover page with company branding and logo.
 * Supports multiple visual styles: executive, legal, policy, proposal, onboarding.
 * Renders inside an A4-sized container with no page numbers.
 */

import React from "react";
import { A4, LETTERHEAD, COMPANY, TYPOGRAPHY } from "@/lib/creative/documents/constants";
import type { DocumentMeta, CoverStyle } from "@/lib/creative/documents/types";

/* ─── Style palettes per cover variant ─────────────────────────── */
const PALETTES: Record<
  CoverStyle,
  {
    accent: string;
    accentDark: string;
    heading: string;
    strip: string;
    bottomBand: string;
    bottomText: string;
    metaLabel: string;
    badgeBorder: string;
    badgeText: string;
  }
> = {
  executive: {
    accent: LETTERHEAD.goldColor,
    accentDark: LETTERHEAD.primaryColor,
    heading: LETTERHEAD.primaryColor,
    strip: LETTERHEAD.goldColor,
    bottomBand: LETTERHEAD.goldColor,
    bottomText: "#FFFFFF",
    metaLabel: LETTERHEAD.primaryColor,
    badgeBorder: LETTERHEAD.goldColor,
    badgeText: LETTERHEAD.goldColor,
  },
  legal: {
    accent: "#1E3A5F",
    accentDark: "#0F1F33",
    heading: "#1E3A5F",
    strip: "#1E3A5F",
    bottomBand: "#1E3A5F",
    bottomText: "#FFFFFF",
    metaLabel: "#1E3A5F",
    badgeBorder: "#8B9EB5",
    badgeText: "#1E3A5F",
  },
  policy: {
    accent: "#1B5E5E",
    accentDark: "#0F3333",
    heading: "#1B5E5E",
    strip: "#1B5E5E",
    bottomBand: "#1B5E5E",
    bottomText: "#FFFFFF",
    metaLabel: "#1B5E5E",
    badgeBorder: "#1B5E5E",
    badgeText: "#1B5E5E",
  },
  proposal: {
    accent: LETTERHEAD.goldColor,
    accentDark: "#1F1C18",
    heading: "#FFFFFF",
    strip: LETTERHEAD.goldColor,
    bottomBand: "#1F1C18",
    bottomText: LETTERHEAD.goldColor,
    metaLabel: LETTERHEAD.goldColor,
    badgeBorder: LETTERHEAD.goldColor,
    badgeText: LETTERHEAD.goldColor,
  },
  onboarding: {
    accent: "#4338CA",
    accentDark: "#1E1B4B",
    heading: "#4338CA",
    strip: "#4338CA",
    bottomBand: "#4338CA",
    bottomText: "#FFFFFF",
    metaLabel: "#4338CA",
    badgeBorder: "#4338CA",
    badgeText: "#4338CA",
  },
};

interface CoverPageProps {
  meta: DocumentMeta;
  /**
   * When true, suppress all variable text (title, subtitle, meta fields,
   * company name/address) so the cover exports as a pure graphic template.
   * The decorative frame, strips, bands and logo image are kept.
   */
  blankMode?: boolean;
}

export function CoverPage({ meta, blankMode = false }: CoverPageProps) {
  const style: CoverStyle = meta.coverStyle ?? "executive";
  const p = PALETTES[style];
  const isProposal = style === "proposal";

  return (
    <div
      className="a4-page relative bg-white shadow-lg"
      style={{
        width: `${A4.px96.width}px`,
        height: `${A4.px96.height}px`,
        overflow: "hidden",
        position: "relative",
        fontFamily: "'Times New Roman', Times, serif",
        color: LETTERHEAD.primaryColor,
        boxSizing: "border-box",
      }}
    >
      {/* ─── Proposal hero background ─── */}
      {isProposal && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "55%",
            background: `linear-gradient(135deg, #1F1C18 0%, #3A3530 100%)`,
            zIndex: 1,
          }}
        />
      )}

      {/* Left accent strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "38px",
          height: "100%",
          backgroundColor: p.strip,
          zIndex: 2,
        }}
      />
      {/* Dark diagonal accent on the strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: "200px",
          width: "38px",
          height: "140px",
          backgroundColor: p.accentDark,
          clipPath: "polygon(0 0, 100% 30%, 100% 100%, 0 70%)",
          zIndex: 3,
        }}
      />

      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "38px",
          right: 0,
          height: "8px",
          backgroundColor: p.accent,
          zIndex: 2,
        }}
      />

      {/* Bottom band */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "58px",
          backgroundColor: p.bottomBand,
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 4,
          display: "flex",
          flexDirection: "column",
          height: "100%",
          paddingLeft: "88px",
          paddingRight: "68px",
          paddingTop: "80px",
          paddingBottom: "80px",
        }}
      >
        {/* Top row: Logo + Company Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            marginBottom: "16px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={COMPANY.logo}
            alt={COMPANY.name}
            width={110}
            height={110}
            style={{
              display: "block",
              width: "110px",
              height: "110px",
              objectFit: "contain",
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: TYPOGRAPHY.heading.fontFamily,
                fontSize: "38px",
                fontWeight: 700,
                color: p.accent,
                letterSpacing: "0.14em",
                lineHeight: 1.15,
              }}
            >
              {blankMode ? "" : COMPANY.name}
            </div>
            <div
              style={{
                fontSize: "11.5px",
                color: isProposal ? "#D8D8D8" : "#777",
                marginTop: "6px",
                letterSpacing: "0.03em",
              }}
            >
              {blankMode ? "" : COMPANY.legalName}
            </div>
          </div>
        </div>

        {/* Registration info row */}
        {!blankMode && (
          <div
            style={{
              fontSize: "11px",
              color: isProposal ? "#C0C0C0" : "#666",
              letterSpacing: "0.04em",
              marginBottom: "12px",
              paddingLeft: "2px",
            }}
          >
            Business Reg. No. {COMPANY.registrationNo} &nbsp;|&nbsp; TIN:{" "}
            {COMPANY.tinNo}
          </div>
        )}

        {/* Address line */}
        {!blankMode && (
          <div
            style={{
              fontSize: "11px",
              color: isProposal ? "#AFAFAF" : "#888",
              letterSpacing: "0.02em",
              marginBottom: "32px",
              paddingLeft: "2px",
            }}
          >
            {COMPANY.fullAddress}
          </div>
        )}

        {/* Accent divider */}
        <div
          style={{
            width: "180px",
            height: "4px",
            backgroundColor: p.accent,
            marginBottom: "48px",
          }}
        />

        {/* Document title */}
        {!blankMode && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.heading.fontFamily,
              fontSize: "36px",
              fontWeight: 700,
              color: p.heading,
              lineHeight: 1.3,
              marginBottom: "16px",
              maxWidth: "580px",
            }}
          >
            {meta.title || "Untitled Document"}
          </div>
        )}

        {/* Subtitle */}
        {!blankMode && meta.subtitle && (
          <div
            style={{
              fontFamily: TYPOGRAPHY.heading.fontFamily,
              fontSize: "20px",
              fontWeight: 400,
              color: isProposal ? "#CCC" : "#555",
              lineHeight: 1.5,
              marginBottom: "16px",
              maxWidth: "540px",
            }}
          >
            {meta.subtitle}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minHeight: "60px" }} />

        {/* Metadata block */}
        {!blankMode && (
          <div
            style={{
              borderTop: `3px solid ${p.accent}`,
              paddingTop: "22px",
              fontSize: "13px",
              lineHeight: 2.1,
              color: "#444",
            }}
          >
            {meta.reference && (
              <div>
                <span style={{ fontWeight: 700, color: p.metaLabel }}>
                  Reference:
                </span>{" "}
                {meta.reference}
              </div>
            )}
            {meta.author && (
              <div>
                <span style={{ fontWeight: 700, color: p.metaLabel }}>
                  Prepared by:
                </span>{" "}
                {meta.author}
              </div>
            )}
            {meta.date && (
              <div>
                <span style={{ fontWeight: 700, color: p.metaLabel }}>
                  Date:
                </span>{" "}
                {meta.date}
              </div>
            )}
            {meta.version && (
              <div>
                <span style={{ fontWeight: 700, color: p.metaLabel }}>
                  Version:
                </span>{" "}
                {meta.version}
              </div>
            )}
            {meta.confidential && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "8px 16px",
                  border: `2px solid ${p.badgeBorder}`,
                  display: "inline-block",
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: p.badgeText,
                }}
              >
                CONFIDENTIAL
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom band text */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "58px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: "52px",
          paddingRight: "44px",
          paddingBottom: "16px",
          zIndex: 5,
        }}
      >
        <span
          style={{
            color: p.bottomText,
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {blankMode ? "" : COMPANY.name}
        </span>
        <span
          style={{
            color: p.bottomText,
            fontSize: "9.5px",
            opacity: 0.9,
          }}
        >
          {blankMode ? "" : `${COMPANY.email} \u00a0|\u00a0 ${COMPANY.website}`}
        </span>
      </div>
    </div>
  );
}
