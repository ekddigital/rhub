import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { XMLParser } from "fast-xml-parser";
import { CONFERENCE_ATTENDANCE_XLSX_PUBLIC_PATH } from "./attendance-register-constants";
import type { ReportAttendanceRow, ReportDataSource } from "./types";

export { CONFERENCE_ATTENDANCE_XLSX_PUBLIC_PATH };

const CONFERENCE_ATTENDANCE_XLSX_FILE = path.join(
  process.cwd(),
  "public",
  "conf",
  "assets",
  "before-after-conf",
  "conference-attendance.xlsx",
);

function formatMoney(value: unknown): string {
  const num = Number(value);
  if (!Number.isFinite(num)) return "0";
  return Number.isInteger(num) ? String(num) : num.toFixed(2);
}

function isAttendanceHeaderOrTotal(row: Record<string, string>): boolean {
  const no = String(row.A ?? "").trim();
  const name = String(row.B ?? "").trim();

  if (!name || name === "Names") return true;
  if (no === "No." || no === "Total") return true;
  if (/conference|table tickets|jersey/i.test(no)) return true;

  return false;
}

/** Parse the official conference-attendance.xlsx workbook (columns A–G only). */
export function parseConferenceAttendanceXlsx(buffer: Buffer): ReportAttendanceRow[] {
  const zip = new AdmZip(buffer);
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const sharedXml = zip.readAsText("xl/sharedStrings.xml");
  const sheetXml = zip.readAsText("xl/worksheets/sheet1.xml");
  const sharedData = parser.parse(sharedXml);
  const sheetData = parser.parse(sheetXml);

  const sharedItems = sharedData.sst?.si ?? [];
  const strings = (Array.isArray(sharedItems) ? sharedItems : [sharedItems]).map(
    (item: unknown) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object") return "";

      const record = item as {
        t?: string | { "#text"?: string };
        r?: Array<{ t?: string | { "#text"?: string } }>;
      };

      if (record.t) {
        return typeof record.t === "string"
          ? record.t
          : (record.t["#text"] ?? "");
      }

      if (record.r) {
        return record.r
          .map((part) => {
            if (!part.t) return "";
            return typeof part.t === "string"
              ? part.t
              : (part.t["#text"] ?? "");
          })
          .join("");
      }

      return "";
    },
  );

  const getCellValue = (cell: {
    "@_t"?: string;
    v?: string | number;
  }): string => {
    if (!cell) return "";
    if (cell["@_t"] === "s") {
      return strings[Number(cell.v)] ?? "";
    }
    return cell.v != null ? String(cell.v) : "";
  };

  const rawRows = sheetData.worksheet?.sheetData?.row ?? [];
  const rows = Array.isArray(rawRows) ? rawRows : [rawRows];
  const parsedRows: ReportAttendanceRow[] = [];

  for (const rawRow of rows) {
    const cells = Array.isArray(rawRow.c)
      ? rawRow.c
      : rawRow.c
        ? [rawRow.c]
        : [];

    const columns: Record<string, string> = {};
    for (const cell of cells) {
      const ref = cell["@_r"] as string | undefined;
      if (!ref) continue;

      const column = ref.replace(/[0-9]/g, "");
      if (column > "G") continue;
      columns[column] = getCellValue(cell);
    }

    if (isAttendanceHeaderOrTotal(columns)) continue;

    parsedRows.push({
      no: String(columns.A ?? parsedRows.length + 1),
      name: columns.B.trim(),
      city: columns.C.trim(),
      room: columns.D.trim(),
      fee: formatMoney(columns.E),
      paid: formatMoney(columns.F),
      balance: formatMoney(columns.G),
    });
  }

  return parsedRows.map((row, index) => ({
    ...row,
    no: String(index + 1),
  }));
}

export function loadReportAttendanceRegisterFromFile(): {
  attendanceRows: ReportAttendanceRow[];
  source: ReportDataSource;
} {
  if (!fs.existsSync(CONFERENCE_ATTENDANCE_XLSX_FILE)) {
    return { attendanceRows: [], source: "static" };
  }

  const buffer = fs.readFileSync(CONFERENCE_ATTENDANCE_XLSX_FILE);
  const attendanceRows = parseConferenceAttendanceXlsx(buffer);

  return {
    attendanceRows,
    source: attendanceRows.length > 0 ? "static" : "static",
  };
}
