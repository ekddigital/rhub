import type { ConfRole } from "@prisma/client";

export type CommitteeRoleTemplateSeed = {
  key: string;
  label: string;
  baseRole: ConfRole;
  title: string | null;
  committeeScope: string | null;
  officeLabel: string | null;
  sortOrder: number;
  isSystem: boolean;
};

export const DEFAULT_COMMITTEE_ROLE_TEMPLATES: readonly CommitteeRoleTemplateSeed[] =
  [
    {
      key: "CONFERENCE_CHAIR",
      label: "Conference Chair",
      baseRole: "CHAIR",
      title: "General Chairman",
      committeeScope: null,
      officeLabel: "Office of the Conference Chairman",
      sortOrder: 1,
      isSystem: true,
    },
    {
      key: "CONFERENCE_VICE_CHAIR",
      label: "Conference Vice-Chair",
      baseRole: "VICE_CHAIR",
      title: "General Co-Chair",
      committeeScope: null,
      officeLabel: "Office of the Conference Vice-Chair",
      sortOrder: 2,
      isSystem: true,
    },
    {
      key: "CONFERENCE_SECRETARY",
      label: "Conference Secretary",
      baseRole: "SECRETARY",
      title: "General Secretary",
      committeeScope: null,
      officeLabel: "Office of the Conference Secretary",
      sortOrder: 3,
      isSystem: true,
    },
    {
      key: "CONFERENCE_TREASURER",
      label: "Conference Treasurer",
      baseRole: "TREASURER",
      title: "Treasurer",
      committeeScope: null,
      officeLabel: "Office of the Conference Treasurer",
      sortOrder: 4,
      isSystem: true,
    },
    {
      key: "PRO_MEDIA_CHAIR",
      label: "PRO and Media",
      baseRole: "COMMITTEE",
      title: "PRO & Media",
      committeeScope: "Media",
      officeLabel: "Office of the Media and Publicity Committee",
      sortOrder: 10,
      isSystem: true,
    },
    {
      key: "COOKING_TEAM_CHAIR",
      label: "Cooking Team Chair",
      baseRole: "COMMITTEE",
      title: "Cooking Team Chair",
      committeeScope: "Cooking",
      officeLabel: "Office of the Cooking Committee",
      sortOrder: 11,
      isSystem: true,
    },
    {
      key: "SPORTS_COMMITTEE_CHAIR",
      label: "Sports Committee Chair",
      baseRole: "COMMITTEE",
      title: "Chair on Sports",
      committeeScope: "Sports",
      officeLabel: "Office of the Sports Committee",
      sortOrder: 12,
      isSystem: true,
    },
    {
      key: "LOGISTICS_COMMITTEE_CHAIR",
      label: "Logistics Committee Chair",
      baseRole: "COMMITTEE",
      title: "Chair on Logistics",
      committeeScope: "Logistics",
      officeLabel: "Office of the Logistics Committee",
      sortOrder: 13,
      isSystem: true,
    },
    {
      key: "DECORATION_COMMITTEE_CHAIR",
      label: "Decoration Committee Chair",
      baseRole: "COMMITTEE",
      title: "Chair on Decoration",
      committeeScope: "Decoration",
      officeLabel: "Office of the Decoration Committee",
      sortOrder: 14,
      isSystem: true,
    },
    {
      key: "FUNDRAISING_COMMITTEE_CHAIR",
      label: "Fundraising Committee Chair",
      baseRole: "COMMITTEE",
      title: "Fundraising Committee Chair",
      committeeScope: "Fundraising",
      officeLabel: "Office of the Fundraising Committee",
      sortOrder: 15,
      isSystem: true,
    },
  ] as const;

export function normalizeRoleKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
    .slice(0, 64);
}
