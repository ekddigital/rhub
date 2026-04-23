import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { normalizeRoleKey } from "@/lib/conf/role-defaults";

const ALLOWED_BASE_ROLES = new Set([
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "TREASURER",
  "COMMITTEE",
  "DELEGATE",
]);

function canManageRoles(access: {
  isSuperAdmin: boolean;
  memberRole: string | null;
}) {
  return access.isSuperAdmin || access.memberRole === "CHAIR";
}

// PATCH /api/conf/[confId]/roles/[roleId]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ confId: string; roleId: string }> },
) {
  try {
    const { confId, roleId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    if (!canManageRoles(auth.access)) {
      return NextResponse.json(
        {
          error:
            "Only Super Admin or Conference Chair can update committee role templates",
        },
        { status: 403 },
      );
    }

    const existing = await prisma.confCommitteeRole.findFirst({
      where: { id: roleId, confId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Role template not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      key?: string;
      label?: string;
      baseRole?:
        | "CHAIR"
        | "VICE_CHAIR"
        | "SECRETARY"
        | "TREASURER"
        | "COMMITTEE"
        | "DELEGATE";
      title?: string | null;
      committeeScope?: string | null;
      officeLabel?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    };

    const updateData: Prisma.ConfCommitteeRoleUpdateInput = {};

    if (body.label !== undefined) {
      if (!body.label.trim()) {
        return NextResponse.json({ error: "Role label is required" }, { status: 400 });
      }
      updateData.label = body.label.trim();
    }

    if (body.key !== undefined) {
      if (existing.isSystem && !auth.access.isSuperAdmin) {
        return NextResponse.json(
          { error: "System role keys can only be changed by Super Admin" },
          { status: 403 },
        );
      }
      const normalized = normalizeRoleKey(body.key);
      if (!normalized) {
        return NextResponse.json({ error: "Invalid role key" }, { status: 400 });
      }
      updateData.key = normalized;
    }

    if (body.baseRole !== undefined) {
      if (existing.isSystem && !auth.access.isSuperAdmin) {
        return NextResponse.json(
          { error: "System role base type can only be changed by Super Admin" },
          { status: 403 },
        );
      }
      const normalizedBase = body.baseRole.toUpperCase();
      if (!ALLOWED_BASE_ROLES.has(normalizedBase)) {
        return NextResponse.json({ error: "Invalid base role" }, { status: 400 });
      }
      updateData.baseRole = normalizedBase as
        | "CHAIR"
        | "VICE_CHAIR"
        | "SECRETARY"
        | "TREASURER"
        | "COMMITTEE"
        | "DELEGATE";
    }

    if (body.title !== undefined) updateData.title = body.title?.trim() || null;
    if (body.committeeScope !== undefined)
      updateData.committeeScope = body.committeeScope?.trim() || null;
    if (body.officeLabel !== undefined)
      updateData.officeLabel = body.officeLabel?.trim() || null;
    if (typeof body.sortOrder === "number") updateData.sortOrder = body.sortOrder;
    if (typeof body.isActive === "boolean") updateData.isActive = body.isActive;

    const updated = await prisma.confCommitteeRole.update({
      where: { id: roleId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A role with this key already exists" },
        { status: 409 },
      );
    }

    console.error("Failed to update conference role:", error);
    return NextResponse.json(
      { error: "Failed to update conference role" },
      { status: 500 },
    );
  }
}

// DELETE /api/conf/[confId]/roles/[roleId]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ confId: string; roleId: string }> },
) {
  try {
    const { confId, roleId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    if (!canManageRoles(auth.access)) {
      return NextResponse.json(
        {
          error:
            "Only Super Admin or Conference Chair can delete committee role templates",
        },
        { status: 403 },
      );
    }

    const existing = await prisma.confCommitteeRole.findFirst({
      where: { id: roleId, confId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Role template not found" }, { status: 404 });
    }

    if (existing.isSystem) {
      const updated = await prisma.confCommitteeRole.update({
        where: { id: roleId },
        data: { isActive: false },
      });
      return NextResponse.json({
        success: true,
        softDeleted: true,
        role: updated,
      });
    }

    await prisma.confCommitteeRole.delete({ where: { id: roleId } });

    return NextResponse.json({ success: true, softDeleted: false });
  } catch (error) {
    console.error("Failed to delete conference role:", error);
    return NextResponse.json(
      { error: "Failed to delete conference role" },
      { status: 500 },
    );
  }
}
