"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Printer,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  Clock,
  ZoomIn,
  ZoomOut,
  FileText,
  Upload,
  X,
  Minus,
  BookOpen,
  CloudUpload,
  Tag,
  CalendarDays,
  PenLine,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchDefaultConference } from "@/lib/conf/client";

// ── Types ────────────────────────────────────────────────────────────────────

type LetterType =
  | "MEMO"
  | "MINUTES"
  | "ANNOUNCEMENT"
  | "BUDGET_LETTER"
  | "PAYMENT_RECEIPT"
  | "GENERAL";

const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  MEMO: "Memo",
  MINUTES: "Minutes",
  ANNOUNCEMENT: "Announcement",
  BUDGET_LETTER: "Budget Letter",
  PAYMENT_RECEIPT: "Payment Receipt",
  GENERAL: "General",
};

const LETTER_TYPE_COLORS: Record<LetterType, string> = {
  MEMO: "#C8A061",
  MINUTES: "#002868",
  ANNOUNCEMENT: "#BF0A30",
  BUDGET_LETTER: "#1a7a4a",
  PAYMENT_RECEIPT: "#7c3aed",
  GENERAL: "#666666",
};

// Lightweight record returned by GET /letters (no draft JSON)
type LetterRecord = {
  id: string;
  title: string;
  type: LetterType;
  letterDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type LetterDraft = {
  id: string;
  dbId: string; // DB ConfLetter.id — empty string if not yet saved to DB
  type: LetterType;
  title: string;
  to: string;
  from: string;
  re: string;
  date: string;
  body: string;
  issuingRoleKey: string;
  officeLabel: string;
  signatoryMode: "NONE" | "STANDARD" | "FUNDRAISING" | "CUSTOM";
  // Signatory 1 (left — least authority, e.g. Secretary → "Signed")
  signatory1Name: string;
  signatory1Title: string;
  signatory1Label: string; // e.g. "Signed"
  signatory1Sig: string; // base64 data URL of signature image
  signatory1SigScale: number; // 0.5–2.0, default 1
  // Signatory 2 (centre — mid authority, e.g. Vice-Chair → "Approved")
  signatory2Name: string;
  signatory2Title: string;
  signatory2Label: string;
  signatory2Sig: string;
  signatory2SigScale: number;
  // Signatory 3 (right — highest authority, e.g. Chair → "Attested")
  signatory3Name: string;
  signatory3Title: string;
  signatory3Label: string;
  signatory3Sig: string;
  signatory3SigScale: number;
  savedAt: string;
};

type Member = {
  id: string;
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  committeeScope: string | null;
  phone: string | null;
};

type ConfInfo = {
  name: string;
  city: string;
  venue: string | null;
  startsAt: string;
  endsAt: string;
};

type RoleTemplate = {
  id: string;
  key: string;
  label: string;
  baseRole:
    | "CHAIR"
    | "VICE_CHAIR"
    | "SECRETARY"
    | "TREASURER"
    | "COMMITTEE"
    | "DELEGATE";
  title: string | null;
  committeeScope: string | null;
  officeLabel: string | null;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
};

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "conf_letter_drafts";

/** Ensure any draft loaded from localStorage has all current fields with defaults. */
function migrateDraft(d: Partial<LetterDraft>): LetterDraft {
  // Detect drafts saved before the label fields existed (d.signatory1Label === undefined).
  // Old STANDARD/FUNDRAISING presets stored Chair=slot1, Vice=slot2, Secretary=slot3.
  // New order is least→highest authority: Secretary=slot1, Vice=slot2, Chair=slot3.
  // When labels are absent and signatoryMode is STANDARD or FUNDRAISING, reverse slots 1↔3.
  const isLegacy = d.signatory1Label === undefined;
  const needsSwap =
    isLegacy &&
    (d.signatoryMode === "STANDARD" || d.signatoryMode === "FUNDRAISING") &&
    (d.signatory1Name || d.signatory3Name);

  const s1Name = needsSwap
    ? (d.signatory3Name ?? "")
    : (d.signatory1Name ?? "");
  const s1Title = needsSwap
    ? (d.signatory3Title ?? "")
    : (d.signatory1Title ?? "");
  const s3Name = needsSwap
    ? (d.signatory1Name ?? "")
    : (d.signatory3Name ?? "");
  const s3Title = needsSwap
    ? (d.signatory1Title ?? "")
    : (d.signatory3Title ?? "");

  return {
    id: d.id ?? newId(),
    dbId: (d as Partial<LetterDraft>).dbId ?? "",
    type: (d as Partial<LetterDraft>).type ?? "GENERAL",
    title: d.title ?? "",
    to: d.to ?? "",
    from: d.from ?? "",
    re: d.re ?? "",
    date: d.date ?? "",
    body: d.body ?? "",
    issuingRoleKey: d.issuingRoleKey ?? "",
    officeLabel: d.officeLabel ?? "Office of the Conference Chairman",
    signatoryMode: d.signatoryMode ?? "NONE",
    signatory1Name: s1Name,
    signatory1Title: s1Title,
    signatory1Label: d.signatory1Label ?? "Signed",
    signatory1Sig: d.signatory1Sig ?? "",
    signatory1SigScale: d.signatory1SigScale ?? 1,
    signatory2Name: d.signatory2Name ?? "",
    signatory2Title: d.signatory2Title ?? "",
    signatory2Label: d.signatory2Label ?? "Approved",
    signatory2Sig: d.signatory2Sig ?? "",
    signatory2SigScale: d.signatory2SigScale ?? 1,
    signatory3Name: s3Name,
    signatory3Title: s3Title,
    signatory3Label: d.signatory3Label ?? "Attested",
    signatory3Sig: d.signatory3Sig ?? "",
    signatory3SigScale: d.signatory3SigScale ?? 1,
    savedAt: d.savedAt ?? "",
  };
}

function loadDrafts(): LetterDraft[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<LetterDraft>[];
    return Array.isArray(parsed) ? parsed.map(migrateDraft) : [];
  } catch {
    return [];
  }
}

