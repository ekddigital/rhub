import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

// GET /api/conf/[confId]/booklet/data
// Returns the complete data payload needed to render a booklet preview.
//
// Structure:
//   - event              — conference event details
//   - booklet            — booklet config + ordered sections
//   - leaders            — ConfLeaderProfile entries (heads of state, ambassador, etc.)
//   - committeeMembers   — ALL active ConfMember entries for this conference
//                          (Conference Chair + all committee members; NOT the NEC)
//                          Each member has a `hasRegistered` flag (true if signed up as delegate)
//   - conferenceChair    — the ConfMember with role CHAIR (Conference Chair)
//   - membersByScope     — committeeMembers grouped by committeeScope
//   - delegates          — CONFIRMED/ATTENDED delegates for the booklet roster
//   - meetings           — scheduled meetings
//   - counts             — summary counters
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const origin = new URL(req.url).origin;

    const [event, booklet, leaders, members, delegates, registeredDelegateUserIds, meetings] =
      await Promise.all([
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

        // Conference Committee members (all roles — CHAIR = Conference Chair)
        prisma.confMember.findMany({
          where: { confId, isActive: true },
          orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
          select: {
            id: true,
            name: true,
            role: true,
            city: true,
            title: true,
            committeeScope: true,
            photoPath: true,
            photoFileName: true,
            bookletBio: true,
            userId: true,
          },
        }),

        // Booklet roster: only CONFIRMED/ATTENDED delegates
        prisma.confDelegate.findMany({
          where: {
            confId,
            status: { in: ["CONFIRMED", "ATTENDED"] },
          },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            delegateCode: true,
            university: true,
            city: true,
            gender: true,
            bookletPhotoPath: true,
            status: true,
            userId: true,
          },
        }),

        // All delegate userIds (any status) — used to mark which committee members have registered
        prisma.confDelegate.findMany({
          where: { confId, userId: { not: null } },
          select: { userId: true },
        }),

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

    // Resolve photo URLs
    const resolvedLeaders = leaders.map((l) => ({
      ...l,
      photoPath: l.photoPath
        ? resolveStoredAssetUrl(l.photoPath, origin)
        : null,
    }));

    const resolvedMembers = members.map((m) => ({
      ...m,
      photoPath: m.photoPath
        ? resolveStoredAssetUrl(m.photoPath, origin)
        : null,
    }));

    const resolvedDelegates = delegates.map((d) => ({
      ...d,
      bookletPhotoPath: d.bookletPhotoPath
        ? resolveStoredAssetUrl(d.bookletPhotoPath, origin)
        : null,
    }));

    // Build Set of userIds that have any delegate registration for this conference
    const signedUpUserIds = new Set(
      registeredDelegateUserIds.map((d) => d.userId).filter(Boolean) as string[],
    );

    // Committee members: ALL active members, each annotated with hasRegistered flag.
    // Admin views show all members; the flag indicates who has signed up as a delegate.
    const committeeMembers = resolvedMembers.map((m) => ({
      ...m,
      hasRegistered:
        m.userId !== null && signedUpUserIds.has(m.userId as string),
    }));

    // Conference Chair is the CHAIR-role member (Enoch). NOT an NEC member.
    const conferenceChair = committeeMembers.find((m) => m.role === "CHAIR") ?? null;

    // Group all (unfiltered) members by committeeScope for section rendering
    const membersByScope: Record<string, typeof resolvedMembers> = {};
    for (const member of committeeMembers) {
      const scope = member.committeeScope ?? "_unassigned";
      if (!membersByScope[scope]) membersByScope[scope] = [];
      membersByScope[scope].push(member);
    }

    return NextResponse.json({
      event,
      booklet,
      leaders: resolvedLeaders,
      committeeMembers,
      conferenceChair,
      membersByScope,
      delegates: resolvedDelegates,
      meetings,
      counts: {
        totalDelegates: resolvedDelegates.length,
        totalMembers: resolvedMembers.length,
        sectionsEnabled:
          booklet?.sections.filter((s) => s.isEnabled).length ?? 0,
        sectionsTotal: booklet?.sections.length ?? 0,
        leadersStored: resolvedLeaders.length,
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
