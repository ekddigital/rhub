/**
 * JULS Card Templates - Main Export
 */

export * from "./constants";
export * from "./graduation";

// Re-export all templates as an array for easy access
import { julsSampleGrad } from "./graduation";

export const JULS_TEMPLATES = [julsSampleGrad];
