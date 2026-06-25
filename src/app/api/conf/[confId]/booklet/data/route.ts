import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";
import {
  resolveDelegateBookletPhotoForClient,
  resolveExternalBookletPhotoForClient,
  resolveMemberPhotoForClient,
} from "@/lib/conf/delegate-document-urls";
import type { BookletRosterMember } from "@/lib/conf/build-booklet-roster";
import { dedupeLeaderProfilesForConference } from "@/lib/conf/dedupe-leader-profiles";
import { buildBookletRosterMembers } from "@/lib/conf/build-booklet-roster";
import { findLsuicLeaderLinks } from "@/lib/conf/lsuic-leader-links";

function normalizePosition(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

// GET /api/conf/[confId]/booklet/data
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const origin = new URL(req.url).origin;

    const [
      event,
      booklet,
      leaders,
      members,
      delegates,
      registeredDelegateUserIds,
      leaderLinks,
      meetings,
    ] = await Promise.all([
      prisma.confEvent.findUnique({
        where: { id: confId },
        select: {
          id: true,
          name: true,
          slug: true,
          year: true,
          city: true,
          venue: true,
          venueCn: true,
          startsAt: true,
          endsAt: true,
        },
      }),

      prisma.confBooklet.findUnique({
        where: { confId },
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
        },
      }),

      prisma.confLeaderProfile.findMany({
        where: {
          OR: [{ confId }, { confId: null }],
          isActive: true,
        },
        orderBy: { sortOrder: "asc" },
      }),

      prisma.confMember.findMany({
        where: { confId, isActive: true },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
        select: {
          id: true,
          name: true,
          role: true,
          city: true,
          phone: true,
          title: true,
          committeeScope: true,
          photoPath: true,
          photoFileName: true,
          bookletBio: true,
          userId: true,
        },
      }),

      prisma.confDelegate.findMany({
        where: {
          confId,
          status: { in: ["REGISTERED", "CONFIRMED", "ATTENDED"] },
        },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          delegateCode: true,
          university: true,
          province: true,
          city: true,
          phone: true,
          email: true,
          conferencePosition: true,
          gender: true,
          bookletPhotoPath: true,
          status: true,
          userId: true,
        },
      }),

      prisma.confDelegate.findMany({
        where: {
          confId,
          userId: { not: null },
          status: { in: ["REGISTERED", "CONFIRMED", "ATTENDED"] },
        },
        select: { userId: true },
      }),

      findLsuicLeaderLinks(confId),

      prisma.confMeeting.findMany({
        where: { confId },
        orderBy: { scheduled: "asc" },
        select: {
          id: true,
          title: true,
          scheduled: true,
          location: true,
          agenda: true,
        },
      }),
    ]);

    if (!event) {
      return NextResponse.json(
        { error: "Conference not found" },
        { status: 404 },
      );
    }

    function resolveLeaderPhoto(photoPath: string): string {
      if (photoPath.startsWith("/conf/") || photoPath.startsWith("/public/")) {
        return photoPath;
      }
      if (photoPath.startsWith("http://") || photoPath.startsWith("https://")) {
        return photoPath;
      }
      return resolveStoredAssetUrl(photoPath, origin);
    }

    const resolvedLeaders = leaders.map((l) => ({
      ...l,
      photoPath: l.photoPath ? resolveLeaderPhoto(l.photoPath) : null,
    }));

    const dedupedLeaders = dedupeLeaderProfilesForConference(
      resolvedLeaders,
      confId,
    );

    const resolvedMembers = members.map((m) => ({
      ...m,
      photoPath: resolveMemberPhotoForClient(confId, m.id, m.photoPath),
    }));

    const resolvedDelegates = delegates.map((d) => ({
      ...d,
      bookletPhotoPath: resolveDelegateBookletPhotoForClient(
        confId,
        d.id,
        d.bookletPhotoPath,
      ),
    }));

    const signedUpUserIds = new Set(
      registeredDelegateUserIds
        .map((d) => d.userId)
        .filter(Boolean) as string[],
    );

    function resolveRosterMemberPhoto(
      member: BookletRosterMember,
    ): BookletRosterMember {
      return {
        ...member,
        photoPath: resolveExternalBookletPhotoForClient(member.photoPath),
      };
    }

    const { necMembers, committeeMembers } = buildBookletRosterMembers({
      dbMembers: resolvedMembers,
      delegates: resolvedDelegates,
      leaderLinks,
      signedUpUserIds,
    });

    const resolvedNecMembers = necMembers.map(resolveRosterMemberPhoto);
    const resolvedCommitteeMembers =
      committeeMembers.map(resolveRosterMemberPhoto);

    const conferenceChair =
      resolvedCommitteeMembers.find((m) => m.role === "CHAIR") ??
      resolvedCommitteeMembers.find((m) =>
        normalizePosition(m.title).includes("general chairman"),
      ) ??
      null;

    const membersByScope: Record<string, typeof resolvedCommitteeMembers> = {};
    for (const member of resolvedCommitteeMembers) {
      const scope = member.committeeScope ?? "_unassigned";
      if (!membersByScope[scope]) membersByScope[scope] = [];
      membersByScope[scope].push(member);
    }

    return NextResponse.json({
      event,
      booklet,
      leaders: dedupedLeaders,
      necMembers: resolvedNecMembers,
      committeeMembers: resolvedCommitteeMembers,
      conferenceChair,
      membersByScope,
      delegates: resolvedDelegates,
      meetings,
      counts: {
        totalDelegates: resolvedDelegates.length,
        totalMembers:
          resolvedNecMembers.length + resolvedCommitteeMembers.length,
        sectionsEnabled:
          booklet?.sections.filter((s) => s.isEnabled).length ?? 0,
        sectionsTotal: booklet?.sections.length ?? 0,
        leadersStored: dedupedLeaders.length,
        rosterLeadersTotal:
          resolvedNecMembers.length + resolvedCommitteeMembers.length,
      },
    });
  } catch (error) {
    console.error("GET /booklet/data error:", error);
    return NextResponse.json(
      { error: "Failed to load booklet data" },
      { status: 500 },
    );
  }
}
