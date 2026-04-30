import { useState, useCallback, useEffect, useRef } from "react";
import { DocumentDraft, DocumentType } from "@/contexts/document-composition-context";

const AUTO_SAVE_DELAY = 800; // ms
const STORAGE_KEY_PREFIX = "doc-draft-";

export interface UseDocumentCompositionOptions {
  confId: string;
  documentType: DocumentType;
  autoSaveToLocalStorage?: boolean;
  onAutoSave?: (draft: DocumentDraft) => void;
}

export function useDocumentComposition({
  confId,
  documentType,
  autoSaveToLocalStorage = true,
  onAutoSave,
}: UseDocumentCompositionOptions) {
  const [drafts, setDrafts] = useState<DocumentDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<DocumentDraft | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<number | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Initialize drafts from localStorage
  useEffect(() => {
    const storageDrafts: DocumentDraft[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_KEY_PREFIX)) {
          const data = JSON.parse(localStorage.getItem(key) || "{}");
          if (data.type === documentType && data.confId === confId) {
            storageDrafts.push(data);
          }
        }
      }
      setDrafts(storageDrafts);
      if (storageDrafts.length > 0) {
        setActiveDraft(storageDrafts[0]);
      }
    } catch (e) {
      console.error("Error loading drafts from localStorage:", e);
    }
  }, [confId, documentType]);

  // Auto-save draft
  const autoSaveDraft = useCallback(
    (draft: DocumentDraft) => {
      if (!autoSaveToLocalStorage) return;

      try {
        const storageKey = `${STORAGE_KEY_PREFIX}${draft.id}`;
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            ...draft,
            confId,
            lastModified: Date.now(),
          })
        );
        setLastAutoSave(Date.now());
        onAutoSave?.(draft);
      } catch (e) {
        console.error("Error auto-saving draft:", e);
      }
    },
    [confId, autoSaveToLocalStorage, onAutoSave]
  );

  // Debounced update with auto-save
  const updateDraft = useCallback(
    (id: string, updates: Partial<DocumentDraft>) => {
      setDrafts((prev) => {
        const updated = prev.map((d) =>
          d.id === id ? { ...d, ...updates, lastModified: Date.now() } : d
        );

        // Update active draft if it's the one being edited
        if (activeDraft?.id === id) {
          const newDraft = { ...activeDraft, ...updates, lastModified: Date.now() };
          setActiveDraft(newDraft);

          // Debounce auto-save
          if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
          }
          autoSaveTimeoutRef.current = setTimeout(() => {
            autoSaveDraft(newDraft);
          }, AUTO_SAVE_DELAY) as unknown as NodeJS.Timeout;
        }

        return updated;
      });
    },
    [activeDraft, autoSaveDraft]
  );

  // Add new draft
  const addDraft = useCallback(
    (draft: DocumentDraft) => {
      const newDraft = {
        ...draft,
        id: draft.id || `draft-${Date.now()}`,
        lastModified: Date.now(),
      };
      setDrafts((prev) => [...prev, newDraft]);
      setActiveDraft(newDraft);
      if (autoSaveToLocalStorage) {
        autoSaveDraft(newDraft);
      }
    },
    [autoSaveToLocalStorage, autoSaveDraft]
  );

  // Remove draft
  const removeDraft = useCallback((id: string) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    if (activeDraft?.id === id) {
      setActiveDraft(null);
    }
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    } catch (e) {
      console.error("Error removing draft from localStorage:", e);
    }
  }, [activeDraft]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return {
    drafts,
    activeDraft,
    setActiveDraft,
    addDraft,
    updateDraft,
    removeDraft,
    lastAutoSave,
    setLastAutoSave,
    zoomLevel,
    setZoomLevel,
  };
}
