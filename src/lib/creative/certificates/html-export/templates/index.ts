/**
 * Certificate Templates - Central Hub
 * This file imports and re-exports all certificate templates from organized directories
 */

// Import types
export * from "./types";

// Import all templates from the organized structure
import { FOM_TEMPLATES } from "./fom";
import { GENERAL_TEMPLATES } from "./general";
import { EKD_TEMPLATES } from "./ekd";
import { JICF_TEMPLATES } from "./jicf";
import { JULS_TEMPLATES } from "./juls";

// Re-export for backward compatibility and easy access
export * from "./fom";
export * from "./general";
export * from "./ekd";
export * from "./jicf";
export * from "./juls";

// Export unified template arrays
export const ALL_CERTIFICATE_TEMPLATES = [
  ...FOM_TEMPLATES,
  ...GENERAL_TEMPLATES,
  ...EKD_TEMPLATES,
  ...JICF_TEMPLATES,
  ...JULS_TEMPLATES,
];

// Utility functions
export const getCertificateTemplate = (templateId: string) => {
  return ALL_CERTIFICATE_TEMPLATES.find(
    (template) => template.id === templateId
  );
};

export const getCertificateTemplatesByCategory = (category: string) => {
  return ALL_CERTIFICATE_TEMPLATES.filter(
    (template) => template.category === category
  );
};

export const getCertificateTemplatesByOrganization = (org: string) => {
  switch (org.toLowerCase()) {
    case "fom":
      return FOM_TEMPLATES;
    case "general":
      return GENERAL_TEMPLATES;
    case "ekd-digital":
    case "ekd":
      return EKD_TEMPLATES;
    case "jicf":
    case "jesus-is-coming-forever":
      return JICF_TEMPLATES;
    case "juls":
    case "junior-university-leadership-seminars":
      return JULS_TEMPLATES;
    default:
      return [];
  }
};
