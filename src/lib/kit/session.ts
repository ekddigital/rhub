import { cookies } from "next/headers";
import { validateSessionFull } from "@/lib/auth";

/** Authenticated hub user for `/api/v1/kit/*` routes (cookie session). */
export async function getKitSession() {
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) return null;
  return validateSessionFull(token);
}
