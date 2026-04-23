import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

// Official NEC roster from conference letterhead / directives.
// This remains distinct from Conference Committee members (ConfMember).
const DEFAULT_NEC_BOARD = [
  {
    name: "Olano Teah Bloh",
    title: "National President",
    role: "CHAIR",
    city: "Nanjing",
    province: "Jiangsu",
    phone: "18351981723",
  },
  {
    name: "Ruphine M. Harmon",
    title: "National Vice President",
    role: "VICE_CHAIR",
    city: "Jinan",
    province: "Shandong",
    phone: "18651615822",
  },
  {
    name: "C. Nathaniel Willie II",
    title: "National Secretary General",
    role: "SECRETARY",
    city: "Chengdu",
    province: "Sichuan",
    phone: "18581578335",
  },
  {
    name: "Jenkins G. Wilson",
    title: "Acting National Deputy Secretary General",
    role: "COMMITTEE",
    city: "Xuzhou",
    province: "Jiangsu",
    phone: "18556169627",
  },
  {
    name: "Noah D. Mason",
    title: "National Financial Secretary General",
    role: "TREASURER",
    city: "Ningbo",
    province: "Zhejiang",
    phone: "19825661023",
  },
  {
    name: "Jenneh Bonah",
    title: "National Treasurer",
    role: "COMMITTEE",
    city: "Jinan",
    province: "Shandong",
    phone: "18906417225",
  },
  {
    name: "Mitchell Vampelt",
    title: "National Chaplain General",
    role: "COMMITTEE",
    city: "Suzhou",
    province: "Jiangsu",
    phone: "15601544001",
  },
] as const;

// Official conference committee roster from appointment letter.
// Used as fallback when members have not linked a delegate profile yet.
const DEFAULT_COMMITTEE_ROSTER = [
  {
    name: "Enoch Kwateh Dongbo",
    title: "General Chairman",
    city: "Jinan",
    province: "Shandong",
    university: "University of Jinan",
    phone: "18506832159",
  },
  {
    name: "Alfreda Ruth Togbah",
    title: "General Co-Chair",
    city: "Suzhou",
    province: "Jiangsu",
    university: "Suzhou Uni. of Sci & Tech",
    phone: "13915437321",
  },
  {
    name: "Harris M Bowulo",
    title: "General Secretary",
    city: "Beijing",
    province: "Beijing",
    university: "North China Uni. of Tech",
    phone: "18514556295",
  },
  {
    name: "Abdul Corneh",
    title: "PRO & Media",
    city: "Zhengzhou",
    province: "Henan",
    university: "North China Uni.",
    phone: "15638483183",
  },
  {
    name: "Kukor Brooks",
    title: "Cooking Team Chair",
    city: "Jinan",
    province: "Shandong",
    university: "Shandong Jianzhu Uni.",
    phone: "15376176715",
  },
  {
    name: "Jefferson T Banquando",
    title: "Chair on Sports",
    city: "Suzhou",
    province: "Jiangsu",
    university: "Suzhou Uni. Sci & Tech",
    phone: "18662966349",
  },
  {
    name: "Lisa Y Synyenlentu",
    title: "Member, Cooking Team",
    city: "Qingdao",
    province: "Shandong",
    university: "Ocean Uni. of China",
    phone: "17863971479",
  },
  {
    name: "Blessing Hawa Washington",
    title: "Member, Cooking Team",
    city: "Nantong",
    province: "Jiangsu",
    university: "Nantong University",
    phone: "19850012998",
  },
  {
    name: "Robert D. Molley",
    title: "Chair on Logistics",
    city: "Qufu",
    province: "Shandong",
    university: "Jining University",
    phone: "18853752989",
  },
  {
    name: "Priscilla Bamu Dweh",
    title: "Member, Cooking Team",
    city: "Suzhou",
    province: "Jiangsu",
    university: "Suzhou Uni. of Sci & Tech",
    phone: "13291194526",
  },
  {
    name: "Williamena Yah Munyenneh",
    title: "Member, Cooking Team",
    city: "Suzhou",
    province: "Jiangsu",
    university: "Suzhou Uni. of Sci & Tech",
    phone: "16606212125",
  },
] as const;

