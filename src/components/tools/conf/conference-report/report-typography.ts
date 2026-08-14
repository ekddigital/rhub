import { C } from "../booklet/constants";

/** Interior body prose — larger than delegate booklet for on-screen/PDF report readability. */
export const REPORT_BODY = {
  fontSize: 16,
  lineHeight: 1.62,
  color: "#0A1328",
} as const;

export const REPORT_SECTION_TITLE = {
  fontSize: 20,
  fontWeight: 800,
  color: C.blue,
  marginBottom: 12,
  paddingBottom: 6,
  borderBottom: `2px solid ${C.gold}`,
} as const;

export const REPORT_SUBSECTION = {
  fontSize: 15,
  fontWeight: 800,
  color: C.blue,
} as const;

export const REPORT_CONTINUATION = {
  fontSize: 14.5,
  fontWeight: 700,
  color: C.blue,
} as const;

export const REPORT_BULLET = {
  fontSize: 15,
  lineHeight: 1.55,
  color: "#333",
} as const;

export const REPORT_LIST_ITEM = {
  fontSize: 15,
  lineHeight: 1.5,
  color: "#333",
} as const;

/** Compact tables (attendance register, program schedule). */
export const REPORT_TABLE = {
  fontSize: 13.5,
  headerFontSize: 12.5,
  cellPadding: "6px 7px",
  compactCellPadding: "5px 6px",
} as const;

/** Overview / finance tables — slightly larger. */
export const REPORT_TABLE_PROSE = {
  fontSize: 15,
  cellPadding: "8px 10px",
} as const;

export const REPORT_PROGRAM = {
  dayTitle: { fontSize: 14, fontWeight: 800, color: C.blue },
  dayMeta: { fontSize: 12, color: "#666" },
  dressCode: { fontSize: 11, lineHeight: 1.4, color: "#555" },
  time: { fontSize: 11, fontWeight: 700, color: C.blue },
  activity: { fontSize: 11.5, lineHeight: 1.4, color: "#222" },
  responsible: { fontSize: 11, color: "#444" },
  subItem: { fontSize: 10.5, color: "#555" },
  tableHeader: { fontSize: 11, fontWeight: 700, color: C.blue },
  footnote: { fontSize: 10.5, color: "#666", lineHeight: 1.4 },
} as const;

export const REPORT_TOC = {
  title: { fontSize: 22, fontWeight: 800, color: C.blue },
  entry: { fontSize: 13.5, lineHeight: 1.38 },
  badge: { fontSize: 10, fontWeight: 700 },
} as const;

export const REPORT_PHOTO = {
  caption: { fontSize: 10.5, fontWeight: 600, color: "#555", lineHeight: 1.3 },
} as const;

export const REPORT_STATS = {
  label: { fontSize: 11.5, fontWeight: 700, color: "#666" },
  value: { fontSize: 24, fontWeight: 800, color: C.blue },
} as const;

export const REPORT_CERT = {
  label: { fontSize: 13, fontWeight: 700, color: C.blue },
  signature: { fontSize: 13, color: "#222" },
  role: { fontSize: 12, color: "#666" },
  date: { fontSize: 11, color: "#888", fontStyle: "italic" as const },
} as const;
