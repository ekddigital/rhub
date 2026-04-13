import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

/**
 * GET /api/admin/audit — list user access/approval audit entries
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim() || "";
  const action = searchParams.get("action") || "";
  const targetUserId = searchParams.get("targetUserId") || "";
  const take = Math.min(parseInt(searchParams.get("limit") || "100"), 200);
  const skip = parseInt(searchParams.get("offset") || "0");

  const where = {
    ...(targetUserId ? { targetUserId } : {}),
    ...(action ? { action } : {}),
    ...(search
      ? {
          OR: [
            { targetEmail: { contains: search } },
            { targetName: { contains: search } },
            { actorEmail: { contains: search } },
            { action: { contains: search } },
            { field: { contains: search } },
            { note: { contains: search } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    prisma.userAccessAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.userAccessAuditLog.count({ where }),
  ]);

  return NextResponse.json({ entries, total });
}