function normalizeName(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizePosition(value: string | null | undefined): string {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

const COMMITTEE_ALIAS_TO_CANONICAL: Array<[string, string]> = [
  ["Lisa Y SET", "Lisa Y Synyenlentu"],
  ["Robert D Molley", "Robert D. Molley"],
  ["Williama Yah Munyenneh", "Williamena Yah Munyenneh"],
  ["Williamena Yah SENET", "Williamena Yah Munyenneh"],
  ["Willimena Y. Munyenneh", "Williamena Yah Munyenneh"],
  ["Willimena Yah Munyenneh", "Williamena Yah Munyenneh"],
  ["Williamena Yah MUNYENEH", "Williamena Yah Munyenneh"],
];

const COMMITTEE_ROSTER_LOOKUP = (() => {
  const lookup = new Map<string, (typeof DEFAULT_COMMITTEE_ROSTER)[number]>();
  for (const entry of DEFAULT_COMMITTEE_ROSTER) {
    lookup.set(normalizeName(entry.name), entry);
  }
  for (const [alias, canonical] of COMMITTEE_ALIAS_TO_CANONICAL) {
    const canonicalEntry = lookup.get(normalizeName(canonical));
    if (canonicalEntry) {
      lookup.set(normalizeName(alias), canonicalEntry);
    }
  }
  return lookup;
})();

function findCommitteeRosterEntry(
  name: string,
  title: string | null,
): (typeof DEFAULT_COMMITTEE_ROSTER)[number] | null {
  const byName = COMMITTEE_ROSTER_LOOKUP.get(normalizeName(name));
  if (byName) return byName;

  if (title) {
    const byTitle = DEFAULT_COMMITTEE_ROSTER.find(
      (entry) => normalizePosition(entry.title) === normalizePosition(title),
    );
    if (byTitle) return byTitle;
  }

  return null;
}

// GET /api/conf/[confId]/booklet/data
// Returns the complete data payload needed to render a booklet preview.
//
// Structure:
//   - event              — conference event details
//   - booklet            — booklet config + ordered sections
//   - leaders            — ConfLeaderProfile entries (heads of state, ambassador, etc.)
//   - necMembers         — NEC board entries (from official roster), auto-linked to
//                          delegate signup data when available
//   - committeeMembers   — ALL active ConfMember entries for this conference
//                          (Conference Chair + all committee members; NOT the NEC)
//                          Each member has a `hasRegistered` flag (true if signed up as delegate)
//   - conferenceChair    — the ConfMember with role CHAIR (Conference Chair)
//   - membersByScope     — committeeMembers grouped by committeeScope
//   - delegates          — ALL signed-up delegates (excluding CANCELLED)
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

    const [
      event,
      booklet,
      leaders,
      members,
      delegates,
      registeredDelegateUserIds,
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

      // Conference Committee members (all roles — CHAIR = Conference Chair)
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

      // Booklet roster: all signed-up delegates (except cancelled)
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
          conferencePosition: true,
          gender: true,
          bookletPhotoPath: true,
          status: true,
          userId: true,
        },
      }),

      // All delegate userIds (any status) — used to mark which committee members have registered
      prisma.confDelegate.findMany({
        where: {
          confId,
          userId: { not: null },
          status: { in: ["REGISTERED", "CONFIRMED", "ATTENDED"] },
        },
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

    // Resolve photo URLs.
    // Public static files (e.g. /conf/president_boakai_Liberia.png) must be
    // kept as relative paths — on the server the internal origin (localhost)
    // differs from the browser's origin, so absolutising them produces URLs
    // the browser can never reach.  Only proper asset-server paths need
    // resolveStoredAssetUrl.
    function resolveLeaderPhoto(photoPath: string): string {
      if (photoPath.startsWith("/conf/") || photoPath.startsWith("/public/")) {
        return photoPath; // relative — browser resolves against its own origin
      }
      return resolveStoredAssetUrl(photoPath, origin);
    }

    const resolvedLeaders = leaders.map((l) => ({
      ...l,
      photoPath: l.photoPath ? resolveLeaderPhoto(l.photoPath) : null,
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

    const delegateByUserId = new Map(
      resolvedDelegates
        .filter((d) => d.userId)
        .map((d) => [d.userId as string, d]),
    );
    const delegateByName = new Map(
      resolvedDelegates.map((d) => [normalizeName(d.name), d]),
    );

    function findLinkedDelegate(
      userId: string | null | undefined,
      name: string,
    ) {
      if (userId && delegateByUserId.has(userId)) {
        return delegateByUserId.get(userId) ?? null;
      }
      return delegateByName.get(normalizeName(name)) ?? null;
    }

    // Build Set of userIds that have any delegate registration for this conference
    const signedUpUserIds = new Set(
      registeredDelegateUserIds
        .map((d) => d.userId)
        .filter(Boolean) as string[],
    );

    // Conference Committee members (NOT NEC): annotate each member with linked
    // delegate profile fields so booklet cards can show school/code/province.
    const committeeMembers = resolvedMembers.map((m) => {
      const linked = findLinkedDelegate(m.userId, m.name);
      const roster = findCommitteeRosterEntry(m.name, m.title);
      return {
        ...m,
        name: roster?.name ?? m.name,
        city: linked?.city ?? m.city ?? roster?.city ?? null,
        phone: linked?.phone ?? m.phone ?? roster?.phone ?? null,
        province: linked?.province ?? roster?.province ?? null,
        university: linked?.university ?? roster?.university ?? null,
        delegateCode: linked?.delegateCode ?? null,
        conferencePosition:
          linked?.conferencePosition ?? m.title ?? roster?.title ?? null,
        photoPath: m.photoPath ?? linked?.bookletPhotoPath ?? null,
        hasRegistered:
          (m.userId !== null && signedUpUserIds.has(m.userId as string)) ||
          Boolean(linked),
      };
    });

    // Conference Chair is the CHAIR-role member (Enoch). NOT an NEC member.
    const conferenceChair =
      committeeMembers.find((m) => m.role === "CHAIR") ?? null;

    // NEC board: fixed roster + live overlay from delegate signups.
    // Missing signup/photo data intentionally stays null, so UI shows placeholders.
    const necMembers = DEFAULT_NEC_BOARD.map((entry, idx) => {
      const byPosition = resolvedDelegates.find(
        (d) =>
          normalizePosition(d.conferencePosition) ===
          normalizePosition(entry.title),
      );
      const byName = delegateByName.get(normalizeName(entry.name)) ?? null;
      const linked = byPosition ?? byName;

      return {
        id: `nec-${idx + 1}`,
        name: linked?.name ?? entry.name,
        role: entry.role,
        title: entry.title,
        city: linked?.city ?? entry.city,
        province: linked?.province ?? entry.province,
        phone: linked?.phone ?? entry.phone,
        committeeScope: "NEC",
        photoPath: linked?.bookletPhotoPath ?? null,
        bookletBio: null,
        userId: linked?.userId ?? null,
        university: linked?.university ?? null,
        delegateCode: linked?.delegateCode ?? null,
        conferencePosition: linked?.conferencePosition ?? entry.title,
        hasRegistered: Boolean(linked),
      };
    });

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
      necMembers,
      committeeMembers,
      conferenceChair,
      membersByScope,
      delegates: resolvedDelegates,
      meetings,
      counts: {
        totalDelegates: resolvedDelegates.length,
        totalMembers: resolvedMembers.length + necMembers.length,
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
