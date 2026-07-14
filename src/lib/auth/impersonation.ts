/** Users who may start an impersonation session. */
export function canImpersonate(user: {
  role: string;
  canImpersonate?: boolean | null;
}): boolean {
  return user.role === "SUPER_ADMIN" || Boolean(user.canImpersonate);
}

/** Super Admin accounts cannot be impersonated. */
export function isImpersonationTargetAllowed(user: {
  role: string;
  id: string;
  actorId: string;
}): boolean {
  if (user.id === user.actorId) return false;
  return user.role !== "SUPER_ADMIN";
}
