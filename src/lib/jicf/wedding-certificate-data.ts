/**
 * JICF Wedding Certificate — editable fields, blank template, and the
 * Harmon–Barvor official record (26 September 2026, Hangzhou).
 */

export const JICF_WEDDING_COLORS = {
  navy: "#190570",
  navyDeep: "#0f0340",
  red: "#ed1c24",
  gold: "#d4af37",
  yellow: "#efe31e",
  cream: "#fffde7",
  ivory: "#fffef8",
  white: "#ffffff",
  ink: "#1a1530",
  muted: "#333333",
} as const;

export type JicfWeddingCertificateData = {
  organizationName: string;
  subtitle: string;
  title: string;
  ceremonyDay: string;
  ceremonyMonth: string;
  ceremonyYear: string;
  location: string;
  brideName: string;
  groomName: string;
  covenantText: string;
  officiantHeading: string;
  officiantTestimony: string;
  officiantName: string;
  officiantRole: string;
  officiantSignatureLabel: string;
  witnessHeading: string;
  witnessTestimony: string;
  witness1Name: string;
  witness2Name: string;
  witnessSignatureLabel: string;
  certificateId: string;
};

export const JICF_WEDDING_BLANK: JicfWeddingCertificateData = {
  organizationName: "Jinan International Christian Fellowship",
  subtitle: "Official Marriage Certification",
  title: "Wedding Certificate",
  ceremonyDay: "",
  ceremonyMonth: "",
  ceremonyYear: "",
  location: "",
  brideName: "",
  groomName: "",
  covenantText:
    "The two individuals have willingly entered into the covenant of marriage, promising to love, honor, cherish, and abide with one another, for better or for worse, in sickness and in health, till death do them part, according to the sacred teachings of the Christian faith.",
  officiantHeading: "Officiant Verification",
  officiantTestimony:
    "I hereby solemnly testify that this marriage ceremony has been legally and spiritually performed by me.",
  officiantName: "",
  officiantRole: "Pastor (Officiant)",
  officiantSignatureLabel: "Signature & Date",
  witnessHeading: "Witness Testification",
  witnessTestimony:
    "We, the undersigned witnesses, were present at this holy wedding ceremony and confirm the authenticity of this marriage covenant.",
  witness1Name: "★",
  witness2Name: "★",
  witnessSignatureLabel: "Signature & Date",
  certificateId: "",
};

/** Filled church record for Ruphine Manaweh Harmon & Joshua Bosco Barvor. */
export const JICF_WEDDING_HARMON_BARVOR: JicfWeddingCertificateData = {
  ...JICF_WEDDING_BLANK,
  ceremonyDay: "26th",
  ceremonyMonth: "September",
  ceremonyYear: "2026",
  location: "Hangzhou, China",
  brideName: "Ruphine Manaweh Harmon",
  groomName: "Joshua Bosco Barvor",
  officiantName: "Joseph Summers",
  certificateId: "JICF-2026-WED-0001-HB",
};

export function buildCertificationText(data: JicfWeddingCertificateData): string {
  const day = data.ceremonyDay.trim() || "____";
  const month = data.ceremonyMonth.trim() || "________";
  const year = data.ceremonyYear.trim() || "____";
  const location = data.location.trim() || "________";
  return `This is to certify that on the ${day} day of ${month}, ${year}, a sacred marriage ceremony was solemnly officiated and completed in ${location}.`;
}

export function buildOversightText(data: JicfWeddingCertificateData): string {
  const org =
    data.organizationName.trim() || "Jinan International Christian Fellowship";
  return `The holy matrimony was celebrated under the authority and pastoral oversight of ${org}, uniting the below two persons in lawful and sacred marriage before God and witnesses.`;
}

export function displayPartyName(name: string, fallback: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function displayWitnessName(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : "★";
}
