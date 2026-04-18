import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

const NEC_ROLES = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "TREASURER",
  "COMMITTEE",
] as const;

// GET /api/conf/[confId]/booklet/data
// Returns the complete data payload needed to render a booklet preview:
// event, booklet config, sections, leaders, NEC members, committee members
// grouped by committeeScope, confirmed delegates, and meetings.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const origin = new URL(req.url).origin;

    const [event, booklet, leaders, members, delegates, meetings] =
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
          },
        }),

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
          },
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

    // Group members by committeeScope for easy section rendering
    const membersByScope: Record<string, typeof resolvedMembers> = {};
    const necMembers: typeof resolvedMembers = [];

    for (const member of resolvedMembers) {
      if (NEC_ROLES.includes(member.role as (typeof NEC_ROLES)[number])) {
        necMembers.push(member);
      }
      const scope = member.committeeScope ?? "_unassigned";
      if (!membersByScope[scope]) membersByScope[scope] = [];
      membersByScope[scope].push(member);
    }

    // National president for the address section
    const nationalPresident = resolvedMembers.find((m) => m.role === "CHAIR");

    return NextResponse.json({
      event,
      booklet,
      leaders: resolvedLeaders,
      necMembers,
      nationalPresident: nationalPresident ?? null,
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
