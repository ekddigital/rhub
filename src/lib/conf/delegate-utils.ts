import { prisma } from "@/lib/prisma";

const LSUIC_CONFERENCE_EDITION = 20;
const LIBERIA_INDEPENDENCE_YEAR = 1847;

export function getLiberiaIndependenceAnniversary(year: number): number {
  return Math.max(0, year - LIBERIA_INDEPENDENCE_YEAR);
}

export function delegateCodePrefix(year: number): string {
  const yearShort = String(year).slice(-2);
  const liberiaAnniversary = getLiberiaIndependenceAnniversary(year);

  // Example for 2026: LS20-179-26-0001 (edition-anniversary-year-sequence)
  return `LS${String(LSUIC_CONFERENCE_EDITION).padStart(2, "0")}-${liberiaAnniversary}-${yearShort}`;
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
