import { type ReactNode } from "react";
import { C } from "./constants";
import { roleLabel } from "./utils";
import { BOOKLET_BODY } from "@/lib/conf/booklet-body-typography";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, NecMember } from "./types";

export type AddressSpeaker = Pick<
  NecMember,
  "id" | "name" | "role" | "title" | "city" | "photoPath" | "committeeScope"
>;

// ---------------------------------------------------------------------------
// Address content parser — extracts styled header lines from body text.
// Detects up to 3 short leading paragraphs as: title / subtitle / tagline.
// ---------------------------------------------------------------------------

type ParsedAddressContent = {
  titleLine: string | null;
  subtitleLine: string | null;
  tagLine: string | null;
  bodyParagraphs: string[];
};

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function isHeaderCandidate(line: string): boolean {
  if (line.length > 90) return false;
  // Ends with period → likely body prose
  if (/\.\s*$/.test(line) && line.split(". ").length > 2) return false;
  return true;
}

// Lines at the END of address body text that belong in the signature block,
// not in the prose — strip them so they don't repeat when showSignature renders.
const SIGN_OFF_PATTERNS: RegExp[] = [
  /^fiscal year\s+\d{4}/i,
  /^july\s+\d/i,
  /^jinan,?\s+shandong/i,
  /^people's republic of china$/i,
  /^liberian student union in china$/i,
  /^national president$/i,
  // A standalone short name line at the very end (≤ 40 chars, no period)
];

function isSignOffParagraph(text: string): boolean {
  const t = text.trim();
  if (SIGN_OFF_PATTERNS.some((re) => re.test(t))) return true;
  // Short standalone line (≤ 40 chars, no sentence terminator) at tail
  if (t.length <= 40 && !/[.!?]$/.test(t) && !/\s/.test(t.slice(-1))) return true;
  return false;
}

function stripTrailingSignOff(paragraphs: string[]): string[] {
  const result = [...paragraphs];
  // Walk backwards and drop sign-off lines until we hit real prose
  while (result.length > 0 && isSignOffParagraph(result[result.length - 1])) {
    result.pop();
  }
  return result;
}

function parseAddressContent(content: string): ParsedAddressContent {
  const paragraphs = splitParagraphs(content);
  let start = 0;

  let titleLine: string | null = null;
  let subtitleLine: string | null = null;
  let tagLine: string | null = null;

  // Title: all-caps, or contains "ADDRESS" / short identifier line
  const p0 = paragraphs[0] ?? "";
  if (
    isHeaderCandidate(p0) &&
    (p0 === p0.toUpperCase() ||
      p0.toUpperCase().includes("ADDRESS") ||
      p0.toUpperCase().includes("MESSAGE"))
  ) {
    titleLine = p0;
    start = 1;
  }

  // Subtitle: "A Message from …" or "From …"
  const p1 = paragraphs[start] ?? "";
  if (
    start === 1 &&
    isHeaderCandidate(p1) &&
    (p1.startsWith("A Message") || p1.startsWith("From "))
  ) {
    subtitleLine = p1;
    start = 2;
  }

  // Tagline: short, no trailing period, title-case decorative line
  const p2 = paragraphs[start] ?? "";
  if (
    start === 2 &&
    isHeaderCandidate(p2) &&
    p2.length <= 80 &&
    !p2.endsWith(".")
  ) {
    tagLine = p2;
    start = 3;
  }

  return {
    titleLine,
    subtitleLine,
    tagLine,
    bodyParagraphs: stripTrailingSignOff(paragraphs.slice(start)),
  };
}

// ---------------------------------------------------------------------------
// Paragraph renderer — bold lead-in sentences for "We …" / "To our/my …"
// ---------------------------------------------------------------------------