function saveDrafts(drafts: LetterDraft[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(drafts));
  } catch {
    // storage full
  }
}

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function newDraft(): LetterDraft {
  return {
    id: newId(),
    dbId: "",
    type: "GENERAL" as LetterType,
    title: "",
    to: "",
    from: "Enoch Kwateh Dongbo\nConference Chair, LSUIC 2026",
    re: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    body: "",
    issuingRoleKey: "",
    officeLabel: "Office of the Conference Chairman",
    signatoryMode: "NONE",
    signatory1Name: "",
    signatory1Title: "",
    signatory1Label: "Signed",
    signatory1Sig: "",
    signatory1SigScale: 1,
    signatory2Name: "",
    signatory2Title: "",
    signatory2Label: "Approved",
    signatory2Sig: "",
    signatory2SigScale: 1,
    signatory3Name: "",
    signatory3Title: "",
    signatory3Label: "Attested",
    signatory3Sig: "",
    signatory3SigScale: 1,
    savedAt: "",
  };
}

// ── Design constants (mirrors letterhead route) ───────────────────────────────

const C = {
  navy: "#002868",
  darkNavy: "#001A4E",
  red: "#BF0A30",
  gold: "#C8A061",
  white: "#FFFFFF",
  muted: "#777777",
  sideAccent: "#88A4C8",
  divider: "#1a3568",
};

const FLAG_STRIPES_11 = [
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

const ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  TREASURER: "Treasurer",
};

function memberLabel(m: Member): string {
  const base = ROLE_LABELS[m.role];
  if (base) return base;
  return m.title ?? m.committeeScope ?? "Committee Member";
}

function fmtDateRange(start: string, end: string): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", opts);
  return (
    fmt(new Date(start), { month: "long", day: "numeric" }) +
    " – " +
    fmt(new Date(end), { month: "long", day: "numeric", year: "numeric" })
  );
}

type Signatory = {
  name: string;
  title: string;
  label: string; // "Signed" | "Approved" | "Attested"
  sig: string; // base64 data URL
  sigScale: number;
};

function wrapParagraph(paragraph: string, maxChars: number): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function bodyToWrappedLines(body: string, maxChars = 92): string[] {
  const paragraphs = body.split("\n");
  const wrapped: string[] = [];
  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      wrapped.push("");
      continue;
    }
    wrapped.push(...wrapParagraph(paragraph, maxChars));
  }
  return wrapped;
}

function paginateBodyText(
  body: string,
  firstPageCapacity: number,
  continuationCapacity: number,
  signatoryLines: number,
) {
  const wrapped = bodyToWrappedLines(body);

  if (wrapped.length === 0) return [""];

  const pages: string[][] = [];
  let cursor = 0;
  let pageIndex = 0;

  while (cursor < wrapped.length) {
    const cap = pageIndex === 0 ? firstPageCapacity : continuationCapacity;
    pages.push(wrapped.slice(cursor, cursor + cap));
    cursor += cap;
    pageIndex += 1;
  }

  if (signatoryLines > 0 && pages.length > 0) {
    let lastIndex = pages.length - 1;
    const lastCap =
      pages.length === 1
        ? Math.max(8, firstPageCapacity - signatoryLines)
        : Math.max(8, continuationCapacity - signatoryLines);

    while (pages[lastIndex].length > lastCap) {
      const overflow = pages[lastIndex].splice(lastCap);
      pages.push(overflow);
      lastIndex = pages.length - 1;
    }
  }

  return pages.map((lines) => lines.join("\n").trimEnd());
}

// ── A4 Letter Preview ─────────────────────────────────────────────────────────

