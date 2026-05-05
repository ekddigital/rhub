/**
 * FOM Card Templates - Main Export
 */

export * from "./constants";
export * from "./graduation";
export * from "./wedding-reception";

// Re-export all templates as an array for easy access
import { fomSampleGrad } from "./graduation";
import { kingdomWeddingReceptionCard } from "./wedding-reception";

export const FOM_TEMPLATES = [fomSampleGrad, kingdomWeddingReceptionCard];
