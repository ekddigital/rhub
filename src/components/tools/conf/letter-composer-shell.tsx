"use client";

import {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
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
  Table2,
  Package,
  Loader2,
  Download,
  LayoutGrid,
  List,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/creative/ui/dropdown-menu";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  parseRecipientCsv,
  draftsFromCsvTemplate,
  recipientCsvColumnLabel,
  type CsvRecipientRow,
} from "@/lib/conf/letter-composer-csv-batch";
import {
  buildLetterPrintDocumentHtml,
  sanitizeLetterExportBasename,
} from "@/lib/conf/letter-print-document-html";
import {
  settleAfterPrintRootUpdate,
  waitForLetterPagesInDom,
  warmupLetterBulkPdfExport,
  yieldToMain,
} from "@/lib/conf/letter-pdf-batch-support";
import {
  LETTERHEAD_CONFIG,
  LETTER_COMPOSER_HEADER_PRIMARY_LINE,
  LETTER_COMPOSER_HEADER_UNION_LINE,
  letterComposerConferenceSubtitle,
  buildCityRegionLine,
  buildLetterheadEmailLine,
  buildLetterheadWebsiteLine,
} from "@/lib/conf/letterhead-config";
import { filterMembersForConferenceLetterRoster } from "@/lib/conf/conference-letter-roster";
import { normalizeSignatureProfileKey } from "@/lib/conf/signature-profiles";
import {
  buildFundraisingLetterBodyRichHtml,
  buildLetterBodyRichHtml,
  stripLegacyFundraisingProgressRow,
  FUNDRAISING_CATEGORY_LABELS,
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
  CONF_FROM_COMMITTEE,
  CONF_THEME,
  CORPORATE_SAMPLE_RECIPIENT,
  CORPORATE_SAMPLE_ORG_NAME,
  CORPORATE_SAMPLE_SUBJECT,
  CORPORATE_SAMPLE_USE_OF_FUNDS,
  GOVERNMENT_SAMPLE_RECIPIENT,
  GOVERNMENT_SAMPLE_OFFICE,
  GOVERNMENT_SAMPLE_SUBJECT,
  GOVERNMENT_SAMPLE_USE_OF_FUNDS,
  ALUMNI_SAMPLE_RECIPIENT,
  ALUMNI_SAMPLE_SUBJECT,
  ALUMNI_SAMPLE_USE_OF_FUNDS,
  NGO_SAMPLE_RECIPIENT,
  NGO_SAMPLE_SUBJECT,
  NGO_SAMPLE_USE_OF_FUNDS,
  NGO_SAMPLE_PARTNERSHIP_TYPE,
  MISS_LSUIC_SAMPLE_RECIPIENT,
  MISS_LSUIC_SAMPLE_SUBJECT,
  MISS_LSUIC_SAMPLE_USE_OF_FUNDS,
  MISS_LSUIC_SAMPLE_EVENT_DATE,
  MISS_LSUIC_SAMPLE_EVENT_TIME,
  MISS_LSUIC_SAMPLE_PAYMENT_DEADLINE,
  normalizeFundraisingLetterFromField,
  FUNDRAISING_KEYNOTE_SPEAKER_ROLE,
  type FundraisingCategory,
  type AllLetterBodyFields,
} from "@/lib/conf/fundraising-letter-template";
import {
  normalizeMarkdownToReadableText,
  richHtmlToBodyBlocks,
} from "./letter-composer-html-blocks";

// ── Types ────────────────────────────────────────────────────────────────────

type LetterType =
  | "MEMO"
  | "MINUTES"
  | "ANNOUNCEMENT"
  | "BUDGET_LETTER"
  | "PAYMENT_RECEIPT"
  | "FUNDRAISING"
  | "GENERAL";

const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  MEMO: "Memo",
  MINUTES: "Minutes",
  ANNOUNCEMENT: "Announcement",
  BUDGET_LETTER: "Budget Letter",
  PAYMENT_RECEIPT: "Payment Receipt",
  FUNDRAISING: "Fundraising",
  GENERAL: "General",
};