function LetterA4Preview({
  draft,
  members,
  confInfo,
  forPrint = false,
}: {
  draft: LetterDraft;
  members: Member[];
  confInfo: ConfInfo | null;
  forPrint?: boolean;
}) {
  const PAGE_W = 794;
  const PAGE_H = 1123;
  const STRIPE_H = 14;
  const HEADER_H = 158; // taller to fit officer phone row
  const GOLD_BAR = 2.5;
  const OFFICE_ROW = 26;
  const NAVY_BAR = 7;
  const RED_BAR = 3;
  const TOTAL_HEADER =
    STRIPE_H + HEADER_H + GOLD_BAR + OFFICE_ROW + NAVY_BAR + RED_BAR;
  const FOOTER_H = 32;
  const SIDEBAR_W = 215; // navy-accent(8) + red-accent(3) + content(204)
  const BODY_H = PAGE_H - TOTAL_HEADER - FOOTER_H;

  const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
  const sortedMembers = [
    ...KEY_ORDER.map((r) => members.find((m) => m.role === r)).filter(Boolean),
    ...members.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as Member[];

  // Officers whose phones go in the header
  const chair = members.find((m) => m.role === "CHAIR");
  const viceChair = members.find((m) => m.role === "VICE_CHAIR");
  const secretary = members.find((m) => m.role === "SECRETARY");
  const officerPhones = [
    chair && chair.phone ? { label: "Chair", phone: chair.phone } : null,
    viceChair && viceChair.phone
      ? { label: "Co-Chair", phone: viceChair.phone }
      : null,
    secretary && secretary.phone
      ? { label: "Secretary", phone: secretary.phone }
      : null,
  ].filter(Boolean) as { label: string; phone: string }[];

  const dateRange = confInfo
    ? fmtDateRange(confInfo.startsAt, confInfo.endsAt)
    : "July 23 – 27, 2026";
  const venue = confInfo?.venue ?? "Arcadia Spa Golf International Hotel";

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

  const metaLineCount =
    (draft.to ? 2 : 0) + (draft.from ? 2 : 0) + (draft.re ? 2 : 0) + 2;
  const signatureReserveLines = signatories.length > 0 ? 10 : 0;
  const firstPageCapacity = Math.max(
    12,
    42 - metaLineCount - signatureReserveLines,
  );
  const continuationCapacity = 56;
  const bodyPages = paginateBodyText(
    draft.body,
    firstPageCapacity,
    continuationCapacity,
    signatureReserveLines,
  );
  const firstPageBody = bodyPages[0] ?? "";
  const continuationBodies = bodyPages.slice(1);
  const showSignaturesOnFirstPage = continuationBodies.length === 0;
  const officeLabel =
    (draft.officeLabel ?? "").trim() || "Office of the Conference Chairman";

  return (
    <>
      <div
        className="letter-page"
        style={{
          width: PAGE_W,
          height: forPrint ? "auto" : PAGE_H,
          background: C.white,
          display: "flex",
          flexDirection: "column",
          overflow: forPrint ? "visible" : "hidden",
          boxShadow: forPrint ? "none" : "0 4px 32px rgba(0,0,0,0.18)",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
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

        {/* ── Header row: logo | text | seal ── */}
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
                (el.parentElement as HTMLElement).innerHTML =
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
            <div style={{ fontSize: 8.5, color: "#555" }}>
              {confInfo?.city ?? "Jinan"}, Shandong Province, P.R. China
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>{dateRange}</div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
              Email: ekd@ekddigital.com · lsuic2006@gmail.com
            </div>
            {officerPhones.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  marginTop: 5,
                  flexWrap: "wrap" as const,
                }}
              >
                {officerPhones.map(({ label, phone }) => (
                  <span
                    key={label}
                    style={{ fontSize: 8.5, color: C.navy, fontWeight: 600 }}
                  >
                    {label}: {phone}
                  </span>
                ))}
              </div>
            )}
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
                (el.parentElement as HTMLElement).innerHTML =
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

        {/* ── Body area: sidebar + content ── */}
        <div
          style={{
            display: "flex",
            height: forPrint ? "auto" : BODY_H,
            flexShrink: 0,
            overflow: forPrint ? "visible" : "hidden",
          }}
        >
          {/* Left sidebar — white bg, navy+red left accent, center-aligned (matches reference letter) */}
          <div
            style={{
              width: SIDEBAR_W,
              background: C.white,
              flexShrink: 0,
              overflow: forPrint ? "visible" : "hidden",
              display: "flex",
              borderRight: `1px solid #dde3ef`,
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
                overflowY: forPrint ? "visible" : "hidden",
              }}
            >
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
                    {memberLabel(m)}
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
                      {m.phone}
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

          {/* Main letter content */}
          <div
            style={{
              flex: 1,
              padding: "24px 32px 24px",
              overflow: forPrint ? "visible" : "hidden",
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
            <div
              style={{
                fontSize: 12,
                color: "#222",
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
              }}
            >
              {firstPageBody ? (
                firstPageBody
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

        {/* ── Footer ── */}
        <div
          style={{
            height: FOOTER_H,
            background: C.navy,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ height: 2, background: C.red, width: "100%" }} />
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 14px",
            }}
          >
            {/* left spacer to balance right page number */}
            <div style={{ width: 48 }} />
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                color: C.gold,
                letterSpacing: "0.5px",
                textAlign: "center",
              }}
            >
              Honoring Our Past, Engaging Our Present, and Inspiring Our Future
            </div>
            <div
              style={{
                fontSize: 8,
                color: C.gold,
                opacity: 0.75,
                fontVariantNumeric: "tabular-nums",
                width: 48,
                textAlign: "right",
              }}
            >
              Page 1 of {1 + continuationBodies.length}
            </div>
          </div>
        </div>
      </div>

      {continuationBodies.map((segment, idx) => {
        const isLast = idx === continuationBodies.length - 1;
        return (
          <div
            key={`cont-${idx}`}
            className="letter-page continuation-page"
            style={{
              width: PAGE_W,
              minHeight: PAGE_H,
              background: C.white,
              display: "flex",
              flexDirection: "column",
              boxShadow: forPrint ? "none" : "0 4px 32px rgba(0,0,0,0.18)",
              fontFamily: "'Helvetica Neue', Arial, sans-serif",
              marginTop: 18,
            }}
          >
            <div style={{ display: "flex", height: 8, flexShrink: 0 }}>
              {FLAG_STRIPES_11.map((color, i) => (
                <div key={i} style={{ flex: 1, background: color }} />
              ))}
            </div>
            <div
              style={{
                padding: "10px 22px",
                borderBottom: `2px solid ${C.gold}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontSize: 10, color: C.navy, fontWeight: 700 }}>
                LIBERIAN STUDENT UNION IN CHINA (LSUIC)
              </div>
              <div style={{ fontSize: 9, color: C.muted, fontStyle: "italic" }}>
                {officeLabel}
              </div>
            </div>

            <div style={{ flex: 1, padding: "26px 32px 24px" }}>
              <div
                style={{
                  fontSize: 12,
                  color: "#222",
                  lineHeight: 1.8,
                  whiteSpace: "pre-wrap",
                }}
              >
                {segment}
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

            <div
              style={{
                height: FOOTER_H,
                background: C.navy,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <div style={{ height: 2, background: C.red, width: "100%" }} />
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                }}
              >
                <div style={{ width: 48 }} />
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    color: C.gold,
                    letterSpacing: "0.5px",
                    textAlign: "center",
                  }}
                >
                  Honoring Our Past, Engaging Our Present, and Inspiring Our
                  Future
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: C.gold,
                    opacity: 0.75,
                    fontVariantNumeric: "tabular-nums",
                    width: 48,
                    textAlign: "right",
                  }}
                >
                  Page {idx + 2} of {1 + continuationBodies.length}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

// ── Main shell ────────────────────────────────────────────────────────────────

export function LetterComposerShell() {
  const [confId, setConfId] = useState("");
  const [confInfo, setConfInfo] = useState<ConfInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [roles, setRoles] = useState<RoleTemplate[]>([]);
  const [necPresidentName, setNecPresidentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<LetterDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<LetterDraft>(newDraft);
  const [showList, setShowList] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [zoom, setZoom] = useState(72);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Library (DB-saved letters) state ────────────────────────────────────
  const [view, setView] = useState<"composer" | "library">("composer");
  const [library, setLibrary] = useState<LetterRecord[]>([]);
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [libraryPages, setLibraryPages] = useState(1);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryFilter, setLibraryFilter] = useState<LetterType | "">("");
  const [savingToDb, setSavingToDb] = useState(false);
  const [saveToDbStatus, setSaveToDbStatus] = useState<"idle" | "saved" | "error">("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Fetch conf data ──────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);

        const [eventRes, membersRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/route`).catch(() => null),
          fetch(`/api/conf/${conf.id}/members`),
        ]);

        const [rolesRes, bookletRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/roles`, { cache: "no-store" }).catch(
            () => null,
          ),
          fetch(`/api/conf/${conf.id}/booklet/data`, {
            cache: "no-store",
          }).catch(() => null),
        ]);

        if (membersRes.ok) {
          const mems = (await membersRes.json()) as Member[];
          setMembers(mems.filter((m) => m.role !== "COMMITTEE" || m.title));
        }

        if (rolesRes?.ok) {
          const roleTemplates = (await rolesRes.json()) as RoleTemplate[];
          setRoles(roleTemplates.filter((r) => r.isActive));
        }

        if (bookletRes?.ok) {
          const booklet = await bookletRes.json();
          const nec = Array.isArray(booklet?.necMembers)
            ? booklet.necMembers
            : [];
          const necPresident = nec.find(
            (n: { title?: string; name?: string }) =>
              (n.title || "").toLowerCase().includes("national president"),
          );
          if (necPresident?.name) {
            setNecPresidentName(String(necPresident.name));
          }
        }

        // Try to get event info from members endpoint data or fallback
        // We'll try the default conf endpoint
        const defRes = await fetch("/api/conf/default");
        if (defRes.ok) {
          // fetch detailed info
          const detRes = await fetch(`/api/conf/${conf.id}/booklet/data`).catch(
            () => null,
          );
          if (detRes?.ok) {
            const data = await detRes.json();
            if (data?.event) {
              setConfInfo({
                name: data.event.name,
                city: data.event.city,
                venue: data.event.venue,
                startsAt: data.event.startsAt,
                endsAt: data.event.endsAt,
              });
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, []);

  // ── Drafts ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = loadDrafts();
    setDrafts(stored);
    if (stored.length > 0) setActiveDraft(stored[0]);
  }, []);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      persistDraft(activeDraft);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }, 800);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDraft]);

  const persistDraft = useCallback((draft: LetterDraft) => {
    const updated = { ...draft, savedAt: new Date().toISOString() };
    setDrafts((prev) => {
      const exists = prev.find((d) => d.id === updated.id);
      const next = exists
        ? prev.map((d) => (d.id === updated.id ? updated : d))
        : [updated, ...prev];
      saveDrafts(next);
      return next;
    });
  }, []);

  const handleManualSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    persistDraft(activeDraft);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  }, [activeDraft, persistDraft]);

  const handleNew = useCallback(() => {
    setActiveDraft(newDraft());
    setShowList(false);
  }, []);

  const handleLoad = useCallback((d: LetterDraft) => {
    setActiveDraft(d);
    setShowList(false);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== id);
        saveDrafts(next);
        return next;
      });
      if (activeDraft.id === id) {
        const remaining = drafts.filter((d) => d.id !== id);
        setActiveDraft(remaining.length > 0 ? remaining[0] : newDraft());
      }
    },
    [activeDraft.id, drafts],
  );

  // ── Library (DB) helpers ─────────────────────────────────────────────────

  const fetchLibrary = useCallback(
    async (page: number, filter: LetterType | "") => {
      if (!confId) return;
      setLibraryLoading(true);
      try {
        const qs = new URLSearchParams({ page: String(page) });
        if (filter) qs.set("type", filter);
        const res = await fetch(`/api/conf/${confId}/letters?${qs.toString()}`);
        if (res.ok) {
          const data = (await res.json()) as {
            letters: LetterRecord[];
            total: number;
            page: number;
            pages: number;
          };
          setLibrary(data.letters);
          setLibraryTotal(data.total);
          setLibraryPages(data.pages);
          setLibraryPage(data.page);
        }
      } catch {
        // silently ignore — library is enhancement
      } finally {
        setLibraryLoading(false);
      }
    },
    [confId],
  );

  // Fetch when view switches to library or page/filter changes
  useEffect(() => {
    if (view === "library") {
      void fetchLibrary(libraryPage, libraryFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, libraryPage, libraryFilter, confId]);

  const handleSaveToLibrary = useCallback(async () => {
    if (!confId) return;
    setSavingToDb(true);
    setSaveToDbStatus("idle");
    try {
      const isExisting = !!activeDraft.dbId;
      const url = isExisting
        ? `/api/conf/${confId}/letters/${activeDraft.dbId}`
        : `/api/conf/${confId}/letters`;
      const method = isExisting ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeDraft.title || activeDraft.re || "Untitled Letter",
          type: activeDraft.type,
          letterDate: activeDraft.date,
          draft: activeDraft,
        }),
      });

      if (res.ok) {
        const saved = (await res.json()) as { id: string };
        // Link this draft to the DB record
        setActiveDraft((d) => ({ ...d, dbId: saved.id }));
        setDrafts((prev) =>
          prev.map((d) =>
            d.id === activeDraft.id ? { ...d, dbId: saved.id } : d,
          ),
        );
        setSaveToDbStatus("saved");
        setTimeout(() => setSaveToDbStatus("idle"), 3000);
      } else {
        setSaveToDbStatus("error");
        setTimeout(() => setSaveToDbStatus("idle"), 4000);
      }
    } catch {
      setSaveToDbStatus("error");
      setTimeout(() => setSaveToDbStatus("idle"), 4000);
    } finally {
      setSavingToDb(false);
    }
  }, [confId, activeDraft]);

  const handleLoadFromLibrary = useCallback(
    async (rec: LetterRecord) => {
      if (!confId) return;
      try {
        const res = await fetch(`/api/conf/${confId}/letters/${rec.id}`);
        if (!res.ok) return;
        const full = (await res.json()) as { draft: unknown; id: string };
        const draft = migrateDraft(
          Object.assign({}, full.draft as Partial<LetterDraft>, {
            dbId: full.id,
          }),
        );
        setActiveDraft(draft);
        // Also persist to local drafts so auto-save keeps it
        setDrafts((prev) => {
          const exists = prev.find((d) => d.id === draft.id);
          const next = exists
            ? prev.map((d) => (d.id === draft.id ? draft : d))
            : [draft, ...prev];
          saveDrafts(next);
          return next;
        });
        setView("composer");
      } catch {
        // ignore
      }
    },
    [confId],
  );

  const handleDeleteFromLibrary = useCallback(
    async (id: string) => {
      if (!confId) return;
      setDeletingId(id);
      try {
        const res = await fetch(`/api/conf/${confId}/letters/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setLibrary((prev) => prev.filter((r) => r.id !== id));
          setLibraryTotal((t) => Math.max(0, t - 1));
          // Unlink from active draft if it pointed to this DB record
          setActiveDraft((d) => (d.dbId === id ? { ...d, dbId: "" } : d));
        }
      } catch {
        // ignore
      } finally {
        setDeletingId(null);
      }
    },
    [confId],
  );

  const set = useCallback(
    (field: keyof LetterDraft) => (v: string) =>
      setActiveDraft((d) => ({ ...d, [field]: v })),
    [],
  );

  const applyOfficeFromRole = useCallback(
    (roleKey: string) => {
      const roleTemplate = roles.find((r) => r.key === roleKey) ?? null;
      setActiveDraft((d) => ({
        ...d,
        issuingRoleKey: roleKey,
        officeLabel:
          roleTemplate?.officeLabel ||
          (roleTemplate ? `Office of ${roleTemplate.label}` : d.officeLabel),
      }));
    },
    [roles],
  );

  const applySignatoryPreset = useCallback(
    (mode: LetterDraft["signatoryMode"]) => {
      const chair = members.find((m) => m.role === "CHAIR");
      const viceChair = members.find((m) => m.role === "VICE_CHAIR");
      const secretary = members.find((m) => m.role === "SECRETARY");

      setActiveDraft((d) => {
        if (mode === "NONE") {
          return {
            ...d,
            signatoryMode: mode,
            signatory1Name: "",
            signatory1Title: "",
            signatory1Label: "Signed",
            signatory1Sig: "",
            signatory2Name: "",
            signatory2Title: "",
            signatory2Label: "Approved",
            signatory2Sig: "",
            signatory3Name: "",
            signatory3Title: "",
            signatory3Label: "Attested",
            signatory3Sig: "",
          };
        }

        if (mode === "STANDARD") {
          // Order: Secretary (Signed) → Vice-Chair (Approved) → Chair (Attested)
          return {
            ...d,
            signatoryMode: mode,
            signatory1Name: secretary?.name ?? "",
            signatory1Title:
              secretary?.title ??
              ROLE_LABELS[secretary?.role ?? ""] ??
              "Conference Secretary",
            signatory1Label: "Signed",
            signatory2Name: viceChair?.name ?? "",
            signatory2Title:
              viceChair?.title ??
              ROLE_LABELS[viceChair?.role ?? ""] ??
              "Conference Vice-Chair",
            signatory2Label: "Approved",
            signatory3Name: chair?.name ?? "",
            signatory3Title:
              chair?.title ??
              ROLE_LABELS[chair?.role ?? ""] ??
              "Conference Chair",
            signatory3Label: "Attested",
          };
        }

        if (mode === "FUNDRAISING") {
          // Order: Secretary (Signed) → Chair (Approved) → NEC President (Attested)
          return {
            ...d,
            signatoryMode: mode,
            signatory1Name: secretary?.name ?? "",
            signatory1Title:
              secretary?.title ??
              ROLE_LABELS[secretary?.role ?? ""] ??
              "Conference Secretary",
            signatory1Label: "Signed",
            signatory2Name: chair?.name ?? "",
            signatory2Title:
              chair?.title ??
              ROLE_LABELS[chair?.role ?? ""] ??
              "Conference Chair",
            signatory2Label: "Approved",
            signatory3Name: necPresidentName || "",
            signatory3Title: necPresidentName
              ? "National President (LSUIC)"
              : "",
            signatory3Label: "Attested",
          };
        }

        return { ...d, signatoryMode: mode };
      });
    },
    [members, necPresidentName],
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Open a clean popup window with just the A4 letter, then auto-print
  // so the user stays on the composer page and only needs one click to save.
  const handleDownloadPdf = useCallback(() => {
    const root = document.getElementById("letter-print-root");
    if (!root) {
      window.print();
      return;
    }
    const popup = window.open(
      "",
      "_blank",
      `width=860,height=1000,scrollbars=no,menubar=no,toolbar=no,status=no`,
    );
    if (!popup) {
      // Popups blocked — fall back to same-window print
      window.print();
      return;
    }
    popup.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <base href="${window.location.origin}">
  <title>LSUIC Letter</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 794px; background: #888; }
    .letter-page { box-shadow: none !important; display: block !important; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { background: #fff !important; width: 210mm; height: 297mm; overflow: hidden; }
      .letter-page { width: 210mm !important; height: 297mm !important; box-shadow: none !important; }
    }
  </style>
</head>
<body>
  ${root.innerHTML}
  <script>
    window.addEventListener('load', function () {
      setTimeout(function () { window.print(); }, 400);
    });
  <\/script>
</body>
</html>`);
    popup.document.close();
  }, []);

  // ── Loading / error ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-muted-foreground">
          Loading conference data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  const sortedRoleTemplates = [...roles].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Print CSS.
           #letter-print-root is always rendered but positioned off-screen
           so images load. In print mode we hide the whole app shell with
           visibility:hidden (works even on app-shell divs we don't own),
           then reveal only the print root. */}
      <style>{`
        #letter-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          pointer-events: none;
        }
        @media print {
          body * { visibility: hidden !important; }
          #letter-print-root,
          #letter-print-root * { visibility: visible !important; }
          #letter-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            pointer-events: auto !important;
          }
          .letter-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            box-shadow: none !important;
            transform: none !important;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
          }
          .letter-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .continuation-page {
            margin-top: 0 !important;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      {/* ── Viewport frame: header + 2-panel body ── */}
      <div className="flex flex-col h-[calc(100vh-8rem)] gap-0">
        {/* ── Header ── */}
        <div className="letter-no-print flex items-center gap-4 shrink-0 pb-3 mb-3 border-b border-border/30">
          <Link href="/tools/conf">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Letter Composer
            </h1>
            <p className="text-sm text-muted-foreground">
              Write official correspondence with the LSUIC letterhead — download
              as PDF
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center rounded-md border border-border overflow-hidden">
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "composer" ? "bg-[#002868] text-white" : "hover:bg-muted/50 text-muted-foreground"}`}
                onClick={() => setView("composer")}
              >
                <PenLine className="size-3.5" /> Composer
              </button>
              <button
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${view === "library" ? "bg-[#002868] text-white" : "hover:bg-muted/50 text-muted-foreground"}`}
                onClick={() => setView("library")}
              >
                <BookOpen className="size-3.5" /> Library
                {libraryTotal > 0 && (
                  <span className="ml-0.5 text-[10px] opacity-70">({libraryTotal})</span>
                )}
              </button>
            </div>

            {view === "composer" && (
              <>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {saveStatus === "saved" ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" /> Saved
                    </>
                  ) : (
                    <>
                      <Clock className="size-3.5" /> Auto-saving
                    </>
                  )}
                </span>
                <Button variant="outline" size="sm" onClick={handleManualSave}>
                  <Save className="size-4" /> Save Draft
                </Button>
                {/* Save to Library (DB) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSaveToLibrary()}
                  disabled={savingToDb}
                  className={
                    saveToDbStatus === "saved"
                      ? "border-emerald-500 text-emerald-600"
                      : saveToDbStatus === "error"
                        ? "border-destructive text-destructive"
                        : activeDraft.dbId
                          ? "border-[#C8A061]/60 text-[#C8A061]"
                          : ""
                  }
                  title={activeDraft.dbId ? "Update saved letter in Library" : "Save letter to Library (database)"}
                >
                  {saveToDbStatus === "saved" ? (
                    <><CheckCircle2 className="size-4" /> Saved to Library</>
                  ) : saveToDbStatus === "error" ? (
                    <><AlertCircle className="size-4" /> Save Failed</>
                  ) : savingToDb ? (
                    <><CloudUpload className="size-4" /> Saving…</>
                  ) : (
                    <><CloudUpload className="size-4" /> {activeDraft.dbId ? "Update Library" : "Save to Library"}</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowList((v) => !v)}
                >
                  <FolderOpen className="size-4" />
                  Drafts ({drafts.length})
                  <ChevronDown
                    className={`size-3.5 ml-1 transition-transform ${showList ? "rotate-180" : ""}`}
                  />
                </Button>
                <Button size="sm" onClick={handleNew}>
                  <Plus className="size-4" /> New Letter
                </Button>
                <Button
                  size="sm"
                  onClick={handlePrint}
                  className="bg-[#002868] hover:bg-[#001A4E]"
                >
                  <Printer className="size-4" /> Print / PDF
                </Button>
              </>
            )}

            {view === "library" && (
              <Button size="sm" onClick={() => setView("composer")}>
                <PenLine className="size-4" /> Open Composer
              </Button>
            )}
          </div>
        </div>

        {/* ── Library view ── */}
        {view === "library" && (
          <div className="letter-no-print flex-1 overflow-y-auto space-y-4 pb-6">
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="size-3.5" /> Filter by type:
              </div>
              {(["", "MEMO", "MINUTES", "ANNOUNCEMENT", "BUDGET_LETTER", "PAYMENT_RECEIPT", "GENERAL"] as (LetterType | "")[]).map(
                (t) => (
                  <button
                    key={t}
                    onClick={() => { setLibraryFilter(t); setLibraryPage(1); }}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      libraryFilter === t
                        ? "bg-[#002868] text-white border-[#002868]"
                        : "border-border hover:bg-muted/50"
                    }`}
                    style={
                      t && libraryFilter !== t
                        ? { borderColor: LETTER_TYPE_COLORS[t as LetterType] + "44", color: LETTER_TYPE_COLORS[t as LetterType] }
                        : {}
                    }
                  >
                    {t ? LETTER_TYPE_LABELS[t as LetterType] : "All"}
                  </button>
                ),
              )}
              <span className="ml-auto text-xs text-muted-foreground">{libraryTotal} letter{libraryTotal !== 1 ? "s" : ""}</span>
            </div>

            {/* Card grid */}
            {libraryLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading library…</div>
            ) : library.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <BookOpen className="size-10 opacity-30" />
                <p className="text-sm">No saved letters yet.</p>
                <p className="text-xs">Compose a letter and click &quot;Save to Library&quot; to store it here.</p>
                <Button size="sm" variant="outline" onClick={() => setView("composer")}>
                  <PenLine className="size-4" /> Go to Composer
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {library.map((rec) => (
                    <div
                      key={rec.id}
                      className="group relative rounded-xl border border-border bg-card hover:border-[#C8A061]/50 hover:shadow-md transition-all cursor-pointer flex flex-col"
                      onClick={() => void handleLoadFromLibrary(rec)}
                    >
                      {/* Color stripe by type */}
                      <div
                        className="h-1.5 rounded-t-xl"
                        style={{ background: LETTER_TYPE_COLORS[rec.type] }}
                      />
                      <div className="flex-1 p-4 space-y-2">
                        {/* Type badge */}
                        <div className="flex items-center justify-between">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              background: LETTER_TYPE_COLORS[rec.type] + "22",
                              color: LETTER_TYPE_COLORS[rec.type],
                            }}
                          >
                            <Tag className="size-2.5" />
                            {LETTER_TYPE_LABELS[rec.type]}
                          </span>
                          {/* Delete button */}
                          <button
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                            title="Delete letter"
                            disabled={deletingId === rec.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteFromLibrary(rec.id);
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                          {rec.title || "Untitled Letter"}
                        </h3>

                        {/* Dates */}
                        <div className="space-y-1">
                          {rec.letterDate && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="size-3" />
                              <span>{rec.letterDate}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            <span>
                              Saved{" "}
                              {new Date(rec.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          {rec.updatedAt !== rec.createdAt && (
                            <div className="text-[10px] text-muted-foreground/60">
                              Updated{" "}
                              {new Date(rec.updatedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Open button on hover */}
                      <div className="px-4 pb-3">
                        <div className="w-full text-center text-xs text-[#C8A061] opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                          Click to open in composer →
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {libraryPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={libraryPage <= 1}
                      onClick={() => setLibraryPage((p) => p - 1)}
                    >
                      ← Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {libraryPage} of {libraryPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={libraryPage >= libraryPages}
                      onClick={() => setLibraryPage((p) => p + 1)}
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Drafts list (local) ── */}
        {view === "composer" && showList && (
          <Card className="letter-no-print border-[#C8A061]/30 shrink-0 mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Local Drafts</CardTitle>
              <CardDescription className="text-xs">
                Auto-saved on this device. Use &quot;Save to Library&quot; to store permanently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No saved drafts yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {drafts.map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
                        d.id === activeDraft.id
                          ? "border-[#C8A061]/50 bg-[#C8A061]/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleLoad(d)}
                    >
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {d.title || d.re || "Untitled Letter"}
                          {d.dbId && (
                            <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                              in library
                            </span>
                          )}
                          {d.id === activeDraft.id && (
                            <span className="ml-1 text-xs text-[#C8A061]">
                              current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {d.date}
                          {d.to ? ` · To: ${d.to.split("\n")[0]}` : ""}
                          {d.savedAt
                            ? ` · saved ${new Date(d.savedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                            : ""}
                        </p>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(d.id)}
                          title="Delete draft"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Main layout: form (left) + preview (right) ── */}
        {view === "composer" && <div className="letter-no-print flex gap-6 flex-1 min-h-0">
          {/* ── Left: form fields ── */}
          <div className="w-[380px] shrink-0 overflow-y-auto space-y-4 pr-1 pb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="size-4 text-[#C8A061]" />
                  Letter Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Letter Type</Label>
                  <select
                    className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                    value={activeDraft.type}
                    onChange={(e) => setActiveDraft((d) => ({ ...d, type: e.target.value as LetterType }))}
                  >
                    {(Object.keys(LETTER_TYPE_LABELS) as LetterType[]).map((t) => (
                      <option key={t} value={t}>{LETTER_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Title / Label</Label>
                  <Input
                    placeholder="e.g. Committee Action Items Apr 20"
                    className="h-8 text-sm"
                    value={activeDraft.title}
                    onChange={(e) => set("title")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input
                    placeholder="e.g. April 20, 2026"
                    className="h-8 text-sm"
                    value={activeDraft.date}
                    onChange={(e) => set("date")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To</Label>
                  <Textarea
                    placeholder="e.g. All Committee Members&#10;LSUIC 2026 Conference"
                    className="text-sm resize-none"
                    rows={2}
                    value={activeDraft.to}
                    onChange={(e) => set("to")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">From</Label>
                  <Textarea
                    placeholder="e.g. Enoch Kwateh Dongbo&#10;Conference Chair, LSUIC 2026"
                    className="text-sm resize-none"
                    rows={2}
                    value={activeDraft.from}
                    onChange={(e) => set("from")(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Subject / Re</Label>
                  <Input
                    placeholder="e.g. Committee Action Items — Week of April 20"
                    className="h-8 text-sm"
                    value={activeDraft.re}
                    onChange={(e) => set("re")(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Letter Body</CardTitle>
                <CardDescription className="text-xs">
                  Paste or type your content. Use blank lines to separate
                  paragraphs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Type or paste your letter content here…"
                  className="text-sm resize-none font-mono"
                  rows={18}
                  value={activeDraft.body}
                  onChange={(e) => set("body")(e.target.value)}
                />
                <p className="mt-1.5 text-[10px] text-muted-foreground text-right">
                  {activeDraft.body.length} characters
                </p>
              </CardContent>
            </Card>

            {/* ── Office & Signatories ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Issuing Office &amp; Signatories
                </CardTitle>
                <CardDescription className="text-xs">
                  Select a committee role to auto-fill the office label, or type
                  a custom label. Add up to three signatories.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Role picker */}
                {sortedRoleTemplates.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Issuing Role (auto-fill office)
                    </Label>
                    <select
                      className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                      value={activeDraft.issuingRoleKey}
                      onChange={(e) => {
                        if (e.target.value) applyOfficeFromRole(e.target.value);
                        else set("issuingRoleKey")("");
                      }}
                    >
                      <option value="">— select role —</option>
                      {sortedRoleTemplates.map((r) => (
                        <option key={r.id} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {/* Office label override */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Office Label (override)</Label>
                  <Input
                    placeholder="e.g. Office of the Conference Chairman"
                    className="h-8 text-sm"
                    value={activeDraft.officeLabel}
                    onChange={(e) => set("officeLabel")(e.target.value)}
                  />
                </div>

                {/* Signatory preset */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Signatory Preset</Label>
                  <div className="flex gap-1.5 flex-wrap">
                    {(
                      ["NONE", "STANDARD", "FUNDRAISING", "CUSTOM"] as const
                    ).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => applySignatoryPreset(mode)}
                        className={`px-2.5 py-1 rounded text-xs border transition-colors ${
                          activeDraft.signatoryMode === mode
                            ? "bg-[#002868] text-white border-[#002868]"
                            : "bg-background border-border hover:bg-muted/60"
                        }`}
                      >
                        {mode === "NONE"
                          ? "None"
                          : mode === "STANDARD"
                            ? "Standard"
                            : mode === "FUNDRAISING"
                              ? "Fundraising"
                              : "Custom"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Signatory fields */}
                {activeDraft.signatoryMode !== "NONE" && (
                  <div className="space-y-3 pt-1">
                    {(
                      [
                        {
                          nameKey: "signatory1Name",
                          titleKey: "signatory1Title",
                          labelKey: "signatory1Label",
                          sigKey: "signatory1Sig",
                          scaleKey: "signatory1SigScale",
                          badge: "1",
                        },
                        {
                          nameKey: "signatory2Name",
                          titleKey: "signatory2Title",
                          labelKey: "signatory2Label",
                          sigKey: "signatory2Sig",
                          scaleKey: "signatory2SigScale",
                          badge: "2",
                        },
                        {
                          nameKey: "signatory3Name",
                          titleKey: "signatory3Title",
                          labelKey: "signatory3Label",
                          sigKey: "signatory3Sig",
                          scaleKey: "signatory3SigScale",
                          badge: "3",
                        },
                      ] as const
                    ).map(
                      ({
                        nameKey,
                        titleKey,
                        labelKey,
                        sigKey,
                        scaleKey,
                        badge,
                      }) => (
                        <div
                          key={nameKey}
                          className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2"
                        >
                          {/* Header row: badge + label input */}
                          <div className="flex items-center gap-2">
                            <span className="size-5 rounded-full bg-[#002868] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                              {badge}
                            </span>
                            <Input
                              placeholder="e.g. Signed / Approved / Attested"
                              className="h-7 text-xs font-semibold flex-1"
                              value={activeDraft[labelKey]}
                              onChange={(e) => set(labelKey)(e.target.value)}
                            />
                          </div>
                          {/* Name */}
                          <Input
                            placeholder="Full name"
                            className="h-7 text-sm"
                            value={activeDraft[nameKey]}
                            onChange={(e) => set(nameKey)(e.target.value)}
                          />
                          {/* Title */}
                          <Input
                            placeholder="Title / Role"
                            className="h-7 text-sm"
                            value={activeDraft[titleKey]}
                            onChange={(e) => set(titleKey)(e.target.value)}
                          />
                          {/* Signature upload + preview + scale */}
                          <div className="space-y-1.5">
                            {activeDraft[sigKey] ? (
                              <div className="flex items-center gap-2">
                                {/* Preview */}
                                <div
                                  className="flex-1 rounded border border-border bg-white flex items-center justify-center py-1 px-2"
                                  style={{ minHeight: 40 }}
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={activeDraft[sigKey]}
                                    alt="sig preview"
                                    style={{
                                      height: Math.round(
                                        32 * (activeDraft[scaleKey] ?? 1),
                                      ),
                                      maxWidth: "100%",
                                      objectFit: "contain",
                                    }}
                                  />
                                </div>
                                {/* Scale controls */}
                                <div className="flex flex-col items-center gap-0.5">
                                  <button
                                    className="size-6 rounded border border-border hover:bg-muted/60 flex items-center justify-center text-xs"
                                    title="Increase signature size"
                                    onClick={() =>
                                      setActiveDraft((d) => ({
                                        ...d,
                                        [scaleKey]: Math.min(
                                          3,
                                          Math.round(
                                            ((d[scaleKey] ?? 1) + 0.25) * 100,
                                          ) / 100,
                                        ),
                                      }))
                                    }
                                  >
                                    <Plus className="size-3" />
                                  </button>
                                  <span className="text-[9px] font-mono text-muted-foreground">
                                    {(
                                      (activeDraft[scaleKey] ?? 1) * 100
                                    ).toFixed(0)}
                                    %
                                  </span>
                                  <button
                                    className="size-6 rounded border border-border hover:bg-muted/60 flex items-center justify-center text-xs"
                                    title="Decrease signature size"
                                    onClick={() =>
                                      setActiveDraft((d) => ({
                                        ...d,
                                        [scaleKey]: Math.max(
                                          0.25,
                                          Math.round(
                                            ((d[scaleKey] ?? 1) - 0.25) * 100,
                                          ) / 100,
                                        ),
                                      }))
                                    }
                                  >
                                    <Minus className="size-3" />
                                  </button>
                                </div>
                                {/* Remove */}
                                <button
                                  className="size-6 rounded border border-border hover:bg-destructive/10 hover:text-destructive flex items-center justify-center shrink-0"
                                  title="Remove signature"
                                  onClick={() =>
                                    setActiveDraft((d) => ({
                                      ...d,
                                      [sigKey]: "",
                                    }))
                                  }
                                >
                                  <X className="size-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <Upload className="size-3.5" />
                                Upload signature image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const result = ev.target
                                        ?.result as string;
                                      setActiveDraft((d) => ({
                                        ...d,
                                        [sigKey]: result,
                                      }));
                                    };
                                    reader.readAsDataURL(file);
                                    e.target.value = "";
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 bg-[#002868] hover:bg-[#001A4E]"
                onClick={handleDownloadPdf}
              >
                <Printer className="size-4" />
                Download PDF
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Opens in a new window — choose &quot;Save as PDF&quot; in the
              print dialog.
            </p>
          </div>

          {/* ── Right: A4 preview ── */}
          <div className="flex-1 min-w-0 overflow-y-auto pb-6">
            {/* Zoom controls */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold text-[#002868]">
                Live A4 Preview
              </p>
              <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setZoom((z) => Math.max(40, z - 5))}
                  className="px-2 py-1 text-xs hover:bg-muted/50"
                  title="Zoom out"
                >
                  <ZoomOut className="size-3.5" />
                </button>
                <span className="px-2 text-xs font-mono">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(120, z + 5))}
                  className="px-2 py-1 text-xs hover:bg-muted/50"
                  title="Zoom in"
                >
                  <ZoomIn className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Preview viewport */}
            <div
              style={{
                background: "#c8c8c8",
                borderRadius: 12,
                padding: 24,
                overflowX: "auto",
              }}
            >
              <div
                className="letter-document"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "top center",
                  width: 794,
                  margin: "0 auto",
                  marginBottom:
                    zoom < 100 ? `${((zoom - 100) / 100) * 900}px` : 0,
                }}
              >
                <LetterA4Preview
                  draft={activeDraft}
                  members={members}
                  confInfo={confInfo}
                />
              </div>
            </div>
          </div>
        </div>}
      </div>
      {/* end flex flex-col viewport frame */}

      {/* ── Print root — rendered off-screen (not display:none so visibility trick works) ── */}
      <div id="letter-print-root">
        <LetterA4Preview
          draft={activeDraft}
          members={members}
          confInfo={confInfo}
        />
      </div>
    </div>
  );
}
