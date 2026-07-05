import {
  ADDITIONAL_GUEST_FEE_RMB,
  calcAdditionalGuestFee,
  calcConferenceRegistrationTotal,
  conferencePackageIncludesGuest,
} from "@/lib/conf/fees";

export {
  ADDITIONAL_GUEST_FEE_RMB,
  calcAdditionalGuestFee,
  calcConferenceRegistrationTotal,
  conferencePackageIncludesGuest,
};

/** Default guest count when a +guest package is selected (first guest included in package). */
export const DEFAULT_GUEST_COUNT_FOR_GUEST_PACKAGE = 1;

/** Upper bound on guests per registration. */
export const MAX_CONFERENCE_GUESTS = 10;

export type ConferenceGuestDetail = {
  id?: string;
  name: string;
  passportNo: string;
  nationality: string;
  /** ISO date string (YYYY-MM-DD) or empty when unknown. */
  passportExpiry: string;
};

export type ConferenceGuestRegistrationPayload = ConferenceGuestDetail & {
  passportPhoto: File | null;
  lastEntryStampPhoto: File | null;
  currentVisaPhoto: File | null;
};

export type ConferenceGuestClientPayload = ConferenceGuestDetail;

export function resizeConferenceGuestDetails(
  prev: ConferenceGuestDetail[],
  count: number,
): ConferenceGuestDetail[] {
  const target = Math.max(0, Math.min(count, MAX_CONFERENCE_GUESTS));
  const next = prev.slice(0, target);
  while (next.length < target) {
    next.push(emptyConferenceGuestDetail());
  }
  return next;
}

export function resizeConferenceGuestRegistrationPayload(
  prev: ConferenceGuestRegistrationPayload[],
  count: number,
): ConferenceGuestRegistrationPayload[] {
  const resized = resizeConferenceGuestDetails(prev, count);
  return resized.map((detail, index) => ({
    ...detail,
    passportPhoto: prev[index]?.passportPhoto ?? null,
    lastEntryStampPhoto: prev[index]?.lastEntryStampPhoto ?? null,
    currentVisaPhoto: prev[index]?.currentVisaPhoto ?? null,
  }));
}

export function emptyConferenceGuestDetail(): ConferenceGuestDetail {
  return {
    name: "",
    passportNo: "",
    nationality: "",
    passportExpiry: "",
  };
}

export function coerceConferenceGuestsFromClient(
  value: unknown,
): ConferenceGuestClientPayload[] {
  if (!Array.isArray(value)) return [];
  const out: ConferenceGuestClientPayload[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    out.push({
      id: typeof row.id === "string" ? row.id.trim() : undefined,
      name: typeof row.name === "string" ? row.name.trim() : "",
      passportNo:
        typeof row.passportNo === "string" ? row.passportNo.trim().toUpperCase() : "",
      nationality:
        typeof row.nationality === "string" ? row.nationality.trim() : "",
      passportExpiry:
        typeof row.passportExpiry === "string" ? row.passportExpiry.trim() : "",
    });
  }
  return out;
}

export function mapConferenceGuestsForClient(
  guests: Array<{
    id: string;
    sortOrder: number;
    name: string;
    passportNo: string | null;
    nationality: string | null;
    passportExpiry: Date | null;
    passportPhotoPath: string | null;
    lastEntryStampPath: string | null;
    currentVisaPath: string | null;
  }>,
): Array<
  ConferenceGuestDetail & {
    passportPhotoPath: string | null;
    lastEntryStampPath: string | null;
    currentVisaPath: string | null;
  }
> {
  return [...guests]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g) => ({
      id: g.id,
      name: g.name,
      passportNo: g.passportNo ?? "",
      nationality: g.nationality ?? "",
      passportExpiry: g.passportExpiry
        ? g.passportExpiry.toISOString().slice(0, 10)
        : "",
      passportPhotoPath: g.passportPhotoPath,
      lastEntryStampPath: g.lastEntryStampPath,
      currentVisaPath: g.currentVisaPath,
    }));
}

function parsePassportExpiry(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = new Date(`${value.trim()}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function validateConferenceGuestsForPackage(args: {
  feePackageId: string;
  guestCount: number;
  guests: ConferenceGuestClientPayload[];
  requireGuestDetails?: boolean;
}):
  | {
      ok: true;
      guestCount: number;
      guests: Array<{
        name: string;
        passportNo: string;
        nationality: string;
        passportExpiry: Date | null;
      }>;
      additionalGuestFee: number;
    }
  | { ok: false; error: string } {
  const includesGuest = conferencePackageIncludesGuest(args.feePackageId);
  const rawCount = Math.floor(Number(args.guestCount) || 0);

  if (!includesGuest) {
    if (rawCount > 0 || args.guests.length > 0) {
      return {
        ok: false,
        error:
          "Guest details are only allowed for packages that include a guest.",
      };
    }
    return {
      ok: true,
      guestCount: 0,
      guests: [],
      additionalGuestFee: 0,
    };
  }

  const guestCount = Math.min(
    MAX_CONFERENCE_GUESTS,
    Math.max(DEFAULT_GUEST_COUNT_FOR_GUEST_PACKAGE, rawCount),
  );

  if (args.guests.length !== guestCount) {
    return {
      ok: false,
      error: `Please provide details for all ${guestCount} guest${guestCount === 1 ? "" : "s"}.`,
    };
  }

  const normalized: Array<{
    name: string;
    passportNo: string;
    nationality: string;
    passportExpiry: Date | null;
  }> = [];

  for (let i = 0; i < args.guests.length; i++) {
    const g = args.guests[i];
    const label = `Guest ${i + 1}`;
    if (!g.name.trim()) {
      return { ok: false, error: `${label}: full name is required.` };
    }
    if (!g.passportNo.trim()) {
      return { ok: false, error: `${label}: passport number is required.` };
    }
    if (!g.nationality.trim()) {
      return { ok: false, error: `${label}: nationality is required.` };
    }
    if (g.passportExpiry.trim()) {
      const expiry = parsePassportExpiry(g.passportExpiry);
      if (!expiry) {
        return {
          ok: false,
          error: `${label}: passport expiry must be a valid date (YYYY-MM-DD).`,
        };
      }
      normalized.push({
        name: g.name.trim(),
        passportNo: g.passportNo.trim().toUpperCase(),
        nationality: g.nationality.trim(),
        passportExpiry: expiry,
      });
    } else {
      normalized.push({
        name: g.name.trim(),
        passportNo: g.passportNo.trim().toUpperCase(),
        nationality: g.nationality.trim(),
        passportExpiry: null,
      });
    }
  }

  if (args.requireGuestDetails !== false && normalized.length === 0) {
    return {
      ok: false,
      error: "At least one guest is required for this package.",
    };
  }

  return {
    ok: true,
    guestCount,
    guests: normalized,
    additionalGuestFee: calcAdditionalGuestFee(guestCount),
  };
}

export function additionalGuestFeeLineLabel(guestCount: number): string {
  const extra = Math.max(0, guestCount - 1);
  if (extra <= 0) return "";
  return `Additional guest room${extra === 1 ? "" : "s"} (×${extra} @ ¥${ADDITIONAL_GUEST_FEE_RMB})`;
}
