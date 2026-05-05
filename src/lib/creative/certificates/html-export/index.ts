/**
 * Certificate Utilities - Main Index
 * Centralizes all certificate-related utilities and functions
 */

// Core template system
export * from "./templates";
export * from "./templates/types";

// Utility modules
export * from "./certificate-id-generator";
export * from "./qr-code-generator";
export * from "./certificate-data-processor";

// Seeding: legacy ekddigital-only; use prisma seed / API when rhub cert models exist.

// Re-export template constants for easy access
export { ALL_CERTIFICATE_TEMPLATES as CERTIFICATE_TEMPLATES } from "./templates";
export {
  getCertificateTemplate,
  getCertificateTemplatesByCategory,
} from "./templates";

// Convenience functions for common operations
import {
  generateCertificateId,
  certificateIdGenerators,
} from "./certificate-id-generator";
import {
  generateCertificateData,
  validateCertificateData,
} from "./certificate-data-processor";
import {
  getCertificateTemplate,
  getCertificateTemplatesByCategory,
} from "./templates";
import type {
  CertificateGenerationOptions,
  CertificateInputData,
  ProcessedCertificateData,
} from "./certificate-data-processor";

/**
 * Quick certificate creation workflow
 */
export async function createCertificate(
  templateId: string,
  recipientData: CertificateInputData,
  options: CertificateGenerationOptions = {}
): Promise<ProcessedCertificateData> {
  const template = getCertificateTemplate(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Validate input data
  const validation = validateCertificateData(template, recipientData);
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  // Generate processed certificate data
  return await generateCertificateData(template, recipientData, options);
}

/**
 * Generate certificate ID for specific organization
 */
export function createCertificateId(
  organization: string,
  category: string
): string {
  const orgKey = organization.toLowerCase();
  const generator =
    certificateIdGenerators[orgKey as keyof typeof certificateIdGenerators];

  if (generator) {
    return generator(category);
  }

  // Fallback to general ID generation
  return generateCertificateId("GENERAL", category);
}

/**
 * Get organization-specific templates
 */
export function getOrganizationTemplates(organization: string) {
  switch (organization.toLowerCase()) {
    case "jicf":
      return getCertificateTemplatesByCategory("jicf");
    case "juls":
      return getCertificateTemplatesByCategory("juls");
    case "fom":
      return getCertificateTemplatesByCategory("fom");
    case "general":
      return getCertificateTemplatesByCategory("general");
    default:
      return [];
  }
}

/**
 * Certificate utility constants
 */
export const CERTIFICATE_ORGANIZATIONS = [
  "jicf",
  "juls",
  "fom",
  "general",
] as const;
export const CERTIFICATE_CATEGORIES = [
  "appreciation",
  "completion",
  "achievement",
  "award",
  "service",
  "participation",
  "excellence",
] as const;

/**
 * Enhanced template discovery functions
 */
export function getTemplatesByOrganization(organization: string) {
  return getOrganizationTemplates(organization);
}

export function getTemplatesByCategory(category: string) {
  return getCertificateTemplatesByCategory(category);
}

/**
 * Template validation helpers
 */
export function isValidTemplate(templateId: string): boolean {
  return getCertificateTemplate(templateId) !== undefined;
}

export function getTemplateInfo(templateId: string) {
  const template = getCertificateTemplate(templateId);
  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    organization: template.organization,
    category: template.category,
    hasVariables: !!(
      template.variables && Object.keys(template.variables).length > 0
    ),
    elementCount: template.elements.length,
    pageSettings: template.pageSettings,
  };
}

// Legacy compatibility exports (keeping existing functions that might be used elsewhere)
import { customAlphabet } from "nanoid";

/**
 * Generate a unique verification ID for certificates (legacy)
 * @deprecated Use generateCertificateId from certificate-id-generator instead
 */
export async function generateVerificationId(): Promise<string> {
  const nanoid = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 8);
  const part1 = nanoid(3);
  const part2 = nanoid(4);
  return `${part1}-${part2}`;
}

/**
 * Generate verification URL (legacy)
 * @deprecated Use generateVerificationQRCode instead
 */
export function generateVerificationUrl(
  certificateId: string,
  baseUrl?: string
): string {
  return `${
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "https://ekddigital.com"
  }/verify/${certificateId}`;
}

/**
 * Legacy generateCertificateId function for backward compatibility
 * @deprecated Use the new generateCertificateId from certificate-id-generator
 */
export function legacyGenerateCertificateId(
  templateName: string,
  sequenceNumber?: number
): string {
  // Try to determine organization and category from template name
  const nameUpper = templateName.toUpperCase();

  let organization: keyof typeof import("./certificate-id-generator").CERTIFICATE_ID_PATTERNS =
    "GENERAL";
  if (nameUpper.includes("JULS")) organization = "JULS";
  else if (nameUpper.includes("JICF")) organization = "JICF";
  else if (nameUpper.includes("FOM")) organization = "FOM";

  let category = "appreciation";
  if (nameUpper.includes("COMPLETION")) category = "completion";
  else if (nameUpper.includes("ACHIEVEMENT")) category = "achievement";
  else if (nameUpper.includes("AWARD")) category = "award";
  else if (nameUpper.includes("SERVICE")) category = "service";

  return generateCertificateId(organization, category, sequenceNumber);
}

// Export legacy function with original name for compatibility
export { legacyGenerateCertificateId as generateCertificateId };

// Legacy interfaces for backward compatibility
export interface LegacyCertificateData {
  recipientName: string;
  templateName: string;
  issueDate: Date;
  expiryDate?: Date;
  customFields?: Record<string, unknown>;
}

export interface LegacyTemplateData {
  name?: string;
  description?: string;
  elements: LegacyTemplateElement[];
  pageSettings: LegacyPageSettings;
  fonts: LegacyFontSettings[];
}

// Alias for compatibility
export type TemplateData = LegacyTemplateData;

export interface LegacyTemplateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr";
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: "italic" | "normal";
    textAlign?: "left" | "center" | "right";
    letterSpacing?: string;
    lineHeight?: string;
    color?: string;
    backgroundColor?: string;
    rotation?: number;
    opacity?: number;
    borderWidth?: string;
    borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none";
    borderColor?: string;
    borderRadius?: string;
    flipHorizontal?: boolean;
    flipVertical?: boolean;
    objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  };
}

// Alias for compatibility
export type TemplateElement = LegacyTemplateElement;

export interface LegacyPageSettings {
  width: number;
  height: number;
  unit: "px" | "mm" | "in";
  orientation: "portrait" | "landscape";
  backgroundColor?: string;
  backgroundImage?: string;
}

export interface LegacyFontSettings {
  family: string;
  variants: string[];
  source?: "google" | "local" | "url";
  url?: string;
}
