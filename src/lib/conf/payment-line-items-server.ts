import type { ConfPaymentLineItem, ConfPaymentProof } from "@prisma/client";
import {
  calcPaymentItemsTotal,
  formatPaymentItemsNote,
  normalizePaymentLineItems,
  parsePaymentItemsNote,
  type PaymentLineItemInput,
} from "@/lib/conf/payment-items";

export type PaymentLineItemWithProofs = ConfPaymentLineItem & {
  proofs: ConfPaymentProof[];
};

export function paymentItemsFromNote(
  note?: string | null,
  fallbackAmount?: number,
): PaymentLineItemInput[] {
  const parsed = parsePaymentItemsNote(note);
  if (parsed.length === 0) {
    if (fallbackAmount && fallbackAmount > 0) {
      return [
        {
          no: 1,
          name: "",
          qty: 1,
          unit: "pcs",
          unitPrice: fallbackAmount,
        },
      ];
    }
    return [
      {
        no: 1,
        name: "",
        qty: 1,
        unit: "pcs",
        unitPrice: 0,
      },
    ];
  }

  return parsed.map((item, idx) => ({
    no: idx + 1,
    name: item.name,
    qty: Number(item.qty) || 1,
    unit: item.unit === "custom" ? item.customUnit?.trim() || "custom" : item.unit,
    unitPrice: Number(item.unitPrice) || 0,
  }));
}

export function buildPaymentNoteFromItems(
  items: PaymentLineItemInput[],
  freeformNote?: string | null,
) {
  const legacyItems = items.map((item) => ({
    name: item.name,
    qty: String(item.qty),
    unit: item.unit,
    unitPrice: String(item.unitPrice),
  }));
  const itemBlock = formatPaymentItemsNote(legacyItems);
  return [freeformNote?.trim(), itemBlock].filter(Boolean).join("\n\n").trim();
}

export function validatePaymentLineItemsPayload(items: unknown) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false as const, error: "At least one line item is required" };
  }

  for (const item of items) {
    if (
      !item ||
      typeof item !== "object" ||
      !("name" in item) ||
      !String((item as PaymentLineItemInput).name || "").trim()
    ) {
      return {
        ok: false as const,
        error: "Each line item needs a name",
      };
    }
    if (
      (item as PaymentLineItemInput).qty === undefined ||
      (item as PaymentLineItemInput).unitPrice === undefined ||
      !(item as PaymentLineItemInput).unit
    ) {
      return {
        ok: false as const,
        error: "Each line item needs qty, unit, and unitPrice",
      };
    }
  }

  return {
    ok: true as const,
    items: normalizePaymentLineItems(items as PaymentLineItemInput[]),
  };
}

export function paymentAmountFromItems(items: PaymentLineItemInput[]) {
  return calcPaymentItemsTotal(items);
}

export function mapLineItemsForClient(items: PaymentLineItemWithProofs[]) {
  return items
    .slice()
    .sort((a, b) => a.no - b.no)
    .map((item) => ({
      id: item.id,
      no: item.no,
      name: item.name,
      qty: item.qty,
      unit: item.unit,
      unitPrice: item.unitPrice,
      proofs: item.proofs,
    }));
}
