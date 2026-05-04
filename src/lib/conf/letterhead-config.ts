import { CONF_2026 } from "./config";

export const LETTERHEAD_CONFIG = {
  organizationName: "LIBERIAN STUDENT UNION IN CHINA (LSUIC)",
  defaultConferenceName: CONF_2026.name,
  defaultVenue: CONF_2026.venue,
  defaultCity: CONF_2026.city,
  defaultYear: CONF_2026.year,
  cityRegionCountry: "Shandong Province, P.R. China",
  defaultOfficeLabel: "Office of the Conference Chairman",
  officialWebsite: "https://lsuic.org",
  conferenceWebsite: "https://rhub.ekddigital.com/tools/conf",
  primaryEmail: "ekd@ekddigital.com",
  tertiaryEmail: "alfredap21@gmail.com",
  secondaryEmail: "harrisbowulom@gmail.com",
  motto: 'Motto: "Excellence Through Hard Work"',
} as const;

/** Letter Composer masthead — main title line (replaces full LSUIC name at top). */
export const LETTER_COMPOSER_HEADER_PRIMARY_LINE =
  "Conference Committee (CC)" as const;

/** Letter Composer masthead — slot that previously showed venue/hotel; union identity instead. */
export const LETTER_COMPOSER_HEADER_UNION_LINE =
  "LIBERIAN STUDENT UNION IN CHINA (LSUIC)" as const;

/**
 * Conference subtitle under the union line in Letter Composer — drops a leading "LSUIC "
 * because the full union name appears on the line above.
 */
export function letterComposerConferenceSubtitle(raw: string): string {
  const base = raw.trim() || CONF_2026.name;
  const stripped = base.replace(/^LSUIC\s+/i, "").trim();
  return stripped || base;
}

export function buildCityRegionLine(city?: string | null): string {
  return `${city || LETTERHEAD_CONFIG.defaultCity}, ${LETTERHEAD_CONFIG.cityRegionCountry}`;
}

export function buildLetterheadEmailLine(separator = " · "): string {
  const emails = [
    LETTERHEAD_CONFIG.primaryEmail,
    LETTERHEAD_CONFIG.tertiaryEmail,
    LETTERHEAD_CONFIG.secondaryEmail,
  ].filter(Boolean);
  return `Email: ${emails.join(separator)}`;
}

export function buildLetterheadWebsiteLine(separator = " · "): string {
  const websites = [
    LETTERHEAD_CONFIG.officialWebsite,
    LETTERHEAD_CONFIG.conferenceWebsite,
  ].filter(Boolean);
  return `Website: ${websites.join(separator)}`;
}
