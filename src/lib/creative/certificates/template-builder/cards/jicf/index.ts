/**
 * JICF Card Templates - Main Export
 */

export * from "./constants";
export * from "./graduation";
export * from "./invitations";
export * from "./service";
export * from "./mc-training-workshop";

// Re-export all templates as an array for easy access
import { gradBlessing, biblicalVerse, elegantRoses } from "./graduation";
import { celebrationInvite, todayIsTheDay } from "./invitations";
import { serviceOutline, graduatesNameList, meetOurGraduates } from "./service";
import { jicfMCTrainingWorkshop } from "./mc-training-workshop";

export const JICF_TEMPLATES = [
  gradBlessing,
  biblicalVerse,
  elegantRoses,
  celebrationInvite,
  todayIsTheDay,
  serviceOutline,
  graduatesNameList,
  meetOurGraduates,
  jicfMCTrainingWorkshop,
];
