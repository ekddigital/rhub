import type { SignatoryDraft } from "@/components/tools/conf/document-signatory-controls";
import { createDefaultSignatoryDraft } from "@/components/tools/conf/document-signatory-controls";

export const PAYMENT_REGISTER_CONFIG_TITLE = "__PAYMENT_REGISTER_CONFIG__";

export type PaymentRegisterConfig = {
  configType: "PAYMENT_REGISTER_CONFIG";
  preparedByMemberId: string;
  signatoryDraft: SignatoryDraft;
  updatedAt: string;
};

export function createDefaultPaymentRegisterConfig(): PaymentRegisterConfig {
  return {
    configType: "PAYMENT_REGISTER_CONFIG",
    preparedByMemberId: "",
    signatoryDraft: createDefaultSignatoryDraft(),
    updatedAt: new Date().toISOString(),
  };
}

export function parsePaymentRegisterConfig(
  draft: unknown,
): PaymentRegisterConfig | null {
  if (!draft || typeof draft !== "object") return null;
  const record = draft as Partial<PaymentRegisterConfig>;
  if (record.configType !== "PAYMENT_REGISTER_CONFIG") return null;
  return {
    configType: "PAYMENT_REGISTER_CONFIG",
    preparedByMemberId: String(record.preparedByMemberId ?? ""),
    signatoryDraft: migrateSignatoryDraft(record.signatoryDraft),
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : new Date().toISOString(),
  };
}

/** Ensure older saved configs include slots 4–6 and slot count. */
export function migrateSignatoryDraft(draft: unknown): SignatoryDraft {
  const defaults = createDefaultSignatoryDraft();
  if (!draft || typeof draft !== "object") return defaults;
  const record = draft as Partial<SignatoryDraft>;
  const slotCount =
    typeof record.signatorySlotCount === "number"
      ? Math.min(6, Math.max(1, record.signatorySlotCount))
      : 3;

  const mergeSlot = (
    key: keyof Pick<
      SignatoryDraft,
      | "signatory1"
      | "signatory2"
      | "signatory3"
      | "signatory4"
      | "signatory5"
      | "signatory6"
    >,
  ) => ({
    ...defaults[key],
    ...(record[key] ?? {}),
  });

  return {
    signatoryMode: record.signatoryMode ?? defaults.signatoryMode,
    signatorySlotCount: slotCount,
    signatory1: mergeSlot("signatory1"),
    signatory2: mergeSlot("signatory2"),
    signatory3: mergeSlot("signatory3"),
    signatory4: mergeSlot("signatory4"),
    signatory5: mergeSlot("signatory5"),
    signatory6: mergeSlot("signatory6"),
  };
}
