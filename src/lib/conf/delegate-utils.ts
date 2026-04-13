import { prisma } from "@/lib/prisma";

export function delegateCodePrefix(year: number): string {
  return `LSUIC${String(year).slice(-2)}`;
}

export async function getNextDelegateCode(confId: string, year: number) {
  const prefix = delegateCodePrefix(year);
  const total = await prisma.confDelegate.count({
    where: { confId },
  });
  return `${prefix}-${String(total + 1).padStart(4, "0")}`;
}

export function canIssueFlyer(input: {
  feePaid: boolean;
  bookletPhotoPath: string | null;
}) {
  return input.feePaid && Boolean(input.bookletPhotoPath);
}
