import "server-only";

import { nanoid } from "nanoid";
import type { VideoSession } from "./types";

const DEFAULT_TTL_MS = 45 * 60 * 1000; // 45 minutes

function ttlMs(): number {
  const raw = process.env.VID_SESSION_TTL_MS?.trim();
  if (!raw) return DEFAULT_TTL_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TTL_MS;
}

type CacheStore = Map<string, VideoSession>;

const globalForCache = globalThis as typeof globalThis & {
  __rhubVideoSessionCache?: CacheStore;
};

function getStore(): CacheStore {
  if (!globalForCache.__rhubVideoSessionCache) {
    globalForCache.__rhubVideoSessionCache = new Map();
  }
  return globalForCache.__rhubVideoSessionCache;
}

function purgeExpired(store: CacheStore): void {
  const now = Date.now();
  for (const [key, session] of store) {
    if (session.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export function createSessionId(): string {
  return nanoid(12);
}

export function putVideoSession(
  session: Omit<VideoSession, "id" | "createdAt" | "expiresAt"> & {
    id?: string;
  },
): VideoSession {
  const store = getStore();
  purgeExpired(store);

  const now = Date.now();
  const entry: VideoSession = {
    ...session,
    id: session.id ?? createSessionId(),
    createdAt: now,
    expiresAt: now + ttlMs(),
  };

  store.set(entry.id, entry);
  return entry;
}

export function getVideoSession(id: string): VideoSession | null {
  const store = getStore();
  purgeExpired(store);

  const session = store.get(id);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    store.delete(id);
    return null;
  }
  return session;
}

export function deleteVideoSession(id: string): void {
  getStore().delete(id);
}

export function toSessionResponse(session: VideoSession) {
  const { createdAt: _createdAt, ...rest } = session;
  return rest;
}
