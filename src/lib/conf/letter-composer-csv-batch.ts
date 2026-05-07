/**
 * Parse recipient CSV files (e.g. LSUIC `lsuic-leaders.csv`) and merge rows into
 * letter composer drafts from a user-defined template draft.
 */

import type { LetterDraft } from "@/components/tools/conf/letter-composer-types";
import { richHtmlToPlainText } from "@/components/tools/conf/letter-composer-plain";
import {
  buildLetterBodyRichHtml,
  type AllLetterBodyFields,
} from "@/lib/conf/fundraising-letter-template";

export type CsvRecipientRow = Record<string, string>;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.replace(/^"|"$/g, "").trim());
}

/**
 * Minimal RFC-4180-style CSV parse: header row + data rows, quote-aware.
 */
export function parseRecipientCsv(text: string): {
  rows: CsvRecipientRow[];
  headers: string[];
  error: string | null;
} {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) {
    return { rows: [], headers: [], error: "File is empty." };
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    return {
      rows: [],
      headers: [],
      error: "CSV needs a header row and at least one data row.",
    };
  }

  const headerCells = parseCsvLine(lines[0]);
  const headers = headerCells.map((h) =>
    h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_"),
  );

  const rows: CsvRecipientRow[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li]);
    if (cells.length === 1 && cells[0] === "") continue;
    const row: CsvRecipientRow = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = cells[i] ?? "";
    }
    rows.push(row);
  }

  return { rows, headers, error: null };
}

function getCell(row: CsvRecipientRow, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

const NAME_KEYS = [
  "leader_name",
  "name",
  "recipient_name",
  "hon",
  "full_name",
];
const ROLE_KEYS = ["leader_role", "role", "position", "title"];
const CITY_KEYS = ["leader_city_area", "city", "location", "area"];
const UNI_KEYS = [
  "leader_university",
  "university",
  "school",
  "institution",
];
const COMM_FORMAL_KEYS = [
  "committee_formal_name",
  "committee",
  "committee_name",
];
const COMM_SHORT_KEYS = [
  "committee_short_name",
  "abbr",
  "code",
  "short_name",
];

function bodyFieldsFromDraft(d: LetterDraft): AllLetterBodyFields {
  return {
    fundraisingCategory: d.fundraisingCategory,
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
    fundraisingOrgName: d.fundraisingOrgName,
    fundraisingOfficeName: d.fundraisingOfficeName,
    fundraisingAlumniGradYear: d.fundraisingAlumniGradYear,
    fundraisingPartnershipType: d.fundraisingPartnershipType,
  };
}

function syncFundraisingBody(draft: LetterDraft): LetterDraft {
  const html = buildLetterBodyRichHtml(bodyFieldsFromDraft(draft));
  return {
    ...draft,
    bodyRich: html,
    body: richHtmlToPlainText(html),
    fundraisingLetterSampleApplied: true,
  };
}

function buildTitle(parts: {
  committeeShort: string;
  committeeFormal: string;
  name: string;
  index: number;
}): string {
  const abbr = parts.committeeShort || parts.committeeFormal || "Letter";
  const who = parts.name || `Recipient ${parts.index + 1}`;
  const t = `${abbr} — ${who}`;
  return t.length > 160 ? t.slice(0, 157) + "…" : t;
}

/**
 * Clone `template` per CSV row: fills To / recipient fields and regenerates
 * fundraising body when fundraising mode is on.
 */
export function draftFromCsvRow(
  template: LetterDraft,
  row: CsvRecipientRow,
  rowIndex: number,
  newId: () => string,
): LetterDraft {
  const name = getCell(row, NAME_KEYS);
  const role = getCell(row, ROLE_KEYS);
  const city = getCell(row, CITY_KEYS);
  const university = getCell(row, UNI_KEYS);
  const committeeFormal = getCell(row, COMM_FORMAL_KEYS);
  const committeeShort = getCell(row, COMM_SHORT_KEYS);

  const committeeLine = [committeeFormal, committeeShort]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(" · ");

  // Omit phone from the printed To / address block — full numbers are not wanted on the letterhead.
  const toLines = [
    name,
    role,
    committeeLine,
    university,
    city,
  ].filter(Boolean);

  const addressLines = [university, city].filter(Boolean);

  let next: LetterDraft = {
    ...template,
    id: newId(),
    dbId: "",
    savedAt: "",
    title: buildTitle({
      committeeShort,
      committeeFormal,
      name,
      index: rowIndex,
    }),
    to: toLines.join("\n"),
    fundraisingRecipientName: name || template.fundraisingRecipientName,
    fundraisingRecipientAddress:
      addressLines.join("\n") || template.fundraisingRecipientAddress,
  };

  if (next.fundraisingEnabled) {
    next = syncFundraisingBody(next);
  }

  return next;
}

export function draftsFromCsvTemplate(
  template: LetterDraft,
  rows: CsvRecipientRow[],
  newId: () => string,
): LetterDraft[] {
  return rows.map((row, i) => draftFromCsvRow(template, row, i, newId));
}

/** Readable table header for normalized CSV keys (e.g. `leader_name` → Leader Name). */
export function recipientCsvColumnLabel(key: string): string {
  if (!key) return "";
  return key
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
