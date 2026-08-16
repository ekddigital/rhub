import { calcItemTotal, fmtRmb } from "@/lib/conf/currency";
import type { ReceiptPhotoEntry } from "@/lib/conf/document-receipt-photos";

export type PaymentProofRecord = {
  id: string;
  fileName: string;
  filePath: string;
  fileType: string | null;
  url?: string;
  isPdf?: boolean;
};

export type PaymentReceiptLineItem = {
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

/** Build receipt photo grid entries — shared by payments register export and conference report. */
export function buildPaymentReceiptPhotoEntries(
  payments: readonly PaymentReceiptSource[],
): ReceiptPhotoEntry[] {
  return payments.flatMap((payment) => {
    const entries: ReceiptPhotoEntry[] = [];
    const seenProofIds = new Set<string>();

    for (const item of payment.lineItems ?? []) {
      for (const proof of item.proofs ?? []) {
        seenProofIds.add(proof.id);
        entries.push({
          id: `proof-${proof.id}`,
          imageUrl: proofIsImage(proof) ? proofDisplayUrl(proof) : null,
          fileName: proof.fileName,
          captionLine1: `${receiptCaptionVendor(payment, item)} · ${fmtRmb(receiptCaptionAmount(payment, item))}`,
          captionLine2: proof.fileName,
          isImage: proofIsImage(proof),
        });
      }
    }

    for (const proof of payment.proofs ?? []) {
      if (seenProofIds.has(proof.id)) continue;
      entries.push({
        id: `proof-${proof.id}`,
        imageUrl: proofIsImage(proof) ? proofDisplayUrl(proof) : null,
        fileName: proof.fileName,
        captionLine1: `${receiptCaptionVendor(payment)} · ${fmtRmb(receiptCaptionAmount(payment))}`,
        captionLine2: proof.fileName,
        isImage: proofIsImage(proof),
      });
    }

    return entries;
  });
}
