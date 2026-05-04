"use client";

import {
  LETTERHEAD_CONFIG,
  LETTER_COMPOSER_HEADER_PRIMARY_LINE,
  LETTER_COMPOSER_HEADER_UNION_LINE,
  letterComposerConferenceSubtitle,
  buildCityRegionLine,
  buildLetterheadEmailLine,
  buildLetterheadWebsiteLine,
} from "@/lib/conf/letterhead-config";
import {
  LP,
  LP_FLAG_STRIPES_11,
  letterPreviewPageChrome,
  LetterPreviewFooter,
  LetterPromotionalFlyerAttachmentPage,
} from "./letter-composer-preview-chrome";
import { letterPreviewPalette } from "./letter-composer-preview-palette";
import {
  fmtLetterDateRange,
  formatChinaPhone,
  letterComposerMemberLabel,
} from "./letter-composer-member-format";
import {
  normalizeMarkdownToReadableText,
  richHtmlToBodyBlocks,
} from "./letter-composer-html-blocks";
import type { LetterBodyBlock } from "./letter-composer-blocks";
import type {
  LetterDraft,
  LetterComposerMember,
  LetterComposerConfInfo,
} from "./letter-composer-types";
import {
  paginateBodyBlocks,
  type PageMetrics,
} from "./letter-composer-pagination";
import { renderLetterBodyBlocks } from "./letter-composer-body-blocks";

