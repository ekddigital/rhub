"use client";

/**
 * Shared letter preview chrome for Letter Composer — keeps footer / attachment
 * layout aligned with `/api/conf/[confId]/letterhead` and avoids duplicating large
 * JSX blocks inside `letter-composer-shell.tsx`.
 */

import { CONF_2026 } from "@/lib/conf/config";
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

/** Fundraising letters append the approved fundraising flyer image. */
export function LetterPromotionalFlyerAttachmentPage({
  confId,
  pageNum,
  totalPages,
  forPrint,
  officeLabel,
  topBannerTagline,
}: {
  /** Reserved for per-conference flyer assets (API routes keyed by conference). */
  confId: string;
  pageNum: number;
  totalPages: number;
  forPrint?: boolean;
  /** Right-rail “Office of…” line; matches main letter sheets. */
  officeLabel?: string;
  /** Navy bar line under page numbers (defaults to conference sub-theme). */
  topBannerTagline?: string;
}) {
  void confId;
  const flyerSrc = "/conf/fundraising.png";
  const resolvedOffice =
    (officeLabel ?? "").trim() || LETTERHEAD_CONFIG.defaultOfficeLabel;
  const bannerLine =
    (topBannerTagline ?? "").trim() || CONF_2026.subTheme;

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
      {/* Top banner — conference tagline + pagination (matches prior flyer sheet) */}
      <div
        style={{
          flexShrink: 0,
          background: LP.navy,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 14px",
            gap: 8,
          }}
        >
          <div style={{ width: 44, flexShrink: 0 }} />
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 7.5,
              fontWeight: 700,
              color: LP.gold,
              letterSpacing: "0.35px",
              textAlign: "center",
              lineHeight: 1.35,
            }}
          >
            {bannerLine}
          </div>
          <div
            style={{
              fontSize: 8,
              color: LP.gold,
              opacity: 0.9,
              fontVariantNumeric: "tabular-nums",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            Page {pageNum} of {totalPages}
          </div>
        </div>
      </div>

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
          padding: "10px 22px",
          borderBottom: `2px solid ${LP.gold}`,
          background: LP.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: LP.navy,
            letterSpacing: "0.02em",
            lineHeight: 1.25,
          }}
        >
          {LETTERHEAD_CONFIG.organizationName}
        </div>
        <div
          style={{
            fontSize: 9,
            color: LP.muted,
            fontStyle: "italic",
            textAlign: "right",
          }}
        >
          {resolvedOffice}
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          margin: "8px 28px 0",
          padding: "10px 12px",
          border: `1.5px solid ${LP.navy}`,
          borderRadius: 4,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: LP.navy,
            letterSpacing: "0.05em",
            marginBottom: 8,
          }}
        >
          PAYMENT INSTRUCTIONS (SEE FLYER BELOW)
        </div>
        <div
          style={{
            fontSize: 9.75,
            color: "#1a1a1a",
            lineHeight: 1.55,
          }}
        >
          Detailed{" "}
          <span style={{ fontWeight: 700 }}>payment methods</span> are shown on{" "}
          <span style={{ fontWeight: 700 }}>the flyer directly below</span>.
          Please pay only through those channels —{" "}
          <span style={{ fontWeight: 700 }}>
            Mobile Money, UBA (bank), WeChat Pay, or Alipay
          </span>{" "}
          — using the QR codes and account titles on that flyer.
        </div>
      </div>

      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          padding: "8px 28px 4px",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: LP.navy,
          }}
        >
          Fundraising flyer — payment methods
        </div>
        <div
          style={{
            fontSize: 9,
            color: LP.muted,
            fontStyle: "italic",
            textAlign: "right",
          }}
        >
          {resolvedOffice}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          padding: "2px 28px 0",
          background: "#fafbfd",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flyerSrc}
            alt="Fundraising flyer — campaign and payment methods"
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
        <div
          style={{
            flexShrink: 0,
            fontSize: 8.25,
            color: "#444",
            textAlign: "center",
            lineHeight: 1.45,
            padding: "10px 4px 4px",
          }}
        >
          Scannable payment details: Mobile Money, UBA, WeChat Pay, and Alipay
          (see the flyer in this section).
        </div>
        {/* soak remaining page height below caption so the flyer stays flush under the copy */}
        <div style={{ flex: 1, minHeight: 0 }} aria-hidden />
      </div>

      <LetterPreviewFooter pageNum={pageNum} totalPages={totalPages} />
    </div>
  );
}
