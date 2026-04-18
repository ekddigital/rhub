import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

// PATCH /api/conf/[confId]/members/[memberId]
// Update member details — supports chair assignment, scope, permissions, user linking
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; memberId: string }> },
) {
  try {
    const { confId, memberId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      name,
      role,
      title,
      city,
      phone,
      email,
      isActive,
      committeeScope,
      canAssignCommittee,
      canApprovePayments,
      userId, // link to a platform User
      bookletBio, // Conference Chairman's address/message for the booklet
    } = body;

    const existing = await prisma.confMember.findUnique({
      where: { id: memberId, confId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Only super admins can link user accounts or grant canAssignCommittee
    const needsSuperAdmin =
      (userId !== undefined && userId !== existing.userId) ||
      canAssignCommittee !== undefined;

    if (needsSuperAdmin && !auth.access.isSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Super Admin required to link user accounts or grant committee assignment permissions",
        },
        { status: 403 },
      );
    }

    // Chairs with canAssignCommittee can set committeeScope on members within their scope
    const isChairAssigning =
      auth.access.canAssignCommittee && !auth.access.isSuperAdmin;
    if (isChairAssigning && committeeScope !== undefined) {
      // Chair can only assign within their own scope
      if (committeeScope !== auth.access.committeeScope) {
        return NextResponse.json(
          { error: "You can only assign members to your own committee scope" },
          { status: 403 },
        );
      }
    }

    // Validate role
    const allowedRoles = [
      "CHAIR",
      "VICE_CHAIR",
      "SECRETARY",
      "TREASURER",
      "COMMITTEE",
      "DELEGATE",
    ];
    if (role !== undefined && !allowedRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // If linking a userId, verify the user exists
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (title !== undefined) updateData.title = title || null;
    if (city !== undefined) updateData.city = city || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (committeeScope !== undefined)
      updateData.committeeScope = committeeScope || null;
    if (canAssignCommittee !== undefined)
      updateData.canAssignCommittee = Boolean(canAssignCommittee);
    if (canApprovePayments !== undefined)
      updateData.canApprovePayments = Boolean(canApprovePayments);
    if (userId !== undefined) updateData.userId = userId || null;
    if (bookletBio !== undefined) updateData.bookletBio = bookletBio || null;

    const updated = await prisma.confMember.update({
      where: { id: memberId },
      data: updateData,
    });

    // Audit log for significant changes
    if (role !== undefined && role !== existing.role) {
      await logFinanceAction({
        confId,
        actorUserId: auth.access.user?.id,
        actorName: auth.access.user?.name ?? "System",
        action: "MEMBER_CHAIR_ASSIGNED",
        entityType: "member",
        entityId: memberId,
        details: {
          memberName: updated.name,
          oldRole: existing.role,
          newRole: role,
        },
      });
    }

    if (
      committeeScope !== undefined &&
      committeeScope !== existing.committeeScope
    ) {
      await logFinanceAction({
        confId,
        actorUserId: auth.access.user?.id,
        actorName: auth.access.user?.name ?? "System",
        action: "MEMBER_SCOPE_SET",
        entityType: "member",
        entityId: memberId,
        details: {
          memberName: updated.name,
          oldScope: existing.committeeScope,
          newScope: committeeScope,
        },
      });
    }

    if (userId !== undefined && userId !== existing.userId) {
      await logFinanceAction({
        confId,
        actorUserId: auth.access.user?.id,
        actorName: auth.access.user?.name ?? "System",
        action: "MEMBER_USER_LINKED",
        entityType: "member",
        entityId: memberId,
        details: {
          memberName: updated.name,
          linkedUserId: userId,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/members/[memberId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; memberId: string }> },
) {
  try {
    const { confId, memberId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const existing = await prisma.confMember.findUnique({
      where: { id: memberId, confId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    await prisma.confMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 },
    );
  }
}
