import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { logFinanceAction } from "@/lib/conf/audit";

async function ensureUniqueCommitteeApprover(input: {
  confId: string;
  committeeScope: string;
  excludeMemberId: string;
}) {
  const existing = await prisma.confMember.findFirst({
    where: {
      confId: input.confId,
      isActive: true,
      canApprovePayments: true,
      committeeScope: input.committeeScope,
      id: { not: input.excludeMemberId },
    },
    select: { id: true, name: true },
  });

  return existing;
}

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
      roleTemplateKey,
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

    const requestedRole = roleTemplate?.baseRole ?? role;
    const requestedScope = roleTemplate?.committeeScope ?? committeeScope;
    const requestedTitle = roleTemplate?.title ?? title;
    const effectiveRole = requestedRole ?? existing.role;
    const effectiveScope =
      requestedScope !== undefined
        ? requestedScope || null
        : existing.committeeScope;
    const effectiveIsActive =
      isActive !== undefined ? Boolean(isActive) : existing.isActive;
    const effectiveCanApprovePayments =
      canApprovePayments !== undefined
        ? Boolean(canApprovePayments)
        : existing.canApprovePayments;

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

    if (
      canApprovePayments !== undefined &&
      !(auth.access.isSuperAdmin || auth.access.memberRole === "CHAIR")
    ) {
      return NextResponse.json(
        {
          error:
            "Only Super Admin or Conference Chair can grant committee approval permissions",
        },
        { status: 403 },
      );
    }

    // Scope-limited assignees can only assign within their own committee scope.
    const isScopedAssigner =
      !auth.access.isSuperAdmin &&
      auth.access.memberRole !== "CHAIR" &&
      auth.access.canAssignCommittee;
    if (isScopedAssigner && requestedScope !== undefined) {
      if (requestedScope !== auth.access.committeeScope) {
        return NextResponse.json(
          { error: "You can only assign members to your own committee scope" },
          { status: 403 },
        );
      }
    }

    // Only Super Admin or Conference Chair can assign leadership roles.
    if (requestedRole !== undefined) {
      const leadershipRoles = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];
      const wantsLeadershipRole = leadershipRoles.includes(requestedRole);
      const canAssignLeadership =
        auth.access.isSuperAdmin || auth.access.memberRole === "CHAIR";
      if (wantsLeadershipRole && !canAssignLeadership) {
        return NextResponse.json(
          {
            error:
              "Only Super Admin or Conference Chair can assign leadership roles",
          },
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
    if (requestedRole !== undefined && !allowedRoles.includes(requestedRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    if (effectiveCanApprovePayments && effectiveIsActive) {
      const leadershipRoles = ["CHAIR", "VICE_CHAIR", "SECRETARY"];
      const isLeadership = leadershipRoles.includes(String(effectiveRole));

      // Leadership roles (CHAIR, VICE_CHAIR, SECRETARY) have conference-wide approval authority
      // They do NOT need a committeeScope — their approval is unlimited across all committees
      if (isLeadership) {
        // Leadership approval is conference-wide, no scope restriction needed
        // Chair can approve all payments, and can delegate to Vice Chair or Secretary
      } else {
        // Non-leadership roles (COMMITTEE) require a committeeScope for approval rights
        if (!effectiveScope) {
          return NextResponse.json(
            {
              error:
                "committeeScope is required when granting committee-level payment approval rights to non-leadership roles",
            },
            { status: 400 },
          );
        }

        const existingChair = await ensureUniqueCommitteeApprover({
          confId,
          committeeScope: effectiveScope,
          excludeMemberId: memberId,
        });

        if (existingChair) {
          return NextResponse.json(
            {
              error: `Committee scope '${effectiveScope}' already has an active approver (${existingChair.name})`,
            },
            { status: 409 },
          );
        }
      }
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
    if (requestedRole !== undefined) updateData.role = requestedRole;
    if (requestedTitle !== undefined) updateData.title = requestedTitle || null;
    if (city !== undefined) updateData.city = city || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (email !== undefined) updateData.email = email || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (requestedScope !== undefined)
      updateData.committeeScope = requestedScope || null;
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
    if (requestedRole !== undefined && requestedRole !== existing.role) {
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
          newRole: requestedRole,
        },
      });
    }

    if (
      requestedScope !== undefined &&
      requestedScope !== existing.committeeScope
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
          newScope: requestedScope,
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

    const hydrated = await prisma.confMember.findUnique({
      where: { id: memberId },
    });

    if (!hydrated) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const linkedUser = hydrated.userId
      ? await prisma.user.findUnique({
          where: { id: hydrated.userId },
          select: { id: true, name: true, email: true },
        })
      : null;

    return NextResponse.json({
      ...hydrated,
      email: hydrated.email || linkedUser?.email || null,
      linkedUserName: linkedUser?.name || null,
      linkedUserEmail: linkedUser?.email || null,
    });
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
