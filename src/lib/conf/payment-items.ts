import { calcItemTotal } from "@/lib/conf/currency";

export type PaymentLineItemInput = {
  id?: string;
  no?: number;
  name: string;
  qty: number;
  unit: string;
  unitPrice: number;
};

export type ParsedLegacyPaymentItem = {
  name: string;
  qty: string;
  unit: string;
  customUnit?: string;
  unitPrice: string;
};

/** Serialize line items into the legacy note format for backward-compatible previews. */
export function formatPaymentItemsNote(items: ParsedLegacyPaymentItem[]) {
  return items
    .map((item) => {
      const lines: string[] = [];
      if (item.name.trim()) lines.push(`Item: ${item.name.trim()}`);
      if (Number(item.qty) > 0) lines.push(`Qty: ${item.qty}`);
      const unit =
        item.unit === "custom" ? item.customUnit?.trim() || "" : item.unit.trim();
      if (unit) lines.push(`Unit: ${unit}`);
      if (item.unitPrice.trim()) {
        const price = Number(item.unitPrice);
        if (!Number.isNaN(price)) lines.push(`Unit price: ¥${price}`);
      }
      const qty = Number(item.qty);
      const unitPrice = Number(item.unitPrice);
      if (qty > 0 && unitPrice > 0) {
        lines.push(`Line total: ¥${calcItemTotal(qty, unitPrice)}`);
      }
      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

export function parsePaymentItemsNote(note?: string | null) {
  if (!note) return [] as ParsedLegacyPaymentItem[];

  const groups = note
    .split(/\n\s*\n/)
    .map((group) => group.trim())
    .filter(Boolean);

  const parsed: ParsedLegacyPaymentItem[] = [];
  for (const group of groups) {
    const item: ParsedLegacyPaymentItem = {
      name: "",
      qty: "1",
      unit: "pcs",
      unitPrice: "",
    };
    let hasItem = false;

    for (const raw of group.split("\n")) {
      const line = raw.trim();
      if (line.toLowerCase().startsWith("item:")) {
        item.name = line.slice(5).trim();
        hasItem = true;
      } else if (line.toLowerCase().startsWith("qty:")) {
        item.qty = line.slice(4).trim() || "1";
      } else if (line.toLowerCase().startsWith("unit price:")) {
        item.unitPrice = line.slice(11).trim().replace(/[¥$,]/g, "") || "";
      } else if (line.toLowerCase().startsWith("unit:")) {
        item.unit = line.slice(5).trim() || "pcs";
      }
    }

    if (hasItem) parsed.push(item);
  }

  return parsed;
}

export function stripPaymentItemDetails(note?: string | null) {
  if (!note) return "";
  return note
    .split("\n")
    .filter(
      (line) =>
        !/^(Item:|Qty:|Unit price:|Unit:|Line total:)/i.test(line.trim()),
    )
    .join("\n")
    .trim();
}

export function calcPaymentItemsTotal(
  items: Pick<PaymentLineItemInput, "qty" | "unitPrice">[],
) {
  return items.reduce(
    (sum, item) => sum + calcItemTotal(Number(item.qty), Number(item.unitPrice)),
    0,
  );
}

export function normalizePaymentLineItems(
  items: PaymentLineItemInput[],
): PaymentLineItemInput[] {
  return items
    .filter((item) => item.name.trim().length > 0)
    .map((item, idx) => ({
      ...(item.id ? { id: item.id } : {}),
      no: idx + 1,
      name: item.name.trim(),
      qty: Number(item.qty),
      unit: item.unit.trim() || "pcs",
      unitPrice: Number(item.unitPrice),
    }));
}
