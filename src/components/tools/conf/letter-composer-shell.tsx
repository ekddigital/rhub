"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  LETTERHEAD_CONFIG,
  buildCityRegionLine,
  buildLetterheadEmailLine,
} from "@/lib/conf/letterhead-config";
import { normalizeSignatureProfileKey } from "@/lib/conf/signature-profiles";
import {
  buildFundraisingLetterBodyRichHtml,
  FUNDRAISING_SAMPLE_DOC_TITLE,
  FUNDRAISING_SAMPLE_DATE_PLACEHOLDER,
  FUNDRAISING_SAMPLE_TO,
  FUNDRAISING_SAMPLE_FROM,
  FUNDRAISING_SAMPLE_SUBJECT,
  FUNDRAISING_SAMPLE_ADDRESS,
  FUNDRAISING_SAMPLE_RECIPIENT_NAME,
  FUNDRAISING_SAMPLE_TARGET_AMOUNT,
  FUNDRAISING_SAMPLE_USE_OF_FUNDS,
  FUNDRAISING_SAMPLE_EVENT_DATE,
  FUNDRAISING_SAMPLE_EVENT_TIME,
  FUNDRAISING_SAMPLE_PAYMENT_DEADLINE,
} from "@/lib/conf/fundraising-letter-template";

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
  bodyRich: string;
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
  fundraisingEnabled: boolean;
  fundraisingInviteRole: string;
  fundraisingInviteRoleOther: string;
  fundraisingRecipientName: string;
  fundraisingRecipientAddress: string;
  fundraisingTargetAmount: string;
  fundraisingUseOfFunds: string;
  fundraisingPaymentDeadline: string;
  fundraisingEventDate: string;
  fundraisingEventTime: string;
  fundraisingMeetingMedium: string;
  fundraisingMeetingLink: string;
  fundraisingMeetingId: string;
  fundraisingMeetingPassword: string;
  /** Last time we merged the FUNDRAISING_LETTER sample on enable (avoid clobbering edits). Reset when disabling fundraising mode. */
  fundraisingLetterSampleApplied: boolean;
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

type SignatureProfile = {
  key: string;
  name: string;
  title?: string;
  signatureDataUrl: string;
};

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = "conf_letter_drafts";
const DEFAULT_FUNDRAISING_PAYMENT_DEADLINE = "June 6, 2026";
const DEFAULT_FUNDRAISING_EVENT_DATE = "May 29, 2026";
const DEFAULT_FUNDRAISING_EVENT_TIME = "21:00 China Time";
const DEFAULT_FUNDRAISING_MEETING_MEDIUM = "Zoom";
const DEFAULT_FUNDRAISING_MEETING_LINK =
  "https://us02web.zoom.us/j/2312312006?pwd=ZHh3V2dXZGJ6Y2NCa0IxczdOaWJVQT09";
const DEFAULT_FUNDRAISING_MEETING_ID = "2312312006";
const DEFAULT_FUNDRAISING_MEETING_PASSWORD = "LSUIC2006";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function plainBodyToRichHtml(body: string): string {
  if (!body.trim()) return "<p></p>";
  return body
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function richHtmlToPlainText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    const lines: string[] = [];

    const pushLine = (line: string) => {
      lines.push(line);
    };
    const pushBlankLine = () => {
      if (lines.length === 0 || lines[lines.length - 1] !== "") {
        lines.push("");
      }
    };

    const parseList = (listEl: Element, ordered: boolean) => {
      const items = Array.from(listEl.children).filter(
        (child) => child.tagName.toLowerCase() === "li",
      );
      items.forEach((item, index) => {
        const marker = ordered ? `${index + 1}. ` : "• ";
        const text = item.textContent?.trim() || "";
        if (text) pushLine(`${marker}${text}`);
      });
      pushBlankLine();
    };

    Array.from(doc.body.children).forEach((el) => {
      const tag = el.tagName.toLowerCase();

      if (tag === "table") {
        const rows = Array.from(el.querySelectorAll("tr"));
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("th,td"))
            .map((cell) => cell.textContent?.trim() || "")
            .filter(Boolean);
          if (cells.length > 0) pushLine(cells.join(" | "));
        });
        pushBlankLine();
        return;
      }

      if (tag === "ul") {
        parseList(el, false);
        return;
      }

      if (tag === "ol") {
        parseList(el, true);
        return;
      }

      const text = el.textContent?.trim() || "";
      if (!text) {
        pushBlankLine();
        return;
      }

      pushLine(text);
      if (["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(tag)) {
        pushBlankLine();
      }
    });

    return lines
      .join("\n")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const withBreaks = trimmed
    .replace(/<\/th>\s*<th[^>]*>/gi, " | ")
    .replace(/<\/td>\s*<td[^>]*>/gi, " | ")
    .replace(/<(th|td)[^>]*>/gi, "")
    .replace(/<\/(th|td)>/gi, "")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/thead>/gi, "\n")
    .replace(/<\/tbody>/gi, "\n")
    .replace(/<\/table>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");

  return withBreaks
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeMarkdownToReadableText(text: string): string {
  const lines = text.split("\n");
  const normalized: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      normalized.push("");
      continue;
    }

    // Remove markdown heading markers (#, ##, ###, etc.)
    const headingMatch = line.match(/^\s*#{1,6}\s+(.+)$/);
    if (headingMatch) {
      normalized.push(headingMatch[1] ?? "");
      continue;
    }

    // Convert markdown bullet lines to typographic bullets.
    if (/^\s*[-*]\s+/.test(line)) {
      normalized.push(line.replace(/^\s*[-*]\s+/, "• "));
      continue;
    }

    // Keep numbered lists but normalize spacing.
    if (/^\s*\d+\.\s+/.test(line)) {
      normalized.push(line.replace(/^\s*(\d+)\.\s+/, "$1. "));
      continue;
    }

    // Markdown table separators should never appear in the final letter.
    if (/^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line)) {
      continue;
    }

    // Render markdown table rows as readable text rows.
    if (line.includes("|")) {
      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
      if (cells.length > 1) {
        normalized.push(cells.join(" | "));
        continue;
      }
    }

    normalized.push(line);
  }

  return normalized
    .join("\n")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** TipTap often wraps paragraphs in single root `<div>`; DOMParser would treat that as one paragraph. */
function letterHtmlTopLevelElements(doc: Document): Element[] {
  let nodes = Array.from(doc.body.children);
  for (let depth = 0; depth < 6; depth++) {
    if (nodes.length === 1) {
      const tag = nodes[0].tagName.toLowerCase();
      if (tag === "div" || tag === "article" || tag === "section") {
        const inner = Array.from(nodes[0].children);
        if (inner.length > 0) {
          nodes = inner;
          continue;
        }
      }
    }
    break;
  }
  return nodes;
}

