import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type LsuicLeaderLinkRow = {
  rosterKey: string;
  delegateId: string | null;
  userId: string | null;
  linkSource: string | null;
  confirmed: boolean;
  includeAddressPage: boolean;
  addressText: string | null;
};

export type LsuicLeaderMappingStatus = "unmapped" | "pending" | "confirmed";

export function lsuicLeaderMappingStatus(
  link: Pick<LsuicLeaderLinkRow, "delegateId" | "userId" | "confirmed"> | null | undefined,
): LsuicLeaderMappingStatus {
  if (!link?.delegateId && !link?.userId) return "unmapped";
  return link.confirmed ? "confirmed" : "pending";
}

/** True when `ConfLsuicLeaderLink` has not been migrated yet (Prisma P2021). */
export function isConfLsuicLeaderLinkTableMissing(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2021"
  ) {
    return false;
  }

  const meta = error.meta as { table?: string; modelName?: string } | undefined;
  const hint = `${meta?.table ?? ""} ${meta?.modelName ?? ""}`.toLowerCase();
  return hint.includes("conf_lsuic_leader_link") || hint.includes("lsuicleaderlink");
}

export async function findLsuicLeaderLinks(
  confId: string,
  select?: {
    rosterKey?: true;
    delegateId?: true;
    userId?: true;
    linkSource?: true;
    confirmed?: true;
    includeAddressPage?: true;
    addressText?: true;
  },
): Promise<LsuicLeaderLinkRow[]> {
  try {
    return await prisma.confLsuicLeaderLink.findMany({
      where: { confId },
      select: select ?? {
        rosterKey: true,
        delegateId: true,
        userId: true,
        linkSource: true,
        confirmed: true,
        includeAddressPage: true,
        addressText: true,
      },
    });
  } catch (error) {
    if (isConfLsuicLeaderLinkTableMissing(error)) {
      console.warn(
        "[conf] ConfLsuicLeaderLink table missing — run prisma migrate deploy",
      );
      return [];
    }
    // Older DBs may lack address columns until migrate deploy.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2022" || error.code === "P2010")
    ) {
      try {
        const legacy = await prisma.confLsuicLeaderLink.findMany({
          where: { confId },
          select: {
            rosterKey: true,
            delegateId: true,
            userId: true,
            linkSource: true,
            confirmed: true,
          },
        });
        return legacy.map((row) => ({
          ...row,
          includeAddressPage: false,
          addressText: null,
        }));
      } catch {
        return [];
      }
    }
    throw error;
  }
}

export async function findLsuicLeaderLinkRosterKeys(
  confId: string,
): Promise<Set<string>> {
  try {
    const rows = await prisma.confLsuicLeaderLink.findMany({
      where: { confId },
      select: { rosterKey: true },
    });
    return new Set(rows.map((row) => row.rosterKey));
  } catch (error) {
    if (isConfLsuicLeaderLinkTableMissing(error)) {
      console.warn(
        "[conf] ConfLsuicLeaderLink table missing — run prisma migrate deploy",
      );
      return new Set();
    }
    throw error;
  }
}

export function lsuicLeaderLinkTableMissingResponse() {
  return {
    error:
      "LSUIC leader link storage is not available yet. Apply migration 20260625120000_conf_lsuic_leader_links (prisma migrate deploy).",
    schemaMissing: true as const,
  };
}
