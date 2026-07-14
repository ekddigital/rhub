import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateSessionWithContext } from "@/lib/auth";
import { canImpersonate } from "@/lib/auth/impersonation";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/impersonation-logs — list impersonation audit entries
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await validateSessionWithContext(token);
  if (!ctx || ctx.isImpersonating || !canImpersonate(ctx.realUser)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("q")?.trim() || "";
  const take = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const skip = parseInt(searchParams.get("offset") || "0");

  const where = search
    ? {
        OR: [
          { targetEmail: { contains: search } },
          { targetName: { contains: search } },
          { actorName: { contains: search } },
          { note: { contains: search } },
        ],
      }
    : {};

  const [entries, total] = await Promise.all([
    prisma.impersonationLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take,
      skip,
    }),
    prisma.impersonationLog.count({ where }),
  ]);

  return NextResponse.json({ entries, total });
}