function richHtmlToBodyBlocks(html: string): LetterBodyBlock[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    const blocks: LetterBodyBlock[] = [];

    const readText = (el: Element) =>
      (el.textContent || "").replace(/\s+/g, " ").trim();

    letterHtmlTopLevelElements(doc).forEach((el) => {
      const tag = el.tagName.toLowerCase();

      if (/^h[1-4]$/.test(tag)) {
        const level = Number(tag[1]) as 1 | 2 | 3 | 4;
        const text = readText(el);
        if (text) blocks.push({ type: "heading", level, text });
        return;
      }

      if (tag === "p" || tag === "div") {
        const text = readText(el);
        if (text) blocks.push({ type: "paragraph", text });
        return;
      }

      if (tag === "blockquote") {
        const text = readText(el);
        if (text) blocks.push({ type: "blockquote", text });
        return;
      }

      if (tag === "hr") {
        blocks.push({ type: "divider" });
        return;
      }

      if (tag === "ul" || tag === "ol") {
        const items = Array.from(el.querySelectorAll(":scope > li"))
          .map((li) => readText(li))
          .filter(Boolean);
        if (items.length > 0) {
          blocks.push({ type: "list", ordered: tag === "ol", items });
        }
        return;
      }

      if (tag === "table") {
        const headerCells = Array.from(el.querySelectorAll("thead tr th, thead tr td"))
          .map((cell) => readText(cell))
          .filter(Boolean);
        const bodyRows = Array.from(el.querySelectorAll("tbody tr"))
          .map((row) =>
            Array.from(row.querySelectorAll("th,td"))
              .map((cell) => readText(cell))
              .filter(Boolean),
          )
          .filter((row) => row.length > 0);

        if (headerCells.length > 0 || bodyRows.length > 0) {
          const inferredHeaders =
            headerCells.length > 0
              ? headerCells
              : bodyRows.length > 0
                ? bodyRows[0]
                : [];
          const inferredRows =
            headerCells.length > 0 ? bodyRows : bodyRows.slice(1);
          blocks.push({
            type: "table",
            headers: inferredHeaders,
            rows: inferredRows,
          });
        }
      }
    });

    if (blocks.length > 0) return blocks;
  }

  // Fallback for SSR or legacy drafts not carrying structured HTML.
  const fallback = normalizeMarkdownToReadableText(richHtmlToPlainText(trimmed));
  if (!fallback) return [];
  return fallback.split("\n\n").map((text) => ({ type: "paragraph", text }));
}

/** Older fundraiser drafts stored list-based markup; regenerate table layout from sidebar fields */
function legacyBulletedFundraisingBody(html: string): boolean {
  const h = html.trim();
  if (!h || /<table\b/i.test(h)) return false;
  if (!/<ul\b/i.test(h)) return false;
  return (
    /<h[34][^>]*>\s*Fundraising\s+goal\b/i.test(h) ||
    /<h[34][^>]*>\s*What your support will fund\b/i.test(h)
  );
}

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

  const base: LetterDraft = {
    id: d.id ?? newId(),
    dbId: (d as Partial<LetterDraft>).dbId ?? "",
    type: (d as Partial<LetterDraft>).type ?? "GENERAL",
    title: d.title ?? "",
    to: d.to ?? "",
    from: d.from ?? "",
    re: d.re ?? "",
    date: d.date ?? "",
    body: d.body ?? "",
    bodyRich: d.bodyRich ?? plainBodyToRichHtml(d.body ?? ""),
    issuingRoleKey: d.issuingRoleKey ?? "",
    officeLabel: d.officeLabel ?? LETTERHEAD_CONFIG.defaultOfficeLabel,
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
    fundraisingEnabled:
      d.fundraisingEnabled ?? d.signatoryMode === "FUNDRAISING",
    fundraisingInviteRole: d.fundraisingInviteRole ?? "Sponsor",
    fundraisingInviteRoleOther: d.fundraisingInviteRoleOther ?? "",
    fundraisingRecipientName: d.fundraisingRecipientName ?? "",
    fundraisingRecipientAddress: d.fundraisingRecipientAddress ?? "",
    fundraisingTargetAmount: d.fundraisingTargetAmount ?? "",
    fundraisingUseOfFunds: d.fundraisingUseOfFunds ?? "",
    fundraisingPaymentDeadline:
      d.fundraisingPaymentDeadline ?? DEFAULT_FUNDRAISING_PAYMENT_DEADLINE,
    fundraisingEventDate:
      d.fundraisingEventDate ?? DEFAULT_FUNDRAISING_EVENT_DATE,
    fundraisingEventTime:
      d.fundraisingEventTime ?? DEFAULT_FUNDRAISING_EVENT_TIME,
    fundraisingMeetingMedium:
      d.fundraisingMeetingMedium ?? DEFAULT_FUNDRAISING_MEETING_MEDIUM,
    fundraisingMeetingLink:
      d.fundraisingMeetingLink ?? DEFAULT_FUNDRAISING_MEETING_LINK,
    fundraisingMeetingId: d.fundraisingMeetingId ?? DEFAULT_FUNDRAISING_MEETING_ID,
    fundraisingMeetingPassword:
      d.fundraisingMeetingPassword ?? DEFAULT_FUNDRAISING_MEETING_PASSWORD,
    fundraisingLetterSampleApplied: d.fundraisingLetterSampleApplied ?? false,
    savedAt: d.savedAt ?? "",
  };

  if (
    base.fundraisingEnabled &&
    legacyBulletedFundraisingBody(base.bodyRich ?? "")
  ) {
    const rebuiltHtml = buildFundraisingLetterBodyRichHtml({
      fundraisingRecipientName: base.fundraisingRecipientName,
      fundraisingInviteRole: base.fundraisingInviteRole,
      fundraisingInviteRoleOther: base.fundraisingInviteRoleOther,
      fundraisingTargetAmount: base.fundraisingTargetAmount,
      fundraisingUseOfFunds: base.fundraisingUseOfFunds,
      fundraisingEventDate: base.fundraisingEventDate,
      fundraisingEventTime: base.fundraisingEventTime,
      fundraisingPaymentDeadline: base.fundraisingPaymentDeadline,
      fundraisingMeetingMedium: base.fundraisingMeetingMedium,
      fundraisingMeetingId: base.fundraisingMeetingId,
      fundraisingMeetingPassword: base.fundraisingMeetingPassword,
      fundraisingMeetingLink: base.fundraisingMeetingLink,
    });
    return {
      ...base,
      bodyRich: rebuiltHtml,
      body: richHtmlToPlainText(rebuiltHtml),
    };
  }

  return base;
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
    bodyRich: "<p></p>",
    issuingRoleKey: "",
    officeLabel: LETTERHEAD_CONFIG.defaultOfficeLabel,
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
    fundraisingEnabled: false,
    fundraisingInviteRole: "Sponsor",
    fundraisingInviteRoleOther: "",
    fundraisingRecipientName: "",
    fundraisingRecipientAddress: "",
    fundraisingTargetAmount: "",
    fundraisingUseOfFunds: "",
    fundraisingPaymentDeadline: DEFAULT_FUNDRAISING_PAYMENT_DEADLINE,
    fundraisingEventDate: DEFAULT_FUNDRAISING_EVENT_DATE,
    fundraisingEventTime: DEFAULT_FUNDRAISING_EVENT_TIME,
    fundraisingMeetingMedium: DEFAULT_FUNDRAISING_MEETING_MEDIUM,
    fundraisingMeetingLink: DEFAULT_FUNDRAISING_MEETING_LINK,
    fundraisingMeetingId: DEFAULT_FUNDRAISING_MEETING_ID,
    fundraisingMeetingPassword: DEFAULT_FUNDRAISING_MEETING_PASSWORD,
    fundraisingLetterSampleApplied: false,
    savedAt: "",
  };
}

function richTextIsEssentiallyEmpty(rich: string): boolean {
  const t = (rich ?? "").trim();
  if (!t) return true;
  if (t === "<p></p>" || t === "<p><br></p>" || t === "<p><br/></p>") {
    return true;
  }
  const plain = richHtmlToPlainText(t)
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .trim();
  return plain.length === 0;
}

