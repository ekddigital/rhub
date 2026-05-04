import type { FundraisingCategory } from "@/lib/conf/fundraising-letter-template";

export type LetterType =
  | "MEMO"
  | "MINUTES"
  | "ANNOUNCEMENT"
  | "BUDGET_LETTER"
  | "PAYMENT_RECEIPT"
  | "FUNDRAISING"
  | "GENERAL";

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  MEMO: "Memo",
  MINUTES: "Minutes",
  ANNOUNCEMENT: "Announcement",
  BUDGET_LETTER: "Budget Letter",
  PAYMENT_RECEIPT: "Payment Receipt",
  FUNDRAISING: "Fundraising",
  GENERAL: "General",
};

export const LETTER_TYPE_COLORS: Record<LetterType, string> = {
  MEMO: "#C8A061",
  MINUTES: "#002868",
  ANNOUNCEMENT: "#BF0A30",
  BUDGET_LETTER: "#1a7a4a",
  PAYMENT_RECEIPT: "#7c3aed",
  FUNDRAISING: "#8E0E00",
  GENERAL: "#666666",
};

/** Lightweight record returned by GET /letters (no draft JSON) */
export type LetterRecord = {
  id: string;
  title: string;
  type: LetterType;
  letterDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LetterDraft = {
  id: string;
  dbId: string;
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
  signatory1Name: string;
  signatory1Title: string;
  signatory1Label: string;
  signatory1Sig: string;
  signatory1SigScale: number;
  signatory2Name: string;
  signatory2Title: string;
  signatory2Label: string;
  signatory2Sig: string;
  signatory2SigScale: number;
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
  fundraisingLetterSampleApplied: boolean;
  savedAt: string;
};

/** Row shape from GET /api/conf/:confId/members */
export type LetterComposerMember = {
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

/** Event slice from booklet/data for letterhead dates */
export type LetterComposerConfInfo = {
  name: string;
  city?: string | null;
  venue?: string | null;
  startsAt: string;
  endsAt: string;
};

export type LetterComposerRoleTemplate = {
  id: string;
  confId: string;
  key: string;
  label: string;
  baseRole: string;
  title: string | null;
  committeeScope: string | null;
  officeLabel: string | null;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
};

export type LetterComposerSignatureProfile = {
  key: string;
  name: string;
  title: string;
  signatureDataUrl: string;
};
