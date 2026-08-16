import {
  createDefaultSignatoryDraft,
  type SignatoryDraft,
} from "@/components/tools/conf/document-signatory-controls";

/** Default §22 certification signatories for Jinan 2026 conference report. */
export function createDefaultReportSignatoryDraft(): SignatoryDraft {
  const base = createDefaultSignatoryDraft();
  return {
    ...base,
    signatoryMode: "CUSTOM",
    signatorySlotCount: 3,
    signatory1: {
      name: "",
      title: "Conference Committee — Documentation & Reporting",
      label: "Prepared by",
      sig: "",
      sigScale: 1,
    },
    signatory2: {
      name: "Harris M. Bowulo",
      title: "General Secretary, Conference Committee",
      label: "Reviewed by",
      sig: "",
      sigScale: 1,
    },
    signatory3: {
      name: "Enoch Kwateh Dongbo",
      title: "General Chairman, Conference Committee",
      label: "Approved by",
      sig: "",
      sigScale: 1,
    },
  };
}