function isLetterDraftBodyEmpty(d: LetterDraft): boolean {
  const rawBody = (d.body ?? "").replace(/\u00a0/g, " ").trim();
  if (rawBody) return false;
  return richTextIsEssentiallyEmpty(d.bodyRich ?? "");
}

function mergeFundraisingTemplateIfEligible(draft: LetterDraft): LetterDraft {
  if (!draft.fundraisingEnabled || !isLetterDraftBodyEmpty(draft)) {
    return draft;
  }
  return {
    ...applyFundraisingLetterSample(draft, "if-empty"),
    fundraisingLetterSampleApplied: true,
  };
}

function fundraisingBodyFieldsFromDraft(
  d: LetterDraft,
): Parameters<typeof buildFundraisingLetterBodyRichHtml>[0] {
  return {
    fundraisingRecipientName: d.fundraisingRecipientName,
    fundraisingInviteRole: d.fundraisingInviteRole,
    fundraisingInviteRoleOther: d.fundraisingInviteRoleOther,
    fundraisingTargetAmount: d.fundraisingTargetAmount,
    fundraisingUseOfFunds: d.fundraisingUseOfFunds,
    fundraisingEventDate: d.fundraisingEventDate,
    fundraisingEventTime: d.fundraisingEventTime,
    fundraisingPaymentDeadline: d.fundraisingPaymentDeadline,
    fundraisingMeetingMedium: d.fundraisingMeetingMedium,
    fundraisingMeetingId: d.fundraisingMeetingId,
    fundraisingMeetingPassword: d.fundraisingMeetingPassword,
    fundraisingMeetingLink: d.fundraisingMeetingLink,
  };
}

/** Fundraising defaults from `@/lib/conf/fundraising-letter-template` — editable in Composer afterward. */
function applyFundraisingLetterSample(
  draft: LetterDraft,
  mode: "if-empty" | "replace-all",
): LetterDraft {
  const trimmedUseOfFunds = FUNDRAISING_SAMPLE_USE_OF_FUNDS.trim();
  const bodyWasEmpty = isLetterDraftBodyEmpty(draft);
  let merged: LetterDraft = { ...draft };

  if (mode === "replace-all") {
    merged = {
      ...merged,
      title: FUNDRAISING_SAMPLE_DOC_TITLE,
      date: FUNDRAISING_SAMPLE_DATE_PLACEHOLDER,
      to: FUNDRAISING_SAMPLE_TO,
      from: FUNDRAISING_SAMPLE_FROM,
      re: FUNDRAISING_SAMPLE_SUBJECT,
      fundraisingInviteRole: "Sponsor",
      fundraisingInviteRoleOther: "",
      fundraisingRecipientName: FUNDRAISING_SAMPLE_RECIPIENT_NAME,
      fundraisingRecipientAddress: FUNDRAISING_SAMPLE_ADDRESS,
      fundraisingTargetAmount: FUNDRAISING_SAMPLE_TARGET_AMOUNT,
      fundraisingUseOfFunds: trimmedUseOfFunds,
      fundraisingEventDate: FUNDRAISING_SAMPLE_EVENT_DATE,
      fundraisingEventTime: FUNDRAISING_SAMPLE_EVENT_TIME,
      fundraisingPaymentDeadline: FUNDRAISING_SAMPLE_PAYMENT_DEADLINE,
      fundraisingMeetingMedium: DEFAULT_FUNDRAISING_MEETING_MEDIUM,
      fundraisingMeetingLink: DEFAULT_FUNDRAISING_MEETING_LINK,
      fundraisingMeetingId: DEFAULT_FUNDRAISING_MEETING_ID,
      fundraisingMeetingPassword: DEFAULT_FUNDRAISING_MEETING_PASSWORD,
    };
  } else {
    if (!(merged.title ?? "").trim()) {
      merged = { ...merged, title: FUNDRAISING_SAMPLE_DOC_TITLE };
    }
    if (!(merged.date ?? "").trim()) {
      merged = { ...merged, date: FUNDRAISING_SAMPLE_DATE_PLACEHOLDER };
    }
    if (!(merged.to ?? "").trim()) merged = { ...merged, to: FUNDRAISING_SAMPLE_TO };
    if (!(merged.from ?? "").trim())
      merged = { ...merged, from: FUNDRAISING_SAMPLE_FROM };
    if (!(merged.re ?? "").trim())
      merged = { ...merged, re: FUNDRAISING_SAMPLE_SUBJECT };
    if (!(merged.fundraisingRecipientName ?? "").trim()) {
      merged = {
        ...merged,
        fundraisingRecipientName: FUNDRAISING_SAMPLE_RECIPIENT_NAME,
      };
    }
    if (!(merged.fundraisingRecipientAddress ?? "").trim()) {
      merged = {
        ...merged,
        fundraisingRecipientAddress: FUNDRAISING_SAMPLE_ADDRESS,
      };
    }
    if (!(merged.fundraisingTargetAmount ?? "").trim()) {
      merged = {
        ...merged,
        fundraisingTargetAmount: FUNDRAISING_SAMPLE_TARGET_AMOUNT,
      };
    }
    if (!(merged.fundraisingUseOfFunds ?? "").trim()) {
      merged = {
        ...merged,
        fundraisingUseOfFunds: trimmedUseOfFunds,
      };
    }
  }

  const wantBody = mode === "replace-all" || bodyWasEmpty;
  if (!wantBody) return merged;

  const html = buildFundraisingLetterBodyRichHtml(
    fundraisingBodyFieldsFromDraft(merged),
  );
  return {
    ...merged,
    bodyRich: html,
    body: richHtmlToPlainText(html),
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

type LetterBodyBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "blockquote"; text: string }
  | { type: "divider" };

// ── Page Metrics: Geometry helpers for layout-aware pagination ─────────────

/**
 * Defines the dimensions and typography for a letter page variant.
 * Enables proper text wrapping and capacity calculations based on actual
 * page geometry rather than abstract line counts.
 */
type PageMetrics = {
  name: string;
  contentWidth: number; // Actual available width in px (after sidebars/padding)
  contentHeight: number; // Available height in px (after header/footer)
  paddingLeft: number;
  paddingRight: number;
  fontSize: number;
  lineHeight: number; // Multiplier (e.g., 1.8 = 1.8x fontSize)
};

function getUsableTextWidth(metrics: PageMetrics): number {
  return Math.max(
    120,
    metrics.contentWidth - metrics.paddingLeft - metrics.paddingRight,
  );
}

function measureTextWidth(text: string, metrics: PageMetrics): number {
  if (typeof document === "undefined") {
    // SSR fallback; keeps behavior deterministic outside browser context.
    return text.length * (metrics.fontSize * 0.52);
  }
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return text.length * (metrics.fontSize * 0.52);
  }
  ctx.font = `${metrics.fontSize}px Helvetica Neue, Arial, sans-serif`;
  return ctx.measureText(text).width;
}

/** Calculate line count capacity based on available height */
function estimateLinesPerPage(metrics: PageMetrics): number {
  const lineHeightPx = metrics.fontSize * metrics.lineHeight;
  return Math.floor(metrics.contentHeight / lineHeightPx);
}

/** Approximate pagination lines for the embedded fundraising flyer at full column width */
function estimateEmbeddedFlyerEquivalentLines(metrics: PageMetrics): number {
  const linePx = metrics.fontSize * metrics.lineHeight;
  const textWidthPx = Math.max(
    120,
    metrics.contentWidth - metrics.paddingLeft - metrics.paddingRight,
  );
  const approxFlyerHeightPx = Math.min(
    metrics.contentHeight * 0.88,
    textWidthPx * 1.22,
  );
  return Math.max(14, Math.ceil(approxFlyerHeightPx / linePx));
}

