import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";
import { normalizeRoleKey } from "@/lib/conf/role-defaults";

// GET /api/conf/[confId]/roles
// Returns role templates available for committee assignment and letter office presets.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "participant");
    if (!auth.ok) return auth.response;

    const includeInactive =
      new URL(req.url).searchParams.get("includeInactive") === "1";

    const roles = await prisma.confCommitteeRole.findMany({
      where: {
        confId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Failed to fetch conference roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch conference roles" },
      { status: 500 },
    );
  }
}

// POST /api/conf/[confId]/roles
// Creates a new role template for assignment dropdowns.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ confId: string }> },
) {
  try {
    const { confId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const canManageRoles =
      auth.access.isSuperAdmin || auth.access.memberRole === "CHAIR";
    if (!canManageRoles) {
      return NextResponse.json(
        {
          error:
            "Only Super Admin or Conference Chair can create committee role templates",
        },
        { status: 403 },
      );
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

    if (!body.label || !body.label.trim()) {
      return NextResponse.json({ error: "Role label is required" }, { status: 400 });
    }

    const key = normalizeRoleKey(body.key || body.label);
    if (!key) {
      return NextResponse.json(
        { error: "Role key could not be generated from label" },
        { status: 400 },
      );
    }

    const allowedBaseRoles = new Set([
      "CHAIR",
      "VICE_CHAIR",
      "SECRETARY",
      "TREASURER",
      "COMMITTEE",
      "DELEGATE",
    ]);

    const baseRole = (body.baseRole || "COMMITTEE").toUpperCase();
    if (!allowedBaseRoles.has(baseRole)) {
      return NextResponse.json({ error: "Invalid base role" }, { status: 400 });
    }

    const role = await prisma.confCommitteeRole.create({
      data: {
        confId,
        key,
        label: body.label.trim(),
        baseRole: baseRole as
          | "CHAIR"
          | "VICE_CHAIR"
          | "SECRETARY"
          | "TREASURER"
          | "COMMITTEE"
          | "DELEGATE",
        title: body.title?.trim() || null,
        committeeScope: body.committeeScope?.trim() || null,
        officeLabel: body.officeLabel?.trim() || null,
        sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 100,
        isSystem: false,
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(role, { status: 201 });
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

    console.error("Failed to create conference role:", error);
    return NextResponse.json(
      { error: "Failed to create conference role" },
      { status: 500 },
    );
  }
}
