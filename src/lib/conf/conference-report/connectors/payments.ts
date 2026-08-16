import { buildCertifiedCookingFinanceSummary } from "@/lib/conf/cooking-report-data";
import { buildPaymentReceiptPhotoEntries } from "@/lib/conf/payment-receipt-entries";
import { RECEIPTS_PER_PAGE_MAX } from "@/lib/conf/document-receipt-photos";
import { mapPaymentsForClient } from "@/lib/conf/payment-proof-urls";
import { prisma } from "@/lib/prisma";
import type { ReportDataSource } from "./types";

export const COOKING_COMMITTEE_SCOPE = "Cooking";

const paymentInclude = {
  proofs: { orderBy: { createdAt: "asc" as const } },
  lineItems: {
    orderBy: { no: "asc" as const },
    include: { proofs: true },
  },
};

export async function loadReportCookingPayments(confId: string): Promise<{
  receiptEntries: ReturnType<typeof buildPaymentReceiptPhotoEntries>;
  approvedExpenseTotal: number;
  source: ReportDataSource;
}> {
  const payments = await prisma.confPayment.findMany({
    where: {
      confId,
      committeeScope: COOKING_COMMITTEE_SCOPE,
      status: { in: ["APPROVED", "COMMITTEE_APPROVED"] },
    },
    include: paymentInclude,
    orderBy: { paidAt: "asc" },
  });

  if (payments.length === 0) {
    return {
      receiptEntries: [],
      approvedExpenseTotal: 0,
      source: "static",
    };
  }

  const clientPayments = mapPaymentsForClient(confId, payments);
  const expensePayments = clientPayments.filter(
    (payment) => payment.paymentType === "EXPENSE",
  );

  return {
    receiptEntries: buildPaymentReceiptPhotoEntries(expensePayments),
    approvedExpenseTotal: expensePayments.reduce(
      (sum, payment) => sum + payment.amount,
      0,
    ),
    source: "live",
  };
}

export function buildStaticCookingFinanceSummary() {
  return buildCertifiedCookingFinanceSummary();
}

/** ~6 receipt screenshots per report appendix page (2×3 grid). */
export function chunkReportReceiptEntries<T>(
  entries: readonly T[],
  perPage = RECEIPTS_PER_PAGE_MAX,
): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < entries.length; i += perPage) {
    chunks.push(entries.slice(i, i + perPage));
  }
  return chunks;
}

export function countReportReceiptAppendixPages(
  entryCount: number,
  perPage = RECEIPTS_PER_PAGE_MAX,
): number {
  if (entryCount <= 0) return 0;
  return Math.ceil(entryCount / perPage);
}
