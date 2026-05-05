/** Tenant keys for `CreativeTemplate` rows — see docs/CREATIVE_STUDIO_ARCHITECTURE.md */

export const SYSTEM_TENANT_KEY = "system";

export function userTenantKey(userId: string): string {
  return `user:${userId}`;
}

export function orgTenantKey(slug: string): string {
  return `org:${slug}`;
}
