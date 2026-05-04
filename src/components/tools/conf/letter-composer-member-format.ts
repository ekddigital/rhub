import type { LetterComposerMember } from "./letter-composer-types";

/** Fallback titles when member.title is empty (committee roster UI + preset wiring). */
export const LETTER_COMPOSER_ROLE_LABELS: Record<string, string> = {
  CHAIR: "General Chairman",
  VICE_CHAIR: "General Co-Chair",
  SECRETARY: "General Secretary",
  TREASURER: "Treasurer",
};

export function letterComposerMemberLabel(m: LetterComposerMember): string {
  const base = LETTER_COMPOSER_ROLE_LABELS[m.role];
  if (base) return base;
  return m.title ?? m.committeeScope ?? "Committee Member";
}

export function formatChinaPhone(phone: string | null | undefined): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "";
  if (raw.startsWith("+")) return raw;

  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;
  if (digits.startsWith("86")) return `+${digits}`;
  return `+86${digits}`;
}

export function fmtLetterDateRange(start: string, end: string): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("en-US", opts);
  return (
    fmt(new Date(start), { month: "long", day: "numeric" }) +
    " – " +
    fmt(new Date(end), { month: "long", day: "numeric", year: "numeric" })
  );
}
