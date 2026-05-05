/**
 * EKD Digital Templates - Main Export
 */

export * from "./professional";

// Re-export all templates as an array for easy access
import { ekdTechCertTemplate, ekdProfessionalTemplate } from "./professional";

export const EKD_TEMPLATES = [ekdTechCertTemplate, ekdProfessionalTemplate];
