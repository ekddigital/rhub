"use client";

import { createContext, useContext, ReactNode } from "react";

/**
 * Generic Document Composition Context
 * Shared across Letters, Payments, Budgets routes
 * Manages document state, auto-save, signatories, preview
 */

export type DocumentType =
  | "MEMO"
  | "MINUTES"
  | "ANNOUNCEMENT"
  | "BUDGET_LETTER"
  | "PAYMENT_RECEIPT"
  | "GENERAL";

export interface DocumentSignatory {
  name: string;
  title: string;
  label: string; // e.g. "Signed", "Approved"
  signature: string; // base64 data URL
  scale: number; // 0.25–3.0, default 1
}

export interface DocumentDraft {
  id: string;
  dbId: string; // DB record ID if saved
  type: DocumentType;
  title: string;
  to: string;
  from: string;
  re: string;
  date: string;
  body: string;
  bodyRich: string;
  issuingRoleKey: string;
  officeLabel: string;
  signatoryMode: "NONE" | "STANDARD" | "FUNDRAISING" | "CUSTOM";
  signatories: DocumentSignatory[]; // 1–3 signatories
  lastModified: number; // timestamp
  isSaved: boolean; // persisted to DB
}

export interface DocumentCompositionContextType {
  // Current draft
  activeDraft: DocumentDraft | null;
  setActiveDraft: (draft: DocumentDraft) => void;

  // All drafts
  drafts: DocumentDraft[];
  addDraft: (draft: DocumentDraft) => void;
  updateDraft: (id: string, updates: Partial<DocumentDraft>) => void;
  removeDraft: (id: string) => void;

  // Auto-save
  lastAutoSave: number | null;
  setLastAutoSave: (time: number) => void;

  // Preview state
  zoomLevel: number;
  setZoomLevel: (level: number) => void;

  // Conference context (shared data)
  confId: string;
  conferenceInfo: Record<string, unknown> | null;
}

const DocumentCompositionContext = createContext<
  DocumentCompositionContextType | undefined
>(undefined);

export interface DocumentCompositionProviderProps {
  children: ReactNode;
  confId: string;
  conferenceInfo?: Record<string, unknown> | null;
}

export function DocumentCompositionProvider({
  children,
  confId,
  conferenceInfo = null,
}: DocumentCompositionProviderProps) {
  // This will be wrapped by a client component that manages state
  return (
    <DocumentCompositionContext.Provider
      value={{
        activeDraft: null,
        setActiveDraft: () => {},
        drafts: [],
        addDraft: () => {},
        updateDraft: () => {},
        removeDraft: () => {},
        lastAutoSave: null,
        setLastAutoSave: () => {},
        zoomLevel: 100,
        setZoomLevel: () => {},
        confId,
        conferenceInfo,
      }}
    >
      {children}
    </DocumentCompositionContext.Provider>
  );
}

export function useDocumentComposition() {
  const context = useContext(DocumentCompositionContext);
  if (!context) {
    throw new Error(
      "useDocumentComposition must be used within DocumentCompositionProvider"
    );
  }
  return context;
}
