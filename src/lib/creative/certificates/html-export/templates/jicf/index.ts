/**
 * JICF Certificate Templates - Main Index
 * Exports all JICF certificate templates
 */

import { jicfAppreciationCertificate } from "./appreciation";
import { jicfAwardsCertificate } from "./awards";
import { jicfCompletionCertificate } from "./completion";
import { jicfServiceCertificate } from "./service";
import { jicfWeddingCertificate } from "./wedding";

// Export individual templates
export { jicfAppreciationCertificate } from "./appreciation";
export { jicfAwardsCertificate } from "./awards";
export { jicfCompletionCertificate } from "./completion";
export { jicfServiceCertificate } from "./service";
export { jicfWeddingCertificate } from "./wedding";

// Export constants
export * from "./constants";

// Unified array of all JICF templates
export const JICF_TEMPLATES = [
  jicfAppreciationCertificate,
  jicfAwardsCertificate,
  jicfCompletionCertificate,
  jicfServiceCertificate,
  jicfWeddingCertificate,
] as const;

// Template lookup utilities
export const getJICFTemplate = (templateId: string) => {
  return JICF_TEMPLATES.find((template) => template.id === templateId);
};

export const getJICFTemplatesByCategory = (category: string) => {
  return JICF_TEMPLATES.filter((template) => template.category === category);
};
