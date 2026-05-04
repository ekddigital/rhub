import type { ConfRole } from "@prisma/client";

/**
 * Roles included on **formal conference committee letters** (composer sidebar,
 * generated letterhead PNG/SVG). Deliberately excludes:
 * - **TREASURER** — typically national / financial-secretary accounts linked for
 *   workflow, not the Jinan conference committee roster printed on letters.
 * - **DELEGATE** — participants, not organizing committee in this context.
 *
 * Managing every member (including treasurers and linked accounts) still happens
 * on `/tools/conf/committee` with the full member list.
 */
export const CONFERENCE_LETTER_ROSTER_ROLES: ConfRole[] = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "COMMITTEE",
];

export function isConfMemberOnConferenceLetterRoster(member: {
  role: string;
  isActive?: boolean | null;
}): boolean {
  if (member.isActive === false) return false;
  return CONFERENCE_LETTER_ROSTER_ROLES.includes(member.role as ConfRole);
}

export function filterMembersForConferenceLetterRoster<
  T extends { role: string; isActive?: boolean | null },
>(members: T[]): T[] {
  return members.filter(isConfMemberOnConferenceLetterRoster);
}
