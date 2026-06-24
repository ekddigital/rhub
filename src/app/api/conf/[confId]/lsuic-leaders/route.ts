import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import {
  autoMatchDelegateForRosterRow,
  buildBookletRosterMembers,
} from "@/lib/conf/build-booklet-roster";
import { resolveDelegateBookletPhotoForClient } from "@/lib/conf/delegate-document-urls";
import {
  loadLsuicLeadersRoster,
  lsuicLeaderRosterKey,
  normalizeLeaderName,
  stripHonorificDisplayName,
} from "@/lib/conf/lsuic-leaders-roster";

// GET /api/conf/[confId]/lsuic-leaders
// LSUIC CSV roster with delegate link status for booklet photo overrides.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const [delegates, links] = await Promise.all([
      prisma.confDelegate.findMany({
        where: {
          confId,
          status: { in: ["REGISTERED", "CONFIRMED", "ATTENDED"] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          city: true,
          userId: true,
          bookletPhotoPath: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.confLsuicLeaderLink.findMany({
        where: { confId },
      }),
    ]);

    const resolvedDelegates = delegates.map((d) => ({
      ...d,
      bookletPhotoPath: resolveDelegateBookletPhotoForClient(
        confId,
        d.id,
        d.bookletPhotoPath,
      ),
    }));

    const linkByKey = new Map(links.map((l) => [l.rosterKey, l]));
    const roster = loadLsuicLeadersRoster();

    const { necMembers, committeeMembers } = buildBookletRosterMembers({
      dbMembers: [],
      delegates: resolvedDelegates.map((d) => ({
        ...d,
        province: null,
        university: null,
        delegateCode: null,
        conferencePosition: null,
      })),
      leaderLinks: links,
      signedUpUserIds: new Set(
        resolvedDelegates.map((d) => d.userId).filter(Boolean) as string[],
      ),
    });

    const builtByKey = new Map(
      [...necMembers, ...committeeMembers].map((m) => [m.rosterKey, m]),
    );

    const delegateIndexes = {
      byUserId: new Map(
        resolvedDelegates
          .filter((d) => d.userId)
          .map((d) => [d.userId as string, d]),
      ),
      byName: new Map(
        resolvedDelegates.map((d) => [normalizeLeaderName(d.name), d]),
      ),
      byPhone: new Map(
        resolvedDelegates
          .map((d) => {
            const phone = (d.phone ?? "").replace(/\D/g, "");
            return phone ? ([phone, d] as const) : null;
          })
          .filter(Boolean) as Array<[string, (typeof resolvedDelegates)[number]]>,
      ),
      byId: new Map(resolvedDelegates.map((d) => [d.id, d])),
    };

    const rows = roster.map((row) => {
      const rosterKey = lsuicLeaderRosterKey(row);
      const built = builtByKey.get(rosterKey);
      const storedLink = linkByKey.get(rosterKey);
      const autoMatch = storedLink
        ? null
        : autoMatchDelegateForRosterRow(row, delegateIndexes);

      return {
        rosterKey,
        committeeFormalName: row.committee_formal_name,
        committeeShortName: row.committee_short_name,
        leaderName: stripHonorificDisplayName(row.leader_name),
        leaderRole: row.leader_role,
        csvPhotoUrl: row.leader_photo_url || null,
        resolvedPhotoPath:
          built?.photoPath ?? (row.leader_photo_url || null),
        link: storedLink
          ? {
              delegateId: storedLink.delegateId,
              userId: storedLink.userId,
              linkSource: storedLink.linkSource,
            }
          : autoMatch
            ? {
                delegateId: autoMatch.id,
                userId: autoMatch.userId,
                linkSource: "AUTO_SUGGESTED",
              }
            : null,
        isMapped: Boolean(storedLink?.delegateId || storedLink?.userId),
      };
    });

    return NextResponse.json({
      rows,
      counts: {
        total: rows.length,
        mapped: rows.filter((r) => r.isMapped).length,
        unmapped: rows.filter((r) => !r.isMapped).length,
      },
    });
  } catch (error) {
    console.error("GET /lsuic-leaders error:", error);
    return NextResponse.json(
      { error: "Failed to load LSUIC leader roster" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/lsuic-leaders/auto-link
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const delegates = await prisma.confDelegate.findMany({
      where: {
        confId,
        status: { in: ["REGISTERED", "CONFIRMED", "ATTENDED"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        userId: true,
        city: true,
        bookletPhotoPath: true,
      },
    });

    const delegateLike = delegates.map((d) => ({
      ...d,
      bookletPhotoPath: null,
    }));

    const indexes = {
      byUserId: new Map<string, (typeof delegateLike)[number]>(),
      byName: new Map<string, (typeof delegateLike)[number]>(),
      byPhone: new Map<string, (typeof delegateLike)[number]>(),
      byId: new Map<string, (typeof delegateLike)[number]>(),
    };

    for (const d of delegateLike) {
      indexes.byId.set(d.id, d);
      indexes.byName.set(normalizeLeaderName(d.name), d);
      if (d.userId) indexes.byUserId.set(d.userId, d);
      const phone = (d.phone ?? "").replace(/\D/g, "");
      if (phone) indexes.byPhone.set(phone, d);
    }

    const existing = await prisma.confLsuicLeaderLink.findMany({
      where: { confId },
      select: { rosterKey: true },
    });
    const existingKeys = new Set(existing.map((e) => e.rosterKey));

    let created = 0;
    for (const row of loadLsuicLeadersRoster()) {
      const rosterKey = lsuicLeaderRosterKey(row);
      if (existingKeys.has(rosterKey)) continue;
      const match = autoMatchDelegateForRosterRow(row, indexes);
      if (!match) continue;

      await prisma.confLsuicLeaderLink.create({
        data: {
          confId,
          rosterKey,
          delegateId: match.id,
          userId: match.userId,
          linkSource: "AUTO_NAME",
        },
      });
      created += 1;
      existingKeys.add(rosterKey);
    }

    return NextResponse.json({ created });
  } catch (error) {
    console.error("POST /lsuic-leaders auto-link error:", error);
    return NextResponse.json(
      { error: "Failed to auto-link LSUIC leaders" },
      { status: 500 },
    );
  }
}
