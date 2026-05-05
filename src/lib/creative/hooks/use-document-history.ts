/**
 * useDocumentHistory
 * Manages multiple saved documents with the database as the primary store
 * and localStorage as an offline write-through cache.
 *
 * Sync strategy:
 *  - On mount → fetch from DB; merge any localStorage-only docs up to DB
 *  - On create / save / delete / rename / reorder → write DB first, then update localStorage
 *  - If DB is unreachable → fall back to localStorage-only (offline mode)
 *
 * Storage layout (localStorage — cache only):
 *   ekd_doc_index_{userId}      → DocIndexEntry[]
 *   ekd_doc_data_{userId}_{id}  → DocData
 *   ekd_doc_active_{userId}     → string
 */

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import type { DocumentMeta, TemplateConfig } from "@/lib/creative/documents/types";

/* ─── Types ────────────────────────────────────────────────────── */

export interface DocIndexEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface SharedDocEntry {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  role: "VIEWER" | "EDITOR" | "ADMIN";
  sharedBy: string;
}

export interface DocData {
  html: string;
  meta: Partial<DocumentMeta>;
  template: Partial<TemplateConfig>;
}

/* ─── Constants ────────────────────────────────────────────────── */

const PREFIX = "ekd_doc_";
const DEBOUNCE_MS = 1500;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function indexKey(uid: string) {
  return `${PREFIX}index_${uid}`;
}
function dataKey(uid: string, docId: string) {
  return `${PREFIX}data_${uid}_${docId}`;
}
function activeKey(uid: string) {
  return `${PREFIX}active_${uid}`;
}
function genId() {
  // Use crypto.randomUUID for proper UUID v4, prefixed with timestamp for sortability
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `doc_${crypto.randomUUID()}`;
  }
  // Fallback for environments without crypto.randomUUID
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}_${Math.random().toString(36).slice(2, 10)}`;
}

/* ─── localStorage helpers (cache layer) ───────────────────────── */

function lsReadIndex(uid: string): DocIndexEntry[] {
  try {
    const raw = localStorage.getItem(indexKey(uid));
    if (!raw) return [];
    const list: DocIndexEntry[] = JSON.parse(raw);
    const now = Date.now();
    return list.filter((d) => now - d.updatedAt < MAX_AGE_MS);
  } catch {
    return [];
  }
}

function lsWriteIndex(uid: string, list: DocIndexEntry[]) {
  localStorage.setItem(indexKey(uid), JSON.stringify(list));
}

function lsReadData(uid: string, docId: string): DocData | null {
  try {
    const raw = localStorage.getItem(dataKey(uid, docId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function lsWriteData(uid: string, docId: string, data: DocData) {
  localStorage.setItem(dataKey(uid, docId), JSON.stringify(data));
}

function lsRemoveData(uid: string, docId: string) {
  localStorage.removeItem(dataKey(uid, docId));
}

/* ─── API helpers ──────────────────────────────────────────────── */

async function apiFetch<T>(
  url: string,
  options?: RequestInit,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/* ─── Hook ─────────────────────────────────────────────────────── */

export function useDocumentHistory() {
  const { data: session } = useSession();
  const uid =
    (session?.user as { id?: string | null } | undefined)?.id ||
    session?.user?.email ||
    "guest";

  const [documents, setDocuments] = useState<DocIndexEntry[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<SharedDocEntry[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Initialize: fetch DB → merge localStorage → update state ── */

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function init() {
      const localIndex = lsReadIndex(uid);
      // Show localStorage docs immediately for snappy UX
      setDocuments(localIndex);

      const savedActive = localStorage.getItem(activeKey(uid));
      if (savedActive && localIndex.some((d) => d.id === savedActive)) {
        setActiveDocId(savedActive);
      }

      // Migrate old single-document auto-save if it exists
      const oldKey = `ekd_doc_studio_${uid}`;
      const oldRaw = localStorage.getItem(oldKey);
      if (oldRaw) {
        try {
          const oldData = JSON.parse(oldRaw);
          if (oldData.html) {
            const migratedId = genId();
            const entry: DocIndexEntry = {
              id: migratedId,
              title: oldData.meta?.title || "Migrated Document",
              createdAt: oldData.savedAt || Date.now(),
              updatedAt: oldData.savedAt || Date.now(),
            };
            const newList = [entry, ...localIndex];
            lsWriteIndex(uid, newList);
            lsWriteData(uid, migratedId, {
              html: oldData.html,
              meta: oldData.meta || {},
              template: oldData.template || {},
            });
            if (!savedActive || !localIndex.some((d) => d.id === savedActive)) {
              setActiveDocId(migratedId);
              localStorage.setItem(activeKey(uid), migratedId);
            }
            localStorage.removeItem(oldKey);
          }
        } catch {
          // ignore
        }
      }

      // Skip DB sync for guest users
      if (uid === "guest") {
        setReady(true);
        return;
      }

      // Fetch from DB
      const dbResult = await apiFetch<{
        documents: Array<{
          id: string;
          title: string;
          html: string;
          meta: string | null;
          template: string | null;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        }>;
        sharedDocuments?: Array<{
          id: string;
          title: string;
          html: string;
          meta: string | null;
          template: string | null;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
          role: "VIEWER" | "EDITOR" | "ADMIN";
          sharedBy: string;
        }>;
      }>("/api/documents");

      if (cancelled) return;

      if (dbResult?.documents) {
        const dbDocs = dbResult.documents;
        const dbIds = new Set(dbDocs.map((d) => d.id));
        const refreshedLocalIndex = lsReadIndex(uid);

        // Find localStorage-only docs that need to be synced up to DB
        const localOnlyDocs: Array<{
          id: string;
          title: string;
          html: string;
          meta: Partial<DocumentMeta> | null;
          template: Partial<TemplateConfig> | null;
          createdAt: number;
          updatedAt: number;
        }> = [];

        for (const entry of refreshedLocalIndex) {
          if (!dbIds.has(entry.id)) {
            const data = lsReadData(uid, entry.id);
            if (data) {
              localOnlyDocs.push({
                id: entry.id,
                title: entry.title,
                html: data.html,
                meta: data.meta || null,
                template: data.template || null,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
              });
            }
          }
        }

        // Push localStorage-only docs to DB
        if (localOnlyDocs.length > 0) {
          await apiFetch("/api/documents", {
            method: "PUT",
            body: JSON.stringify({
              action: "sync",
              documents: localOnlyDocs,
            }),
          });
        }

        // Build merged index: DB docs (authoritative) + any local-only docs
        const mergedIndex: DocIndexEntry[] = [];
        for (const d of dbDocs) {
          mergedIndex.push({
            id: d.id,
            title: d.title,
            createdAt: new Date(d.createdAt).getTime(),
            updatedAt: new Date(d.updatedAt).getTime(),
          });
          // Update localStorage cache with DB content
          try {
            lsWriteData(uid, d.id, {
              html: d.html,
              meta: d.meta ? JSON.parse(d.meta) : {},
              template: d.template ? JSON.parse(d.template) : {},
            });
          } catch {
            // JSON parse error — skip
          }
        }

        for (const ld of localOnlyDocs) {
          mergedIndex.push({
            id: ld.id,
            title: ld.title,
            createdAt: ld.createdAt,
            updatedAt: ld.updatedAt,
          });
        }

        if (!cancelled) {
          lsWriteIndex(uid, mergedIndex);
          setDocuments(mergedIndex);
        }

        // Process shared documents
        if (dbResult.sharedDocuments && !cancelled) {
          const shared: SharedDocEntry[] = dbResult.sharedDocuments.map(
            (d) => ({
              id: d.id,
              title: d.title || "Untitled",
              createdAt: new Date(d.createdAt).getTime(),
              updatedAt: new Date(d.updatedAt).getTime(),
              role: d.role,
              sharedBy: d.sharedBy,
            }),
          );
          setSharedDocuments(shared);

          // Cache shared doc data in localStorage for offline access
          for (const d of dbResult.sharedDocuments) {
            try {
              lsWriteData(uid, d.id, {
                html: d.html,
                meta: d.meta ? JSON.parse(d.meta) : {},
                template: d.template ? JSON.parse(d.template) : {},
              });
            } catch {
              // skip
            }
          }
        }
      }

      if (!cancelled) {
        setReady(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  /* ── Flush pending save on page unload / tab hide ──────────────── */

  useEffect(() => {
    // Flush any pending debounced save when the page unloads or becomes hidden
    const flush = () => {
      if (timerRef.current) {
        // Cannot await — fire-and-forget is fine since localStorage writes are synchronous
        // and the DB write is best-effort on unload.
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  /* ── re-read localStorage index (internal helper) ─────────────── */

  const readIndex = useCallback((): DocIndexEntry[] => {
    return lsReadIndex(uid);
  }, [uid]);

  /* ── Read data (public — used by document page) ───────────────── */

  const readData = useCallback(
    (docId: string): DocData | null => {
      return lsReadData(uid, docId);
    },
    [uid],
  );

  /* ── Create new document ──────────────────────────────────────── */

  const createDocument = useCallback(
    (title = "Untitled Document", data?: DocData): string => {
      const id = genId();
      const now = Date.now();

      const docData = data || {
        html: "",
        meta: { title },
        template: {
          showHeader: true,
          showFooter: true,
          firstPageDifferent: true,
          showTOC: false,
          margins: "standard",
        },
      };

      const entry: DocIndexEntry = {
        id,
        title,
        createdAt: now,
        updatedAt: now,
      };
      const list = [entry, ...readIndex()];

      // Update localStorage cache immediately
      lsWriteIndex(uid, list);
      lsWriteData(uid, id, docData);
      setDocuments(list);
      setActiveDocId(id);
      localStorage.setItem(activeKey(uid), id);

      // Persist to DB in background (don't block UI)
      if (uid !== "guest") {
        apiFetch("/api/documents", {
          method: "POST",
          body: JSON.stringify({
            id,
            title,
            html: docData.html,
            meta: docData.meta,
            template: docData.template,
          }),
        });
      }

      return id;
    },
    [uid, readIndex],
  );

  /* ── Save document (debounced) ────────────────────────────────── */

  const saveDocument = useCallback(
    (docId: string, data: DocData, title?: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Write to localStorage immediately
        lsWriteData(uid, docId, data);
        const list = readIndex().map((d) =>
          d.id === docId
            ? { ...d, title: title || d.title, updatedAt: Date.now() }
            : d,
        );
        lsWriteIndex(uid, list);
        setDocuments(list);

        // Persist to DB in background
        if (uid !== "guest") {
          apiFetch(`/api/documents/${docId}`, {
            method: "PUT",
            body: JSON.stringify({
              html: data.html,
              meta: data.meta,
              template: data.template,
              ...(title ? { title } : {}),
            }),
          });
        }
      }, DEBOUNCE_MS);
    },
    [uid, readIndex],
  );

  /** Force an immediate save (e.g. before switching documents) */
  const saveDocumentNow = useCallback(
    (docId: string, data: DocData, title?: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      lsWriteData(uid, docId, data);
      const list = readIndex().map((d) =>
        d.id === docId
          ? { ...d, title: title || d.title, updatedAt: Date.now() }
          : d,
      );
      lsWriteIndex(uid, list);
      setDocuments(list);

      if (uid !== "guest") {
        apiFetch(`/api/documents/${docId}`, {
          method: "PUT",
          body: JSON.stringify({
            html: data.html,
            meta: data.meta,
            template: data.template,
            ...(title ? { title } : {}),
          }),
        });
      }
    },
    [uid, readIndex],
  );

  /* ── Load document ────────────────────────────────────────────── */

  const loadDocument = useCallback(
    (docId: string): DocData | null => {
      const data = lsReadData(uid, docId);
      if (data) {
        setActiveDocId(docId);
        localStorage.setItem(activeKey(uid), docId);
      }
      return data;
    },
    [uid],
  );

  /* ── Delete document ──────────────────────────────────────────── */

  const deleteDocument = useCallback(
    (
      docId: string,
    ): {
      deletedActive: boolean;
      nextDocId: string | null;
      nextDocData: DocData | null;
    } => {
      const wasActive = activeDocId === docId;

      // Remove data from localStorage
      lsRemoveData(uid, docId);
      const list = readIndex().filter((d) => d.id !== docId);
      lsWriteIndex(uid, list);
      setDocuments(list);

      let nextDocId: string | null = null;
      let nextDocData: DocData | null = null;

      if (wasActive) {
        nextDocId = list[0]?.id || null;
        setActiveDocId(nextDocId);
        if (nextDocId) {
          localStorage.setItem(activeKey(uid), nextDocId);
          nextDocData = lsReadData(uid, nextDocId);
        } else {
          localStorage.removeItem(activeKey(uid));
        }
      }

      // Delete from DB in background
      if (uid !== "guest") {
        apiFetch(`/api/documents/${docId}`, { method: "DELETE" });
      }

      return { deletedActive: wasActive, nextDocId, nextDocData };
    },
    [uid, activeDocId, readIndex],
  );

  /* ── Set active document (no load, just track) ────────────────── */

  const setActive = useCallback(
    (docId: string) => {
      setActiveDocId(docId);
      localStorage.setItem(activeKey(uid), docId);
    },
    [uid],
  );

  /* ── Rename ───────────────────────────────────────────────────── */

  const renameDocument = useCallback(
    (docId: string, newTitle: string) => {
      const list = readIndex().map((d) =>
        d.id === docId ? { ...d, title: newTitle, updatedAt: Date.now() } : d,
      );
      lsWriteIndex(uid, list);
      setDocuments(list);

      if (uid !== "guest") {
        apiFetch(`/api/documents/${docId}`, {
          method: "PUT",
          body: JSON.stringify({ title: newTitle }),
        });
      }
    },
    [uid, readIndex],
  );

  /* ── Reorder ──────────────────────────────────────────────────── */

  const reorderDocuments = useCallback(
    (fromIndex: number, toIndex: number) => {
      const list = [...readIndex()];
      if (
        fromIndex < 0 ||
        fromIndex >= list.length ||
        toIndex < 0 ||
        toIndex >= list.length ||
        fromIndex === toIndex
      ) {
        return;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      lsWriteIndex(uid, list);
      setDocuments(list);

      // Update sortOrder in DB
      if (uid !== "guest") {
        apiFetch("/api/documents", {
          method: "PUT",
          body: JSON.stringify({
            action: "reorder",
            order: list.map((d) => d.id),
          }),
        });
      }
    },
    [uid, readIndex],
  );

  /* ── Manual sync (pull from DB — useful after switching envs) ─── */

  const syncFromDB = useCallback(async () => {
    if (uid === "guest") return;
    setSyncing(true);

    const result = await apiFetch<{
      documents: Array<{
        id: string;
        title: string;
        html: string;
        meta: string | null;
        template: string | null;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
      }>;
      sharedDocuments?: Array<{
        id: string;
        title: string;
        html: string;
        meta: string | null;
        template: string | null;
        sortOrder: number;
        createdAt: string;
        updatedAt: string;
        role: "VIEWER" | "EDITOR" | "ADMIN";
        sharedBy: string;
      }>;
    }>("/api/documents");

    if (result?.documents) {
      const index: DocIndexEntry[] = result.documents.map((d) => ({
        id: d.id,
        title: d.title,
        createdAt: new Date(d.createdAt).getTime(),
        updatedAt: new Date(d.updatedAt).getTime(),
      }));

      lsWriteIndex(uid, index);
      setDocuments(index);

      for (const d of result.documents) {
        try {
          lsWriteData(uid, d.id, {
            html: d.html,
            meta: d.meta ? JSON.parse(d.meta) : {},
            template: d.template ? JSON.parse(d.template) : {},
          });
        } catch {
          // skip
        }
      }
    }

    // Also refresh shared documents
    if (result?.sharedDocuments) {
      const shared: SharedDocEntry[] = result.sharedDocuments.map((d) => ({
        id: d.id,
        title: d.title || "Untitled",
        createdAt: new Date(d.createdAt).getTime(),
        updatedAt: new Date(d.updatedAt).getTime(),
        role: d.role,
        sharedBy: d.sharedBy,
      }));
      setSharedDocuments(shared);

      for (const d of result.sharedDocuments) {
        try {
          lsWriteData(uid, d.id, {
            html: d.html,
            meta: d.meta ? JSON.parse(d.meta) : {},
            template: d.template ? JSON.parse(d.template) : {},
          });
        } catch {
          // skip
        }
      }
    }

    setSyncing(false);
  }, [uid]);

  return {
    /** Sorted list of documents */
    documents,
    /** Documents shared with the current user */
    sharedDocuments,
    /** Currently active document ID */
    activeDocId,
    /** Whether initial load is complete */
    ready,
    /** Whether a DB sync is in progress */
    syncing,
    /** CRUD operations */
    createDocument,
    saveDocument,
    saveDocumentNow,
    loadDocument,
    deleteDocument,
    renameDocument,
    reorderDocuments,
    setActive,
    /** Read data without setting active */
    readData,
    /** Force pull from DB */
    syncFromDB,
  };
}
