import type { NextRequest } from "next/server";

/**
 * Admin API auth used by install/setup routes.
 * Without ADMIN_API_KEY, only localhost/127.0.0.1 may call protected endpoints.
 */
export function isAdminApiAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    const host = request.headers.get("host") || "";
    return host.includes("localhost") || host.includes("127.0.0.1");
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;

  const token = authHeader.replace("Bearer ", "").trim();
  return token === adminKey;
}
