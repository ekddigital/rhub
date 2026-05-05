/**
 * FOM Certificate Templates - Main Export
 */

export * from "./constants";
export * from "./appreciation";
export * from "./excellence";

// Re-export all templates as an array for easy access
import { fomAppreciationCert } from "./appreciation";
import { fomExcellenceCert } from "./excellence";

export const FOM_TEMPLATES = [fomAppreciationCert, fomExcellenceCert];