const LETTER_TYPE_COLORS: Record<LetterType, string> = {
  MEMO: "#C8A061",
  MINUTES: "#002868",
  ANNOUNCEMENT: "#BF0A30",
  BUDGET_LETTER: "#1a7a4a",
  PAYMENT_RECEIPT: "#7c3aed",
  FUNDRAISING: "#8E0E00",
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

type RoleTemplate = {
  id: string;
  key: string;
  label: string;
  baseRole:
    | "CHAIR"
    | "VICE_CHAIR"
    | "SECRETARY"
    | "FINANCIAL_SECRETARY"
    | "TREASURER"
    | "COMMITTEE"
    | "DELEGATE";
  title: string | null;
  committeeScope: string | null;
  officeLabel: string | null;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
};

type SignatureProfile = {
  key: string;
  name: string;
  title?: string;
  signatureDataUrl: string;
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
  signatory1Sig: string;
  signatory1SigScale: number;
  // Signatory 2 (middle)
  signatory2Name: string;
  signatory2Title: string;
  signatory2Label: string;
  signatory2Sig: string;
  signatory2SigScale: number;
  // Signatory 3 (right)
  signatory3Name: string;
  signatory3Title: string;
  signatory3Label: string;
  signatory3Sig: string;
  signatory3SigScale: number;
  fundraisingEnabled: boolean;
  fundraisingCategory: FundraisingCategory;
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
  fundraisingOrgName: string;
  fundraisingConferenceTheme: string;
  fundraisingOfficeName: string;
  fundraisingAlumniGradYear: string;
  fundraisingPartnershipType: string;
  /** General / Keynote Speaker: proposed thematic emphasis for remarks. */
  fundraisingKeynoteTopicDirection: string;
  /** General / Keynote Speaker: e.g. 15–20 minutes. */
  fundraisingKeynoteApproxDuration: string;
  fundraisingLetterSampleApplied: boolean;
  /** ISO timestamp for the last successful Library (DB) sync. */
  lastDbSyncedAt: string;
  savedAt: string;
};

const DEFAULT_FUNDRAISING_MEETING_MEDIUM = "Zoom";
const DEFAULT_FUNDRAISING_PAYMENT_DEADLINE =
  FUNDRAISING_SAMPLE_PAYMENT_DEADLINE;
const DEFAULT_FUNDRAISING_EVENT_DATE = FUNDRAISING_SAMPLE_EVENT_DATE;
const DEFAULT_FUNDRAISING_EVENT_TIME = FUNDRAISING_SAMPLE_EVENT_TIME;
const DEFAULT_FUNDRAISING_MEETING_LINK =
  "https://us02web.zoom.us/j/2312312006?pwd=ZHh3V2dXZGJ6Y2NCa0IxczdOaWJVQT09";
const DEFAULT_FUNDRAISING_MEETING_ID = "2312312006";
const DEFAULT_FUNDRAISING_MEETING_PASSWORD = "LSUIC2006";

const FUNDRAISING_BODY_SYNC_FIELDS = new Set<keyof LetterDraft>([
  "fundraisingCategory",
  "fundraisingRecipientName",
  "fundraisingInviteRole",
  "fundraisingInviteRoleOther",
  "fundraisingTargetAmount",
  "fundraisingUseOfFunds",
  "fundraisingPaymentDeadline",
  "fundraisingEventDate",
  "fundraisingEventTime",
  "fundraisingMeetingMedium",
  "fundraisingMeetingLink",
  "fundraisingMeetingId",
  "fundraisingMeetingPassword",
  "fundraisingOrgName",
  "fundraisingConferenceTheme",
  "fundraisingOfficeName",
  "fundraisingAlumniGradYear",
  "fundraisingPartnershipType",
  "fundraisingKeynoteTopicDirection",
  "fundraisingKeynoteApproxDuration",
]);

const LS_KEY = "rhub:letter-composer:drafts-v2";

type Member = {
  id: string;
  name: string;
  role: string;
  title: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  photoPath: string | null;
  joinedAt: string;
  committeeScope: string | null;
  canAssignCommittee: boolean;
  canApprovePayments: boolean;
  userId: string | null;
  linkedUserName?: string | null;
  linkedUserEmail?: string | null;
};

type ConfInfo = {
  name: string;
  city: string | null;
  venue: string | null;
  startsAt: string;
  endsAt: string;
};

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
    .map(
      (paragraph) =>
        `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`,
    )
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
      if (
        ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(
          tag,
        )
      ) {
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

function legacyMissGenericTargetLine(html: string): boolean {
  const plain = richHtmlToPlainText(html)
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!plain) return false;
  return (
    plain.includes("your stated sponsorship target for this invitation") ||
    plain.includes("rmb 180,000") ||
    (plain.includes("payment deadline for confirmed patronage") &&
      plain.includes("june 6, 2026"))
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

  const richFromDisk = d.bodyRich ?? plainBodyToRichHtml(d.body ?? "");
  const scrubbedRich = stripLegacyFundraisingProgressRow(richFromDisk);

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
    from: normalizeFundraisingLetterFromField(d.from ?? "", {
      fundraisingMode:
        Boolean(d.fundraisingEnabled ?? d.signatoryMode === "FUNDRAISING") ||
        (d as Partial<LetterDraft>).type === "FUNDRAISING",
    }),
    re: d.re ?? "",
    date: d.date ?? "",
    body: richHtmlToPlainText(scrubbedRich),
    bodyRich: scrubbedRich,
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
    fundraisingCategory:
      (d as Partial<LetterDraft>).fundraisingCategory ?? "general",
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
    fundraisingMeetingId:
      d.fundraisingMeetingId ?? DEFAULT_FUNDRAISING_MEETING_ID,
    fundraisingMeetingPassword:
      d.fundraisingMeetingPassword ?? DEFAULT_FUNDRAISING_MEETING_PASSWORD,
    fundraisingOrgName: (d as Partial<LetterDraft>).fundraisingOrgName ?? "",
    fundraisingConferenceTheme:
      (d as Partial<LetterDraft>).fundraisingConferenceTheme ?? "",
    fundraisingOfficeName:
      (d as Partial<LetterDraft>).fundraisingOfficeName ?? "",
    fundraisingAlumniGradYear:
      (d as Partial<LetterDraft>).fundraisingAlumniGradYear ?? "",
    fundraisingPartnershipType:
      (d as Partial<LetterDraft>).fundraisingPartnershipType ?? "",
    fundraisingKeynoteTopicDirection:
      (d as Partial<LetterDraft>).fundraisingKeynoteTopicDirection ?? "",
    fundraisingKeynoteApproxDuration:
      (d as Partial<LetterDraft>).fundraisingKeynoteApproxDuration ?? "",
    fundraisingLetterSampleApplied: d.fundraisingLetterSampleApplied ?? false,
    lastDbSyncedAt: (d as Partial<LetterDraft>).lastDbSyncedAt ?? "",
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
      fundraisingConferenceTheme: base.fundraisingConferenceTheme,
      fundraisingKeynoteTopicDirection: base.fundraisingKeynoteTopicDirection,
      fundraisingKeynoteApproxDuration: base.fundraisingKeynoteApproxDuration,
    });
    return {
      ...base,
      bodyRich: rebuiltHtml,
      body: richHtmlToPlainText(rebuiltHtml),
    };
  }

  if (
    base.fundraisingEnabled &&
    base.fundraisingCategory === "miss_lsuic" &&
    legacyMissGenericTargetLine(base.bodyRich ?? "")
  ) {
    const rebuiltHtml = buildLetterBodyRichHtml(
      allLetterBodyFieldsFromDraft(base),
    );
    return {
      ...base,
      bodyRich: rebuiltHtml,
      body: richHtmlToPlainText(rebuiltHtml),
      fundraisingLetterSampleApplied: true,
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

async function parseApiErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const payload = (await res.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  if (typeof payload?.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  return `${fallback} (${res.status})`;
}

/** Opens print dialog for pre-rendered letter HTML (one or many letters). */
function openLetterPrintWindow(fragmentInnerHtml: string) {
  const popup = window.open(
    "",
    "_blank",
    `width=860,height=1000,scrollbars=no,menubar=no,toolbar=no,status=no`,
  );
  if (!popup) {
    window.print();
    return;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  popup.document.write(
    buildLetterPrintDocumentHtml(fragmentInnerHtml, {
      origin,
      includeAutoPrintScript: true,
      documentTitle: "LSUIC Letter",
    }),
  );
  popup.document.close();
}

/** Default sender block shown for a freshly created letter. */
const NEW_LETTER_DEFAULT_FROM =
  "Enoch Kwateh Dongbo\nConference Chair, LSUIC 2026";

function formatTodayLetterDate() {
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Brand-new composer draft — always runs through {@link migrateDraft} so sidebar
 * defaults (fundraising Zoom fields, keynote slots, etc.) stay in sync with
 * migrated localStorage drafts and any schema additions.
 */
function newDraft(): LetterDraft {
  return migrateDraft({
    id: newId(),
    dbId: "",
    type: "GENERAL",
    title: "",
    to: "",
    from: NEW_LETTER_DEFAULT_FROM,
    re: "",
    date: formatTodayLetterDate(),
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
    fundraisingCategory: "general",
    fundraisingInviteRole: "Sponsor",
    fundraisingInviteRoleOther: "",
    fundraisingRecipientName: "",
    fundraisingRecipientAddress: "",
    fundraisingTargetAmount: "",
    fundraisingUseOfFunds: "",
    fundraisingOrgName: "",
    fundraisingConferenceTheme: "",
    fundraisingOfficeName: "",
    fundraisingAlumniGradYear: "",
    fundraisingPartnershipType: "",
    fundraisingKeynoteTopicDirection: "",
    fundraisingKeynoteApproxDuration: "",
    fundraisingLetterSampleApplied: false,
    lastDbSyncedAt: "",
    savedAt: "",
  });
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

/** Payment flyer attachment page (preview, print, PDF, Word). Miss LSUIC omits it. */
function draftShowsFundraisingFlyer(draft: LetterDraft): boolean {
  if (draft.fundraisingCategory === "miss_lsuic") return false;
  const hasFundraisingContent =
    (draft.fundraisingTargetAmount ?? "").trim().length > 0 ||
    (draft.fundraisingUseOfFunds ?? "").trim().length > 0 ||
    draft.fundraisingCategory !== "general";
  return (
    draft.type === "FUNDRAISING" ||
    Boolean(draft.fundraisingEnabled) ||
    draft.signatoryMode === "FUNDRAISING" ||
    hasFundraisingContent
  );
}

function mergeFundraisingTemplateIfEligible(draft: LetterDraft): LetterDraft {
  if (!draft.fundraisingEnabled || !isLetterDraftBodyEmpty(draft)) {
    return draft;
  }
  return {
    ...applyLetterSample(draft, "if-empty"),
    fundraisingLetterSampleApplied: true,
  };
}

/** Maps all draft fields to the AllLetterBodyFields shape consumed by the category dispatch builder. */
function allLetterBodyFieldsFromDraft(d: LetterDraft): AllLetterBodyFields {
  return {
    fundraisingCategory: d.fundraisingCategory,
    // General / Sponsor fields
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
    fundraisingConferenceTheme: d.fundraisingConferenceTheme,
    fundraisingKeynoteTopicDirection: d.fundraisingKeynoteTopicDirection,
    fundraisingKeynoteApproxDuration: d.fundraisingKeynoteApproxDuration,
    // Corporate
    fundraisingOrgName: d.fundraisingOrgName,
    // Government
    fundraisingOfficeName: d.fundraisingOfficeName,
    // Alumni
    fundraisingAlumniGradYear: d.fundraisingAlumniGradYear,
    // NGO
    fundraisingPartnershipType: d.fundraisingPartnershipType,
  };
}

function shouldAutoSyncFundraisingBody(draft: LetterDraft): boolean {
  if (!draft.fundraisingEnabled) return false;
  if (isLetterDraftBodyEmpty(draft)) return true;
  if (
    draft.fundraisingCategory === "miss_lsuic" &&
    legacyMissGenericTargetLine(draft.bodyRich ?? "")
  ) {
    return true;
  }

  const generatedRich = buildLetterBodyRichHtml(
    allLetterBodyFieldsFromDraft(draft),
  );
  return (
    richHtmlToPlainText(draft.bodyRich ?? "") ===
    richHtmlToPlainText(generatedRich)
  );
}

function syncFundraisingBodyFromFields(draft: LetterDraft): LetterDraft {
  const html = buildLetterBodyRichHtml(allLetterBodyFieldsFromDraft(draft));
  return {
    ...draft,
    bodyRich: html,
    body: richHtmlToPlainText(html),
    fundraisingLetterSampleApplied: true,
  };
}

/**
 * Category-aware sample defaults. Each category fills sensible placeholder values for
 * all header fields (to/from/re/title) and its own sidebar fields. Body is always
 * regenerated from those values via the dispatcher `buildLetterBodyRichHtml`.
 */
function applyLetterSample(
  draft: LetterDraft,
  mode: "if-empty" | "replace-all",
): LetterDraft {
  const bodyWasEmpty = isLetterDraftBodyEmpty(draft);
  const cat = draft.fundraisingCategory;
  let merged: LetterDraft = { ...draft };

  // Per-category default overrides
  type Defaults = Partial<LetterDraft>;
  const defaults: Record<FundraisingCategory, Defaults> = {
    general: {
      title: FUNDRAISING_SAMPLE_DOC_TITLE,
      to: FUNDRAISING_SAMPLE_TO,
      from: FUNDRAISING_SAMPLE_FROM,
      re: FUNDRAISING_SAMPLE_SUBJECT,
      fundraisingInviteRole: "Sponsor",
      fundraisingInviteRoleOther: "",
      fundraisingRecipientName: FUNDRAISING_SAMPLE_RECIPIENT_NAME,
      fundraisingRecipientAddress: FUNDRAISING_SAMPLE_ADDRESS,
      fundraisingTargetAmount: FUNDRAISING_SAMPLE_TARGET_AMOUNT,
      fundraisingUseOfFunds: FUNDRAISING_SAMPLE_USE_OF_FUNDS.trim(),
      fundraisingEventDate: FUNDRAISING_SAMPLE_EVENT_DATE,
      fundraisingEventTime: FUNDRAISING_SAMPLE_EVENT_TIME,
      fundraisingPaymentDeadline: FUNDRAISING_SAMPLE_PAYMENT_DEADLINE,
      fundraisingMeetingMedium: DEFAULT_FUNDRAISING_MEETING_MEDIUM,
      fundraisingMeetingLink: DEFAULT_FUNDRAISING_MEETING_LINK,
      fundraisingMeetingId: DEFAULT_FUNDRAISING_MEETING_ID,
      fundraisingMeetingPassword: DEFAULT_FUNDRAISING_MEETING_PASSWORD,
      fundraisingConferenceTheme: "",
      fundraisingKeynoteTopicDirection: "",
      fundraisingKeynoteApproxDuration: "",
    },
    corporate: {
      title: "Corporate Sponsorship Request — LSUIC 2026 Conference",
      to: CORPORATE_SAMPLE_RECIPIENT,
      from: CONF_FROM_COMMITTEE,
      re: CORPORATE_SAMPLE_SUBJECT,
      fundraisingRecipientName: CORPORATE_SAMPLE_RECIPIENT,
      fundraisingRecipientAddress: "",
      fundraisingOrgName: CORPORATE_SAMPLE_ORG_NAME,
      fundraisingConferenceTheme: CONF_THEME,
      fundraisingTargetAmount: FUNDRAISING_SAMPLE_TARGET_AMOUNT,
      fundraisingUseOfFunds: CORPORATE_SAMPLE_USE_OF_FUNDS.trim(),
    },
    government: {
      title: "Request for Support — LSUIC 2026 Conference",
      to: GOVERNMENT_SAMPLE_RECIPIENT,
      from: CONF_FROM_COMMITTEE,
      re: GOVERNMENT_SAMPLE_SUBJECT,
      fundraisingRecipientName: GOVERNMENT_SAMPLE_RECIPIENT,
      fundraisingRecipientAddress: "",
      fundraisingOfficeName: GOVERNMENT_SAMPLE_OFFICE,
      fundraisingConferenceTheme: CONF_THEME,
      fundraisingUseOfFunds: GOVERNMENT_SAMPLE_USE_OF_FUNDS.trim(),
    },
    alumni: {
      title: "Alumni Giving — LSUIC 20th Anniversary",
      to: ALUMNI_SAMPLE_RECIPIENT,
      from: CONF_FROM_COMMITTEE,
      re: ALUMNI_SAMPLE_SUBJECT,
      fundraisingRecipientName: ALUMNI_SAMPLE_RECIPIENT,
      fundraisingRecipientAddress: "",
      fundraisingAlumniGradYear: "",
      fundraisingUseOfFunds: ALUMNI_SAMPLE_USE_OF_FUNDS.trim(),
    },
    ngo: {
      title: "NGO Partnership Request — LSUIC 2026 Conference",
      to: NGO_SAMPLE_RECIPIENT,
      from: CONF_FROM_COMMITTEE,
      re: NGO_SAMPLE_SUBJECT,
      fundraisingRecipientName: NGO_SAMPLE_RECIPIENT,
      fundraisingRecipientAddress: "",
      fundraisingConferenceTheme: CONF_THEME,
      fundraisingPartnershipType: NGO_SAMPLE_PARTNERSHIP_TYPE,
      fundraisingUseOfFunds: NGO_SAMPLE_USE_OF_FUNDS.trim(),
    },
    miss_lsuic: {
      title: "Miss LSUIC Pageant & Achievers Night — Patron Invitation",
      to: MISS_LSUIC_SAMPLE_RECIPIENT,
      from: CONF_FROM_COMMITTEE,
      re: MISS_LSUIC_SAMPLE_SUBJECT,
      fundraisingRecipientName: MISS_LSUIC_SAMPLE_RECIPIENT,
      fundraisingRecipientAddress: "",
      fundraisingConferenceTheme: CONF_THEME,
      fundraisingTargetAmount: "",
      fundraisingUseOfFunds: MISS_LSUIC_SAMPLE_USE_OF_FUNDS.trim(),
      fundraisingEventDate: MISS_LSUIC_SAMPLE_EVENT_DATE,
      fundraisingEventTime: MISS_LSUIC_SAMPLE_EVENT_TIME,
      fundraisingPaymentDeadline: MISS_LSUIC_SAMPLE_PAYMENT_DEADLINE,
      fundraisingMeetingMedium: "",
      fundraisingMeetingLink: "",
      fundraisingMeetingId: "",
      fundraisingMeetingPassword: "",
    },
  };

  const catDefaults = defaults[cat] ?? defaults.general;

  if (mode === "replace-all") {
    merged = {
      ...merged,
      date: FUNDRAISING_SAMPLE_DATE_PLACEHOLDER,
      ...catDefaults,
    };
  } else {
    // Only fill empty fields
    for (const [key, val] of Object.entries(catDefaults)) {
      const k = key as keyof LetterDraft;
      if (!(merged[k] as string | boolean | undefined)?.toString().trim()) {
        (merged as Record<string, unknown>)[k] = val;
      }
    }
    if (!(merged.date ?? "").trim()) {
      merged = { ...merged, date: FUNDRAISING_SAMPLE_DATE_PLACEHOLDER };
    }
  }

  merged = {
    ...merged,
    from: normalizeFundraisingLetterFromField(merged.from, {
      fundraisingMode:
        merged.fundraisingEnabled || merged.type === "FUNDRAISING",
    }),
  };

  const wantBody = mode === "replace-all" || bodyWasEmpty;
  if (!wantBody) return merged;

  const html = buildLetterBodyRichHtml(allLetterBodyFieldsFromDraft(merged));
  return { ...merged, bodyRich: html, body: richHtmlToPlainText(html) };
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
  FINANCIAL_SECRETARY: "National Financial Secretary",
  TREASURER: "National Treasurer",
};

function memberLabel(m: Member): string {
  const base = ROLE_LABELS[m.role];
  if (base) return base;
  return m.title ?? m.committeeScope ?? "Committee Member";
}

/** Collapse duplicate roster cards (same id or identical displayed contact block). */
function dedupeSidebarRosterMembers(members: Member[]): Member[] {
  const byId = new Map<string, Member>();
  for (const m of members) {
    if (!byId.has(m.id)) byId.set(m.id, m);
  }
  const idUnique = [...byId.values()];
  const seenSig = new Set<string>();
  const out: Member[] = [];
  for (const m of idUnique) {
    const city = (m.city ?? "").trim().toLowerCase();
    const phone = (m.phone ?? "").replace(/\D/g, "");
    const sig = [
      m.name.trim().toLowerCase(),
      memberLabel(m).trim().toLowerCase(),
      city,
      phone,
    ].join("\0");
    if (seenSig.has(sig)) continue;
    seenSig.add(sig);
    out.push(m);
  }
  return out;
}

function formatChinaPhone(phone: string | null | undefined): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.startsWith("86")) return `+${digits}`;
  return `+86${digits}`;
}

function normalizeRoleOrTitle(value: string | null | undefined): string {
  return (value ?? "").toUpperCase().replace(/[^A-Z]/g, "");
}

function findOfficerByKeywords(
  members: Member[],
  keywords: string[],
): Member | null {
  for (const m of members) {
    const role = normalizeRoleOrTitle(m.role);
    const title = normalizeRoleOrTitle(m.title);
    if (keywords.some((k) => role.includes(k) || title.includes(k))) {
      return m;
    }
  }
  return null;
}

function buildOfficerPhoneEntries(
  members: Member[],
): { label: string; phone: string }[] {
  const chair =
    members.find((m) => m.role === "CHAIR") ||
    findOfficerByKeywords(members, ["CHAIRMAN", "CHAIR"]);
  const viceChair =
    members.find((m) => m.role === "VICE_CHAIR") ||
    findOfficerByKeywords(members, ["VICECHAIR", "COCHAIR"]);
  const secretary =
    members.find((m) => m.role === "SECRETARY") ||
    findOfficerByKeywords(members, ["SECRETARY"]);

  const chairPhone =
    formatChinaPhone(chair?.phone) || LETTERHEAD_CONFIG.officerPhones.chair;
  const viceChairPhone =
    formatChinaPhone(viceChair?.phone) ||
    LETTERHEAD_CONFIG.officerPhones.coChair;
  const secretaryPhone =
    formatChinaPhone(secretary?.phone) ||
    LETTERHEAD_CONFIG.officerPhones.secretary;

  return [
    { label: "Chair", phone: chairPhone },
    { label: "Co-Chair", phone: viceChairPhone },
    { label: "Secretary", phone: secretaryPhone },
  ].filter((entry) => Boolean(entry.phone));
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
  | { type: "paragraph"; text: string; richHtmlInner?: string }
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

function estimateBlockLines(
  block: LetterBodyBlock,
  metrics: PageMetrics,
): number {
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
          Math.max(
            1,
            wrapParagraph(
              `${block.ordered ? `${idx + 1}. ` : "• "}${item}`,
              metrics,
            ).length,
          ),
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
function dropEmptyPaginationPages(
  pages: LetterBodyBlock[][],
): LetterBodyBlock[][] {
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
    const targetMetrics = p === 0 ? firstPageMetrics : continuationPageMetrics;
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
  const continuationCap = Math.max(14, Math.floor(rawContinuationCap * 0.985));

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
    const nextLines = nextBlock ? estimateBlockLines(nextBlock, metrics) : 0;

    // Do not end a page with a section title while its following block is forced to the next sheet.
    if (block.type === "heading" && nextBlock && pages[pageIndex].length > 0) {
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
      const style: CSSProperties = {
        fontSize: 12,
        color: "#222",
        lineHeight: 1.8,
        margin: "0 0 8px",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      };
      if (block.richHtmlInner?.trim()) {
        return (
          <p
            key={key}
            className="letter-composer-rich-p"
            style={style}
            dangerouslySetInnerHTML={{ __html: block.richHtmlInner }}
          />
        );
      }
      return (
        <p key={key} style={style}>
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
              <span
                style={{
                  flex: 1,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                }}
              >
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

/**
 * Single To: block for preview/print — avoids duplicating lines when
 * `fundraisingRecipientAddress` repeats the tail of `to` (CSV batch sets both).
 */
function letterRecipientBlockDisplay(
  to: string | undefined,
  fundraisingRecipientAddress: string | undefined,
): string {
  const t = (to ?? "").trim();
  const a = (fundraisingRecipientAddress ?? "").trim();
  if (!t) return a;
  if (!a) return t;
  const toNorm = t.replace(/\r\n/g, "\n").trimEnd();
  const addrNorm = a.replace(/\r\n/g, "\n").trim();
  const addrLines = addrNorm
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (addrLines.length === 0) return t;
  const toLines = toNorm
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (toLines.length >= addrLines.length) {
    const suffix = toLines.slice(-addrLines.length);
    if (suffix.every((line, i) => line === addrLines[i])) return toNorm;
  }
  return `${toNorm}\n${addrNorm}`;
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
  const HEADER_H = 178; // keep all masthead lines visible (emails, websites, phones)
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

  /** Screen preview: rigid A4 frame; print CSS keeps each page at exact A4 height */
  const letterPageChrome = {
    width: PAGE_W,
    minHeight: PAGE_H,
    height: PAGE_H,
    maxHeight: PAGE_H,
    overflow: "hidden" as const,
    flexShrink: 0 as const,
  };

  const KEY_ORDER = [
    "CHAIR",
    "VICE_CHAIR",
    "SECRETARY",
    "FINANCIAL_SECRETARY",
    "TREASURER",
  ];
  const rosterMembers = dedupeSidebarRosterMembers(members);
  const sortedMembers = [
    ...KEY_ORDER.map((r) => rosterMembers.find((m) => m.role === r)).filter(
      Boolean,
    ),
    ...rosterMembers.filter((m) => !KEY_ORDER.includes(m.role)),
  ] as Member[];

  // Officers whose phones go in the header
  const officerPhones = buildOfficerPhoneEntries(members);

  const dateRange = confInfo
    ? fmtDateRange(confInfo.startsAt, confInfo.endsAt)
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

  /** Trailing slab reserve for final-page signatures. */
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

  const recipientDisplay = letterRecipientBlockDisplay(
    draft.to,
    draft.fundraisingRecipientAddress,
  );
  const newlineRows = (s: string) => (s.trim() ? s.split("\n").length : 0);
  // Chrome overhead: date row (~1.2 lines) + divider with margins (~1.2 lines) + spacing (~0.6 lines)
  // = ~3 base lines, then 1 line per wrapped row of To/From, ~2 for Re (includes marginTop).
  // Previous formula used *2 multiplier on to/from which over-reserved by ~9 lines on a standard
  // single-line letter, artificially dropping page-1 body capacity from ~30 lines to ~22.
  const firstPageLeadReserveLines =
    3 +
    Math.max(1, newlineRows(recipientDisplay)) +
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
  const showFundraisingFlyer = draftShowsFundraisingFlyer(draft);
  const totalPages =
    1 + continuationBodies.length + (showFundraisingFlyer ? 1 : 0);
  const officeLabel =
    (draft.officeLabel ?? "").trim() || LETTERHEAD_CONFIG.defaultOfficeLabel;

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
            alignItems: "flex-start",
            height: HEADER_H,
            flexShrink: 0,
            background: C.white,
            padding: "10px 18px 8px",
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
              marginTop: 6,
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
          <div style={{ flex: 1, textAlign: "center", paddingTop: 2 }}>
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
            <div style={{ fontSize: 8.5, color: "#555" }}>
              {buildCityRegionLine(confInfo?.city)}
            </div>
            <div style={{ fontSize: 8.5, color: "#555" }}>{dateRange}</div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 3 }}>
              {buildLetterheadEmailLine()}
            </div>
            <div style={{ fontSize: 8, color: C.muted, marginTop: 1 }}>
              {buildLetterheadWebsiteLine()}
            </div>
            {officerPhones.length > 0 && (
              <div
                style={{
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                {officerPhones.map((op) => (
                  <span
                    key={op.label}
                    style={{ fontSize: 7.8, color: C.navy, fontWeight: 700 }}
                  >
                    {op.label}: {op.phone}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right column — Liberia seal */}
          <div
            style={{
              flexShrink: 0,
              width: 108,
              height: 108,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 6,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/liberia-seal.svg"
              alt="Republic of Liberia Seal"
              style={{ width: 100, height: 100, objectFit: "contain" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* ── Gold divider bar ── */}
        <div
          style={{
            height: GOLD_BAR,
            background: C.gold,
            flexShrink: 0,
          }}
        />

        {/* ── Office label row ── */}
        <div
          style={{
            height: OFFICE_ROW,
            background: C.white,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 18,
            borderBottom: `${NAVY_BAR}px solid ${C.navy}`,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontStyle: "italic",
              fontWeight: 700,
              color: C.navy,
            }}
          >
            {officeLabel}
          </span>
        </div>

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
              {recipientDisplay && (
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <strong
                    style={{
                      color: C.navy,
                      flexShrink: 0,
                      marginRight: "0.4em",
                    }}
                  >
                    To:
                  </strong>
                  <span style={{ whiteSpace: "pre-line" }}>
                    {recipientDisplay}
                  </span>
                </div>
              )}
              {draft.from && (
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <strong
                    style={{
                      color: C.navy,
                      flexShrink: 0,
                      marginRight: "0.4em",
                    }}
                  >
                    From:
                  </strong>
                  <span style={{ whiteSpace: "pre-line" }}>{draft.from}</span>
                </div>
              )}
              {draft.re && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    marginTop: 4,
                  }}
                >
                  <strong
                    style={{
                      color: C.navy,
                      flexShrink: 0,
                      marginRight: "0.4em",
                    }}
                  >
                    Re:
                  </strong>
                  <strong style={{ whiteSpace: "pre-line" }}>{draft.re}</strong>
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
                {renderBodyBlocks(segmentBlocks, `continuation-${idx}`)}
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
                  Page {idx + 2} of {totalPages}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Fundraising flyer attachment page ── */}
      {showFundraisingFlyer && (
        <div
          className="letter-page continuation-page letter-flyer-page"
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
          {/* Flag stripes */}
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

          {/* Mini header */}
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
              {LETTER_COMPOSER_HEADER_UNION_LINE}
            </div>
            <div style={{ fontSize: 9, color: C.muted, fontStyle: "italic" }}>
              {officeLabel}
            </div>
          </div>

          {/* Payment instructions note */}
          <div
            style={{
              margin: "18px 32px 14px 32px",
              padding: "12px 16px",
              border: `1.5px solid ${C.navy}`,
              borderRadius: 4,
              background: "#f8f9fc",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "0.5px",
                textTransform: "uppercase" as const,
                marginBottom: 6,
              }}
            >
              Payment Instructions (See Flyer Below)
            </div>
            <div style={{ fontSize: 9, color: "#333", lineHeight: 1.6 }}>
              Detailed <strong>payment mediums</strong> are shown on{" "}
              <strong>the flyer directly below</strong>. Please pay only through
              those channels — <strong>Mobile Money</strong>,{" "}
              <strong>UBA (bank)</strong>, <strong>WeChat Pay</strong>, or{" "}
              <strong>Alipay</strong> — using the QR codes and account titles on
              that flyer.
            </div>
          </div>

          {/* Flyer  */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              padding: "0 32px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: C.gold,
                  letterSpacing: "0.3px",
                }}
              >
                Fundraising flyer — payment methods
              </div>
              <div style={{ fontSize: 9, color: C.muted, fontStyle: "italic" }}>
                {officeLabel}
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/conf/fundraising.png"
              alt="Fundraising flyer — payment methods"
              style={{
                maxWidth: "100%",
                maxHeight: 580,
                objectFit: "contain",
                display: "block",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div
              style={{
                marginTop: 8,
                fontSize: 8,
                color: C.muted,
                textAlign: "center",
              }}
            >
              Scannable payment details: Mobile Money, UBA, WeChat Pay, and
              Alipay (see the flyer graphic in this section).
            </div>
          </div>

          {/* Footer */}
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
                Page {totalPages} of {totalPages}
              </div>
            </div>
          </div>
        </div>
      )}
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
  const [libraryPageSize, setLibraryPageSize] = useState(20);
  const [librarySelectedIds, setLibrarySelectedIds] = useState<string[]>([]);
  const [libraryListMode, setLibraryListMode] = useState(false);
  const [libraryBulkDeleting, setLibraryBulkDeleting] = useState(false);
  const [librarySelectAllLoading, setLibrarySelectAllLoading] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [saveToDbStatus, setSaveToDbStatus] = useState<
    "idle" | "saved" | "error"
  >("idle");
  const [saveToDbMessage, setSaveToDbMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [signatureLibrary, setSignatureLibrary] = useState<
    Record<string, SignatureProfile>
  >({});

  const CSV_PREVIEW_PAGE_SIZE = 10;
  const [draftsListPage, setDraftsListPage] = useState(1);
  const [draftsListPageSize, setDraftsListPageSize] = useState(15);
  const [draftsSelectedIds, setDraftsSelectedIds] = useState<string[]>([]);
  const [csvImportRows, setCsvImportRows] = useState<CsvRecipientRow[]>([]);
  const [csvImportHeaders, setCsvImportHeaders] = useState<string[]>([]);
  const [csvImportError, setCsvImportError] = useState<string | null>(null);
  const [csvImportPage, setCsvImportPage] = useState(1);
  const [lastCsvBatchDrafts, setLastCsvBatchDrafts] = useState<LetterDraft[]>(
    [],
  );
  /** When set, `#letter-print-root` renders one preview per draft for bulk PDF. */
  const [batchPrintDrafts, setBatchPrintDrafts] = useState<
    LetterDraft[] | null
  >(null);
  const [batchLibrarySaving, setBatchLibrarySaving] = useState(false);
  const [batchLibraryProgress, setBatchLibraryProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [batchLibraryResult, setBatchLibraryResult] = useState<{
    ok: number;
    fail: number;
  } | null>(null);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [zipPdfProgress, setZipPdfProgress] = useState<{
    phase: string;
    current: number;
    total: number;
    detail?: string;
  } | null>(null);
  const [zipPdfMessage, setZipPdfMessage] = useState<string | null>(null);
  const [docxExporting, setDocxExporting] = useState(false);
  const [docxExportMessage, setDocxExportMessage] = useState<string | null>(
    null,
  );

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
          setMembers(filterMembersForConferenceLetterRoster(mems));
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

  /** Warm PDF pipeline once data is ready so first bulk download is faster and more reliable. */
  useEffect(() => {
    if (!loading && !error) {
      void warmupLetterBulkPdfExport();
    }
  }, [loading, error]);

  // ── Drafts ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const stored = loadDrafts();
    setDrafts(stored);
    if (stored.length > 0) setActiveDraft(stored[0]);
  }, []);

  useEffect(() => {
    if (Object.keys(signatureLibrary).length === 0) return;
    setActiveDraft((current) => hydrateDraftSignatures(current));
    setDrafts((current) =>
      current.map((draft) => hydrateDraftSignatures(draft)),
    );
  }, [signatureLibrary, hydrateDraftSignatures]);

  useEffect(() => {
    if (
      activeDraft.signatoryMode === "FUNDRAISING" &&
      !activeDraft.fundraisingEnabled
    ) {
      setActiveDraft((draft) => ({
        ...draft,
        fundraisingEnabled: true,
        type: "FUNDRAISING",
      }));
    }
  }, [activeDraft.signatoryMode, activeDraft.fundraisingEnabled]);

  useEffect(() => {
    if (activeDraft.fundraisingEnabled && activeDraft.type !== "FUNDRAISING") {
      setActiveDraft((draft) =>
        draft.fundraisingEnabled && draft.type !== "FUNDRAISING"
          ? { ...draft, type: "FUNDRAISING" }
          : draft,
      );
      return;
    }

    if (!activeDraft.fundraisingEnabled && activeDraft.type === "FUNDRAISING") {
      setActiveDraft((draft) =>
        !draft.fundraisingEnabled && draft.type === "FUNDRAISING"
          ? { ...draft, type: "GENERAL" }
          : draft,
      );
    }
  }, [activeDraft.fundraisingEnabled, activeDraft.type]);

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
    setActiveDraft(hydrateDraftSignatures(newDraft()));
    setShowList(false);
  }, [hydrateDraftSignatures]);

  const handleLoad = useCallback(
    (d: LetterDraft) => {
      setActiveDraft(hydrateDraftSignatures(d));
      setShowList(false);
    },
    [hydrateDraftSignatures],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setDrafts((prev) => {
        const next = prev.filter((d) => d.id !== id);
        saveDrafts(next);
        return next;
      });
      if (activeDraft.id === id) {
        const remaining = drafts.filter((d) => d.id !== id);
        setActiveDraft(
          remaining.length > 0
            ? remaining[0]
            : hydrateDraftSignatures(newDraft()),
        );
      }
    },
    [activeDraft.id, drafts, hydrateDraftSignatures],
  );

  // ── Library (DB) helpers ─────────────────────────────────────────────────

  const fetchLibrary = useCallback(
    async (page: number, filter: LetterType | "") => {
      if (!confId) return;
      setLibraryLoading(true);
      try {
        const qs = new URLSearchParams({
          page: String(page),
          pageSize: String(libraryPageSize),
        });
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
    [confId, libraryPageSize],
  );

  /** Walk every API page so bulk actions can target the whole library, not only the current grid page. */
  const selectAllLibraryLetterIds = useCallback(async () => {
    if (!confId || libraryTotal <= 0) return;
    setLibrarySelectAllLoading(true);
    try {
      const allIds: string[] = [];
      let page = 1;
      const batch = 100;
      for (;;) {
        const qs = new URLSearchParams({
          page: String(page),
          pageSize: String(batch),
        });
        if (libraryFilter) qs.set("type", libraryFilter);
        const res = await fetch(`/api/conf/${confId}/letters?${qs.toString()}`);
        if (!res.ok) break;
        const data = (await res.json()) as {
          letters: { id: string }[];
          total: number;
        };
        allIds.push(...data.letters.map((l) => l.id));
        if (allIds.length >= data.total || data.letters.length === 0) break;
        page += 1;
      }
      setLibrarySelectedIds(allIds);
    } finally {
      setLibrarySelectAllLoading(false);
    }
  }, [confId, libraryFilter, libraryTotal]);

  // Fetch when view switches to library or page/filter/pageSize changes
  useEffect(() => {
    if (view === "library") {
      void fetchLibrary(libraryPage, libraryFilter);
    }
  }, [view, libraryPage, libraryFilter, libraryPageSize, confId, fetchLibrary]);

  useEffect(() => {
    setLibrarySelectedIds([]);
  }, [libraryFilter]);

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(drafts.length / draftsListPageSize));
    if (draftsListPage > maxPage) setDraftsListPage(maxPage);
  }, [drafts.length, draftsListPage, draftsListPageSize]);

  useEffect(() => {
    const ids = new Set(drafts.map((d) => d.id));
    setDraftsSelectedIds((prev) => prev.filter((id) => ids.has(id)));
  }, [drafts]);

  const upsertDraftToLibrary = useCallback(
    async (draft: LetterDraft) => {
      if (!confId) {
        throw new Error(
          "Conference context is still loading. Try again in a moment.",
        );
      }

      const payload = {
        title: draft.title || draft.re || "Untitled Letter",
        type: draft.type,
        letterDate: draft.date,
        draft,
      };

      const createLetter = async () => {
        const res = await fetch(`/api/conf/${confId}/letters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(
            await parseApiErrorMessage(res, "Failed to save letter to Library"),
          );
        }

        const saved = (await res.json()) as { id: string };
        return { id: saved.id, recoveredFromMissingRecord: false };
      };

      if (!draft.dbId) {
        return createLetter();
      }

      const patchRes = await fetch(
        `/api/conf/${confId}/letters/${draft.dbId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (patchRes.ok) {
        const saved = (await patchRes.json()) as { id: string };
        return { id: saved.id, recoveredFromMissingRecord: false };
      }

      if (patchRes.status === 404) {
        const recreated = await createLetter();
        return { id: recreated.id, recoveredFromMissingRecord: true };
      }

      throw new Error(
        await parseApiErrorMessage(
          patchRes,
          "Failed to update existing Library letter",
        ),
      );
    },
    [confId],
  );

  const handleSaveToLibrary = useCallback(async () => {
    if (!confId) {
      setSaveToDbStatus("error");
      setSaveToDbMessage(
        "Conference data is still loading, so Library save is not available yet.",
      );
      setTimeout(() => setSaveToDbStatus("idle"), 4000);
      return;
    }

    setSavingToDb(true);
    setSaveToDbStatus("idle");
    setSaveToDbMessage("");

    try {
      const syncedAt = new Date().toISOString();
      const result = await upsertDraftToLibrary(activeDraft);
      const syncedDraft: LetterDraft = {
        ...activeDraft,
        dbId: result.id,
        lastDbSyncedAt: syncedAt,
      };

      // Keep active state and local-storage draft list in sync immediately.
      setActiveDraft(syncedDraft);
      setDrafts((prev) => {
        const exists = prev.some((d) => d.id === syncedDraft.id);
        const next = exists
          ? prev.map((d) => (d.id === syncedDraft.id ? syncedDraft : d))
          : [syncedDraft, ...prev];
        saveDrafts(next);
        return next;
      });

      setSaveToDbStatus("saved");
      if (result.recoveredFromMissingRecord) {
        setSaveToDbMessage(
          "The previous Library record no longer existed, so a new one was created and linked.",
        );
      } else if (activeDraft.dbId) {
        setSaveToDbMessage("Library update saved.");
      } else {
        setSaveToDbMessage("Saved to Library (database).");
      }
      setTimeout(() => setSaveToDbStatus("idle"), 3000);
      void fetchLibrary(libraryPage, libraryFilter);
    } catch (error) {
      setSaveToDbStatus("error");
      setSaveToDbMessage(
        error instanceof Error
          ? error.message
          : "Failed to save this letter to Library",
      );
      setTimeout(() => setSaveToDbStatus("idle"), 4000);
    } finally {
      setSavingToDb(false);
    }
  }, [
    confId,
    activeDraft,
    fetchLibrary,
    libraryPage,
    libraryFilter,
    upsertDraftToLibrary,
  ]);

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
          setLibrarySelectedIds((prev) => prev.filter((x) => x !== id));
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
      setActiveDraft((d) => {
        const next = { ...d, [field]: v };
        if (!FUNDRAISING_BODY_SYNC_FIELDS.has(field)) {
          return next;
        }
        if (!shouldAutoSyncFundraisingBody(d)) {
          return next;
        }
        return syncFundraisingBodyFromFields(next);
      }),
    [],
  );

  const handleLetterTypeChange = useCallback((nextType: LetterType) => {
    setActiveDraft((d) => {
      const switchingOffFundraisingType =
        d.type === "FUNDRAISING" && nextType !== "FUNDRAISING";

      const next: LetterDraft = {
        ...d,
        type: nextType,
        fundraisingEnabled:
          nextType === "FUNDRAISING"
            ? true
            : switchingOffFundraisingType
              ? false
              : d.fundraisingEnabled,
        signatoryMode:
          switchingOffFundraisingType && d.signatoryMode === "FUNDRAISING"
            ? "CUSTOM"
            : d.signatoryMode,
        fundraisingLetterSampleApplied: switchingOffFundraisingType
          ? false
          : d.fundraisingLetterSampleApplied,
      };

      return nextType === "FUNDRAISING"
        ? mergeFundraisingTemplateIfEligible(next)
        : next;
    });
  }, []);

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
            type: "FUNDRAISING",
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

  const handleDownloadPdf = useCallback(() => {
    const root = document.getElementById("letter-print-root");
    if (!root) {
      window.print();
      return;
    }
    openLetterPrintWindow(root.innerHTML);
  }, []);

  const handleDownloadWord = useCallback(async () => {
    const basename = sanitizeLetterExportBasename(
      activeDraft.title || activeDraft.re,
      activeDraft.id,
    );

    setDocxExporting(true);
    setDocxExportMessage(null);
    try {
      const { exportLetterDraftToDocx } =
        await import("@/lib/conf/letter-docx-export");
      await exportLetterDraftToDocx(activeDraft, basename);
    } catch (err) {
      console.error("[letters] DOCX export failed:", err);
      setDocxExportMessage(
        err instanceof Error ? err.message : "Word export failed.",
      );
    } finally {
      setDocxExporting(false);
    }
  }, [activeDraft]);

  const handlePrintBatchDrafts = useCallback((drafts: LetterDraft[]) => {
    if (drafts.length === 0) return;
    flushSync(() => {
      setBatchPrintDrafts(drafts);
    });
    const root = document.getElementById("letter-print-root");
    const html = root?.innerHTML ?? "";
    flushSync(() => {
      setBatchPrintDrafts(null);
    });
    if (html.trim()) {
      openLetterPrintWindow(html);
    }
  }, []);

  const handleSaveBatchToLibrary = useCallback(
    async (drafts: LetterDraft[]) => {
      if (!confId || drafts.length === 0) return;
      setBatchLibrarySaving(true);
      setBatchLibraryResult(null);
      setBatchLibraryProgress({ current: 0, total: drafts.length });
      const idMap = new Map<string, { dbId: string; syncedAt: string }>();
      let ok = 0;
      let fail = 0;
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        setBatchLibraryProgress({ current: i + 1, total: drafts.length });
        try {
          const result = await upsertDraftToLibrary(d);
          idMap.set(d.id, {
            dbId: result.id,
            syncedAt: new Date().toISOString(),
          });
          ok++;
        } catch {
          fail++;
        }
        await new Promise((r) => setTimeout(r, 120));
      }

      setDrafts((prev) => {
        const next = prev.map((dr) => {
          const sync = idMap.get(dr.id);
          return sync
            ? { ...dr, dbId: sync.dbId, lastDbSyncedAt: sync.syncedAt }
            : dr;
        });
        saveDrafts(next);
        return next;
      });
      setActiveDraft((cur) => {
        const sync = idMap.get(cur.id);
        return sync
          ? { ...cur, dbId: sync.dbId, lastDbSyncedAt: sync.syncedAt }
          : cur;
      });
      setLastCsvBatchDrafts((prev) =>
        prev.map((dr) => {
          const sync = idMap.get(dr.id);
          return sync
            ? { ...dr, dbId: sync.dbId, lastDbSyncedAt: sync.syncedAt }
            : dr;
        }),
      );
      setBatchLibraryResult({ ok, fail });
      setBatchLibrarySaving(false);
      setBatchLibraryProgress(null);
      void fetchLibrary(libraryPage, libraryFilter);
    },
    [confId, fetchLibrary, libraryPage, libraryFilter, upsertDraftToLibrary],
  );

  const handleDownloadBatchZipPdf = useCallback(
    async (drafts: LetterDraft[]) => {
      if (drafts.length === 0) return;
      setZipPdfMessage(null);
      setZipDownloading(true);
      setZipPdfProgress({
        phase: "Preparing fonts and letterhead assets…",
        current: 0,
        total: drafts.length,
      });
      let pdfOk = 0;
      let pdfFail = 0;
      try {
        const JSZip = (await import("jszip")).default;
        const { saveAs } = await import("file-saver");
        const { exportToPDF } =
          await import("@/lib/creative/documents/pdfExport");
        await warmupLetterBulkPdfExport();

        const zip = new JSZip();
        const folder = zip.folder("lsuic-letters");
        const padW = Math.max(3, String(drafts.length).length);

        for (let i = 0; i < drafts.length; i++) {
          const d = drafts[i];
          const label = (d.title || d.re || `Draft ${i + 1}`).slice(0, 56);
          setZipPdfProgress({
            phase: "Rendering each letter to PDF…",
            current: i + 1,
            total: drafts.length,
            detail: label,
          });
          try {
            flushSync(() => {
              setBatchPrintDrafts([d]);
            });
            await settleAfterPrintRootUpdate();
            const domReady = await waitForLetterPagesInDom(
              "letter-print-root",
              ".letter-page",
              1,
              { timeoutMs: 12_000, intervalMs: 40 },
            );
            if (!domReady) {
              pdfFail++;
              console.error(
                `[letters] Print root never showed pages for "${d.title || d.id}"`,
              );
              continue;
            }

            const basename = sanitizeLetterExportBasename(d.title, d.id);
            const name = `${String(i + 1).padStart(padW, "0")}-${basename}.pdf`;
            const blob = await exportToPDF(
              "letter-print-root",
              basename,
              undefined,
              {
                pageSelector: ".letter-page",
                pageWrapperSelector: null,
                mode: "blob",
                // Bulk ZIP: raster export — tune for smaller files (print-to-PDF stays vector).
                canvasScale: 1.25,
                jpegQuality: 0.72,
                svgRasterScale: 1.5,
                maxInlineImagePixels: 1400,
              },
            );
            if (blob && blob.size > 0) {
              folder?.file(name, blob);
              pdfOk++;
            } else {
              pdfFail++;
            }
          } catch (err) {
            pdfFail++;
            console.error(
              `[letters] PDF export failed for "${d.title || d.id}":`,
              err,
            );
          }
          await yieldToMain();
        }

        flushSync(() => {
          setBatchPrintDrafts(null);
        });

        if (pdfOk === 0) {
          setZipPdfMessage(
            "No PDFs were added to the ZIP — pages did not render in time or export failed. Check the console and try a smaller batch.",
          );
          return;
        }

        setZipPdfProgress({
          phase: "Building ZIP file…",
          current: drafts.length,
          total: drafts.length,
          detail: `${pdfOk} PDF${pdfOk !== 1 ? "s" : ""}`,
        });

        const zipBlob = await zip.generateAsync(
          { type: "blob", compression: "DEFLATE" },
          (meta) => {
            setZipPdfProgress((prev) =>
              prev
                ? {
                    ...prev,
                    phase: "Building ZIP file…",
                    detail: `${Math.round(meta.percent)}% packed`,
                  }
                : null,
            );
          },
        );

        saveAs(
          zipBlob,
          `lsuic-letters-${new Date().toISOString().slice(0, 10)}.zip`,
        );

        const failedPart =
          pdfFail > 0 ? ` ${pdfFail} letter(s) skipped due to errors.` : "";
        setZipPdfMessage(
          `Saved ZIP with ${pdfOk} PDF${pdfOk !== 1 ? "s" : ""}.${failedPart}`,
        );
        window.setTimeout(() => setZipPdfMessage(null), 12_000);
      } finally {
        setZipPdfProgress(null);
        setZipDownloading(false);
      }
    },
    [],
  );

  const loadFullDraftsFromLibraryIds = useCallback(
    async (ids: string[]): Promise<LetterDraft[]> => {
      if (!confId || ids.length === 0) return [];
      const out: LetterDraft[] = [];
      for (const id of ids) {
        try {
          const res = await fetch(`/api/conf/${confId}/letters/${id}`);
          if (!res.ok) continue;
          const full = (await res.json()) as { draft: unknown; id: string };
          const draft = migrateDraft(
            Object.assign({}, full.draft as Partial<LetterDraft>, {
              dbId: full.id,
            }),
          );
          out.push(hydrateDraftSignatures(draft));
        } catch {
          // skip broken row
        }
      }
      return out;
    },
    [confId, hydrateDraftSignatures],
  );

  const handleLibraryBulkZip = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      const [loaded] = await Promise.all([
        loadFullDraftsFromLibraryIds(ids),
        warmupLetterBulkPdfExport(),
      ]);
      if (loaded.length === 0) return;
      await handleDownloadBatchZipPdf(loaded);
    },
    [loadFullDraftsFromLibraryIds, handleDownloadBatchZipPdf],
  );

  const handleLibraryBulkDelete = useCallback(
    async (ids: string[]) => {
      if (!confId || ids.length === 0) return;
      if (
        !window.confirm(
          `Delete ${ids.length} letter(s) from the library? This cannot be undone.`,
        )
      ) {
        return;
      }
      setLibraryBulkDeleting(true);
      try {
        for (const id of ids) {
          try {
            await fetch(`/api/conf/${confId}/letters/${id}`, {
              method: "DELETE",
            });
          } catch {
            // continue
          }
        }
        setActiveDraft((d) =>
          d.dbId && ids.includes(d.dbId) ? { ...d, dbId: "" } : d,
        );
        setLibrarySelectedIds([]);
        setLibraryPage(1);
        void fetchLibrary(1, libraryFilter);
      } finally {
        setLibraryBulkDeleting(false);
      }
    },
    [confId, fetchLibrary, libraryFilter],
  );

  const handleCsvFile = useCallback((file: File | null) => {
    setCsvImportError(null);
    setCsvImportPage(1);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseRecipientCsv(text);
      if (parsed.error) {
        setCsvImportRows([]);
        setCsvImportHeaders([]);
        setCsvImportError(parsed.error);
        return;
      }
      if (parsed.rows.length === 0) {
        setCsvImportRows([]);
        setCsvImportHeaders([]);
        setCsvImportError("No data rows in CSV.");
        return;
      }
      setCsvImportRows(parsed.rows);
      setCsvImportHeaders(
        parsed.headers.length > 0
          ? parsed.headers
          : Object.keys(parsed.rows[0] ?? {}),
      );
    };
    reader.onerror = () => {
      setCsvImportError("Could not read file.");
      setCsvImportRows([]);
      setCsvImportHeaders([]);
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const handleCsvGenerateDrafts = useCallback(() => {
    if (csvImportRows.length === 0) return;
    setBatchLibraryResult(null);
    setBatchLibraryProgress(null);
    const template = hydrateDraftSignatures(
      JSON.parse(JSON.stringify(activeDraft)) as LetterDraft,
    );
    const created = draftsFromCsvTemplate(template, csvImportRows, newId);
    const migrated = created.map((d) => migrateDraft(d));
    setDrafts((prev) => {
      const next = [...migrated, ...prev];
      saveDrafts(next);
      return next;
    });
    setLastCsvBatchDrafts(migrated);
    setActiveDraft(migrated[0]);
    setDraftsListPage(1);
    setShowList(true);
  }, [activeDraft, csvImportRows, hydrateDraftSignatures]);

  const handleCsvClear = useCallback(() => {
    setCsvImportRows([]);
    setCsvImportHeaders([]);
    setCsvImportError(null);
    setCsvImportPage(1);
    setLastCsvBatchDrafts([]);
    setBatchLibraryResult(null);
    setBatchLibraryProgress(null);
  }, []);

  const draftsTotalPages = Math.max(
    1,
    Math.ceil(drafts.length / draftsListPageSize),
  );
  const draftsPageSlice = useMemo(() => {
    const start = (draftsListPage - 1) * draftsListPageSize;
    return drafts.slice(start, start + draftsListPageSize);
  }, [drafts, draftsListPage, draftsListPageSize]);

  const libraryPageIds = useMemo(() => library.map((r) => r.id), [library]);
  const librarySelectedSet = useMemo(
    () => new Set(librarySelectedIds),
    [librarySelectedIds],
  );
  const allLibraryPageSelected =
    libraryPageIds.length > 0 &&
    libraryPageIds.every((id) => librarySelectedSet.has(id));

  const draftsPageIds = useMemo(
    () => draftsPageSlice.map((d) => d.id),
    [draftsPageSlice],
  );
  const draftsSelectedSet = useMemo(
    () => new Set(draftsSelectedIds),
    [draftsSelectedIds],
  );
  const allDraftsPageSelected =
    draftsPageIds.length > 0 &&
    draftsPageIds.every((id) => draftsSelectedSet.has(id));
  const allDraftsListSelected =
    drafts.length > 0 && drafts.every((d) => draftsSelectedSet.has(d.id));

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
            height: 297mm !important;
            max-height: none !important;
            display: flex !important;
            flex-direction: column !important;
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
        {zipPdfProgress && (
          <div className="letter-no-print mb-3 flex items-start gap-3 rounded-lg border border-[#002868]/35 bg-[#002868]/[0.08] px-4 py-3 text-sm shadow-sm">
            <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-[#002868]" />
            <div className="min-w-0 flex-1 space-y-2">
              <p className="font-semibold leading-tight text-foreground">
                {zipPdfProgress.phase}
              </p>
              <p className="text-xs text-muted-foreground">
                Letter {zipPdfProgress.current} of {zipPdfProgress.total}
                {zipPdfProgress.detail ? ` · ${zipPdfProgress.detail}` : ""}.
                Leave this tab open until the download starts.
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-[#002868] transition-[width] duration-300 ease-out"
                  style={{
                    width: `${Math.min(100, Math.round((zipPdfProgress.current / zipPdfProgress.total) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {zipPdfMessage && !zipPdfProgress && (
          <div
            className={`letter-no-print mb-3 flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
              zipPdfMessage.startsWith("No PDFs")
                ? "border-amber-500/40 bg-amber-500/10 text-amber-950"
                : "border-emerald-500/40 bg-emerald-500/10 text-emerald-950"
            }`}
          >
            <p className="min-w-0 flex-1 leading-snug">{zipPdfMessage}</p>
            <button
              type="button"
              className="shrink-0 rounded p-1 text-current opacity-70 hover:opacity-100"
              onClick={() => setZipPdfMessage(null)}
              aria-label="Dismiss"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
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
              as PDF or Word
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tools/conf/letterhead">
                <Download className="size-4" />
                Letterhead parts
              </Link>
            </Button>
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
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      Local draft saved
                    </>
                  ) : (
                    <>
                      <Clock className="size-3.5" /> Auto-saving local draft
                    </>
                  )}
                </span>
                <Button variant="outline" size="sm" onClick={handleManualSave}>
                  <Save className="size-4" /> Save Local Draft
                </Button>
                {/* Save to Library (DB) */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleSaveToLibrary()}
                  disabled={savingToDb || loading || !confId || !!error}
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
                    !confId
                      ? "Conference context is still loading"
                      : activeDraft.dbId
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

        {view === "composer" && saveToDbMessage && (
          <div
            className={`letter-no-print mb-3 rounded-md border px-3 py-2 text-xs ${
              saveToDbStatus === "error"
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
            }`}
          >
            {saveToDbMessage}
          </div>
        )}

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
                  "FUNDRAISING",
                  "GENERAL",
                ] as (LetterType | "")[]
              ).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setLibraryFilter(t);
                    setLibraryPage(1);
                    setLibrarySelectedIds([]);
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

            <div className="flex flex-wrap items-center gap-3 justify-between rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>
                  {libraryTotal > 0 ? (
                    <>
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {(libraryPage - 1) * libraryPageSize + 1}–
                        {Math.min(libraryPage * libraryPageSize, libraryTotal)}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {libraryTotal}
                      </span>
                    </>
                  ) : (
                    "0 letters"
                  )}
                </span>
                <label className="inline-flex items-center gap-1.5">
                  <span className="whitespace-nowrap">Per page</span>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={libraryPageSize}
                    onChange={(e) => {
                      setLibraryPageSize(Number(e.target.value));
                      setLibraryPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-input"
                    checked={allLibraryPageSelected}
                    onChange={() => {
                      if (allLibraryPageSelected) {
                        setLibrarySelectedIds((prev) =>
                          prev.filter((id) => !libraryPageIds.includes(id)),
                        );
                      } else {
                        setLibrarySelectedIds((prev) => [
                          ...new Set([...prev, ...libraryPageIds]),
                        ]);
                      }
                    }}
                  />
                  <span>Select all on page</span>
                </label>
                {libraryTotal > libraryPageIds.length && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={
                      librarySelectAllLoading ||
                      libraryLoading ||
                      libraryTotal === 0
                    }
                    onClick={() => void selectAllLibraryLetterIds()}
                  >
                    {librarySelectAllLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : null}
                    Select all {libraryTotal} matching
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    !libraryListMode
                      ? "bg-[#002868] text-white"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => setLibraryListMode(false)}
                >
                  <LayoutGrid className="size-3.5" />
                  Grid
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                    libraryListMode
                      ? "bg-[#002868] text-white"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                  onClick={() => setLibraryListMode(true)}
                >
                  <List className="size-3.5" />
                  List
                </button>
              </div>
            </div>

            {librarySelectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#C8A061]/40 bg-[#C8A061]/10 px-3 py-2.5">
                <span className="text-xs font-medium text-foreground">
                  {librarySelectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  disabled={zipDownloading || libraryBulkDeleting}
                  type="button"
                  onClick={() => void handleLibraryBulkZip(librarySelectedIds)}
                >
                  {zipDownloading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Download className="size-3.5" />
                  )}
                  Download ZIP (PDF)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={libraryBulkDeleting || zipDownloading}
                  type="button"
                  onClick={() =>
                    void handleLibraryBulkDelete(librarySelectedIds)
                  }
                >
                  {libraryBulkDeleting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                  Delete selected
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  type="button"
                  onClick={() => setLibrarySelectedIds([])}
                >
                  Clear selection
                </Button>
              </div>
            )}

            {/* Card grid / table */}
            {libraryLoading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                Loading library…
              </div>
            ) : libraryTotal === 0 ? (
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
            ) : library.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
                <p>No letters on this page.</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={libraryPage <= 1}
                  onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                >
                  Go to previous page
                </Button>
              </div>
            ) : (
              <>
                {!libraryListMode ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {library.map((rec) => (
                      <div
                        key={rec.id}
                        className="group relative rounded-xl border border-border bg-card hover:border-[#C8A061]/50 hover:shadow-md transition-all cursor-pointer flex flex-col"
                        onClick={() => void handleLoadFromLibrary(rec)}
                      >
                        <div
                          className="absolute left-3 top-3 z-10 flex size-8 items-center justify-center rounded-md border border-border bg-background/90 shadow-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-input"
                            checked={librarySelectedSet.has(rec.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLibrarySelectedIds((prev) => [
                                  ...new Set([...prev, rec.id]),
                                ]);
                              } else {
                                setLibrarySelectedIds((prev) =>
                                  prev.filter((x) => x !== rec.id),
                                );
                              }
                            }}
                            aria-label={`Select ${rec.title || "letter"}`}
                          />
                        </div>
                        <div
                          className="h-1.5 rounded-t-xl"
                          style={{
                            background: LETTER_TYPE_COLORS[rec.type],
                          }}
                        />
                        <div className="flex-1 space-y-2 p-4 pl-11">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                background: LETTER_TYPE_COLORS[rec.type] + "22",
                                color: LETTER_TYPE_COLORS[rec.type],
                              }}
                            >
                              <Tag className="size-2.5" />
                              {LETTER_TYPE_LABELS[rec.type]}
                            </span>
                            <button
                              className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                              title="Delete letter"
                              type="button"
                              disabled={deletingId === rec.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleDeleteFromLibrary(rec.id);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
                            {rec.title || "Untitled Letter"}
                          </h3>
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
                              <div className="text-[10px] text-muted-foreground/70">
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
                        <div className="px-4 pb-3">
                          <div className="w-full text-center text-xs font-medium text-[#C8A061] opacity-0 transition-opacity group-hover:opacity-100">
                            Click to open in composer →
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/60 text-left text-xs font-medium text-muted-foreground">
                          <th className="w-10 p-2">
                            <input
                              type="checkbox"
                              className="rounded border-input"
                              checked={allLibraryPageSelected}
                              onChange={() => {
                                if (allLibraryPageSelected) {
                                  setLibrarySelectedIds((prev) =>
                                    prev.filter(
                                      (id) => !libraryPageIds.includes(id),
                                    ),
                                  );
                                } else {
                                  setLibrarySelectedIds((prev) => [
                                    ...new Set([...prev, ...libraryPageIds]),
                                  ]);
                                }
                              }}
                              title="Select all on page"
                            />
                          </th>
                          <th className="p-2">Title</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Letter date</th>
                          <th className="p-2">Saved</th>
                          <th className="w-24 p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {library.map((rec) => (
                          <tr
                            key={rec.id}
                            className="border-b border-border/60 transition-colors hover:bg-muted/30"
                          >
                            <td className="p-2 align-middle">
                              <input
                                type="checkbox"
                                className="rounded border-input"
                                checked={librarySelectedSet.has(rec.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setLibrarySelectedIds((prev) => [
                                      ...new Set([...prev, rec.id]),
                                    ]);
                                  } else {
                                    setLibrarySelectedIds((prev) =>
                                      prev.filter((x) => x !== rec.id),
                                    );
                                  }
                                }}
                              />
                            </td>
                            <td className="max-w-[240px] p-2 align-middle">
                              <button
                                type="button"
                                className="text-left font-medium text-foreground hover:underline"
                                onClick={() => void handleLoadFromLibrary(rec)}
                              >
                                {rec.title || "Untitled Letter"}
                              </button>
                            </td>
                            <td className="p-2 align-middle">
                              <span
                                className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold"
                                style={{
                                  background:
                                    LETTER_TYPE_COLORS[rec.type] + "22",
                                  color: LETTER_TYPE_COLORS[rec.type],
                                }}
                              >
                                {LETTER_TYPE_LABELS[rec.type]}
                              </span>
                            </td>
                            <td className="whitespace-nowrap p-2 align-middle text-muted-foreground text-xs">
                              {rec.letterDate || "—"}
                            </td>
                            <td className="whitespace-nowrap p-2 align-middle text-xs text-muted-foreground">
                              {new Date(rec.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </td>
                            <td className="p-2 align-middle text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="size-8 p-0 text-destructive hover:text-destructive"
                                type="button"
                                disabled={deletingId === rec.id}
                                onClick={() =>
                                  void handleDeleteFromLibrary(rec.id)
                                }
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {libraryTotal > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border/60 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
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
                      type="button"
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
            <CardHeader className="space-y-2 pb-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">Local Drafts</CardTitle>
                  <CardDescription className="text-xs">
                    Auto-saved on this device. Use &quot;Save to Library&quot;
                    to store in the cloud library.
                  </CardDescription>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {drafts.length} total
                  {drafts.length > 0 && (
                    <>
                      {" "}
                      · Page {draftsListPage} / {draftsTotalPages}
                    </>
                  )}
                </div>
              </div>
              {drafts.length > 0 && draftsSelectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md border border-[#C8A061]/30 bg-[#C8A061]/8 px-2 py-2">
                  <span className="text-xs font-medium">
                    {draftsSelectedIds.length} selected
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    type="button"
                    disabled={
                      batchLibrarySaving || draftsSelectedIds.length === 0
                    }
                    title="Save or update selected drafts in the Library"
                    onClick={() => {
                      const sel = drafts.filter((d) =>
                        draftsSelectedIds.includes(d.id),
                      );
                      void handleSaveBatchToLibrary(sel);
                    }}
                  >
                    {batchLibrarySaving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="size-3.5" />
                    )}
                    Save to Library
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    type="button"
                    disabled={zipDownloading}
                    onClick={() => {
                      const sel = drafts.filter((d) =>
                        draftsSelectedIds.includes(d.id),
                      );
                      void handleDownloadBatchZipPdf(sel);
                    }}
                  >
                    {zipDownloading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    ZIP (PDF)
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    type="button"
                    onClick={() => setDraftsSelectedIds([])}
                  >
                    Clear
                  </Button>
                </div>
              )}
              {drafts.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={allDraftsPageSelected}
                      onChange={() => {
                        if (allDraftsPageSelected) {
                          setDraftsSelectedIds((prev) =>
                            prev.filter((id) => !draftsPageIds.includes(id)),
                          );
                        } else {
                          setDraftsSelectedIds((prev) => [
                            ...new Set([...prev, ...draftsPageIds]),
                          ]);
                        }
                      }}
                    />
                    Select all on this page
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={allDraftsListSelected}
                      onChange={() => {
                        if (allDraftsListSelected) {
                          setDraftsSelectedIds([]);
                        } else {
                          setDraftsSelectedIds(drafts.map((d) => d.id));
                        }
                      }}
                    />
                    Select all {drafts.length} draft
                    {drafts.length !== 1 ? "s" : ""}
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <span className="text-muted-foreground">Per page</span>
                    <select
                      className="rounded border border-input bg-background px-1.5 py-0.5 text-xs"
                      value={draftsListPageSize}
                      onChange={(e) => {
                        setDraftsListPageSize(Number(e.target.value));
                        setDraftsListPage(1);
                      }}
                    >
                      <option value={15}>15</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No saved drafts yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {draftsPageSlice.map((d) => (
                    <div
                      key={d.id}
                      className={`flex items-center justify-between gap-2 rounded-lg border px-2 py-2.5 transition-colors cursor-pointer ${
                        d.id === activeDraft.id
                          ? "border-[#C8A061]/50 bg-[#C8A061]/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleLoad(d)}
                    >
                      <div
                        className="flex min-w-0 flex-1 items-start gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          className="mt-1 size-3.5 shrink-0 rounded border-input"
                          checked={draftsSelectedSet.has(d.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setDraftsSelectedIds((prev) => [
                                ...new Set([...prev, d.id]),
                              ]);
                            } else {
                              setDraftsSelectedIds((prev) =>
                                prev.filter((x) => x !== d.id),
                              );
                            }
                          }}
                          aria-label={`Select draft ${d.title || d.id}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                            <span
                              className="truncate"
                              onClick={() => handleLoad(d)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  handleLoad(d);
                                }
                              }}
                              role="button"
                              tabIndex={0}
                            >
                              {d.title || d.re || "Untitled Letter"}
                            </span>
                            {d.dbId && (
                              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">
                                in library
                              </span>
                            )}
                            {d.id === activeDraft.id && (
                              <span className="shrink-0 text-xs text-[#C8A061]">
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
                            {d.lastDbSyncedAt
                              ? ` · Library sync ${new Date(d.lastDbSyncedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div
                        className="flex shrink-0 items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          type="button"
                          onClick={() => handleDelete(d.id)}
                          title="Delete draft"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {drafts.length > 0 && (
                    <div className="flex items-center justify-center gap-2 border-t pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-8 text-xs"
                        disabled={draftsListPage <= 1}
                        onClick={() =>
                          setDraftsListPage((p) => Math.max(1, p - 1))
                        }
                      >
                        Prev
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Page {draftsListPage} / {draftsTotalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-8 text-xs"
                        disabled={draftsListPage >= draftsTotalPages}
                        onClick={() =>
                          setDraftsListPage((p) =>
                            Math.min(draftsTotalPages, p + 1),
                          )
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
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
              <Card className="border-[#002868]/25 bg-[#002868]/[0.04]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Table2 className="size-4 text-[#002868]" />
                    Batch from CSV
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set letter type, signatories, and fundraising fields on the
                    current draft first. Upload a CSV — each row becomes a new
                    local draft. The preview lists every column in the file
                    (header names are normalized to snake_case). For merging
                    into drafts, common keys like{" "}
                    <code className="rounded bg-muted px-0.5 text-[10px]">
                      leader_name
                    </code>
                    ,{" "}
                    <code className="rounded bg-muted px-0.5 text-[10px]">
                      leader_role
                    </code>
                    , and{" "}
                    <code className="rounded bg-muted px-0.5 text-[10px]">
                      committee_short_name
                    </code>{" "}
                    (see LSUIC leaders export) are recognized automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Recipient list (.csv)</Label>
                    <Input
                      type="file"
                      accept=".csv,text/csv"
                      className="h-9 cursor-pointer text-xs file:mr-2"
                      onChange={(e) =>
                        handleCsvFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </div>
                  {csvImportError && (
                    <p className="text-xs text-destructive">{csvImportError}</p>
                  )}
                  {csvImportRows.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground">
                        {csvImportRows.length} row
                        {csvImportRows.length !== 1 ? "s" : ""} loaded.
                      </p>
                      <div className="max-h-[220px] overflow-auto rounded-md border border-border">
                        <table className="w-full min-w-max text-[10px]">
                          <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                            <tr>
                              {(csvImportHeaders.length > 0
                                ? csvImportHeaders
                                : Object.keys(csvImportRows[0] ?? {})
                              ).map((h) => (
                                <th
                                  key={h}
                                  className="max-w-[200px] p-2 text-left font-medium whitespace-nowrap"
                                >
                                  {recipientCsvColumnLabel(h)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvImportRows
                              .slice(
                                (csvImportPage - 1) * CSV_PREVIEW_PAGE_SIZE,
                                csvImportPage * CSV_PREVIEW_PAGE_SIZE,
                              )
                              .map((row, i) => {
                                const keys =
                                  csvImportHeaders.length > 0
                                    ? csvImportHeaders
                                    : Object.keys(row);
                                return (
                                  <tr
                                    key={`${csvImportPage}-${i}`}
                                    className="border-t border-border/60"
                                  >
                                    {keys.map((h) => (
                                      <td
                                        key={h}
                                        className="max-w-[200px] break-words p-2 align-top"
                                      >
                                        {row[h] ?? ""}
                                      </td>
                                    ))}
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                      {csvImportRows.length > CSV_PREVIEW_PAGE_SIZE && (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            type="button"
                            disabled={csvImportPage <= 1}
                            onClick={() =>
                              setCsvImportPage((p) => Math.max(1, p - 1))
                            }
                          >
                            Prev
                          </Button>
                          <span className="text-[10px] text-muted-foreground">
                            Page {csvImportPage} of{" "}
                            {Math.max(
                              1,
                              Math.ceil(
                                csvImportRows.length / CSV_PREVIEW_PAGE_SIZE,
                              ),
                            )}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            type="button"
                            disabled={
                              csvImportPage * CSV_PREVIEW_PAGE_SIZE >=
                              csvImportRows.length
                            }
                            onClick={() => setCsvImportPage((p) => p + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          type="button"
                          className="h-8 bg-[#002868] hover:bg-[#001A4E]"
                          onClick={handleCsvGenerateDrafts}
                        >
                          Generate {csvImportRows.length} draft
                          {csvImportRows.length !== 1 ? "s" : ""}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          className="h-8"
                          onClick={handleCsvClear}
                        >
                          Clear CSV
                        </Button>
                      </div>
                    </>
                  )}
                  {lastCsvBatchDrafts.length > 0 && (
                    <div className="space-y-2 border-t border-border/60 pt-3">
                      <p className="text-[10px] text-muted-foreground">
                        Last batch: {lastCsvBatchDrafts.length} draft
                        {lastCsvBatchDrafts.length !== 1 ? "s" : ""}. Switch
                        drafts in the list to edit individually, print one
                        combined PDF, save all to the Library, or download a ZIP
                        of PDF files (one per recipient).
                      </p>
                      {batchLibraryProgress && (
                        <p className="text-[10px] font-medium text-[#002868] flex items-center gap-1.5">
                          <Loader2 className="size-3.5 animate-spin" />
                          Saving to Library… {
                            batchLibraryProgress.current
                          } / {batchLibraryProgress.total}
                        </p>
                      )}
                      {batchLibraryResult && !batchLibrarySaving && (
                        <p
                          className={`text-[10px] ${
                            batchLibraryResult.fail > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          Library: {batchLibraryResult.ok} saved
                          {batchLibraryResult.fail > 0 &&
                            `, ${batchLibraryResult.fail} failed`}
                          .
                        </p>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        type="button"
                        className="h-8 w-full"
                        disabled={
                          batchLibrarySaving ||
                          zipDownloading ||
                          lastCsvBatchDrafts.length === 0
                        }
                        onClick={() =>
                          void handleSaveBatchToLibrary(lastCsvBatchDrafts)
                        }
                      >
                        {batchLibrarySaving ? (
                          <>
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            Saving…
                          </>
                        ) : (
                          <>
                            <CloudUpload className="mr-1.5 size-3.5" />
                            Save all to Library ({lastCsvBatchDrafts.length})
                          </>
                        )}
                      </Button>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          className="h-8 w-full"
                          disabled={
                            batchLibrarySaving ||
                            zipDownloading ||
                            lastCsvBatchDrafts.length === 0
                          }
                          onClick={() =>
                            handlePrintBatchDrafts(lastCsvBatchDrafts)
                          }
                        >
                          <Printer className="mr-1.5 size-3.5" />
                          Print / PDF all
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          className="h-8 w-full"
                          disabled={
                            batchLibrarySaving ||
                            zipDownloading ||
                            lastCsvBatchDrafts.length === 0
                          }
                          onClick={() =>
                            void handleDownloadBatchZipPdf(lastCsvBatchDrafts)
                          }
                        >
                          {zipDownloading ? (
                            <>
                              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                              ZIP…
                            </>
                          ) : (
                            <>
                              <Package className="mr-1.5 size-3.5" />
                              ZIP (PDF × {lastCsvBatchDrafts.length})
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

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
                        handleLetterTypeChange(e.target.value as LetterType)
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
                      placeholder={`e.g. ${FUNDRAISING_SAMPLE_FROM}`}
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
                    Outreach Letter Type
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Choose the audience for this letter. Each version generates
                    tailored copy. General/corporate/government/alumni/NGO
                    versions append the fundraising flyer page; Miss LSUIC does
                    not. Edit any field freely after generating.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Enable toggle */}
                  <label className="flex items-center gap-2 text-xs font-medium text-[#002868]">
                    <input
                      type="checkbox"
                      checked={activeDraft.fundraisingEnabled}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setActiveDraft((d) => {
                          const next: LetterDraft = {
                            ...d,
                            fundraisingEnabled: checked,
                            type: checked
                              ? "FUNDRAISING"
                              : d.type === "FUNDRAISING"
                                ? "GENERAL"
                                : d.type,
                            signatoryMode:
                              !checked && d.signatoryMode === "FUNDRAISING"
                                ? "CUSTOM"
                                : d.signatoryMode,
                            ...(checked
                              ? {}
                              : { fundraisingLetterSampleApplied: false }),
                          };
                          return checked
                            ? mergeFundraisingTemplateIfEligible(next)
                            : next;
                        });
                      }}
                    />
                    Enable outreach / fundraising letter mode
                  </label>

                  {activeDraft.fundraisingEnabled && (
                    <>
                      {/* ── Letter Category ── */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">
                          Letter Version
                        </Label>
                        <select
                          className="w-full h-8 text-sm rounded-md border border-input bg-background px-2"
                          value={activeDraft.fundraisingCategory}
                          onChange={(e) => {
                            const cat = e.target.value as FundraisingCategory;
                            setActiveDraft((d) => {
                              const seeded = applyLetterSample(
                                {
                                  ...d,
                                  type: "FUNDRAISING",
                                  fundraisingCategory: cat,
                                  fundraisingEnabled: true,
                                  fundraisingLetterSampleApplied: false,
                                },
                                "replace-all",
                              );
                              return {
                                ...seeded,
                                fundraisingLetterSampleApplied: true,
                              };
                            });
                          }}
                        >
                          {(
                            Object.entries(FUNDRAISING_CATEGORY_LABELS) as [
                              FundraisingCategory,
                              string,
                            ][]
                          ).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground leading-snug">
                          <span className="block mb-1">
                            {activeDraft.fundraisingCategory === "miss_lsuic"
                              ? "Patron invitation — itemised production costs in the letter body; edit sponsor visibility lines below. No virtual fundraiser block and no flyer/payment attachment page."
                              : "Every letter category includes campaign overview, use of proceeds, session logistics, and the flyer payment note in the generated body."}
                            {activeDraft.fundraisingCategory === "general"
                              ? " Keynote Speaker (General only): both speaking and substantive support."
                              : activeDraft.fundraisingCategory !== "miss_lsuic"
                                ? " This version stays support-focused."
                                : ""}
                          </span>
                          {activeDraft.fundraisingCategory === "general" &&
                            "Set invitation category, target, Zoom details, payment deadline."}
                          {activeDraft.fundraisingCategory === "corporate" &&
                            "Sponsor invite — brand benefits, partnership package, conference theme."}
                          {activeDraft.fundraisingCategory === "government" &&
                            "Embassy / government support request — national impact, student welfare."}
                          {activeDraft.fundraisingCategory === "alumni" &&
                            "Alumni giving appeal — legacy, mentorship, student support."}
                          {activeDraft.fundraisingCategory === "ngo" &&
                            "Development partner — capacity building, mutual impact, program collaboration."}
                          {activeDraft.fundraisingCategory === "miss_lsuic" &&
                            "Achievers Award Dinner & Miss LSUIC Pageant — patron tables, programme sponsorship, and visibility."}
                        </p>
                      </div>

                      {/* ── Action buttons ── */}
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
                                `Replace letter body and header fields with the ${FUNDRAISING_CATEGORY_LABELS[activeDraft.fundraisingCategory]} sample?`,
                              )
                            ) {
                              return;
                            }
                            setActiveDraft((d) => ({
                              ...applyLetterSample(d, "replace-all"),
                              fundraisingLetterSampleApplied: true,
                            }));
                          }}
                        >
                          Load sample letter
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
                                "Replace the Letter Body with freshly generated text from the fields below?",
                              )
                            ) {
                              return;
                            }
                            setActiveDraft((d) => {
                              const html = buildLetterBodyRichHtml(
                                allLetterBodyFieldsFromDraft(d),
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

                      {/* ── Shared: Recipient ── */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {activeDraft.fundraisingCategory === "corporate"
                            ? "Contact Person / Representative"
                            : activeDraft.fundraisingCategory === "government"
                              ? "Title and Name"
                              : "Recipient Name"}
                          <span className="text-muted-foreground">
                            {" "}
                            (optional)
                          </span>
                        </Label>
                        <Input
                          className="h-8 text-sm"
                          placeholder={
                            activeDraft.fundraisingCategory === "corporate"
                              ? "e.g. Ms. Jane Doe, Head of CSR"
                              : activeDraft.fundraisingCategory === "government"
                                ? "e.g. H.E. Ambassador John Smith"
                                : activeDraft.fundraisingCategory === "alumni"
                                  ? "e.g. Esteemed Alumnus / Alumna"
                                  : "e.g. [Organization Name]"
                          }
                          value={activeDraft.fundraisingRecipientName}
                          onChange={(e) =>
                            set("fundraisingRecipientName")(e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Recipient Address
                          <span className="text-muted-foreground">
                            {" "}
                            (optional)
                          </span>
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

                      {/* ── Corporate-specific ── */}
                      {activeDraft.fundraisingCategory === "corporate" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Company / Organization Name
                            </Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder="e.g. Acme Corporation"
                              value={activeDraft.fundraisingOrgName}
                              onChange={(e) =>
                                set("fundraisingOrgName")(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Conference Theme</Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder={CONF_THEME}
                              value={activeDraft.fundraisingConferenceTheme}
                              onChange={(e) =>
                                set("fundraisingConferenceTheme")(
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Target Amount
                              <span className="text-muted-foreground">
                                {" "}
                                (optional)
                              </span>
                            </Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder="e.g. RMB 180,000"
                              value={activeDraft.fundraisingTargetAmount}
                              onChange={(e) =>
                                set("fundraisingTargetAmount")(e.target.value)
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* ── Government-specific ── */}
                      {activeDraft.fundraisingCategory === "government" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Embassy / Government Office Name
                            </Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder="e.g. Embassy of Liberia in Beijing"
                              value={activeDraft.fundraisingOfficeName}
                              onChange={(e) =>
                                set("fundraisingOfficeName")(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Conference Theme</Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder={CONF_THEME}
                              value={activeDraft.fundraisingConferenceTheme}
                              onChange={(e) =>
                                set("fundraisingConferenceTheme")(
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* ── Alumni-specific ── */}
                      {activeDraft.fundraisingCategory === "alumni" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">
                            Graduation / Class Year
                            <span className="text-muted-foreground">
                              {" "}
                              (optional)
                            </span>
                          </Label>
                          <Input
                            className="h-8 text-sm"
                            placeholder="e.g. 2018"
                            value={activeDraft.fundraisingAlumniGradYear}
                            onChange={(e) =>
                              set("fundraisingAlumniGradYear")(e.target.value)
                            }
                          />
                        </div>
                      )}

                      {/* ── NGO-specific ── */}
                      {activeDraft.fundraisingCategory === "ngo" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Form of Partnership Sought
                            </Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder="e.g. funding, program collaboration, or resource sharing"
                              value={activeDraft.fundraisingPartnershipType}
                              onChange={(e) =>
                                set("fundraisingPartnershipType")(
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Conference Theme</Label>
                            <Input
                              className="h-8 text-sm"
                              placeholder={CONF_THEME}
                              value={activeDraft.fundraisingConferenceTheme}
                              onChange={(e) =>
                                set("fundraisingConferenceTheme")(
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </>
                      )}

                      {/* ── Shared: Use of Funds / Benefits textarea (label varies) ── */}
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {activeDraft.fundraisingCategory === "corporate"
                            ? "Partnership Benefits"
                            : activeDraft.fundraisingCategory === "government"
                              ? "Areas of Impact"
                              : activeDraft.fundraisingCategory === "alumni"
                                ? "Contribution Areas"
                                : activeDraft.fundraisingCategory === "ngo"
                                  ? "Impact Areas"
                                  : activeDraft.fundraisingCategory ===
                                      "miss_lsuic"
                                    ? "Sponsor visibility & recognition"
                                    : "Intended Use of Funds"}
                          <span className="text-muted-foreground">
                            {" "}
                            (one per line)
                          </span>
                        </Label>
                        <Textarea
                          className="text-sm resize-none"
                          rows={4}
                          placeholder={
                            activeDraft.fundraisingCategory === "corporate"
                              ? CORPORATE_SAMPLE_USE_OF_FUNDS
                              : activeDraft.fundraisingCategory === "government"
                                ? GOVERNMENT_SAMPLE_USE_OF_FUNDS
                                : activeDraft.fundraisingCategory === "alumni"
                                  ? ALUMNI_SAMPLE_USE_OF_FUNDS
                                  : activeDraft.fundraisingCategory === "ngo"
                                    ? NGO_SAMPLE_USE_OF_FUNDS
                                    : activeDraft.fundraisingCategory ===
                                        "miss_lsuic"
                                      ? MISS_LSUIC_SAMPLE_USE_OF_FUNDS
                                      : "- Fee reduction support for financially constrained students\n- Venue and accommodation costs"
                          }
                          value={activeDraft.fundraisingUseOfFunds}
                          onChange={(e) =>
                            set("fundraisingUseOfFunds")(e.target.value)
                          }
                        />
                        <p className="text-[10px] text-muted-foreground">
                          Start each line with <code>-</code> or leave plain.
                          Leave blank to use defaults.
                        </p>
                      </div>

                      {/* ── General only: invitation category + keynote fields ── */}
                      {activeDraft.fundraisingCategory === "general" && (
                        <>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              Invitation Category
                            </Label>
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
                            <p className="text-[10px] text-muted-foreground leading-snug mt-1.5">
                              <strong>Keynote Speaker</strong> applies only to
                              the Zoom fundraising session in this letter. For
                              sponsor/donor asks without a speaking role, choose
                              Sponsor, Donor, Patron, etc. Invitations centred
                              on the main conference in Jinan use{" "}
                              <strong>Corporate</strong>,{" "}
                              <strong>Government</strong>,{" "}
                              <strong>Alumni</strong>, or <strong>NGO</strong>.
                            </p>
                          </div>
                          {activeDraft.fundraisingInviteRole ===
                            FUNDRAISING_KEYNOTE_SPEAKER_ROLE && (
                            <>
                              <div className="rounded-md border border-border/70 bg-muted/30 p-2.5 space-y-2">
                                <p className="text-[11px] text-foreground/90 leading-snug">
                                  The letter asks for the Zoom keynote and also
                                  expressly invites a substantive contribution
                                  to Liberian students—plus theme, topic, and
                                  duration fields when you fill them.
                                </p>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">
                                    Conference theme (optional)
                                  </Label>
                                  <Input
                                    className="h-8 text-sm"
                                    placeholder={`Leave blank for “${CONF_THEME}”`}
                                    value={
                                      activeDraft.fundraisingConferenceTheme
                                    }
                                    onChange={(e) =>
                                      set("fundraisingConferenceTheme")(
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">
                                    Proposed thematic emphasis
                                  </Label>
                                  <Textarea
                                    className="text-sm resize-none min-h-[72px]"
                                    rows={3}
                                    placeholder="e.g. leadership and diaspora engagement in line with the milestone theme"
                                    value={
                                      activeDraft.fundraisingKeynoteTopicDirection
                                    }
                                    onChange={(e) =>
                                      set("fundraisingKeynoteTopicDirection")(
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">
                                    Proposed speaking duration (optional)
                                  </Label>
                                  <Input
                                    className="h-8 text-sm"
                                    placeholder="e.g. 15–20 minutes"
                                    value={
                                      activeDraft.fundraisingKeynoteApproxDuration
                                    }
                                    onChange={(e) =>
                                      set("fundraisingKeynoteApproxDuration")(
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            </>
                          )}
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
                                  set("fundraisingInviteRoleOther")(
                                    e.target.value,
                                  )
                                }
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Target & virtual session (all categories — fills appendix tables) ── */}
                      <>
                        {activeDraft.fundraisingCategory !== "corporate" &&
                          activeDraft.fundraisingCategory !== "miss_lsuic" && (
                            <div className="space-y-1.5">
                              <Label className="text-xs">
                                Target Fundraising Amount
                              </Label>
                              <Input
                                className="h-8 text-sm"
                                placeholder="e.g. RMB 180,000"
                                value={activeDraft.fundraisingTargetAmount}
                                onChange={(e) =>
                                  set("fundraisingTargetAmount")(e.target.value)
                                }
                              />
                            </div>
                          )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              {activeDraft.fundraisingCategory === "miss_lsuic"
                                ? "Programme Date"
                                : "Fundraising Date"}
                            </Label>
                            <Input
                              className="h-8 text-sm"
                              value={activeDraft.fundraisingEventDate}
                              onChange={(e) =>
                                set("fundraisingEventDate")(e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">
                              {activeDraft.fundraisingCategory === "miss_lsuic"
                                ? "Programme Time"
                                : "Fundraising Time"}
                            </Label>
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
                          <Label className="text-xs">
                            {activeDraft.fundraisingCategory === "miss_lsuic"
                              ? "Patron Confirmation / Payment Deadline"
                              : "Payment Deadline"}
                          </Label>
                          <Input
                            className="h-8 text-sm"
                            value={activeDraft.fundraisingPaymentDeadline}
                            onChange={(e) =>
                              set("fundraisingPaymentDeadline")(e.target.value)
                            }
                          />
                        </div>
                        {activeDraft.fundraisingCategory !== "miss_lsuic" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Meeting Medium</Label>
                              <Input
                                className="h-8 text-sm"
                                value={activeDraft.fundraisingMeetingMedium}
                                onChange={(e) =>
                                  set("fundraisingMeetingMedium")(
                                    e.target.value,
                                  )
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
                                <Label className="text-xs">
                                  Meeting Password
                                </Label>
                                <Input
                                  className="h-8 text-sm"
                                  value={activeDraft.fundraisingMeetingPassword}
                                  onChange={(e) =>
                                    set("fundraisingMeetingPassword")(
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </>
                        )}
                      </>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="flex-1 bg-[#002868] hover:bg-[#001A4E]"
                      disabled={docxExporting}
                    >
                      {docxExporting ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Download className="size-4" />
                      )}
                      Download
                      <ChevronDown className="size-4 opacity-90" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Export format</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      disabled={docxExporting}
                      onClick={handleDownloadPdf}
                    >
                      <Printer className="mr-2 size-4" />
                      PDF (print dialog)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={docxExporting}
                      onClick={() => void handleDownloadWord()}
                    >
                      <FileText className="mr-2 size-4" />
                      Word (.docx)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                PDF opens the print dialog; Word saves an editable .docx from
                letter fields and body (not a screenshot).
              </p>
              {docxExportMessage && (
                <p className="text-[10px] text-destructive text-center">
                  {docxExportMessage}
                </p>
              )}
            </div>

            {/* ── Right: A4 preview ── */}
            <div className="flex-1 min-w-0 overflow-y-auto pb-6">
              {/* Zoom controls */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#002868]">
                    Live A4 Preview
                  </p>
                  {draftShowsFundraisingFlyer(activeDraft) && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Fundraising flyer is attached on the last page. Scroll
                      down to view it.
                    </p>
                  )}
                </div>
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
                    zoom: zoom / 100,
                    width: 794,
                    margin: "0 auto",
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
        {batchPrintDrafts && batchPrintDrafts.length > 0 ? (
          batchPrintDrafts.map((d) => (
            <LetterA4Preview
              key={d.id}
              draft={d}
              members={members}
              confInfo={confInfo}
              forPrint
            />
          ))
        ) : (
          <LetterA4Preview
            draft={activeDraft}
            members={members}
            confInfo={confInfo}
            forPrint
          />
        )}
      </div>
    </div>
  );
}
