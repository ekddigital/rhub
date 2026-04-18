// Re-export shared booklet types from the manager shell so all sub-modules
// import from a single, stable location.
export type {
  BookletData,
  BookletSection,
  BookletConfig,
  BookletStatus,
  LeaderProfile,
  NecMember,
} from "@/components/tools/conf/booklet-manager-shell";

// Convenience local aliases
export type Meeting =
  import("@/components/tools/conf/booklet-manager-shell").BookletData["meetings"][0];
export type Delegate =
  import("@/components/tools/conf/booklet-manager-shell").BookletData["delegates"][0];