type Signatory = {
  name: string;
  title: string;
  label: string;
  sig: string;
  sigScale: number;
};
export function LetterA4Preview({
  draft,
  members,
  confInfo,
  confId,
  forPrint = false,
}: {
  draft: LetterDraft;
  members: LetterComposerMember[];
  confInfo: LetterComposerConfInfo | null;
  /** Required for fundraising promotional flyer attachment page */
  confId: string;
  forPrint?: boolean;
}) {
  const C = letterPreviewPalette();
  const PAGE_W = LP.PAGE_W;
  const PAGE_H = LP.PAGE_H;
  const STRIPE_H = 14;
  /** Logo + masthead copy (+ seal). Keep in sync with gold/office bars below. */
  const MAIN_HEADER_H = 190;
  const GOLD_BAR = 2.5;
  const OFFICE_ROW = 26;
  const NAVY_BAR = 7;
  const RED_BAR = 3;
  const TOTAL_HEADER =
    STRIPE_H + MAIN_HEADER_H + GOLD_BAR + OFFICE_ROW + NAVY_BAR + RED_BAR;
  const FOOTER_H = LP.FOOTER_H;
  const SIDEBAR_W = 215; // navy-accent(8) + red-accent(3) + content(204)
  const BODY_H = PAGE_H - TOTAL_HEADER - FOOTER_H;
  /** Main letter column vertical padding (`paddingTop` + `paddingBottom` on primary body pane) */
  const FIRST_MAIN_VERTICAL_PADDING = 24 + 24;
  /** Continuation sheet: stripes + condensed title strip — keep JSX heights in sync for true A4 pages */
  const CONTINUATION_STRIPES_H = 8;
  const CONTINUATION_TITLEBAR_BODY_H = 62; // padded bar + gold border-bottom
  const CONTINUATION_LETTERHEAD_H =
    CONTINUATION_STRIPES_H + CONTINUATION_TITLEBAR_BODY_H;
  const continuationMiddlePx = PAGE_H - CONTINUATION_LETTERHEAD_H - FOOTER_H;
  const CONTINUATION_TEXT_PADDING_TOP = 20;
  const CONTINUATION_TEXT_PADDING_RIGHT = 96;
  const CONTINUATION_TEXT_PADDING_BOTTOM = 28;
  const CONTINUATION_TEXT_PADDING_LEFT = 96;

  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
  const sortedMembers = [
    ...KEY_ORDER.map((r) => members.find((m) => m.role === r)).filter(Boolean),
    ...members.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as LetterComposerMember[];

  // Officers whose phones go in the header
  const chair = members.find((m) => m.role === "CHAIR");
  const viceChair = members.find((m) => m.role === "VICE_CHAIR");
  const secretary = members.find((m) => m.role === "SECRETARY");
  const officerPhones = [
    chair && chair.phone
      ? { label: "Chair", phone: formatChinaPhone(chair.phone) }
      : null,
    viceChair && viceChair.phone
      ? { label: "Co-Chair", phone: formatChinaPhone(viceChair.phone) }
      : null,
    secretary && secretary.phone
      ? { label: "Secretary", phone: formatChinaPhone(secretary.phone) }
      : null,
  ].filter(Boolean) as { label: string; phone: string }[];

  const officeLabel =
    (draft.officeLabel ?? "").trim() || LETTERHEAD_CONFIG.defaultOfficeLabel;

  const dateRange = confInfo
    ? fmtLetterDateRange(confInfo.startsAt, confInfo.endsAt)
    : "July 24 – 27, 2026";

  const signatories: Signatory[] = [
    {
      name: draft.signatory1Name ?? "",
      title: draft.signatory1Title ?? "",
      label: draft.signatory1Label ?? "Signed",
      sig: draft.signatory1Sig ?? "",
      sigScale: draft.signatory1SigScale ?? 1,
    },
    {
      name: draft.signatory2Name ?? "",
      title: draft.signatory2Title ?? "",
      label: draft.signatory2Label ?? "Approved",
      sig: draft.signatory2Sig ?? "",
      sigScale: draft.signatory2SigScale ?? 1,
    },
    {
      name: draft.signatory3Name ?? "",
      title: draft.signatory3Title ?? "",
      label: draft.signatory3Label ?? "Attested",
      sig: draft.signatory3Sig ?? "",
      sigScale: draft.signatory3SigScale ?? 1,
    },
  ].filter((s) => s.name.trim() || s.title.trim());

  // Geometry for pagination capacity (reserve must use these first)
  const firstPageMetrics: PageMetrics = {
    name: "first-page",
    contentWidth: PAGE_W - SIDEBAR_W,
    contentHeight: Math.max(120, BODY_H - FIRST_MAIN_VERTICAL_PADDING),
    paddingLeft: 24,
    paddingRight: 32,
    fontSize: 12,
    lineHeight: 1.8,
  };

  const continuationPageMetrics: PageMetrics = {
    name: "continuation-page",
    contentWidth: PAGE_W,
    contentHeight: Math.max(
      120,
      continuationMiddlePx -
        CONTINUATION_TEXT_PADDING_TOP -
        CONTINUATION_TEXT_PADDING_BOTTOM,
    ),
    paddingLeft: CONTINUATION_TEXT_PADDING_LEFT,
    paddingRight: CONTINUATION_TEXT_PADDING_RIGHT,
    fontSize: 12,
    lineHeight: 1.8,
  };

  /** Trailing slab: signatures + payment note + embedded flyer (same page as body tail) */
  const signaturesBlockLines = signatories.length > 0 ? 11 : 0;
  // Flyer and payment note now go on a dedicated attachment page — only reserve
  // space for the signature block itself on the final body content page.
  const signatureReserveLines = signaturesBlockLines;

  // Paginate structured body blocks using page-aware metrics
  const bodyBlocks = richHtmlToBodyBlocks(draft.bodyRich ?? "");
  const fallbackBody = normalizeMarkdownToReadableText(draft.body || "");
  const normalizedBlocks =
    bodyBlocks.length > 0
      ? bodyBlocks
      : fallbackBody
        ? fallbackBody
            .split("\n\n")
            .filter(Boolean)
            .map((text) => ({ type: "paragraph", text }) as LetterBodyBlock)
        : [];

  const newlineRows = (s: string) => (s.trim() ? s.split("\n").length : 0);
  // Chrome overhead: date row (~1.2 lines) + divider with margins (~1.2 lines) + spacing (~0.6 lines)
  // = ~3 base lines, then 1 line per wrapped row of To/From, ~2 for Re (includes marginTop).
  // Previous formula used *2 multiplier on to/from which over-reserved by ~9 lines on a standard
  // single-line letter, artificially dropping page-1 body capacity from ~30 lines to ~22.
  const firstPageLeadReserveLines =
    3 +
    Math.max(1, newlineRows(draft.to)) +
    Math.max(1, newlineRows(draft.from)) +
    (draft.re.trim() ? 2 : 0);

  const blockPages = paginateBodyBlocks(
    normalizedBlocks,
    firstPageMetrics,
    continuationPageMetrics,
    signatureReserveLines,
    firstPageLeadReserveLines,
  );
  const firstPageBlocks = blockPages[0] ?? [];
  const continuationBodies = blockPages.slice(1);
  const showSignaturesOnFirstPage = continuationBodies.length === 0;
  const bodySheetCount = 1 + continuationBodies.length;
  const includePromotionalFlyer =
    Boolean(confId.trim()) &&
    (draft.fundraisingEnabled || draft.type === "FUNDRAISING");
  const totalPages = bodySheetCount + (includePromotionalFlyer ? 1 : 0);

  const lineVenueOrCity =
    (confInfo?.venue ?? "").trim() ||
    (confInfo?.city ?? "").trim() ||
    LETTERHEAD_CONFIG.defaultCity;

  return (
    <>
      <div
        className="letter-page"
        style={{
          ...letterPreviewPageChrome(forPrint),
          background: C.white,
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
        }}
      >
        {/* ── Liberian flag stripes ── */}
        <div style={{ display: "flex", height: STRIPE_H, flexShrink: 0 }}>
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

        {/* ── Header row: logo | text | seal ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: MAIN_HEADER_H,
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
                (el.parentElement as HTMLElement).innerHTML =
                  '<span style="font-size:10px;font-weight:800;color:#002868;">LSUIC</span>';
              }}
            />
          </div>

          {/* Center text block */}
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div
              style={{
                fontSize: 14.5,
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "0.3px",
                lineHeight: 1.2,
              }}
            >
              {LETTER_COMPOSER_HEADER_PRIMARY_LINE}
            </div>
            <div style={{ fontSize: 8.5, color: "#555", marginTop: 4 }}>
              {LETTER_COMPOSER_HEADER_UNION_LINE}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.gold,
                marginTop: 4,
              }}
            >
              {letterComposerConferenceSubtitle(
                confInfo?.name ?? LETTERHEAD_CONFIG.defaultConferenceName,
              )}
            </div>
            <div style={{ fontSize: 8.5, color: "#555", marginTop: 2 }}>
              {lineVenueOrCity}
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>
              {buildCityRegionLine(confInfo?.city)}
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>{dateRange}</div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
              {buildLetterheadEmailLine()}
            </div>
            <div style={{ fontSize: 7.5, color: C.muted, marginTop: 2 }}>
              {buildLetterheadWebsiteLine()}
            </div>
            {officerPhones.length > 0 && (
              <div
                style={{
                  fontSize: 7.5,
                  color: C.navy,
                  fontWeight: 600,
                  marginTop: 4,
                  lineHeight: 1.35,
                }}
              >
                {officerPhones.map((o) => `${o.label}: ${o.phone}`).join(" · ")}
              </div>
            )}
          </div>

          {/* Liberia seal — matches PNG letterhead */}
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
              src="/conf/liberia-seal.svg"
              alt=""
              style={{ width: 100, height: 100, objectFit: "contain" }}
            />
          </div>
        </div>

        <div
          style={{ height: GOLD_BAR, background: C.gold, flexShrink: 0 }}
        />
        <div
          style={{
            height: OFFICE_ROW,
            flexShrink: 0,
            background: C.white,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 22,
            paddingLeft: 18,
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

        <div style={{ height: NAVY_BAR, background: C.navy, flexShrink: 0 }} />
        <div style={{ height: RED_BAR, background: C.red, flexShrink: 0 }} />

        {/* ── Body area: sidebar + content ── */}
        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            width: "100%",
            flexShrink: 0,
            height: BODY_H,
            maxHeight: BODY_H,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          {/* Left sidebar — white bg, navy+red left accent, center-aligned (matches reference letter) */}
          <div
            style={{
              width: SIDEBAR_W,
              height: BODY_H,
              maxHeight: BODY_H,
              background: C.white,
              flexShrink: 0,
              overflow: "hidden",
              display: "flex",
              borderRight: `1px solid #dde3ef`,
            }}
          >
            {/* Vertical accent strips */}
            <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>
              <div style={{ width: 8, background: C.navy }} />
              <div style={{ width: 3, background: C.red }} />
            </div>

            {/* Member list column — header fixed, roster scrolls so long NEC lists obey A4 body height */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                padding: "12px 8px 12px 9px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 7.5,
                    fontWeight: 800,
                    color: C.navy,
                    letterSpacing: "0.8px",
                    textTransform: "uppercase" as const,
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
              </div>
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                {sortedMembers.map((m) => (
                  <div
                    key={m.id}
                    style={{ marginBottom: 6, textAlign: "center" }}
                  >
                    {/* Name: bold italic navy, largest */}
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.navy,
                        fontStyle: "italic",
                        lineHeight: 1.25,
                        wordBreak: "break-word" as const,
                      }}
                    >
                      {m.name}
                    </div>
                    {/* Role: italic navy, slightly smaller */}
                    <div
                      style={{
                        fontSize: 9.5,
                        color: C.navy,
                        fontStyle: "italic",
                        lineHeight: 1.3,
                        opacity: 0.8,
                      }}
                    >
                      {letterComposerMemberLabel(m)}
                    </div>
                    {/* City */}
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
                    {/* Phone: bold italic, prominent — matches reference */}
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
                        {formatChinaPhone(m.phone)}
                      </div>
                    )}
                    {/* Thin divider */}
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
          </div>

          {/* Main letter content */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              height: BODY_H,
              maxHeight: BODY_H,
              padding: "24px 32px 24px",
              overflow: "hidden",
            }}
          >
            {/* Date (right-aligned) */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 14,
              }}
            >
              <span
                style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}
              >
                {draft.date ||
                  new Date().toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </span>
            </div>

            {/* To / From / Re */}
            <div
              style={{
                fontSize: 12,
                color: "#222",
                lineHeight: 1.8,
                marginBottom: 6,
              }}
            >
              {draft.to && (
                <div>
                  <strong style={{ color: C.navy }}>To:</strong>{" "}
                  <span style={{ whiteSpace: "pre-line" }}>{draft.to}</span>
                </div>
              )}
              {draft.from && (
                <div>
                  <strong style={{ color: C.navy }}>From:</strong>{" "}
                  <span style={{ whiteSpace: "pre-line" }}>{draft.from}</span>
                </div>
              )}
              {draft.re && (
                <div style={{ marginTop: 4 }}>
                  <strong style={{ color: C.navy }}>Re:</strong>{" "}
                  <strong>{draft.re}</strong>
                </div>
              )}
            </div>

            {/* Gold divider */}
            <div
              style={{ height: 1.5, background: C.gold, margin: "12px 0" }}
            />

            {/* Body text */}
            <div>
              {firstPageBlocks.length > 0 ? (
                renderLetterBodyBlocks(firstPageBlocks, "first-page")
              ) : (
                <span style={{ color: "#bbb", fontStyle: "italic" }}>
                  Your letter content will appear here as you type…
                </span>
              )}
            </div>

            {showSignaturesOnFirstPage && signatories.length > 0 && (
              <div
                style={{
                  marginTop: 28,
                  paddingTop: 14,
                  borderTop: `1px solid ${C.gold}`,
                  display: "grid",
                  gridTemplateColumns:
                    signatories.length === 1
                      ? "1fr"
                      : signatories.length === 2
                        ? "repeat(2, 1fr)"
                        : "repeat(3, 1fr)",
                  gap: 16,
                }}
              >
                {signatories.map((sig, idx) => (
                  <div
                    key={`${sig.name}-${idx}`}
                    style={{ minHeight: 80, textAlign: "center" }}
                  >
                    {(sig.name || sig.title) && (
                      <>
                        {/* Signature image */}
                        {sig.sig && (
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              marginBottom: 2,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={sig.sig}
                              alt="signature"
                              style={{
                                height: Math.round(36 * sig.sigScale),
                                maxWidth: "100%",
                                objectFit: "contain",
                              }}
                            />
                          </div>
                        )}
                        {/* Signature line */}
                        <div
                          style={{
                            borderTop: "1px solid #222",
                            width: "100%",
                            marginBottom: 4,
                          }}
                        />
                        {/* Signature label — below the line */}
                        {sig.label && (
                          <div
                            style={{
                              fontSize: 9,
                              color: C.muted,
                              marginBottom: 4,
                              fontStyle: "italic",
                            }}
                          >
                            {sig.label}
                          </div>
                        )}
                        {sig.name && (
                          <div
                            style={{
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: "#222",
                            }}
                          >
                            {sig.name}
                          </div>
                        )}
                        {sig.title && (
                          <div style={{ fontSize: 10.5, color: C.muted }}>
                            {sig.title}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <LetterPreviewFooter pageNum={1} totalPages={totalPages} />
      </div>

      {continuationBodies.map((segmentBlocks, idx) => {
        const isLast = idx === continuationBodies.length - 1;
        return (
          <div
            key={`cont-${idx}`}
            className="letter-page continuation-page"
            style={{
              ...letterPreviewPageChrome(forPrint),
              background: C.white,
              display: "flex",
              flexDirection: "column",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              marginTop: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                height: CONTINUATION_STRIPES_H,
                flexShrink: 0,
              }}
            >
              {LP_FLAG_STRIPES_11.map((color, i) => (
                <div key={i} style={{ flex: 1, background: color }} />
              ))}
            </div>
            <div
              style={{
                flexShrink: 0,
                height: CONTINUATION_TITLEBAR_BODY_H,
                boxSizing: "border-box",
                padding: "10px 22px",
                borderBottom: `2px solid ${C.gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 10, color: C.navy, fontWeight: 700 }}>
                {LETTER_COMPOSER_HEADER_PRIMARY_LINE}
              </div>
              <div style={{ fontSize: 9, color: C.muted, fontStyle: "italic" }}>
                {officeLabel}
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                height: continuationMiddlePx,
                maxHeight: continuationMiddlePx,
                overflow: "hidden",
                padding: `${CONTINUATION_TEXT_PADDING_TOP}px ${CONTINUATION_TEXT_PADDING_RIGHT}px ${CONTINUATION_TEXT_PADDING_BOTTOM}px ${CONTINUATION_TEXT_PADDING_LEFT}px`,
              }}
            >
              <div>
                {renderLetterBodyBlocks(segmentBlocks, `continuation-${idx}`)}
              </div>

              {isLast && signatories.length > 0 && (
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 14,
                    borderTop: `1px solid ${C.gold}`,
                    display: "grid",
                    gridTemplateColumns:
                      signatories.length === 1
                        ? "1fr"
                        : signatories.length === 2
                          ? "repeat(2, 1fr)"
                          : "repeat(3, 1fr)",
                    gap: 16,
                  }}
                >
                  {signatories.map((sig, sigIdx) => (
                    <div
                      key={`${sig.name}-${sigIdx}`}
                      style={{ minHeight: 80, textAlign: "center" }}
                    >
                      {(sig.name || sig.title) && (
                        <>
                          {sig.label && (
                            <div
                              style={{
                                fontSize: 9,
                                color: C.muted,
                                marginBottom: 4,
                                fontStyle: "italic",
                              }}
                            >
                              {sig.label}
                            </div>
                          )}
                          {sig.sig && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                                marginBottom: 2,
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sig.sig}
                                alt="signature"
                                style={{
                                  height: Math.round(36 * sig.sigScale),
                                  maxWidth: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                          )}
                          <div
                            style={{
                              borderTop: "1px solid #222",
                              width: "100%",
                              marginBottom: 6,
                            }}
                          />
                          {sig.name && (
                            <div
                              style={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: "#222",
                              }}
                            >
                              {sig.name}
                            </div>
                          )}
                          {sig.title && (
                            <div style={{ fontSize: 10.5, color: C.muted }}>
                              {sig.title}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <LetterPreviewFooter
              pageNum={idx + 2}
              totalPages={totalPages}
            />
          </div>
        );
      })}

      {includePromotionalFlyer && (
        <LetterPromotionalFlyerAttachmentPage
          confId={confId}
          pageNum={bodySheetCount + 1}
          totalPages={totalPages}
          forPrint={forPrint}
        />
      )}
    </>
  );
}
