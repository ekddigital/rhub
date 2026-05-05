/**
 * Certificate Templates - Central Hub
 * This file imports and re-exports all certificate templates from organized directories
 */

// Import types
export * from "./certificates/types";

// Import all templates from the organized structure
import { JICF_TEMPLATES } from "./certificates/jicf";
import { JULS_TEMPLATES } from "./certificates/juls";
import { FOM_TEMPLATES } from "./certificates/fom";
import { GENERAL_TEMPLATES } from "./certificates/general";

// Re-export for backward compatibility and easy access
export * from "./certificates/jicf";
export * from "./certificates/juls";
export * from "./certificates/fom";
export * from "./certificates/general";

// Export unified template arrays
export const CERTIFICATE_TEMPLATES = [
  ...JICF_TEMPLATES,
  ...JULS_TEMPLATES,
  ...FOM_TEMPLATES,
  ...GENERAL_TEMPLATES,
];

// Utility functions
export const getCertificateTemplate = (templateId: string) => {
  return CERTIFICATE_TEMPLATES.find((template) => template.id === templateId);
};

export const getCertificateTemplatesByCategory = (category: string) => {
  return CERTIFICATE_TEMPLATES.filter(
    (template) => template.category === category
  );
};

export const getCertificateTemplatesByOrganization = (org: string) => {
  switch (org.toLowerCase()) {
    case "jicf":
      return JICF_TEMPLATES;
    case "juls":
      return JULS_TEMPLATES;
    case "fom":
      return FOM_TEMPLATES;
    case "general":
      return GENERAL_TEMPLATES;
    default:
      return [];
  }
};