/**
 * Wrap a single paragraph into lines, respecting max character width.
 */
function wrapParagraph(paragraph: string, metrics: PageMetrics): string[] {
  const words = paragraph.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  const maxWidth = getUsableTextWidth(metrics);

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureTextWidth(candidate, metrics) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (measureTextWidth(word, metrics) <= maxWidth) {
        current = word;
        continue;
      }
      // Hard-wrap very long tokens so they don't overflow.
      let segment = "";
      for (const ch of word) {
        const next = segment + ch;
        if (measureTextWidth(next, metrics) <= maxWidth) {
          segment = next;
        } else {
          if (segment) lines.push(segment);
          segment = ch;
        }
      }
      current = segment;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

/**
 * When estimating "will this block fit on the previous sheet?", allow a few extra
 * line-slots so preview pages fill closer to the A4 limit (table/heading heuristics
 * are slightly pessimistic). Keeps greedy breaks strict; only slack backfill uses this.
 */
const PAGINATION_BACKFILL_LINE_TOLERANCE = 3;

function estimateBlockLines(block: LetterBodyBlock, metrics: PageMetrics): number {
  const paragraphLines = (text: string, bonus = 1) =>
    Math.max(1, wrapParagraph(text, metrics).length + bonus);

  if (block.type === "heading") {
    return paragraphLines(block.text, block.level <= 2 ? 2 : 1);
  }
  if (block.type === "paragraph") {
    return paragraphLines(block.text, 1);
  }
  if (block.type === "blockquote") {
    return paragraphLines(block.text, 2);
  }
  if (block.type === "divider") {
    return 2;
  }
  if (block.type === "list") {
    return (
      block.items.reduce(
        (sum, item, idx) =>
          sum +
          Math.max(1, wrapParagraph(`${block.ordered ? `${idx + 1}. ` : "• "}${item}`, metrics).length),
        0,
      ) + 1
    );
  }
  if (block.type === "table") {
    const hasHeaderRow = block.headers.length > 0 ? 1 : 0;
    const rowCount = hasHeaderRow + block.rows.length;
    // Render uses 10.5px type and ~4px padding; ~1.15–1.25 "line units" per row is closer than 1.65.
    return Math.max(3, Math.ceil(rowCount * 1.22) + 1);
  }
  return 2;
}

/**
 * Headings stranded alone at the foot of a page (with their table/list on the next sheet)
 * create large empty margins. Pull trailing headings onto the next page whenever possible.
 */
function coalesceTrailingHeadingsOntoNextPage(
  pages: LetterBodyBlock[][],
): LetterBodyBlock[][] {
  const out = pages;
  let p = 0;
  while (p < Math.max(0, out.length - 1)) {
    const cur = out[p];
    const nxt = out[p + 1];
    if (!cur?.length || !nxt?.length) {
      p++;
      continue;
    }
    if (cur[cur.length - 1].type !== "heading") {
      p++;
      continue;
    }
    nxt.unshift(cur.pop()!);
    if (cur.length === 0) out.splice(p, 1);
    else p++;
  }
  return out.length > 0 ? out : [[]];
}

/** Fix stray empty pagination buckets */
function dropEmptyPaginationPages(pages: LetterBodyBlock[][]): LetterBodyBlock[][] {
  const next = pages.filter((seg) => seg.length > 0);
  return next.length > 0 ? next : [[]];
}

/**
 * Greedy pagination can leave large trailing slack on page P while P+1 begins with
 * a block that would still fit (e.g. a table after a section title). Pull blocks
 * forward so we fill vertical slack for every letter body, not just this template.
 */
function backfillSlackOnce(
  pages: LetterBodyBlock[][],
  firstCap: number,
  continuationCap: number,
  firstPageMetrics: PageMetrics,
  continuationPageMetrics: PageMetrics,
  lineTolerance = 0,
): boolean {
  let moved = false;
  for (let p = 0; p < pages.length - 1; p++) {
    const cap = p === 0 ? firstCap : continuationCap;
    const targetMetrics =
      p === 0 ? firstPageMetrics : continuationPageMetrics;
    while (pages[p + 1]?.length) {
      const head = pages[p + 1][0];
      const used = pages[p].reduce(
        (sum, b) => sum + estimateBlockLines(b, targetMetrics),
        0,
      );
      const add = estimateBlockLines(head, targetMetrics);
      if (used + add <= cap + lineTolerance) {
        pages[p].push(pages[p + 1].shift()!);
        moved = true;
      } else {
        break;
      }
    }
  }
  return moved;
}

function spliceOutEmptyIntermediatePages(pages: LetterBodyBlock[][]): void {
  for (let i = pages.length - 1; i >= 0; i--) {
    if (pages[i].length === 0 && pages.length > 1) {
      pages.splice(i, 1);
    }
  }
}

function runBackfillSlackConvergence(
  pages: LetterBodyBlock[][],
  firstCap: number,
  continuationCap: number,
  firstPageMetrics: PageMetrics,
  continuationPageMetrics: PageMetrics,
  lineTolerance = 0,
): void {
  for (let guard = 0; guard < 32; guard++) {
    spliceOutEmptyIntermediatePages(pages);
    const moved = backfillSlackOnce(
      pages,
      firstCap,
      continuationCap,
      firstPageMetrics,
      continuationPageMetrics,
      lineTolerance,
    );
    if (!moved) break;
  }
  spliceOutEmptyIntermediatePages(pages);
}

function paginateBodyBlocks(
  blocks: LetterBodyBlock[],
  firstPageMetrics: PageMetrics,
  continuationPageMetrics: PageMetrics,
  signatureReserveLines: number,
  firstPageLeadReserveLines: number,
): LetterBodyBlock[][] {
  if (blocks.length === 0) return [[]];

  const rawFirstCap = estimateLinesPerPage(firstPageMetrics);
  const rawContinuationCap = estimateLinesPerPage(continuationPageMetrics);
  // Subtract To/From/date chrome from raw line budget first, then apply a light margin.
  // (Applying margin to the full page before subtracting lead was over-penalizing body space.)
  const firstCap = Math.max(
    14,
    Math.floor(
      Math.max(0, rawFirstCap - Math.max(0, firstPageLeadReserveLines)) * 0.985,
    ),
  );
  const continuationCap = Math.max(
    14,
    Math.floor(rawContinuationCap * 0.985),
  );

  const pages: LetterBodyBlock[][] = [[]];
  let pageIndex = 0;
  let usedLines = 0;

  const pageCap = () => (pageIndex === 0 ? firstCap : continuationCap);

  const metricsAt = () =>
    pageIndex === 0 ? firstPageMetrics : continuationPageMetrics;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const metrics = metricsAt();
    const blockLines = estimateBlockLines(block, metrics);
    const nextBlock = blocks[i + 1];
    const nextLines = nextBlock
      ? estimateBlockLines(nextBlock, metrics)
      : 0;

    // Do not end a page with a section title while its following block is forced to the next sheet.
    if (
      block.type === "heading" &&
      nextBlock &&
      pages[pageIndex].length > 0
    ) {
      const remainder = pageCap() - usedLines;
      const headingFitsInRemainder = remainder >= blockLines;
      const pairFitsInRemainder = remainder >= blockLines + nextLines;
      if (headingFitsInRemainder && !pairFitsInRemainder) {
        pages.push([]);
        pageIndex += 1;
        usedLines = 0;
      }
    }

    if (usedLines + blockLines > pageCap() && pages[pageIndex].length > 0) {
      pages.push([]);
      pageIndex += 1;
      usedLines = 0;
    }

    const blockMetrics = metricsAt();
    pages[pageIndex].push(block);
    usedLines += estimateBlockLines(block, blockMetrics);
  }

  runBackfillSlackConvergence(
    pages,
    firstCap,
    continuationCap,
    firstPageMetrics,
    continuationPageMetrics,
    PAGINATION_BACKFILL_LINE_TOLERANCE,
  );
  let normalized = dropEmptyPaginationPages(pages);
  normalized = coalesceTrailingHeadingsOntoNextPage(normalized);
  normalized = dropEmptyPaginationPages(normalized);

  if (signatureReserveLines > 0 && normalized.length > 0) {
    let lastIndex = normalized.length - 1;
    const reserveCap = Math.max(
      8,
      (lastIndex === 0 ? firstCap : continuationCap) - signatureReserveLines,
    );

    let used = normalized[lastIndex].reduce(
      (sum, block) =>
        sum +
        estimateBlockLines(
          block,
          lastIndex === 0 ? firstPageMetrics : continuationPageMetrics,
        ),
      0,
    );

    while (used > reserveCap && normalized[lastIndex].length > 1) {
      const moved = normalized[lastIndex].pop();
      if (!moved) break;
      if (!normalized[lastIndex + 1]) normalized.push([]);
      normalized[lastIndex + 1].unshift(moved);
      used = normalized[lastIndex].reduce(
        (sum, block) =>
          sum +
          estimateBlockLines(
            block,
            lastIndex === 0 ? firstPageMetrics : continuationPageMetrics,
          ),
        0,
      );
      lastIndex = normalized.length - 1;
    }
  }

  runBackfillSlackConvergence(
    normalized,
    firstCap,
    continuationCap,
    firstPageMetrics,
    continuationPageMetrics,
    PAGINATION_BACKFILL_LINE_TOLERANCE,
  );
  normalized = coalesceTrailingHeadingsOntoNextPage(normalized);
  normalized = dropEmptyPaginationPages(normalized);

  return normalized;
}

