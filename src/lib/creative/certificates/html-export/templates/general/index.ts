/**
 * General Templates - Main Export
 */

export * from "./completion";

// Re-export all templates as an array for easy access
import { courseCompletionTemplate, participationTemplate } from "./completion";

export const GENERAL_TEMPLATES = [
  courseCompletionTemplate,
  participationTemplate,
];
