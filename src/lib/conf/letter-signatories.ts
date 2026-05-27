import type { CSSProperties } from "react";

export const MAX_LETTER_SIGNATORY_SLOTS = 6;

export type LetterSignatorySlot = {
  name: string;
  title: string;
  label: string;
  sig: string;
  sigScale: number;
};

export type LetterSignatoryDraftFields = {
  signatory1Name?: string;
  signatory1Title?: string;
  signatory1Label?: string;
  signatory1Sig?: string;
  signatory1SigScale?: number;
  signatory2Name?: string;
  signatory2Title?: string;
  signatory2Label?: string;
  signatory2Sig?: string;
  signatory2SigScale?: number;
  signatory3Name?: string;
  signatory3Title?: string;
  signatory3Label?: string;
  signatory3Sig?: string;
  signatory3SigScale?: number;
  signatory4Name?: string;
  signatory4Title?: string;
  signatory4Label?: string;
  signatory4Sig?: string;
  signatory4SigScale?: number;
  signatory5Name?: string;
  signatory5Title?: string;
  signatory5Label?: string;
  signatory5Sig?: string;
  signatory5SigScale?: number;
  signatory6Name?: string;
  signatory6Title?: string;
  signatory6Label?: string;
  signatory6Sig?: string;
  signatory6SigScale?: number;
  signatorySlotCount?: number;
};

const DEFAULT_LABELS = [
  "Signed",
  "Approved",
  "Attested",
  "Signed",
  "Approved",
  "Attested",
] as const;

/** Collect populated signatory slots (1–6) from a draft slice. */
export function collectLetterSignatories(
  draft: LetterSignatoryDraftFields,
): LetterSignatorySlot[] {
  const slots: LetterSignatorySlot[] = [];
  for (let i = 1; i <= MAX_LETTER_SIGNATORY_SLOTS; i++) {
    const d = draft as Record<string, string | number | undefined>;
    const name = String(d[`signatory${i}Name`] ?? "").trim();
    const title = String(d[`signatory${i}Title`] ?? "").trim();
    if (!name && !title) continue;
    slots.push({
      name,
      title,
      label: String(d[`signatory${i}Label`] ?? DEFAULT_LABELS[i - 1] ?? ""),
      sig: String(d[`signatory${i}Sig`] ?? ""),
      sigScale: Number(d[`signatory${i}SigScale`] ?? 1),
    });
  }
  return slots;
}

/** Visible sidebar slots — at least 3, up to {@link MAX_LETTER_SIGNATORY_SLOTS}. */
export function resolveSignatorySlotCount(
  draft: LetterSignatoryDraftFields,
): number {
  const stored = draft.signatorySlotCount;
  if (
    typeof stored === "number" &&
    stored >= 3 &&
    stored <= MAX_LETTER_SIGNATORY_SLOTS
  ) {
    return stored;
  }
  let highest = 3;
  for (let i = MAX_LETTER_SIGNATORY_SLOTS; i >= 4; i--) {
    const d = draft as Record<string, string | undefined>;
    if (
      String(d[`signatory${i}Name`] ?? "").trim() ||
      String(d[`signatory${i}Title`] ?? "").trim()
    ) {
      highest = i;
      break;
    }
  }
  return highest;
}

export function signatureBlockContainerStyle(): CSSProperties {
  return {
    display: "flex",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "center",
    alignItems: "stretch",
    gap: 16,
  };
}

export function signatureBlockItemStyle(): CSSProperties {
  return {
    minHeight: 80,
    textAlign: "center",
    flex: "0 1 140px",
    maxWidth: 160,
  };
}

type SignatoryUiSlot = {
  badge: string;
  nameKey:
    | "signatory1Name"
    | "signatory2Name"
    | "signatory3Name"
    | "signatory4Name"
    | "signatory5Name"
    | "signatory6Name";
  titleKey:
    | "signatory1Title"
    | "signatory2Title"
    | "signatory3Title"
    | "signatory4Title"
    | "signatory5Title"
    | "signatory6Title";
  labelKey:
    | "signatory1Label"
    | "signatory2Label"
    | "signatory3Label"
    | "signatory4Label"
    | "signatory5Label"
    | "signatory6Label";
  sigKey:
    | "signatory1Sig"
    | "signatory2Sig"
    | "signatory3Sig"
    | "signatory4Sig"
    | "signatory5Sig"
    | "signatory6Sig";
  scaleKey:
    | "signatory1SigScale"
    | "signatory2SigScale"
    | "signatory3SigScale"
    | "signatory4SigScale"
    | "signatory5SigScale"
    | "signatory6SigScale";
  defaultLabel: string;
};

export const LETTER_SIGNATORY_SLOT_UI: readonly SignatoryUiSlot[] = [
  {
    badge: "1",
    nameKey: "signatory1Name",
    titleKey: "signatory1Title",
    labelKey: "signatory1Label",
    sigKey: "signatory1Sig",
    scaleKey: "signatory1SigScale",
    defaultLabel: DEFAULT_LABELS[0],
  },
  {
    badge: "2",
    nameKey: "signatory2Name",
    titleKey: "signatory2Title",
    labelKey: "signatory2Label",
    sigKey: "signatory2Sig",
    scaleKey: "signatory2SigScale",
    defaultLabel: DEFAULT_LABELS[1],
  },
  {
    badge: "3",
    nameKey: "signatory3Name",
    titleKey: "signatory3Title",
    labelKey: "signatory3Label",
    sigKey: "signatory3Sig",
    scaleKey: "signatory3SigScale",
    defaultLabel: DEFAULT_LABELS[2],
  },
  {
    badge: "4",
    nameKey: "signatory4Name",
    titleKey: "signatory4Title",
    labelKey: "signatory4Label",
    sigKey: "signatory4Sig",
    scaleKey: "signatory4SigScale",
    defaultLabel: DEFAULT_LABELS[3],
  },
  {
    badge: "5",
    nameKey: "signatory5Name",
    titleKey: "signatory5Title",
    labelKey: "signatory5Label",
    sigKey: "signatory5Sig",
    scaleKey: "signatory5SigScale",
    defaultLabel: DEFAULT_LABELS[4],
  },
  {
    badge: "6",
    nameKey: "signatory6Name",
    titleKey: "signatory6Title",
    labelKey: "signatory6Label",
    sigKey: "signatory6Sig",
    scaleKey: "signatory6SigScale",
    defaultLabel: DEFAULT_LABELS[5],
  },
];

/** Reset slots 4–6 when applying a 3-person preset. */
export function emptyExtraSignatoryFields(): Pick<
  LetterSignatoryDraftFields,
  | "signatory4Name"
  | "signatory4Title"
  | "signatory4Label"
  | "signatory4Sig"
  | "signatory4SigScale"
  | "signatory5Name"
  | "signatory5Title"
  | "signatory5Label"
  | "signatory5Sig"
  | "signatory5SigScale"
  | "signatory6Name"
  | "signatory6Title"
  | "signatory6Label"
  | "signatory6Sig"
  | "signatory6SigScale"
  | "signatorySlotCount"
> {
  return {
    signatory4Name: "",
    signatory4Title: "",
    signatory4Label: "Signed",
    signatory4Sig: "",
    signatory4SigScale: 1,
    signatory5Name: "",
    signatory5Title: "",
    signatory5Label: "Approved",
    signatory5Sig: "",
    signatory5SigScale: 1,
    signatory6Name: "",
    signatory6Title: "",
    signatory6Label: "Attested",
    signatory6Sig: "",
    signatory6SigScale: 1,
    signatorySlotCount: 3,
  };
}
