export type ConfAccessFlags = {
  isParticipant: boolean;
  isManager: boolean;
  isSuperAdmin: boolean;
  isHotelCheckin?: boolean;
  isHotelCheckinOnly?: boolean;
};

const PLATFORM_MANAGER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "JUDGE_ADMIN",
  "HEAD_JUDGE",
] as const;

/** Normalize role strings from DB enums, display labels, or legacy formats. */
export function normalizePlatformRole(role: string): string {
  const compact = role.trim().toUpperCase().replace(/[\s-]+/g, "_");
  if (compact === "SUPERADMIN") return "SUPER_ADMIN";
  return compact;
}

export function getManagerFlagsFromRole(
  role: string,
): Pick<ConfAccessFlags, "isManager" | "isSuperAdmin"> {
  const normalized = normalizePlatformRole(role);
  const isSuperAdmin = normalized === "SUPER_ADMIN";
  const isManager =
    isSuperAdmin ||
    (PLATFORM_MANAGER_ROLES as readonly string[]).includes(normalized);

  return { isManager, isSuperAdmin };
}

export function getAccessFlagsFromRole(
  role: string | null | undefined,
): ConfAccessFlags {
  if (!role) {
    return { isParticipant: false, isManager: false, isSuperAdmin: false };
  }

  return mergeConfAccessFlags(
    { isParticipant: false, isManager: false, isSuperAdmin: false },
    getManagerFlagsFromRole(role),
  );
}

/** Superadmin always inherits manager visibility for conference navigation. */
export function mergeConfAccessFlags(
  confFlags: Partial<ConfAccessFlags>,
  roleFlags: Partial<ConfAccessFlags>,
): ConfAccessFlags {
  const isSuperAdmin = Boolean(
    confFlags.isSuperAdmin || roleFlags.isSuperAdmin,
  );
  const isManager = Boolean(
    confFlags.isManager || roleFlags.isManager || isSuperAdmin,
  );
  const isParticipant = Boolean(
    confFlags.isParticipant || isManager || isSuperAdmin,
  );
  const isHotelCheckin = Boolean(
    confFlags.isHotelCheckin || roleFlags.isHotelCheckin,
  );
  const isHotelCheckinOnly = Boolean(
    confFlags.isHotelCheckinOnly || roleFlags.isHotelCheckinOnly,
  );

  return {
    isParticipant,
    isManager,
    isSuperAdmin,
    isHotelCheckin,
    isHotelCheckinOnly,
  };
}

export function canViewConfNavItem(
  minAccess: "public" | "delegate" | "manager" | "logistics-viewer" | undefined,
  access: ConfAccessFlags,
  options?: { superAdminOnly?: boolean },
): boolean {
  if (options?.superAdminOnly) {
    return access.isSuperAdmin;
  }

  if (access.isSuperAdmin) {
    return true;
  }

  const requirement = minAccess ?? "manager";
  if (requirement === "public") return true;
  if (requirement === "delegate") {
    return access.isParticipant || access.isManager || access.isSuperAdmin;
  }
  if (requirement === "logistics-viewer") {
    return (
      access.isManager ||
      access.isSuperAdmin ||
      Boolean(access.isHotelCheckin)
    );
  }

  return access.isManager || access.isSuperAdmin;
}

function extractRoleFromAuthPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const record = payload as Record<string, unknown>;
  if (typeof record.role === "string") return record.role;

  const user = record.user;
  if (user && typeof user === "object") {
    const userRole = (user as Record<string, unknown>).role;
    if (typeof userRole === "string") return userRole;
  }

  return "";
}

export async function resolveConferenceAccessFlags(options?: {
  knownRole?: string | null;
}): Promise<ConfAccessFlags> {
  const [confRes, authRes] = await Promise.all([
    fetch("/api/conf/default/access", {
      cache: "no-store",
      credentials: "include",
    }),
    fetch(`/api/auth/me?_t=${Date.now()}`, {
      cache: "no-store",
      credentials: "include",
      headers: { "Cache-Control": "no-cache" },
    }),
  ]);

  let confFlags: ConfAccessFlags = {
    isParticipant: false,
    isManager: false,
    isSuperAdmin: false,
    isHotelCheckin: false,
    isHotelCheckinOnly: false,
  };

  if (confRes.ok) {
    const payload = (await confRes.json()) as Partial<ConfAccessFlags>;
    confFlags = {
      isParticipant: Boolean(payload.isParticipant),
      isManager: Boolean(payload.isManager),
      isSuperAdmin: Boolean(payload.isSuperAdmin),
      isHotelCheckin: Boolean(payload.isHotelCheckin),
      isHotelCheckinOnly: Boolean(payload.isHotelCheckinOnly),
    };
  }

  let roleFlags: Pick<ConfAccessFlags, "isManager" | "isSuperAdmin"> = {
    isManager: false,
    isSuperAdmin: false,
  };

  if (options?.knownRole) {
    roleFlags = getManagerFlagsFromRole(options.knownRole);
  }

  if (authRes.ok) {
    const authPayload = await authRes.json();
    const fetchedRole = extractRoleFromAuthPayload(authPayload);
    if (fetchedRole) {
      roleFlags = getManagerFlagsFromRole(fetchedRole);
    }
  }

  return mergeConfAccessFlags(confFlags, roleFlags);
}
