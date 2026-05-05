/**
 * JULS Certificate Templates - Main Export
 */

export * from "./constants";
export * from "./appreciation";
export * from "./awards";

// Re-export all templates as an array for easy access
import { julsAppreciationCert } from "./appreciation";
import { julsOutstandingAward } from "./awards";

export const JULS_TEMPLATES = [julsAppreciationCert, julsOutstandingAward];
