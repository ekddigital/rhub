import type { ConfPayment, ConfPaymentLineItem, ConfPaymentProof } from "@prisma/client";

export type PaymentProofClient = ConfPaymentProof & {
  url: string;
  isPdf: boolean;
};

export type PaymentLineItemClient = ConfPaymentLineItem & {
  proofs: PaymentProofClient[];
};

export type PaymentWithProofUrls = ConfPayment & {
  proofs: PaymentProofClient[];
  lineItems?: PaymentLineItemClient[];
};

export function buildPaymentProofFileUrl(
  confId: string,
  paymentId: string,
  proofId: string,
): string {
  return `/api/conf/${confId}/payments/${paymentId}/proofs/${proofId}/file`;
}

export function isPaymentProofPdf(
  proof: Pick<ConfPaymentProof, "fileName" | "fileType">,
): boolean {
  const fileType = proof.fileType?.toLowerCase() ?? "";
  if (fileType.includes("pdf")) return true;
  return proof.fileName.toLowerCase().endsWith(".pdf");
}

export function isPaymentProofImage(
  proof: Pick<ConfPaymentProof, "fileName" | "fileType">,
): boolean {
  const fileType = proof.fileType?.toLowerCase() ?? "";
  if (fileType.startsWith("image/")) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(proof.fileName);
}

export function mapPaymentProofForClient(
  confId: string,
  paymentId: string,
  proof: ConfPaymentProof,
): PaymentProofClient {
  return {
    ...proof,
    url: buildPaymentProofFileUrl(confId, paymentId, proof.id),
    isPdf: isPaymentProofPdf(proof),
  };
}

export function mapPaymentForClient<
  T extends ConfPayment & {
    proofs: ConfPaymentProof[];
    lineItems?: Array<ConfPaymentLineItem & { proofs: ConfPaymentProof[] }>;
  },
>(confId: string, payment: T): PaymentWithProofUrls {
  return {
    ...payment,
    proofs: payment.proofs.map((proof) =>
      mapPaymentProofForClient(confId, payment.id, proof),
    ),
    lineItems: payment.lineItems?.map((item) => ({
      ...item,
      proofs: item.proofs.map((proof) =>
        mapPaymentProofForClient(confId, payment.id, proof),
      ),
    })),
  };
}

export function mapPaymentsForClient<
  T extends ConfPayment & {
    proofs: ConfPaymentProof[];
    lineItems?: Array<ConfPaymentLineItem & { proofs: ConfPaymentProof[] }>;
  },
>(confId: string, payments: T[]): PaymentWithProofUrls[] {
  return payments.map((payment) => mapPaymentForClient(confId, payment));
}