function renderAddressParagraph(text: string, fontSize: number): ReactNode {
  // Bold "We [verb] …" lead sentence
  const weMatch = text.match(/^(We [^.]+\.) ([\s\S]+)$/);
  if (weMatch) {
    return (
      <span>
        <strong style={{ fontWeight: 700, color: "#000000" }}>
          {weMatch[1]}
        </strong>{" "}
        {weMatch[2]}
      </span>
    );
  }

  // Bold "And we did all of this …" lead sentence
  const andWeMatch = text.match(/^(And we [^.]+\.) ([\s\S]+)$/);
  if (andWeMatch) {
    return (
      <span>
        <strong style={{ fontWeight: 700, color: "#000000" }}>
          {andWeMatch[1]}
        </strong>{" "}
        {andWeMatch[2]}
      </span>
    );
  }

  // Bold "To our/my [group]:" salutation
  const toMatch = text.match(/^(To (?:our|my) [^:]+:)([\s\S]+)$/);
  if (toMatch) {
    return (
      <span>
        <strong style={{ fontWeight: 700, color: "#000000" }}>
          {toMatch[1]}
        </strong>
        {toMatch[2]}
      </span>
    );
  }

  // Bold "How far have we come?" lead-in
  const howMatch = text.match(/^(How far have we come\?) ([\s\S]+)$/);
  if (howMatch) {
    return (
      <span>
        <strong style={{ fontWeight: 700, color: "#000000" }}>
          {howMatch[1]}
        </strong>{" "}
        {howMatch[2]}
      </span>
    );
  }

  // Bold "As we look to the future," opener
  const asWeMatch = text.match(/^(As we look to the future,)([\s\S]+)$/);
  if (asWeMatch) {
    return (
      <span>
        <strong style={{ fontWeight: 700, color: "#000000" }}>
          {asWeMatch[1]}
        </strong>
        {asWeMatch[2]}
      </span>
    );
  }

  return text;
}

/**
 * Shared booklet address template.
 * Automatically parses TITLE / SUBTITLE / TAGLINE header lines from the body
 * text and renders them with proper typographic hierarchy before the prose.
 */
