import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

const TRANSIENT_AUTH_DB_ERROR_CODES = new Set(["P1001", "P1002", "P2024"]);
const AUTH_DB_COOLDOWN_MS = 30_000;
let authDbUnavailableUntil = 0;

export class AuthDatabaseUnavailableError extends Error {
  declare cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "AuthDatabaseUnavailableError";
    this.cause = cause;
  }
}

export function isAuthDatabaseUnavailableError(
  error: unknown,
): error is AuthDatabaseUnavailableError {
  return error instanceof AuthDatabaseUnavailableError;
}

function isTransientAuthDatabaseError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_AUTH_DB_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("can't reach database server") ||
      message.includes("timed out fetching a new connection")
    );
  }

  return false;
}

async function findSessionWithUser(token: string) {
  if (Date.now() < authDbUnavailableUntil) {
    throw new AuthDatabaseUnavailableError(
      "Auth database is temporarily unavailable. Please retry shortly.",
    );
  }

  try {
    return await prisma.session.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  } catch (error) {
    if (isTransientAuthDatabaseError(error)) {
      authDbUnavailableUntil = Date.now() + AUTH_DB_COOLDOWN_MS;
      throw new AuthDatabaseUnavailableError(
        "Auth database is temporarily unavailable. Please retry shortly.",
        error,
      );
    }

    throw error;
  }
}

function hasApprovedHubAccess(user: {
  isActive: boolean;
  emailVerified: boolean;
  accessStatus: string;
  canAccessHub: boolean;
}): boolean {
  return (
    user.isActive &&
    user.emailVerified &&
    user.accessStatus === "APPROVED" &&
    user.canAccessHub
  );
}

export async function hashPwd(pwd: string): Promise<string> {
  return bcrypt.hash(pwd, 10);
}

export async function verifyPwd(
  pwd: string,
  hash: string | null,
): Promise<boolean> {
  if (!hash) return false; // OAuth-only user has no password
  return bcrypt.compare(pwd, hash);
}

export function genToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<string> {
  const token = genToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function validateSession(token: string) {
  let session;
  try {
    session = await findSessionWithUser(token);
  } catch (error) {
    if (isAuthDatabaseUnavailableError(error)) {
      return null;
    }

    throw error;
  }

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  if (!hasApprovedHubAccess(session.user)) {
    return null;
  }

  // If the admin is impersonating someone, return the target user instead.
  if (session.impersonatingUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: session.impersonatingUserId },
    });
    if (targetUser && hasApprovedHubAccess(targetUser)) {
      return targetUser;
    }
  }

  return session.user;
}

/**
 * Like validateSession but also returns impersonation metadata.
 * Use this in API routes/pages that need to know who the real actor is.
 */
export async function validateSessionWithContext(token: string) {
  let session;
  try {
    session = await findSessionWithUser(token);
  } catch (error) {
    if (isAuthDatabaseUnavailableError(error)) {
      return null;
    }
    throw error;
  }

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  if (!hasApprovedHubAccess(session.user)) {
    return null;
  }

  const realUser = session.user;
  let effectiveUser = session.user;

  if (session.impersonatingUserId) {
    const targetUser = await prisma.user.findUnique({
      where: { id: session.impersonatingUserId },
    });
    if (targetUser && hasApprovedHubAccess(targetUser)) {
      effectiveUser = targetUser;
    }
  }

  return {
    effectiveUser,
    realUser,
    isImpersonating: effectiveUser.id !== realUser.id,
  };
}

/** Same as validateSession but also returns the session's createdAt timestamp,
 *  used by /api/auth/me to detect role changes that occurred after login. */
export async function validateSessionFull(token: string) {
  const session = await findSessionWithUser(token);

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  if (!hasApprovedHubAccess(session.user)) {
    return null;
  }

  return { user: session.user, sessionCreatedAt: session.createdAt };
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session
    .delete({
      where: { token },
    })
    .catch(() => null);
}
