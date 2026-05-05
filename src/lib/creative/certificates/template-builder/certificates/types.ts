/**
 * Shared types and interfaces for certificate templates
 */

import type {
  TemplateData,
  TemplateElement,
  PageSettings,
  FontSettings,
} from "../certificate";

// Re-export for easy access
export type { TemplateData, TemplateElement, PageSettings, FontSettings };

// Additional certificate-specific types
export interface CertificateColors {
  // Core required colors
  primary: string;
  secondary: string;
  accent: string;
  white: string;
  darkGray: string; // Required for text color

  // Common colors that might be used
  black?: string;
  gold?: string;
  silver?: string;
  red?: string;
  blue?: string;
  yellow?: string;
  lightRed?: string;
  darkBlue?: string;
  lightBlue?: string;

  // Gray variants commonly used
  lightGray?: string;
  veryLightGray?: string;
  mediumGray?: string;
  darkWarmGray?: string;
  mediumWarmGray?: string;

  // Deep variants
  primaryDeep?: string;
  accentDark?: string;
}

export interface CertificateTemplate extends TemplateData {
  id: string;
  organization: "jicf" | "juls" | "fom" | "general";
  category:
    | "appreciation"
    | "excellence"
    | "leadership"
    | "service"
    | "mission"
    | "baptism"
    | "award"
    | "graduation";
}
