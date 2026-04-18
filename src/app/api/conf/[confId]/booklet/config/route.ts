import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

const DEFAULT_SECTIONS = [
  { type: "COVER", title: "Cover Page", sortOrder: 1 },
  { type: "LEADER", title: "President of Liberia", sortOrder: 2 },
  { type: "LEADER", title: "President of China", sortOrder: 3 },
  { type: "LEADER", title: "Liberian Ambassador to China", sortOrder: 4 },
  { type: "NEC", title: "NEC Leadership", sortOrder: 5 },
  { type: "PRESIDENT_ADDRESS", title: "President's Address", sortOrder: 6 },
  { type: "GUEST_BIO", title: "Guest Speaker Biography", sortOrder: 7 },
  {
    type: "COC",
    title: "Council of Coordinators — Leadership",
    sortOrder: 8,
    committeeScope: "CoC",
  },
  {
    type: "COC_MEMBERS",
    title: "Council of Coordinators — Members",
    sortOrder: 9,
    committeeScope: "CoC Province",
  },
  {
    type: "CITY_PRESIDENTS",
    title: "City Presidents",
    sortOrder: 10,
    committeeScope: "City",
  },
  {
    type: "JUDICIAL",
    title: "Judicial Board",
    sortOrder: 11,
    committeeScope: "Judicial",
  },
  {
    type: "COMMITTEE",
    title: "Planning & Program Committee",
    subtitle: "PPC",
    sortOrder: 12,
    committeeScope: "PPC",
  },
  {
    type: "COMMITTEE",
    title: "Academic Excellence Committee",
    subtitle: "AEC",
    sortOrder: 13,
    committeeScope: "AEC",
  },
  {
    type: "COMMITTEE",
    title: "Ways, Means & Finance Committee",
    subtitle: "WMF",
    sortOrder: 14,
    committeeScope: "WMF",
  },
  { type: "SCHEDULE", title: "Conference Schedule", sortOrder: 15 },
  { type: "DELEGATES", title: "Delegate Roster", sortOrder: 16 },
  { type: "SPONSORS", title: "Sponsors & Partners", sortOrder: 17 },
  { type: "BACK_COVER", title: "Back Cover", sortOrder: 18 },
];

// GET /api/conf/[confId]/booklet/config
// Returns the booklet config. Creates it with defaults if it doesn't exist.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    let booklet = await prisma.confBooklet.findUnique({
      where: { confId },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!booklet) {
      booklet = await prisma.confBooklet.create({
        data: {
          confId,
          sections: {
            create: DEFAULT_SECTIONS,
          },
        },
        include: {
          sections: {
            orderBy: { sortOrder: "asc" },
          },
        },
      });
    }

    return NextResponse.json({ booklet });
  } catch (error) {
    console.error("GET /booklet/config error:", error);
    return NextResponse.json(
      { error: "Failed to load booklet config" },
      { status: 500 },
    );
  }
}

// PATCH /api/conf/[confId]/booklet/config
// Update booklet title, subtitle, theme, cover image, or status.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "chair");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as Record<string, unknown>;
    const { title, subtitle, theme, coverImagePath, status } = body;

    const updated = await prisma.confBooklet.upsert({
      where: { confId },
      create: {
        confId,
        title: typeof title === "string" ? title : "Conference Booklet",
        subtitle: typeof subtitle === "string" ? subtitle : undefined,
        theme: typeof theme === "string" ? theme : undefined,
        coverImagePath:
          typeof coverImagePath === "string" ? coverImagePath : undefined,
        status:
          status === "DRAFT" || status === "READY" || status === "PUBLISHED"
            ? status
            : "DRAFT",
      },
      update: {
        ...(typeof title === "string" && { title }),
        ...(typeof subtitle === "string" && { subtitle }),
        ...(typeof theme === "string" && { theme }),
        ...(typeof coverImagePath === "string" && { coverImagePath }),
        ...(status === "DRAFT" || status === "READY" || status === "PUBLISHED"
          ? { status }
          : {}),
      },
    });

    return NextResponse.json({ booklet: updated });
  } catch (error) {
    console.error("PATCH /booklet/config error:", error);
    return NextResponse.json(
      { error: "Failed to update booklet config" },
      { status: 500 },
    );
  }
}
