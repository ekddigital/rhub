import type { NecMember } from "./types";

// ─── Date / time formatters ───────────────────────────────────────────────────
export function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function fmtTime(d: string | Date) {
  return new Date(d).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtRange(start: string | Date, end: string | Date) {
  const s = new Date(start);
  const e = new Date(end);
  if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
    return `${s.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${fmt(s)} – ${fmt(e)}`;
}

// ─── NEC role label ───────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  TREASURER: "Treasurer",
  COMMITTEE: "",
};

export function roleLabel(m: NecMember) {
  if (m.title && m.title.trim().length > 0) return m.title;
  const base = ROLE_LABELS[m.role];
  if (base !== undefined && base !== "") return base;
  return m.committeeScope ?? "Committee Member";
}
