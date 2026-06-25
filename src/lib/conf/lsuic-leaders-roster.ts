import rosterJson from "./lsuic-leaders-roster.generated.json";

export type LsuicLeaderRosterRow = {
  committee_formal_name: string;
  committee_short_name: string;
  leader_name: string;
  leader_role: string;
  leader_city_area: string;
  leader_phone: string;
  leader_university: string;
  leader_photo_url: string;
};

export type LsuicMemberRole =
  | "CHAIR"
  | "VICE_CHAIR"
  | "SECRETARY"
  | "FINANCIAL_SECRETARY"
  | "TREASURER"
  | "COMMITTEE";

const ROSTER_ROWS = rosterJson as LsuicLeaderRosterRow[];

export function normalizeLeaderName(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/\*\*/g, "")
    .replace(/^hon\.?\s*/i, "")
    .replace(/^h\.?\s*e\.?\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHonorificDisplayName(name: string): string {
  return name.replace(/^\*\*/g, "").replace(/^Hon\.?\s*/i, "").trim();
}

export function lsuicLeaderRosterKey(row: LsuicLeaderRosterRow): string {
  return `${row.committee_short_name}|${normalizeLeaderName(row.leader_name)}`;
}

export function loadLsuicLeadersRoster(): LsuicLeaderRosterRow[] {
  return ROSTER_ROWS;
}

export function inferLsuicMemberRole(leaderRole: string): LsuicMemberRole {
  const role = (leaderRole ?? "").toLowerCase();
  if (
    role.includes("coc-1") ||
    role.includes("coordinator: coc-1")
  ) {
    return "CHAIR";
  }
  if (
    role.includes("national president") ||
    role.includes("general chairman") ||
    (role.includes("chairman") && !role.includes("co-chair")) ||
    role.includes("chair:") ||
    role.includes("chair –") ||
    role.includes("chair -") ||
    role.includes("senior adjudicator")
  ) {
    return "CHAIR";
  }
  if (
    role.includes("vice president") ||
    role.includes("co-chair") ||
    (role.includes("deputy") && !role.includes("secretary")) ||
    role.includes("associate adjudicator")
  ) {
    return "VICE_CHAIR";
  }
  if (role.includes("financial secretary")) return "FINANCIAL_SECRETARY";
  if (role.includes("treasurer")) return "TREASURER";
  if (role.includes("secretary") || role.includes("general secretary")) {
    return "SECRETARY";
  }
  return "COMMITTEE";
}

/** Map CSV committee short code to booklet `committeeScope`. */
export function bookletScopeForLsuicRow(row: LsuicLeaderRosterRow): string | null {
  const short = row.committee_short_name;
  const role = (row.leader_role ?? "").toLowerCase();

  if (short === "NEC") return "NEC";
  if (short === "CC") return null;
  if (short === "NCP") return "City";
  if (short === "JB") return "Judicial";
  if (short === "CoC") {
    if (
      role.includes("coc-1") ||
      role.includes("coc-2") ||
      role.includes("coordinator: coc")
    ) {
      return "CoC";
    }
    return "CoC Province";
  }
  return short;
}

export const LSUIC_BOOKLET_COMMITTEE_SCOPES = [
  "PPC",
  "AEC",
  "CRC",
  "PPA",
  "IEC",
  "WC",
  "AC",
] as const;

export function lsuicCommitteesInRoster(): Array<{
  short: string;
  formal: string;
  count: number;
}> {
  const map = new Map<string, { formal: string; count: number }>();
  for (const row of ROSTER_ROWS) {
    const prev = map.get(row.committee_short_name);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(row.committee_short_name, {
        formal: row.committee_formal_name,
        count: 1,
      });
    }
  }
  return [...map.entries()]
    .map(([short, meta]) => ({ short, formal: meta.formal, count: meta.count }))
    .sort((a, b) => a.short.localeCompare(b.short));
}

export function digitsOnlyPhone(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}
