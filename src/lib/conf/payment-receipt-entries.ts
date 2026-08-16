import { calcItemTotal, fmtRmb } from "@/lib/conf/currency";
import type { ReceiptPhotoEntry } from "@/lib/conf/document-receipt-photos";

export type PaymentProofRecord = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
  url?: string;
  isPdf?: boolean;
  lineItemId?: string | null;
  createdAt?: Date | string;
};

export type PaymentReceiptLineItem = {
  id?: string;
  no?: number;
  name: string;
  qty: number;
  unitPrice: number;
  proofs?: PaymentProofRecord[];
};

export type PaymentReceiptSource = {
  amount: number;
  paidBy: string;
  paidTo: string | null;
  proofs?: PaymentProofRecord[];
  lineItems?: PaymentReceiptLineItem[];
};

function proofSortTime(proof: PaymentProofRecord): number {
  if (!proof.createdAt) return 0;
  const value =
    proof.createdAt instanceof Date
      ? proof.createdAt.getTime()
      : Date.parse(proof.createdAt);
  return Number.isFinite(value) ? value : 0;
}

function proofDisplayUrl(proof: PaymentProofRecord): string {
  return proof.url || proof.filePath;
}

function proofIsImage(proof: PaymentProofRecord): boolean {
  if (proof.isPdf) return false;
  if (proof.fileType?.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(proof.fileName);
}

function receiptCaptionVendor(
  payment: PaymentReceiptSource,
  lineItem?: PaymentReceiptLineItem,
): string {
  return (
    lineItem?.name?.trim() ||
    payment.paidTo?.trim() ||
    payment.paidBy?.trim() ||
    "—"
  );
}

function receiptCaptionAmount(
  payment: PaymentReceiptSource,
  lineItem?: PaymentReceiptLineItem,
): number {
  if (lineItem) {
    return calcItemTotal(lineItem.qty, lineItem.unitPrice);
  }
  return payment.amount;
}

function toReceiptPhotoEntry(
  payment: PaymentReceiptSource,
  proof: PaymentProofRecord,
  lineItem?: PaymentReceiptLineItem,
): ReceiptPhotoEntry {
  const captionLine1 = lineItem
    ? `${receiptCaptionVendor(payment, lineItem)} · ${fmtRmb(receiptCaptionAmount(payment, lineItem))}`
    : `${proof.fileName} · supplementary receipt`;

  return {
    id: `proof-${proof.id}`,
    imageUrl: proofIsImage(proof) ? proofDisplayUrl(proof) : null,
    fileName: proof.fileName,
    captionLine1,
    captionLine2: proof.fileName,
    isImage: proofIsImage(proof),
  };
}

/** Build receipt photo grid entries — shared by payments register export and conference report. */
export function buildPaymentReceiptPhotoEntries(
  payments: readonly PaymentReceiptSource[],
): ReceiptPhotoEntry[] {
  return payments.flatMap((payment) => {
    const lineItems = [...(payment.lineItems ?? [])].sort(
      (a, b) => (a.no ?? 0) - (b.no ?? 0),
    );
    const lineItemById = new Map(
      lineItems
        .filter((item): item is PaymentReceiptLineItem & { id: string } =>
          Boolean(item.id),
        )
        .map((item) => [item.id, item]),
    );

    type TaggedProof = {
      proof: PaymentProofRecord;
      lineItem?: PaymentReceiptLineItem;
    };
    const tagged: TaggedProof[] = [];
    const seenProofIds = new Set<string>();

    for (const item of lineItems) {
      for (const proof of item.proofs ?? []) {
        seenProofIds.add(proof.id);
        tagged.push({ proof, lineItem: item });
      }
    }

    const orphans: PaymentProofRecord[] = [];
    for (const proof of payment.proofs ?? []) {
      if (seenProofIds.has(proof.id)) continue;
      seenProofIds.add(proof.id);

      const linked = proof.lineItemId
        ? lineItemById.get(proof.lineItemId)
        : undefined;
      if (linked) {
        tagged.push({ proof, lineItem: linked });
      } else {
        orphans.push(proof);
      }
    }

    const sortedOrphans = [...orphans].sort(
      (a, b) => proofSortTime(a) - proofSortTime(b),
    );
    for (let i = 0; i < sortedOrphans.length; i++) {
      tagged.push({
        proof: sortedOrphans[i],
        lineItem: lineItems[i],
      });
    }

    return tagged
      .sort((a, b) => proofSortTime(a.proof) - proofSortTime(b.proof))
      .map(({ proof, lineItem }) => toReceiptPhotoEntry(payment, proof, lineItem));
  });
}

/** Resolve relative proof proxy URLs to absolute URLs for print/PDF capture. */
export function absolutizeReceiptPhotoEntryUrls(
  entries: readonly ReceiptPhotoEntry[],
  origin: string,
): ReceiptPhotoEntry[] {
  const base = origin.replace(/\/$/, "");
  return entries.map((entry) => {
    if (!entry.imageUrl || /^https?:\/\//i.test(entry.imageUrl)) {
      return entry;
    }
    return {
      ...entry,
      imageUrl: entry.imageUrl.startsWith("/")
        ? `${base}${entry.imageUrl}`
        : `${base}/${entry.imageUrl}`,
    };
  });
}
