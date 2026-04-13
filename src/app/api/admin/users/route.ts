import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession, hashPwd } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAdminAuditEntries } from "@/lib/admin/audit";
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

const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "JUDGE_ADMIN",
    "HEAD_JUDGE",
    "JUDGE",
    "USER",
  ]),
});

/**
 * GET /api/admin/users — list all users
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "";
  const accessStatus = searchParams.get("accessStatus") || "";
  const take = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const skip = parseInt(searchParams.get("offset") || "0");

  const where = {
    ...(search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }],
        }
      : {}),
    ...(role ? { role: role as never } : {}),
    ...(accessStatus ? { accessStatus: accessStatus as never } : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
        googleId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ users, total });
}

/**
 * POST /api/admin/users — create a new user (admin creates directly, bypasses email verify)
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only SUPER_ADMIN can create SUPER_ADMIN or ADMIN
  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid data" },
      { status: 400 },
    );
  }
  const { name, email, password, role } = parsed.data;

  // Role elevation guard
  if (
    (role === "SUPER_ADMIN" || role === "ADMIN") &&
    admin.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.json(
      { error: "Only Super Admins can create Admin or Super Admin accounts" },
      { status: 403 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 409 },
    );
  }

  const hashed = await hashPwd(password);
  const isAdminRole = role === "SUPER_ADMIN" || role === "ADMIN";
  const canAccessDebateRole = [
    "SUPER_ADMIN",
    "ADMIN",
    "JUDGE_ADMIN",
    "HEAD_JUDGE",
    "JUDGE",
  ].includes(role);

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role,
      accessStatus: "APPROVED",
      isActive: true,
      canAccessHub: true,
      canAccessConference: isAdminRole ? true : null,
      canAccessAdmin: isAdminRole ? true : null,
      accessNote: canAccessDebateRole ? "Admin-created account" : null,
      approvedAt: new Date(),
      approvedBy: admin.id,
      emailVerified: true, // admin-created users are verified
    },
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

  await writeAdminAuditEntries([
    {
      actorUserId: admin.id,
      actorEmail: admin.email,
      targetUserId: user.id,
      targetEmail: user.email,
      targetName: user.name,
      action: "USER_CREATED",
      note: `Created with role=${user.role}, accessStatus=${user.accessStatus}`,
    },
  ]).catch((err) => console.error("[admin-audit:create-user]", err));

  return NextResponse.json({ user }, { status: 201 });
}
