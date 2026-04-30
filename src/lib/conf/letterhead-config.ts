import { CONF_2026 } from "./config";

export const LETTERHEAD_CONFIG = {
  organizationName: "LIBERIAN STUDENT UNION IN CHINA (LSUIC)",
  defaultConferenceName: CONF_2026.name,
  defaultVenue: CONF_2026.venue,
  defaultCity: CONF_2026.city,
  defaultYear: CONF_2026.year,
  cityRegionCountry: "Shandong Province, P.R. China",
  defaultOfficeLabel: "Office of the Conference Chairman",
  primaryEmail: "ekd@ekddigital.com",
  secondaryEmail: "harrisbowulom@gmail.com",
  motto: 'Motto: "Excellence Through Hard Work"',
} as const;

export function buildCityRegionLine(city?: string | null): string {
  return `${city || LETTERHEAD_CONFIG.defaultCity}, ${LETTERHEAD_CONFIG.cityRegionCountry}`;
}

export function buildLetterheadEmailLine(separator = " · "): string {
  return `Email: ${LETTERHEAD_CONFIG.primaryEmail}${separator}${LETTERHEAD_CONFIG.secondaryEmail}`;
}
