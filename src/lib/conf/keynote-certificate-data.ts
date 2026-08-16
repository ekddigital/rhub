import { CONF_2026 } from "@/lib/conf/config";

export type KeynoteCertificateSignatory = {
  name: string;
  title: string;
  label: string;
};

export type KeynoteCertificateData = {
  speakerName: string;
  companyName: string;
  speakerTitle: string;
  citationText: string;
  issueDate: string;
  certificateId: string;
  displayDate: string;
  theme: string;
  signatories: KeynoteCertificateSignatory[];
};

export const KEYNOTE_CERTIFICATE_DEFAULTS = {
  speakerName: "SUANON IFON FELIX MARCELLIN",
  companyName: "EXANORA",
  speakerTitle: "Founder and Chief Executive Officer (CEO)",
  citationText:
    "In heartfelt appreciation for delivering a keynote message and inspiring support during the fundraising program of the LSUIC 20th Annual Conference & Anniversary. As Founder and Chief Executive Officer (CEO) of EXANORA, your voice of leadership and service strengthened our unity and commitment to the Union's vision.",
  issueDate: "2026-05-29",
} as const;

export const KEYNOTE_CERTIFICATE_DEFAULT_SIGNATORIES: readonly KeynoteCertificateSignatory[] =
  [
    {
      name: "Harris M Bowulo",
      title: "General Secretary (Conference Committee)",
      label: "Signed",
    },
    {
      name: "Enoch Kwateh Dongbo",
      title: "Chairman (Conference Committee)",
      label: "Approved",
    },
    {
      name: "Olano Teah Bloh",
      title: "National President (NEC)",
      label: "Attested",
    },
  ];

export function formatKeynoteCertificateDisplayDate(value: string): string {
  if (!value) return "May 29, 2026";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "May 29, 2026";
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function buildKeynoteCertificateId(dateValue: string): string {
  const datePart = (dateValue || "2026-05-29").replace(/-/g, "");
  return `LSUIC-KN-${datePart}`;
}

export function buildKeynoteCertificateData(
  overrides: Partial<typeof KEYNOTE_CERTIFICATE_DEFAULTS> = {},
): KeynoteCertificateData {
  const speakerName = overrides.speakerName ?? KEYNOTE_CERTIFICATE_DEFAULTS.speakerName;
  const companyName = overrides.companyName ?? KEYNOTE_CERTIFICATE_DEFAULTS.companyName;
  const speakerTitle =
    overrides.speakerTitle ?? KEYNOTE_CERTIFICATE_DEFAULTS.speakerTitle;
  const citationText =
    overrides.citationText ?? KEYNOTE_CERTIFICATE_DEFAULTS.citationText;
  const issueDate = overrides.issueDate ?? KEYNOTE_CERTIFICATE_DEFAULTS.issueDate;

  return {
    speakerName,
    companyName,
    speakerTitle,
    citationText,
    issueDate,
    certificateId: buildKeynoteCertificateId(issueDate),
    displayDate: formatKeynoteCertificateDisplayDate(issueDate),
    theme: CONF_2026.theme,
    signatories: [...KEYNOTE_CERTIFICATE_DEFAULT_SIGNATORIES],
  };
}

/** Static certificate record for conference report (matches /tools/conf/certificates defaults). */
export const REPORT_KEYNOTE_CERTIFICATE = buildKeynoteCertificateData();
