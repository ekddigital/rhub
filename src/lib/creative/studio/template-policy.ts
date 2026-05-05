import type { User, UserRole } from "@prisma/client";
import type { CreativeTemplate } from "@prisma/client";

export function isKitAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function assertTenantWritable(user: User, tenantKey: string): void {
  if (tenantKey === "system") {
    if (!isKitAdmin(user.role)) {
      throw new StudioPermissionError("Only admins can modify system templates.");
    }
    return;
  }
  if (tenantKey.startsWith("user:")) {
    if (isKitAdmin(user.role) || tenantKey === `user:${user.id}`) {
      return;
    }
    throw new StudioPermissionError("You cannot modify another user's template namespace.");
  }
  if (tenantKey.startsWith("org:")) {
    if (!isKitAdmin(user.role)) {
      throw new StudioPermissionError(
        "Organization templates require admin until org membership is wired.",
      );
    }
    return;
  }
  throw new StudioPermissionError("Invalid tenantKey.");
}

export function canReadTemplate(user: User | null, row: CreativeTemplate): boolean {
  if (!user) {
    return row.tenantKey === "system" && row.status === "PUBLISHED";
  }
  if (isKitAdmin(user.role)) return true;
  if (row.tenantKey === "system" && row.status === "PUBLISHED") return true;
  if (row.tenantKey === `user:${user.id}`) return true;
  if (row.createdByUserId === user.id) return true;
  return false;
}

export class StudioPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudioPermissionError";
  }
}

export class StudioConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StudioConflictError";
  }
}