export function AddressSection({
  section,
  speaker,
  content,
  showSpeaker = true,
  showQuote = true,
  showSignature = true,
  contentFontSize,
  confName,
  confYear,
  pageNum,
  totalPages,
  sectionLabel,
}: {
  section: BookletSection;
  speaker: AddressSpeaker | null;
  content: string | null | undefined;
  showSpeaker?: boolean;
  showQuote?: boolean;
  showSignature?: boolean;
  contentFontSize?: number;
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
  sectionLabel?: string;
}) {
  const label = sectionLabel ?? section.title;
  const trimmed = (content ?? "").trim();
  const bodyFontSize = contentFontSize ?? Math.max(BOOKLET_BODY.fontSize, 15.5);

  const { titleLine, subtitleLine, tagLine, bodyParagraphs } =
    parseAddressContent(trimmed);

  // Only show parsed headers on the first page of this section (showSpeaker === true)
  const isFirstPage = showSpeaker;

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={label}
      confName={confName}
      confYear={confYear}
    >
      {/* ── Section badge + rule ──────────────────────────────────────── */}
      <div style={{ marginBottom: "18px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "4px",
            background: C.red,
            color: C.white,
            fontSize: "9.5px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          {label}
        </div>
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${C.blue}, ${C.red}, transparent)`,
          }}
        />
      </div>

      {/* ── Speaker profile card ──────────────────────────────────────── */}
      {speaker && showSpeaker && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: `linear-gradient(90deg, ${C.blue}12, ${C.lightBlue})`,
            border: `1px solid ${C.blue}22`,
            marginBottom: "14px",
          }}
        >
          <Avatar src={speaker.photoPath} name={speaker.name} size={50} />
          <div>
            <div
              style={{ fontSize: "15px", fontWeight: 700, color: "#000000" }}
            >
              {speaker.name}
            </div>
            <div
              style={{ fontSize: "11.5px", color: "#222222", marginTop: "2px" }}
            >
              {roleLabel(speaker as NecMember)}
              {speaker.city ? ` · ${speaker.city}` : ""}
            </div>
          </div>
        </div>
      )}

      {/* ── Hero photo (president address, first page only) ───────────── */}
      {section.type === "PRESIDENT_ADDRESS" && showSpeaker && (
        <div style={{ marginBottom: "12px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/conf/national-pres-vice-pres.jpg"
            alt="National President and Vice President"
            style={{
              width: "100%",
              height: "240px",
              objectFit: "contain",
              objectPosition: "center",
              background: "#f4f6fb",
              borderRadius: "8px",
              border: `1px solid ${C.border}`,
              display: "block",
            }}
          />
        </div>
      )}

      {/* ── Parsed address headers (first page only) ─────────────────── */}
      {isFirstPage && titleLine && (
        <div
          style={{
            textAlign: "center",
            marginBottom: "4px",
            marginTop: "4px",
          }}
        >
          <div
            style={{
              fontSize: "17px",
              fontWeight: 900,
              color: "#000000",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {titleLine}
          </div>

          {subtitleLine && (
            <div
              style={{
                fontSize: "13.5px",
                fontWeight: 700,
                color: "#000000",
                marginTop: "6px",
              }}
            >
              {subtitleLine}
            </div>
          )}

          {tagLine && (
            <div
              style={{
                fontSize: "12.5px",
                fontStyle: "italic",
                color: "#111111",
                marginTop: "4px",
                marginBottom: "2px",
              }}
            >
              {tagLine}
            </div>
          )}

          <div
            style={{
              height: "1.5px",
              background: `linear-gradient(90deg, transparent, ${C.blue}, ${C.red}, transparent)`,
              margin: "10px auto 0",
              maxWidth: "320px",
            }}
          />
        </div>
      )}

      {/* ── Decorative quote mark (continuation pages) ───────────────── */}
      {!isFirstPage && showQuote && (
        <div
          style={{
            fontSize: "52px",
            lineHeight: 0.8,
            color: `${C.red}14`,
            fontFamily: "Georgia, serif",
            marginBottom: "8px",
            userSelect: "none",
          }}
        >
          &ldquo;
        </div>
      )}

      {/* ── Body prose ───────────────────────────────────────────────── */}
      {trimmed ? (
        <div
          style={{
            fontSize: `${bodyFontSize}px`,
            lineHeight: 1.72,
            color: "#000000",
            marginTop: isFirstPage && titleLine ? "10px" : "0",
          }}
        >
          {bodyParagraphs.map((paragraph, i) => (
            <p
              key={i}
              style={{
                marginBottom: "7px",
                textAlign: "justify",
                color: "#000000",
              }}
            >
              {renderAddressParagraph(paragraph, bodyFontSize)}
            </p>
          ))}
        </div>
      ) : null}

      {/* ── Closing signature ─────────────────────────────────────────── */}
      {speaker && trimmed && showSignature && (
        <div
          style={{
            marginTop: "22px",
            paddingTop: "16px",
            borderTop: `2px solid ${C.border}`,
          }}
        >
          {/* Signature photo beside sign-off for president address */}
          {section.type === "PRESIDENT_ADDRESS" ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <Avatar src={speaker.photoPath} name={speaker.name} size={54} />
              <div>
                <div
                  style={{
                    fontSize: "14.5px",
                    fontWeight: 800,
                    color: "#000000",
                    letterSpacing: "0.01em",
                  }}
                >
                  {speaker.name}
                </div>
                <div style={{ fontSize: "12px", color: "#222222", marginTop: "1px" }}>
                  {roleLabel(speaker as NecMember)}
                </div>
                <div style={{ fontSize: "12px", color: "#222222" }}>
                  Liberian Student Union in China
                </div>
                <div style={{ fontSize: "11px", color: "#444444", marginTop: "3px" }}>
                  Fiscal Year 2025–2026
                </div>
                <div style={{ fontSize: "11px", color: "#444444", marginTop: "6px" }}>
                  July 26, 2026 · Jinan, Shandong Province, People's Republic of China
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#000000",
                  marginBottom: "2px",
                }}
              >
                {speaker.name}
              </div>
              <div style={{ fontSize: "11.5px", color: "#333333" }}>
                {roleLabel(speaker as NecMember)}
              </div>
            </div>
          )}
        </div>
      )}
    </A4Page>
  );
}
