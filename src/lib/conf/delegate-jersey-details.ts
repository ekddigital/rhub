import { countConferenceJerseySets } from "@/lib/conf/fees";

export const CONFERENCE_JERSEY_SIZES = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
] as const;

export type ConferenceJerseySize = (typeof CONFERENCE_JERSEY_SIZES)[number];

export type ConferenceJerseyDetail = {
  name: string;
  size: ConferenceJerseySize;
  number: string;
};

export const MIN_CONFERENCE_JERSEY_NUMBER = 0;
export const MAX_CONFERENCE_JERSEY_NUMBER = 99;

export function emptyConferenceJerseyDetail(): ConferenceJerseyDetail {
  return { name: "", size: "M", number: "" };
}

export function resizeConferenceJerseyDetails(
  current: ConferenceJerseyDetail[],
  quantity: number,
): ConferenceJerseyDetail[] {
  const qty = Math.max(0, quantity);
  if (qty === 0) return [];
  const next = current.slice(0, qty);
  while (next.length < qty) {
    next.push(emptyConferenceJerseyDetail());
  }
  return next;
}

function isJerseySize(value: string): value is ConferenceJerseySize {
  return (CONFERENCE_JERSEY_SIZES as readonly string[]).includes(value);
}

export function coerceConferenceJerseyDetailsFromClient(
  raw: unknown,
): ConferenceJerseyDetail[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => {
    if (!item || typeof item !== "object") return emptyConferenceJerseyDetail();
    const row = item as Record<string, unknown>;
    const sizeRaw = String(row.size ?? "").trim().toUpperCase();
    return {
      name: String(row.name ?? ""),
      size: isJerseySize(sizeRaw) ? sizeRaw : "M",
      number: String(row.number ?? ""),
    };
  });
}

export function parseConferenceJerseyDetails(
  raw: unknown,
): ConferenceJerseyDetail[] {
  if (!Array.isArray(raw)) return [];
  const parsed: ConferenceJerseyDetail[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const name = String(row.name ?? "").trim();
    const sizeRaw = String(row.size ?? "").trim().toUpperCase();
    const number = String(row.number ?? "").trim();
    if (!name || !isJerseySize(sizeRaw) || !number) continue;
    parsed.push({ name, size: sizeRaw, number });
  }
  return parsed;
}

export function normalizeConferenceJerseyDetailsForStorage(
  details: ConferenceJerseyDetail[],
  jerseyQuantity: number,
): ConferenceJerseyDetail[] | null {
  if (jerseyQuantity <= 0) return null;
  return details.slice(0, jerseyQuantity).map((row) => ({
    name: row.name.trim(),
    size: row.size,
    number: row.number.trim(),
  }));
}

export function mapDelegateJerseyDetailsForClient(
  raw: unknown,
): ConferenceJerseyDetail[] {
  return parseConferenceJerseyDetails(raw);
}

export function validateConferenceJerseyNumber(
  value: string,
): { ok: true; number: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: "Jersey number is required" };
  }
  if (!/^\d{1,2}$/.test(trimmed)) {
    return {
      ok: false,
      error: `Jersey number must be ${MIN_CONFERENCE_JERSEY_NUMBER}–${MAX_CONFERENCE_JERSEY_NUMBER}`,
    };
  }
  const num = Number(trimmed);
  if (
    !Number.isInteger(num) ||
    num < MIN_CONFERENCE_JERSEY_NUMBER ||
    num > MAX_CONFERENCE_JERSEY_NUMBER
  ) {
    return {
      ok: false,
      error: `Jersey number must be ${MIN_CONFERENCE_JERSEY_NUMBER}–${MAX_CONFERENCE_JERSEY_NUMBER}`,
    };
  }
  return { ok: true, number: String(num) };
}

export function validateConferenceJerseyDetails(
  jerseyQuantity: number,
  details: ConferenceJerseyDetail[],
): { ok: true; details: ConferenceJerseyDetail[] } | { ok: false; error: string } {
  if (jerseyQuantity <= 0) {
    return { ok: true, details: [] };
  }
  if (details.length !== jerseyQuantity) {
    return {
      ok: false,
      error: `Please complete customization for all ${jerseyQuantity} jersey set${jerseyQuantity === 1 ? "" : "s"}`,
    };
  }

  const normalized: ConferenceJerseyDetail[] = [];
  for (let i = 0; i < details.length; i++) {
    const row = details[i];
    const label = `Jersey ${i + 1} of ${jerseyQuantity}`;
    const name = row.name.trim();
    if (!name) {
      return { ok: false, error: `${label}: name on jersey is required` };
    }
    const sizeRaw = String(row.size ?? "").trim().toUpperCase();
    if (!isJerseySize(sizeRaw)) {
      return { ok: false, error: `${label}: please select a size` };
    }
    const numberCheck = validateConferenceJerseyNumber(row.number);
    if (!numberCheck.ok) {
      return { ok: false, error: `${label}: ${numberCheck.error}` };
    }
    normalized.push({
      name,
      size: sizeRaw,
      number: numberCheck.number,
    });
  }

  return { ok: true, details: normalized };
}

export function validateConferenceJerseyDetailsForAddOns(
  addOnPackageIds: string[],
  details: ConferenceJerseyDetail[],
): ReturnType<typeof validateConferenceJerseyDetails> {
  return validateConferenceJerseyDetails(
    countConferenceJerseySets(addOnPackageIds),
    details,
  );
}

export function formatConferenceJerseyDetailLine(
  detail: ConferenceJerseyDetail,
  index: number,
): string {
  return `#${index + 1}: ${detail.name} · ${detail.size} · #${detail.number}`;
}
