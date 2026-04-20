import { prisma } from "@/lib/prisma";

const LIBERIA_INDEPENDENCE_YEAR = 1847;

export function getLiberiaIndependenceAnniversary(year: number): number {
  return Math.max(0, year - LIBERIA_INDEPENDENCE_YEAR);
}

/**
 * Returns the delegate code prefix for a given conference year.
 * Format: LSUICNC{YY} — LSUIC National Conference + 2-digit year.
 * Example: LSUICNC26 (for 2026) → full code LSUICNC26-0001
 */
export function delegateCodePrefix(year: number): string {
  const yearShort = String(year).slice(-2);
  return `LSUICNC${yearShort}`;
}

export async function getNextDelegateCode(confId: string, year: number) {
  const prefix = delegateCodePrefix(year);
  const delegates = await prisma.confDelegate.findMany({
    where: {
      confId,
      delegateCode: {
        startsWith: `${prefix}-`,
      },
    },
    select: {
      delegateCode: true,
    },
  });

  let maxSequence = 0;
  for (const delegate of delegates) {
    const code = delegate.delegateCode;
    if (!code) continue;

    const suffix = code.slice(prefix.length + 1);
    if (!/^\d{4}$/.test(suffix)) continue;

    const seq = Number.parseInt(suffix, 10);
    if (Number.isFinite(seq) && seq > maxSequence) {
      maxSequence = seq;
    }
  }

  return `${prefix}-${String(maxSequence + 1).padStart(4, "0")}`;
}

export function canIssueFlyer(input: {
  feePaid: boolean;
  bookletPhotoPath: string | null;
}) {
  return input.feePaid && Boolean(input.bookletPhotoPath);
}
