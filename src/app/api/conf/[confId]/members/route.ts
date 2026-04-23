import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { resolveStoredAssetUrl } from "@/lib/conf/assets";

// GET /api/conf/[confId]/members — list all committee members
export async function GET(
  req: Request,
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

    const origin = new URL(req.url).origin;
    const normalized = members.map((member) => ({
      ...member,
      photoPath: member.photoPath
        ? resolveStoredAssetUrl(member.photoPath, origin)
        : null,
    }));

    return NextResponse.json(normalized);
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
    const {
      name,
      role,
      city,
      phone,
      email,
      title,
      committeeScope,
      roleTemplateKey,
      photoPath,
      photoFileName,
    } = body as {
      name?: string;
      role?: string;
      city?: string;
      phone?: string;
      email?: string;
      title?: string;
      committeeScope?: string;
      roleTemplateKey?: string;
      photoPath?: string;
      photoFileName?: string;
    };

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

    const roleTemplate = roleTemplateKey
      ? await prisma.confCommitteeRole.findFirst({
          where: {
            confId,
            key: String(roleTemplateKey),
            isActive: true,
          },
        })
      : null;

    if (roleTemplateKey && !roleTemplate) {
      return NextResponse.json(
        { error: "Role template not found" },
        { status: 404 },
      );
    }

    const resolvedRole = (roleTemplate?.baseRole ?? role ?? "COMMITTEE") as import("@prisma/client").ConfRole;
    const resolvedTitle = roleTemplate?.title ?? title ?? null;
    const resolvedScope = roleTemplate?.committeeScope ?? committeeScope ?? null;

    const isLeadershipRole = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"].includes(
      resolvedRole,
    );
    const canAssignLeadership =
      auth.access.isSuperAdmin || auth.access.memberRole === "CHAIR";

    if (isLeadershipRole && !canAssignLeadership) {
      return NextResponse.json(
        {
          error:
            "Only Super Admin or Conference Chair can assign leadership roles",
        },
        { status: 403 },
      );
    }

    const isScopedAssigner =
      !auth.access.isSuperAdmin &&
      auth.access.memberRole !== "CHAIR" &&
      auth.access.canAssignCommittee;

    if (
      isScopedAssigner &&
      resolvedScope &&
      auth.access.committeeScope &&
      resolvedScope !== auth.access.committeeScope
    ) {
      return NextResponse.json(
        { error: "You can only assign members within your committee scope" },
        { status: 403 },
      );
    }

    const member = await prisma.confMember.create({
      data: {
        confId,
        name,
        role: resolvedRole,
        city: city || null,
        phone: phone || null,
        email: email || null,
        title: resolvedTitle,
        committeeScope: resolvedScope,
        photoPath: photoPath || null,
        photoFileName: photoFileName || null,
      },
    });

    const origin = new URL(req.url).origin;
    return NextResponse.json(
      {
        ...member,
        photoPath: member.photoPath
          ? resolveStoredAssetUrl(member.photoPath, origin)
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create member:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 },
    );
  }
}
