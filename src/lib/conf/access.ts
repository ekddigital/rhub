import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import {
  isAuthDatabaseUnavailableError,
  validateSessionFull,
} from "@/lib/auth";
import {
  ensureDefaultConference,
  isConferenceDatabaseUnavailableError,
} from "@/lib/conf/bootstrap";
import { prisma } from "@/lib/prisma";

type AccessScope = "participant" | "manager" | "chair" | "super-admin";

type SessionUser = NonNullable<
  NonNullable<Awaited<ReturnType<typeof validateSessionFull>>>["user"]
>;

export type ConferenceAccess = {
  user: SessionUser | null;
  confId: string;
  isParticipant: boolean;
  isManager: boolean;
  isChair: boolean;
  isSuperAdmin: boolean;
  delegateId: string | null;
  memberId: string | null;
  memberRole: string | null;
  committeeScope: string | null;
  canApprovePayments: boolean;
  canAssignCommittee: boolean;
};

const PLATFORM_MANAGER_ROLES = new Set([
  "SUPER_ADMIN",
  "ADMIN",
  "JUDGE_ADMIN",
  "HEAD_JUDGE",
]);

async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const session = await validateSessionFull(token);
  if (!session || !session.user.isActive) return null;

  return session.user;
}

export async function getConferenceAccess(
  confId: string,
): Promise<ConferenceAccess> {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      confId,
      isParticipant: false,
      isManager: false,
      isChair: false,
      isSuperAdmin: false,
      delegateId: null,
      memberId: null,
      memberRole: null,
      committeeScope: null,
      canApprovePayments: false,
      canAssignCommittee: false,
    };
  }

  const [member, delegate] = await Promise.all([
    prisma.confMember.findFirst({
      where: {
        confId,
        isActive: true,
        OR: [{ userId: user.id }, { email: user.email }],
      },
      select: {
        id: true,
        role: true,
        committeeScope: true,
        canApprovePayments: true,
        canAssignCommittee: true,
      },
    }),
    prisma.confDelegate.findFirst({
      where: {
        confId,
        status: { not: "CANCELLED" },
        OR: [{ userId: user.id }, { email: user.email }],
      },
      select: {
        id: true,
      },
    }),
  ]);

  const isPlatformManager = PLATFORM_MANAGER_ROLES.has(user.role);
  const isConferenceManager = Boolean(member && member.role !== "DELEGATE");
  const isManager = isPlatformManager || isConferenceManager;
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isConferenceChair = Boolean(member?.role === "CHAIR");
  const isChair =
    isSuperAdmin ||
    Boolean(member && (member.role === "CHAIR" || member.role === "VICE_CHAIR"));
  const isParticipant = isManager || Boolean(member) || Boolean(delegate);

  return {
    user,
    confId,
    isParticipant,
    isManager,
    isChair,
    isSuperAdmin,
    delegateId: delegate?.id ?? null,
    memberId: member?.id ?? null,
    memberRole: member?.role ?? null,
    committeeScope: member?.committeeScope ?? null,
    canApprovePayments:
      isSuperAdmin || Boolean(member?.canApprovePayments),
    canAssignCommittee:
      isSuperAdmin || isConferenceChair || Boolean(member?.canAssignCommittee),
  };
}

export async function requireConferenceApiAccess(
  confId: string,
  scope: AccessScope = "participant",
) {
  let access;
  try {
    access = await getConferenceAccess(confId);
  } catch (error) {
    if (isAuthDatabaseUnavailableError(error)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: error.message }, { status: 503 }),
      };
    }
    throw error;
  }

  if (!access.user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }

  if (scope === "manager" && !access.isManager) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Manager access required" },
        { status: 403 },
      ),
    };
  }

  if (scope === "chair" && !access.isChair) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Chair access required" },
        { status: 403 },
      ),
    };
  }

  if (scope === "super-admin" && !access.isSuperAdmin) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Super Admin access required" },
        { status: 403 },
      ),
    };
  }

  if (scope === "participant" && !access.isParticipant) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Conference participant access required" },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true as const,
    access,
  };
}

export async function requireDefaultConferenceApiAccess(
  scope: AccessScope = "participant",
) {
  let event;
  try {
    event = await ensureDefaultConference();
  } catch (error) {
    if (isConferenceDatabaseUnavailableError(error)) {
      return {
        ok: false as const,
        response: NextResponse.json({ error: error.message }, { status: 503 }),
      };
    }

    throw error;
  }

  return requireConferenceApiAccess(event.id, scope);
}

export async function requireConferencePageAccess(
  routePath: string,
  scope: AccessScope = "participant",
) {
  let event;
  try {
    event = await ensureDefaultConference();
  } catch (error) {
    if (isConferenceDatabaseUnavailableError(error)) {
      redirect(
        `/tools/conf/unavailable?redirect=${encodeURIComponent(routePath)}`,
      );
    }

    throw error;
  }

  let access;
  try {
    access = await getConferenceAccess(event.id);
  } catch (error) {
    if (isAuthDatabaseUnavailableError(error)) {
      redirect(
        `/tools/conf/unavailable?redirect=${encodeURIComponent(routePath)}`,
      );
    }
    throw error;
  }

  if (!access.user) {
    redirect(`/login?redirect=${encodeURIComponent(routePath)}`);
  }

  if (scope === "manager" && !access.isManager) {
    redirect("/tools/conf?forbidden=1");
  }

  if (scope === "participant" && !access.isParticipant) {
    redirect("/tools/conf/delegates/register?restricted=1");
  }

  return access;
}
