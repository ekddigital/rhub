/**
 * Backfill ConfPaymentProof.lineItemId for the LSUIC 2026 Cooking Committee payment.
 *
 * Maps each proof filename to a line item using the verified table in
 * cooking-payment-proof-line-item-map.ts (OCR receipt totals + manual spot-checks).
 *
 * Usage (from rhub/):
 *   npx tsx tooling/backfill-cooking-payment-proof-line-items.ts
 *   npx tsx tooling/backfill-cooking-payment-proof-line-items.ts --dry-run
 */
import { config } from "dotenv";

config();

import { PrismaClient } from "@prisma/client";
import { COOKING_PAYMENT_PROOF_LINE_ITEM_BY_FILE } from "../src/lib/conf/cooking-payment-proof-line-item-map";

const prisma = new PrismaClient();

const COOKING_COMMITTEE_SCOPE = "Cooking";
const CONF_SLUG = "lsuic-2026";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const conf = await prisma.confEvent.findFirst({
    where: { slug: CONF_SLUG },
    select: { id: true, slug: true },
  });
  if (!conf) {
    throw new Error(`Conference not found (slug: ${CONF_SLUG})`);
  }

  const payment = await prisma.confPayment.findFirst({
    where: {
      confId: conf.id,
      committeeScope: COOKING_COMMITTEE_SCOPE,
      status: { in: ["APPROVED", "COMMITTEE_APPROVED"] },
    },
    include: {
      proofs: true,
      lineItems: { orderBy: { no: "asc" } },
    },
  });

  if (!payment) {
    throw new Error("No approved Cooking Committee payment found");
  }

  const lineItemByNo = new Map(payment.lineItems.map((item) => [item.no, item]));
  const unmappedFiles = new Set<string>();
  let updated = 0;
  let unchanged = 0;

  for (const proof of payment.proofs) {
    const lineNo = COOKING_PAYMENT_PROOF_LINE_ITEM_BY_FILE[proof.fileName];
    const lineItem = lineNo ? lineItemByNo.get(lineNo) : undefined;
    const nextLineItemId = lineItem?.id ?? null;

    if (!lineNo || !lineItem) {
      unmappedFiles.add(proof.fileName);
    }

    if (proof.lineItemId === nextLineItemId) {
      unchanged++;
      continue;
    }

    if (!dryRun) {
      await prisma.confPaymentProof.update({
        where: { id: proof.id },
        data: { lineItemId: nextLineItemId },
      });
    }
    updated++;
  }

  const linked = payment.proofs.filter((proof) => {
    const lineNo = COOKING_PAYMENT_PROOF_LINE_ITEM_BY_FILE[proof.fileName];
    return Boolean(lineNo && lineItemByNo.has(lineNo));
  }).length;

  console.log(
    [
      dryRun ? "[dry-run]" : "[applied]",
      `payment=${payment.id}`,
      `proofs=${payment.proofs.length}`,
      `mapped=${linked}`,
      `updated=${updated}`,
      `unchanged=${unchanged}`,
      `unmappedFiles=${unmappedFiles.size}`,
    ].join(" "),
  );

  if (unmappedFiles.size > 0) {
    console.log("Unmapped filenames:", [...unmappedFiles].sort().join(", "));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
