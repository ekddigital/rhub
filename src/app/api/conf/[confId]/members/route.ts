import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/members — list all committee members
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const members = await prisma.confMember.findMany({
      where: { confId },
      orderBy: { joinedAt: "asc" },
    });
    return NextResponse.json(members);
  } catch (error) {
    console.error("Failed to fetch members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/members — add a committee member
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const { name, role, city, phone, email, title, photoPath, photoFileName } =
      body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const allowedRoles = [
      "CHAIR",
      "VICE_CHAIR",
      "SECRETARY",
      "TREASURER",
      "COMMITTEE",
      "DELEGATE",
    ];

    if (role && !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid committee role" },
        { status: 400 },
      );
    }

    const member = await prisma.confMember.create({
      data: {
        confId,
        name,
        role: role || "COMMITTEE",
        city: city || null,
        phone: phone || null,
        email: email || null,
        title: title || null,
        photoPath: photoPath || null,
        photoFileName: photoFileName || null,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 },
    );
  }
}
