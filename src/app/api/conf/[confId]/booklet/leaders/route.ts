import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/booklet/leaders
// Returns all leader profiles for this conference + global profiles (confId = null).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const leaders = await prisma.confLeaderProfile.findMany({
      where: {
        OR: [{ confId }, { confId: null }],
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ leaders });
  } catch (error) {
    console.error("GET /booklet/leaders error:", error);
    return NextResponse.json(
      { error: "Failed to load leader profiles" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/booklet/leaders
// Create a new leader profile.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "super-admin");
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as Record<string, unknown>;
    const { role, name, title, bio, photoPath, photoFileName, country, sortOrder, isGlobal } =
      body;

    if (typeof role !== "string" || !role.trim()) {
      return NextResponse.json({ error: "role is required" }, { status: 400 });
    }
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const leader = await prisma.confLeaderProfile.create({
      data: {
        confId: isGlobal === true ? null : confId,
        role: role.trim(),
        name: name.trim(),
        title: title.trim(),
        bio: typeof bio === "string" ? bio : undefined,
        photoPath: typeof photoPath === "string" ? photoPath : undefined,
        photoFileName:
          typeof photoFileName === "string" ? photoFileName : undefined,
        country: typeof country === "string" ? country : undefined,
        sortOrder:
          typeof sortOrder === "number" ? sortOrder : 0,
      },
    });

    return NextResponse.json({ leader }, { status: 201 });
  } catch (error) {
    console.error("POST /booklet/leaders error:", error);
    return NextResponse.json(
      { error: "Failed to create leader profile" },
      { status: 500 },
    );
  }
}
