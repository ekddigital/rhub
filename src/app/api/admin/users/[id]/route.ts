import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  writeAdminAuditEntries,
  type AdminAuditEntryInput,
} from "@/lib/admin/audit";
import { sendRoleChangeEmail } from "@/lib/mail";
import { z } from "zod";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const user = await validateSession(token);
  if (!user) return null;
  if (!["SUPER_ADMIN", "ADMIN"].includes(user.role)) return null;
  if (user.canAccessAdmin === false) return null;
  return user;
}

const updateUserSchema = z.object({
  role: z
    .enum([
      "SUPER_ADMIN",
      "ADMIN",
      "JUDGE_ADMIN",
      "HEAD_JUDGE",
      "JUDGE",
      "USER",
    ])
    .optional(),
  isActive: z.boolean().optional(),
  name: z.string().min(2).max(100).optional(),
  accessStatus: z
    .enum(["PENDING", "APPROVED", "RESTRICTED", "REJECTED"])
    .optional(),
  canAccessHub: z.boolean().optional(),
  canAccessConference: z.boolean().nullable().optional(),
  canAccessAdmin: z.boolean().nullable().optional(),
  accessNote: z.string().max(1000).nullable().optional(),
});

/**
 * PATCH /api/admin/users/[id] — update user role, active status, or name
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid data" },
      { status: 400 },
    );
  }

  const {
    role,
    isActive,
    name,
    accessStatus,
    canAccessHub,
    canAccessConference,
    canAccessAdmin,
    accessNote,
  } = parsed.data;

  const nextName = name !== undefined ? name.trim() : target.name;
  const nextAccessNote =
    accessNote !== undefined ? accessNote?.trim() || null : target.accessNote;

  const nextRole = role ?? target.role;
  const nextStatus = accessStatus ?? target.accessStatus;
  const nextIsActive = isActive ?? target.isActive;

  if (canAccessAdmin !== undefined && admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admins can change admin access flags" },
      { status: 403 },
    );
  }

  if (canAccessHub === true && nextStatus !== "APPROVED") {
    return NextResponse.json(
      {
        error:
          "Only approved accounts can have hub access enabled. Approve the account first.",
      },
      { status: 400 },
    );
  }

  // Role elevation guard — only SUPER_ADMIN can grant SUPER_ADMIN / ADMIN
  if (
    role &&
    (role === "SUPER_ADMIN" || role === "ADMIN") &&
    admin.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      { error: "Only Super Admins can assign Admin or Super Admin roles" },
      { status: 403 },
    );
  }

  // Prevent non-SUPER_ADMIN from editing a SUPER_ADMIN
  if (target.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot modify a Super Admin account" },
      { status: 403 },
    );
  }

  // Prevent self-demotion to USER if the only SUPER_ADMIN
  if (
    role &&
    role !== "SUPER_ADMIN" &&
    target.id === admin.id &&
    admin.role === "SUPER_ADMIN"
  ) {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      return NextResponse.json(
        {
          error:
            "Cannot demote the only Super Admin. Create another Super Admin first.",
        },
        { status: 400 },
      );
    }
  }

  let nextCanAccessHub = canAccessHub ?? target.canAccessHub;
  if (!nextIsActive || nextStatus !== "APPROVED") {
    nextCanAccessHub = false;
  }

  let nextCanAccessAdmin =
    canAccessAdmin !== undefined ? canAccessAdmin : target.canAccessAdmin;
  if (canAccessAdmin === undefined && role !== undefined) {
    nextCanAccessAdmin =
      nextRole === "SUPER_ADMIN" || nextRole === "ADMIN" ? true : null;
  }

  if (
    nextCanAccessAdmin === true &&
    !["SUPER_ADMIN", "ADMIN"].includes(nextRole)
  ) {
    return NextResponse.json(
      {
        error:
          "Admin access can only be enabled for ADMIN or SUPER_ADMIN roles.",
      },
      { status: 400 },
    );
  }

  const nextCanAccessConference =
    canAccessConference !== undefined
      ? canAccessConference
      : target.canAccessConference;

  const roleChanged = nextRole !== target.role;

  const auditEntries: AdminAuditEntryInput[] = [];

  const pushAudit = (
    action: string,
    field: string,
    before: unknown,
    after: unknown,
    note?: string,
  ) => {
    if (before === after) return;

    auditEntries.push({
      actorUserId: admin.id,
      actorEmail: admin.email,
      targetUserId: target.id,
      targetEmail: target.email,
      targetName: target.name,
      action,
      field,
      oldValue: before,
      newValue: after,
      note: note ?? null,
    });
  };

  pushAudit("NAME_CHANGED", "name", target.name, nextName);
  pushAudit("ROLE_CHANGED", "role", target.role, nextRole);

  if (target.accessStatus !== nextStatus) {
    const statusAction =
      nextStatus === "APPROVED"
        ? "ACCESS_APPROVED"
        : nextStatus === "RESTRICTED"
          ? "ACCESS_RESTRICTED"
          : nextStatus === "REJECTED"
            ? "ACCESS_REJECTED"
            : "ACCESS_PENDING";
    pushAudit(statusAction, "accessStatus", target.accessStatus, nextStatus);
  }

  if (target.isActive !== nextIsActive) {
    pushAudit(
      nextIsActive ? "ACCOUNT_ENABLED" : "ACCOUNT_DISABLED",
      "isActive",
      target.isActive,
      nextIsActive,
    );
  }

  if (target.canAccessHub !== nextCanAccessHub) {
    pushAudit(
      nextCanAccessHub ? "HUB_ACCESS_ENABLED" : "HUB_ACCESS_DISABLED",
      "canAccessHub",
      target.canAccessHub,
      nextCanAccessHub,
    );
  }

  pushAudit(
    "CONFERENCE_ACCESS_CHANGED",
    "canAccessConference",
    target.canAccessConference,
    nextCanAccessConference,
  );
  pushAudit(
    "ADMIN_ACCESS_CHANGED",
    "canAccessAdmin",
    target.canAccessAdmin,
    nextCanAccessAdmin,
  );
  pushAudit(
    "ACCESS_NOTE_CHANGED",
    "accessNote",
    target.accessNote,
    nextAccessNote,
  );

  const updateData: Record<string, unknown> = {
    role: nextRole,
    isActive: nextIsActive,
    accessStatus: nextStatus,
    canAccessHub: nextCanAccessHub,
    canAccessConference: nextCanAccessConference,
    canAccessAdmin: nextCanAccessAdmin,
    ...(name !== undefined ? { name: nextName } : {}),
    ...(accessNote !== undefined ? { accessNote: nextAccessNote } : {}),
    ...(roleChanged ? { roleChangedAt: new Date() } : {}),
  };

  if (nextStatus === "APPROVED" && target.accessStatus !== "APPROVED") {
    updateData.approvedAt = new Date();
    updateData.approvedBy = admin.id;
  }

  if (nextStatus !== "APPROVED") {
    updateData.approvedAt = null;
    updateData.approvedBy = null;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accessStatus: true,
      isActive: true,
      canAccessHub: true,
      canAccessConference: true,
      canAccessAdmin: true,
      approvedBy: true,
      approvedAt: true,
      accessNote: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  // Fire-and-forget email notification when role changes
  if (roleChanged) {
    sendRoleChangeEmail(target.email, target.name, target.role, role!).catch(
      (err) => console.error("[role-change-email]", err),
    );
  }

  await writeAdminAuditEntries(auditEntries).catch((err) =>
    console.error("[admin-audit:update-user]", err),
  );

  return NextResponse.json({ user: updated });
}

/**
 * DELETE /api/admin/users/[id] — delete user (SUPER_ADMIN only)
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (admin.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admins can delete users" },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (id === admin.id) {
    return NextResponse.json(
      { error: "Cannot delete your own account" },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  await prisma.user.delete({ where: { id } });

  await writeAdminAuditEntries([
    {
      actorUserId: admin.id,
      actorEmail: admin.email,
      targetUserId: target.id,
      targetEmail: target.email,
      targetName: target.name,
      action: "USER_DELETED",
      note: `Deleted account with role=${target.role}, accessStatus=${target.accessStatus}`,
    },
  ]).catch((err) => console.error("[admin-audit:delete-user]", err));

  return NextResponse.json({ message: "User deleted" });
}