function renderBodyBlocks(blocks: LetterBodyBlock[], keyPrefix: string) {
  return blocks.map((block, idx) => {
    const key = `${keyPrefix}-${idx}`;

    if (block.type === "heading") {
      const fontSize = block.level === 1 ? 17 : block.level === 2 ? 15 : 13;
      return (
        <div
          key={key}
          style={{
            fontSize,
            fontWeight: 700,
            color: C.navy,
            marginTop: block.level <= 2 ? 8 : 6,
            marginBottom: 6,
            lineHeight: 1.4,
          }}
        >
          {block.text}
        </div>
      );
    }

    if (block.type === "paragraph") {
      return (
        <p
          key={key}
          style={{
            fontSize: 12,
            color: "#222",
            lineHeight: 1.8,
            margin: "0 0 8px",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
        >
          {block.text}
        </p>
      );
    }

    if (block.type === "blockquote") {
      return (
        <blockquote
          key={key}
          style={{
            margin: "6px 0 10px",
            padding: "2px 0 2px 10px",
            borderLeft: `3px solid ${C.gold}`,
            color: "#444",
            fontStyle: "italic",
            fontSize: 11.5,
            lineHeight: 1.7,
          }}
        >
          {block.text}
        </blockquote>
      );
    }

    if (block.type === "divider") {
      return (
        <div
          key={key}
          style={{ height: 1, background: `${C.gold}80`, margin: "10px 0" }}
        />
      );
    }

    if (block.type === "list") {
      return (
        <div key={key} style={{ marginBottom: 10 }}>
          {block.items.map((item, itemIdx) => (
            <div
              key={`${key}-item-${itemIdx}`}
              style={{
                fontSize: 12,
                color: "#222",
                lineHeight: 1.8,
                marginBottom: 3,
                paddingLeft: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <span style={{ minWidth: 18 }}>
                {block.ordered ? `${itemIdx + 1}.` : "•"}
              </span>
              <span style={{ flex: 1, whiteSpace: "pre-wrap", overflowWrap: "break-word" }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === "table") {
      return (
        <div key={key} style={{ margin: "8px 0 12px", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 10.5,
              color: "#222",
            }}
          >
            {block.headers.length > 0 && (
              <thead>
                <tr>
                  {block.headers.map((header, headerIdx) => (
                    <th
                      key={`${key}-head-${headerIdx}`}
                      style={{
                        border: `1px solid ${C.divider}55`,
                        background: `${C.navy}10`,
                        padding: "4px 6px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: C.navy,
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, rowIdx) => (
                <tr key={`${key}-row-${rowIdx}`}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={`${key}-cell-${rowIdx}-${cellIdx}`}
                      style={{
                        border: `1px solid ${C.divider}40`,
                        padding: "4px 6px",
                        verticalAlign: "top",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  });
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

  /** Screen preview: rigid A4 frame; `@media print` / popup print CSS overrides with height:auto */
  const letterPageChrome = {
    width: PAGE_W,
    minHeight: PAGE_H,
    height: PAGE_H,
    maxHeight: PAGE_H,
    overflow: "hidden" as const,
    flexShrink: 0 as const,
  };

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
    : "July 24 – 27, 2026";
  const venue = confInfo?.venue ?? LETTERHEAD_CONFIG.defaultVenue;

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
  const fundraiserFooterPack =
    draft.fundraisingEnabled && signatories.length > 0;
  const paymentNoteLinesApprox = fundraiserFooterPack ? 8 : 0;
  const embeddedFlyerLinesApproxRaw = fundraiserFooterPack
    ? Math.max(
        estimateEmbeddedFlyerEquivalentLines(firstPageMetrics),
        estimateEmbeddedFlyerEquivalentLines(continuationPageMetrics),
      )
    : 0;
  // The flyer attaches only to the signature sheet — reserving its full px height against
  // pagination line counts was forcing almost all Letter Body blocks off page 1.
  const embeddedFlyerLinesApproxForPagination =
    fundraiserFooterPack ? Math.min(embeddedFlyerLinesApproxRaw, 22) : 0;
  const signatureReserveLines =
    signaturesBlockLines +
    paymentNoteLinesApprox +
    embeddedFlyerLinesApproxForPagination;

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
  const firstPageLeadReserveLines =
    8 +
    newlineRows(draft.to) * 2 +
    newlineRows(draft.from) * 2 +
    (draft.re.trim() ? 3 : 0);

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
  const showFundraisingFlyer = Boolean(draft.fundraisingEnabled);
  const totalPages = 1 + continuationBodies.length;
  const officeLabel =
    (draft.officeLabel ?? "").trim() || LETTERHEAD_CONFIG.defaultOfficeLabel;

  /** Embedded flyer + payment slabs (flows under signatures on final letter sheet) */
  function renderEmbeddedFundraisingFlyer(): ReactNode {
    if (!showFundraisingFlyer) return null;

    return (
      <div
        className="letter-embedded-flyer"
        style={{
          width: "100%",
          marginTop: 10,
          pageBreakInside: "avoid",
          breakInside: "avoid",
          borderTop: `1px solid ${C.gold}`,
          paddingTop: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: C.navy }}>
            Fundraising flyer — payment methods
          </div>
          <div style={{ fontSize: 8.5, color: C.muted, fontStyle: "italic" }}>
            {officeLabel}
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/conf/funraising.png"
          alt="LSUIC fundraising campaign flyer — payment channels"
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            border: "1px solid #d9d9d9",
            borderRadius: 6,
            background: "#fff",
          }}
        />
        <div
          style={{
            fontSize: 8.5,
            color: C.muted,
            marginTop: 6,
            lineHeight: 1.35,
          }}
        >
          Scannable payment details: Mobile Money, UBA, WeChat Pay, and Alipay
          (see the flyer graphic in this section).
        </div>
      </div>
    );
  }

  /** Note immediately above the embedded payment flyer */
  function renderPaymentMediumPreflyerNote(): ReactNode {
    if (!showFundraisingFlyer) return null;

    return (
      <div
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          boxSizing: "border-box",
          marginTop: 18,
          marginBottom: 4,
          border: `1px solid ${C.navy}`,
          borderLeftWidth: 4,
          borderLeftColor: C.navy,
          borderRadius: 4,
          background: "#f8fafc",
          padding: "12px 16px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.navy,
            letterSpacing: "0.4px",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Payment instructions (see flyer below)
        </div>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            color: "#1e293b",
            lineHeight: 1.6,
            overflowWrap: "break-word",
          }}
        >
          Detailed <strong style={{ fontWeight: 700 }}>payment mediums</strong>{" "}
          are shown on <strong>the flyer image directly below</strong>. Please
          pay only through those channels —
          <strong> Mobile Money</strong>, <strong>UBA (bank)</strong>,{" "}
          <strong>WeChat Pay</strong>, or <strong>Alipay</strong> — using the
          QR codes and account titles on that flyer.
        </p>
      </div>
    );
  }

  return (
    <>
      <div
        className="letter-page"
        style={{
          ...letterPageChrome,
          background: C.white,
          display: "flex",
          flexDirection: "column",
          boxShadow: forPrint ? "none" : "0 4px 32px rgba(0,0,0,0.18)",
          outline: forPrint ? "none" : "1px solid rgba(0,0,0,0.06)",
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
              {LETTERHEAD_CONFIG.organizationName}
            </div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: C.gold,
                marginTop: 4,
              }}
            >
              {confInfo?.name ?? LETTERHEAD_CONFIG.defaultConferenceName}
            </div>
            <div style={{ fontSize: 8.5, color: "#555", marginTop: 4 }}>
              {venue}
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>
              {buildCityRegionLine(confInfo?.city)}
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>{dateRange}</div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
              {buildLetterheadEmailLine()}
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
                renderBodyBlocks(firstPageBlocks, "first-page")
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
            {showSignaturesOnFirstPage &&
              signatories.length > 0 &&
              renderPaymentMediumPreflyerNote()}
            {showSignaturesOnFirstPage &&
              signatories.length > 0 &&
              renderEmbeddedFundraisingFlyer()}
          </div>
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
              Page 1 of {totalPages}
            </div>
          </div>
        </div>
      </div>

      {continuationBodies.map((segmentBlocks, idx) => {
        const isLast = idx === continuationBodies.length - 1;
        return (
          <div
            key={`cont-${idx}`}
            className="letter-page continuation-page"
            style={{
              ...letterPageChrome,
              background: C.white,
              display: "flex",
              flexDirection: "column",
              boxShadow: forPrint ? "none" : "0 4px 32px rgba(0,0,0,0.18)",
              outline: forPrint ? "none" : "1px solid rgba(0,0,0,0.06)",
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
              {FLAG_STRIPES_11.map((color, i) => (
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
                {LETTERHEAD_CONFIG.organizationName}
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
              <div>{renderBodyBlocks(segmentBlocks, `continuation-${idx}`)}</div>

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
              {isLast &&
                signatories.length > 0 &&
                renderPaymentMediumPreflyerNote()}
              {isLast &&
                signatories.length > 0 &&
                renderEmbeddedFundraisingFlyer()}
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
                  Page {idx + 2} of {totalPages}
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
  const [saveToDbStatus, setSaveToDbStatus] = useState<
    "idle" | "saved" | "error"
  >("idle");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signatureLibrary, setSignatureLibrary] = useState<
    Record<string, SignatureProfile>
  >({});

  const resolveSignatureForName = useCallback(
    (name: string) => {
      const key = normalizeSignatureProfileKey(name);
      return signatureLibrary[key]?.signatureDataUrl ?? "";
    },
    [signatureLibrary],
  );

  const hydrateDraftSignatures = useCallback(
    (draft: LetterDraft): LetterDraft => {
      const sig1 =
        draft.signatory1Sig || resolveSignatureForName(draft.signatory1Name);
      const sig2 =
        draft.signatory2Sig || resolveSignatureForName(draft.signatory2Name);
      const sig3 =
        draft.signatory3Sig || resolveSignatureForName(draft.signatory3Name);
      return {
        ...draft,
        signatory1Sig: sig1,
        signatory2Sig: sig2,
        signatory3Sig: sig3,
      };
    },
    [resolveSignatureForName],
  );

  const saveSignatureProfile = useCallback(
    async (name: string, title: string, signatureDataUrl: string) => {
      const normalizedName = name.trim();
      if (!confId || !normalizedName || !signatureDataUrl) return;

      const key = normalizeSignatureProfileKey(normalizedName);
      const profile: SignatureProfile = {
        key,
        name: normalizedName,
        title: title.trim(),
        signatureDataUrl,
      };

      setSignatureLibrary((prev) => ({ ...prev, [key]: profile }));
      setActiveDraft((draft) => ({
        ...draft,
        signatory1Sig:
          normalizeSignatureProfileKey(draft.signatory1Name) === key
            ? signatureDataUrl
            : draft.signatory1Sig,
        signatory2Sig:
          normalizeSignatureProfileKey(draft.signatory2Name) === key
            ? signatureDataUrl
            : draft.signatory2Sig,
        signatory3Sig:
          normalizeSignatureProfileKey(draft.signatory3Name) === key
            ? signatureDataUrl
            : draft.signatory3Sig,
      }));

      try {
        await fetch(`/api/conf/${confId}/letters/signatures`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
      } catch (err) {
        console.warn("Failed to persist signature profile", err);
      }
    },
    [confId],
  );

  // ── Fetch conf data ──────────────────────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const conf = await fetchDefaultConference();
        setConfId(conf.id);

        const membersRes = await fetch(`/api/conf/${conf.id}/members`);

        const [rolesRes, bookletRes, signaturesRes] = await Promise.all([
          fetch(`/api/conf/${conf.id}/roles`, { cache: "no-store" }).catch(
            () => null,
          ),
          fetch(`/api/conf/${conf.id}/booklet/data`, {
            cache: "no-store",
          }).catch(() => null),
          fetch(`/api/conf/${conf.id}/letters/signatures`, {
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

        if (signaturesRes?.ok) {
          const signatureData = (await signaturesRes.json()) as {
            profiles?: SignatureProfile[];
          };
          const mapped = (signatureData.profiles ?? []).reduce<
            Record<string, SignatureProfile>
          >((acc, profile) => {
            if (!profile?.key || !profile?.signatureDataUrl) return acc;
            acc[profile.key] = profile;
            return acc;
          }, {});
          setSignatureLibrary(mapped);
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
    if (Object.keys(signatureLibrary).length === 0) return;
    setActiveDraft((current) => hydrateDraftSignatures(current));
    setDrafts((current) => current.map((draft) => hydrateDraftSignatures(draft)));
  }, [signatureLibrary, hydrateDraftSignatures]);

  useEffect(() => {
    if (
      activeDraft.signatoryMode === "FUNDRAISING" &&
      !activeDraft.fundraisingEnabled
    ) {
      setActiveDraft((draft) => ({ ...draft, fundraisingEnabled: true }));
    }
  }, [activeDraft.signatoryMode, activeDraft.fundraisingEnabled]);

  useEffect(() => {
    setActiveDraft((d) => mergeFundraisingTemplateIfEligible(d));
  }, [activeDraft.fundraisingEnabled, activeDraft.body, activeDraft.bodyRich]);

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
    setActiveDraft(hydrateDraftSignatures(d));
    setShowList(false);
  }, [hydrateDraftSignatures]);

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
        setActiveDraft(hydrateDraftSignatures(draft));
        // Also persist to local drafts so auto-save keeps it
        setDrafts((prev) => {
          const exists = prev.find((d) => d.id === draft.id);
          const next = exists
            ? prev.map((d) =>
                d.id === draft.id ? hydrateDraftSignatures(draft) : d,
              )
            : [hydrateDraftSignatures(draft), ...prev];
          saveDrafts(next);
          return next;
        });
        setView("composer");
      } catch {
        // ignore
      }
    },
    [confId, hydrateDraftSignatures],
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
          const s1Name = secretary?.name ?? "";
          const s2Name = viceChair?.name ?? "";
          const s3Name = chair?.name ?? "";
          return {
            ...d,
            signatoryMode: mode,
            signatory1Name: s1Name,
            signatory1Title:
              secretary?.title ??
              ROLE_LABELS[secretary?.role ?? ""] ??
              "Conference Secretary",
            signatory1Label: "Signed",
            signatory1Sig: resolveSignatureForName(s1Name),
            signatory2Name: s2Name,
            signatory2Title:
              viceChair?.title ??
              ROLE_LABELS[viceChair?.role ?? ""] ??
              "Conference Vice-Chair",
            signatory2Label: "Approved",
            signatory2Sig: resolveSignatureForName(s2Name),
            signatory3Name: s3Name,
            signatory3Title:
              chair?.title ??
              ROLE_LABELS[chair?.role ?? ""] ??
              "Conference Chair",
            signatory3Label: "Attested",
            signatory3Sig: resolveSignatureForName(s3Name),
          };
        }

        if (mode === "FUNDRAISING") {
          // Order: Secretary (Signed) → Chair (Approved) → NEC President (Attested)
          const s1Name = secretary?.name ?? "";
          const s2Name = chair?.name ?? "";
          const s3Name = necPresidentName || "";
          const next: LetterDraft = {
            ...d,
            signatoryMode: mode,
            fundraisingEnabled: true,
            signatory1Name: s1Name,
            signatory1Title:
              secretary?.title ??
              ROLE_LABELS[secretary?.role ?? ""] ??
              "Conference Secretary",
            signatory1Label: "Signed",
            signatory1Sig: resolveSignatureForName(s1Name),
            signatory2Name: s2Name,
            signatory2Title:
              chair?.title ??
              ROLE_LABELS[chair?.role ?? ""] ??
              "Conference Chair",
            signatory2Label: "Approved",
            signatory2Sig: resolveSignatureForName(s2Name),
            signatory3Name: s3Name,
            signatory3Title: necPresidentName
              ? "National President (LSUIC)"
              : "",
            signatory3Label: "Attested",
            signatory3Sig: resolveSignatureForName(s3Name),
          };
          return mergeFundraisingTemplateIfEligible(next);
        }

        return { ...d, signatoryMode: mode };
      });
    },
    [members, necPresidentName, resolveSignatureForName],
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
      html, body { background: #fff !important; width: 210mm; overflow: visible; }
      .letter-page {
        width: 210mm !important;
        min-height: 297mm !important;
        height: auto !important;
        box-shadow: none !important;
        break-after: page;
        page-break-after: always;
      }
      .letter-page:last-child {
        break-after: auto;
        page-break-after: auto;
      }
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
          .letter-embedded-flyer {
            page-break-inside: avoid;
            break-inside: avoid;
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
                  <span className="ml-0.5 text-[10px] opacity-70">
                    ({libraryTotal})
                  </span>
                )}
              </button>
            </div>

            {view === "composer" && (
              <>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {saveStatus === "saved" ? (
                    <>
                      <CheckCircle2 className="size-3.5 text-emerald-500" />{" "}
                      Saved
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
                  title={
                    activeDraft.dbId
                      ? "Update saved letter in Library"
                      : "Save letter to Library (database)"
                  }
                >
                  {saveToDbStatus === "saved" ? (
                    <>
                      <CheckCircle2 className="size-4" /> Saved to Library
                    </>
                  ) : saveToDbStatus === "error" ? (
                    <>
                      <AlertCircle className="size-4" /> Save Failed
                    </>
                  ) : savingToDb ? (
                    <>
                      <CloudUpload className="size-4" /> Saving…
                    </>
                  ) : (
                    <>
                      <CloudUpload className="size-4" />{" "}
                      {activeDraft.dbId ? "Update Library" : "Save to Library"}
                    </>
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
              {(
                [
                  "",
                  "MEMO",
                  "MINUTES",
                  "ANNOUNCEMENT",
                  "BUDGET_LETTER",
                  "PAYMENT_RECEIPT",
                  "GENERAL",
                ] as (LetterType | "")[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setLibraryFilter(t);
                    setLibraryPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    libraryFilter === t
                      ? "bg-[#002868] text-white border-[#002868]"
                      : "border-border hover:bg-muted/50"
                  }`}
                  style={
                    t && libraryFilter !== t
                      ? {
                          borderColor:
                            LETTER_TYPE_COLORS[t as LetterType] + "44",
                          color: LETTER_TYPE_COLORS[t as LetterType],
                        }
                      : {}
                  }
                >
                  {t ? LETTER_TYPE_LABELS[t as LetterType] : "All"}
                </button>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {libraryTotal} letter{libraryTotal !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Card grid */}
            {libraryLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                Loading library…
              </div>
            ) : library.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <BookOpen className="size-10 opacity-30" />
                <p className="text-sm">No saved letters yet.</p>
                <p className="text-xs">
                  Compose a letter and click &quot;Save to Library&quot; to
                  store it here.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setView("composer")}
                >
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
                              {new Date(rec.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {rec.updatedAt !== rec.createdAt && (
                            <div className="text-[10px] text-muted-foreground/60">
                              Updated{" "}
                              {new Date(rec.updatedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
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
                Auto-saved on this device. Use &quot;Save to Library&quot; to
                store permanently.
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
        {view === "composer" && (
          <div className="letter-no-print flex gap-6 flex-1 min-h-0">
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
                      onChange={(e) =>
                        setActiveDraft((d) => ({
                          ...d,
                          type: e.target.value as LetterType,
                        }))
                      }
                    >
                      {(Object.keys(LETTER_TYPE_LABELS) as LetterType[]).map(
                        (t) => (
                          <option key={t} value={t}>
                            {LETTER_TYPE_LABELS[t]}
                          </option>
                        ),
                      )}
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
                  <CardTitle className="text-sm">
                    Fundraising Attachment & Invite Context
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Appends the fundraiser flyer on the last page. Letter copy is
                    generated in TypeScript from the fundraising fields when the body
                    is blank or when you load the sample. After changing dates, Zoom,
                    target, invitation category, or use-of-funds, click &quot;Update
                    letter from fields&quot; to refresh the Letter Body (replacing
                    its current text).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#002868]">
                    <input
                      type="checkbox"
                      checked={activeDraft.fundraisingEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setActiveDraft((d) =>
                          mergeFundraisingTemplateIfEligible({
                            ...d,
                            fundraisingEnabled: checked,
                            ...(checked
                              ? {}
                              : { fundraisingLetterSampleApplied: false }),
                          }),
                        );
                      }}
                    />
                    Enable fundraising mode and add flyer (`/conf/funraising.png`)
                  </label>

                  {activeDraft.fundraisingEnabled && (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="h-8 shrink-0 text-xs"
                            onClick={() => {
                              const touched =
                                !isLetterDraftBodyEmpty(activeDraft) ||
                                !!(activeDraft.to ?? "").trim() ||
                                !!(activeDraft.from ?? "").trim() ||
                                !!(activeDraft.re ?? "").trim() ||
                                !!(activeDraft.title ?? "").trim();

                              if (
                                touched &&
                                typeof window !== "undefined" &&
                                !window.confirm(
                                  "Replace letter body, header fields, and fundraising details with the built-in LSUIC fundraising sample?",
                                )
                              ) {
                                return;
                              }
                              setActiveDraft((d) => ({
                                ...applyFundraisingLetterSample(d, "replace-all"),
                                fundraisingLetterSampleApplied: true,
                              }));
                            }}
                          >
                            Load full sample letter
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            className="h-8 shrink-0 border-dashed text-xs"
                            onClick={() => {
                              if (
                                typeof window !== "undefined" &&
                                !isLetterDraftBodyEmpty(activeDraft) &&
                                !window.confirm(
                                  "Replace the Letter Body with freshly generated text from the fundraising fields on the left?",
                                )
                              ) {
                                return;
                              }
                              setActiveDraft((d) => {
                                const html = buildFundraisingLetterBodyRichHtml(
                                  fundraisingBodyFieldsFromDraft(d),
                                );
                                return {
                                  ...d,
                                  bodyRich: html,
                                  body: richHtmlToPlainText(html),
                                  fundraisingLetterSampleApplied: true,
                                };
                              });
                            }}
                          >
                            Update letter from fields
                          </Button>
                        </div>
                        <p className="text-[11px] leading-snug text-muted-foreground">
                          Source:{" "}
                          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[10px]">
                            src/lib/conf/fundraising-letter-template.ts
                          </code>{" "}
                          (not loaded from markdown).
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs">Invitation Category</Label>
                        <select
                          className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                          value={activeDraft.fundraisingInviteRole}
                          onChange={(e) =>
                            set("fundraisingInviteRole")(e.target.value)
                          }
                        >
                          {[
                            "Sponsor",
                            "Keynote Speaker",
                            "Patron",
                            "Donor",
                            "Partner Organization",
                            "Well-wisher",
                            "Other",
                          ].map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                      {activeDraft.fundraisingInviteRole === "Other" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Custom Invitation Category
                          </Label>
                          <Input
                            className="h-8 text-sm"
                            placeholder="e.g. Strategic Development Partner"
                            value={activeDraft.fundraisingInviteRoleOther}
                            onChange={(e) =>
                              set("fundraisingInviteRoleOther")(e.target.value)
                            }
                          />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Recipient Name (optional)</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="e.g. Ms. Jane Doe"
                          value={activeDraft.fundraisingRecipientName}
                          onChange={(e) =>
                            set("fundraisingRecipientName")(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Recipient Address (optional)
                        </Label>
                        <Textarea
                          className="text-sm resize-none"
                          rows={2}
                          placeholder="Organization / mailing address"
                          value={activeDraft.fundraisingRecipientAddress}
                          onChange={(e) =>
                            set("fundraisingRecipientAddress")(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Target Fundraising Amount</Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder="e.g. RMB 120,000"
                          value={activeDraft.fundraisingTargetAmount}
                          onChange={(e) =>
                            set("fundraisingTargetAmount")(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Intended Use of Funds</Label>
                        <Textarea
                          className="text-sm resize-none"
                          rows={3}
                          placeholder="State what the fundraising amount will cover."
                          value={activeDraft.fundraisingUseOfFunds}
                          onChange={(e) =>
                            set("fundraisingUseOfFunds")(e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Fundraising Date</Label>
                          <Input
                            className="h-8 text-sm"
                            value={activeDraft.fundraisingEventDate}
                            onChange={(e) =>
                              set("fundraisingEventDate")(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Fundraising Time</Label>
                          <Input
                            className="h-8 text-sm"
                            value={activeDraft.fundraisingEventTime}
                            onChange={(e) =>
                              set("fundraisingEventTime")(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Payment Deadline</Label>
                        <Input
                          className="h-8 text-sm"
                          value={activeDraft.fundraisingPaymentDeadline}
                          onChange={(e) =>
                            set("fundraisingPaymentDeadline")(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meeting Medium</Label>
                        <Input
                          className="h-8 text-sm"
                          value={activeDraft.fundraisingMeetingMedium}
                          onChange={(e) =>
                            set("fundraisingMeetingMedium")(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Meeting Link</Label>
                        <Input
                          className="h-8 text-sm"
                          value={activeDraft.fundraisingMeetingLink}
                          onChange={(e) =>
                            set("fundraisingMeetingLink")(e.target.value)
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Meeting ID</Label>
                          <Input
                            className="h-8 text-sm"
                            value={activeDraft.fundraisingMeetingId}
                            onChange={(e) =>
                              set("fundraisingMeetingId")(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Meeting Password</Label>
                          <Input
                            className="h-8 text-sm"
                            value={activeDraft.fundraisingMeetingPassword}
                            onChange={(e) =>
                              set("fundraisingMeetingPassword")(e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Letter Body</CardTitle>
                  <CardDescription className="text-xs">
                    Use rich formatting (headings, bold, lists, alignment, and
                    links). The print layout keeps text flow clean for official
                    letters.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={activeDraft.bodyRich}
                    placeholder="Type or paste your letter content here..."
                    onChange={(value) =>
                      setActiveDraft((d) => ({
                        ...d,
                        bodyRich: value.html,
                        body: richHtmlToPlainText(value.html),
                      }))
                    }
                  />
                  <p className="mt-1.5 text-[10px] text-muted-foreground text-right">
                    {activeDraft.body.trim()
                      ? `${activeDraft.body.trim().split(/\s+/).length} words · ${activeDraft.body.length} characters`
                      : "0 words · 0 characters"}
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
                    Select a committee role to auto-fill the office label, or
                    type a custom label. Add up to three signatories.
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
                          if (e.target.value)
                            applyOfficeFromRole(e.target.value);
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
                      placeholder={`e.g. ${LETTERHEAD_CONFIG.defaultOfficeLabel}`}
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
                              onChange={(e) => {
                                const nextName = e.target.value;
                                const matchedSignature =
                                  resolveSignatureForName(nextName);
                                setActiveDraft((d) => ({
                                  ...d,
                                  [nameKey]: nextName,
                                  [sigKey]: matchedSignature,
                                }));
                              }}
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
                                        setActiveDraft((d) => {
                                          const signatoryName = String(
                                            d[nameKey] ?? "",
                                          );
                                          const signatoryTitle = String(
                                            d[titleKey] ?? "",
                                          );
                                          if (signatoryName.trim()) {
                                            void saveSignatureProfile(
                                              signatoryName,
                                              signatoryTitle,
                                              result,
                                            );
                                          }
                                          return {
                                            ...d,
                                            [sigKey]: result,
                                          };
                                        });
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
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 16,
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
          </div>
        )}
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
