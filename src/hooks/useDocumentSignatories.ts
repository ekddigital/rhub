import { useState, useCallback } from "react";
import { DocumentSignatory } from "@/contexts/document-composition-context";

export interface SignatoryPreset {
  mode: "NONE" | "STANDARD" | "FUNDRAISING" | "CUSTOM";
  signatories: DocumentSignatory[];
}

export interface UseDocumentSignatoriesOptions {
  onSignatoriesChange?: (signatories: DocumentSignatory[]) => void;
}

export function useDocumentSignatories({
  onSignatoriesChange,
}: UseDocumentSignatoriesOptions = {}) {
  const [signatories, setSignatories] = useState<DocumentSignatory[]>([]);
  const [signatoryMode, setSignatoryMode] = useState<
    "NONE" | "STANDARD" | "FUNDRAISING" | "CUSTOM"
  >("NONE");

  // Update signatory at index
  const updateSignatory = useCallback(
    (index: number, updates: Partial<DocumentSignatory>) => {
      setSignatories((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], ...updates };
        onSignatoriesChange?.(updated);
        return updated;
      });
    },
    [onSignatoriesChange]
  );

  // Add signatory
  const addSignatory = useCallback(
    (signatory: DocumentSignatory = {
      name: "",
      title: "",
      label: "Signed",
      signature: "",
      scale: 1,
    }) => {
      setSignatories((prev) => {
        const updated = [...prev, signatory];
        onSignatoriesChange?.(updated);
        return updated;
      });
    },
    [onSignatoriesChange]
  );

  // Remove signatory at index
  const removeSignatory = useCallback(
    (index: number) => {
      setSignatories((prev) => {
        const updated = prev.filter((_, i) => i !== index);
        onSignatoriesChange?.(updated);
        return updated;
      });
    },
    [onSignatoriesChange]
  );

  // Apply preset
  const applyPreset = useCallback(
    (preset: SignatoryPreset) => {
      setSignatoryMode(preset.mode);
      setSignatories(preset.signatories);
      onSignatoriesChange?.(preset.signatories);
    },
    [onSignatoriesChange]
  );

  // Clear all
  const clearSignatories = useCallback(() => {
    setSignatories([]);
    setSignatoryMode("NONE");
    onSignatoriesChange?.([]);
  }, [onSignatoriesChange]);

  return {
    signatories,
    setSignatories,
    signatoryMode,
    setSignatoryMode,
    updateSignatory,
    addSignatory,
    removeSignatory,
    applyPreset,
    clearSignatories,
  };
}
