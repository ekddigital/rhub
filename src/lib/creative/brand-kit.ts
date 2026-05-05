/**
 * Organization-scoped brand tokens — shared across flyers, documents, certificates, cards.
 * Prefer passing OrganizationBrandKit into templates instead of hardcoding org palettes.
 */

export type OrgId = string;

export type BrandColorTokens = {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
};

export type BrandAssetRefs = {
  logoUrl?: string;
  logoMarkUrl?: string;
  watermarkUrl?: string;
  assetBaseKey?: string;
};

export type BrandTypography = {
  headingFont?: string;
  bodyFont?: string;
};

export type OrganizationBrandKit = {
  orgId: OrgId;
  slug: string;
  displayName: string;
  colors: BrandColorTokens;
  assets: BrandAssetRefs;
  typography: BrandTypography;
  templateDefaults?: Record<string, unknown>;
};

const defaultColors = (partial?: Partial<BrandColorTokens>): BrandColorTokens => ({
  primary: partial?.primary ?? "#1a1a1a",
  secondary: partial?.secondary,
  accent: partial?.accent,
  background: partial?.background ?? "#ffffff",
  surface: partial?.surface,
  text: partial?.text ?? "#111111",
  muted: partial?.muted ?? "#6b7280",
});

export function mergeBrandKit(
  base: OrganizationBrandKit,
  override: Partial<OrganizationBrandKit>,
): OrganizationBrandKit {
  return {
    orgId: override.orgId ?? base.orgId,
    slug: override.slug ?? base.slug,
    displayName: override.displayName ?? base.displayName,
    colors: defaultColors({ ...base.colors, ...override.colors }),
    assets: { ...base.assets, ...override.assets },
    typography: { ...base.typography, ...override.typography },
    templateDefaults:
      base.templateDefaults || override.templateDefaults
        ? {
            ...(base.templateDefaults ?? {}),
            ...(override.templateDefaults ?? {}),
          }
        : undefined,
  };
}

export function brandColorsToCssVars(
  colors: BrandColorTokens,
): Record<string, string> {
  const out: Record<string, string> = {
    "--brand-primary": colors.primary,
  };
  if (colors.secondary) out["--brand-secondary"] = colors.secondary;
  if (colors.accent) out["--brand-accent"] = colors.accent;
  if (colors.background) out["--brand-background"] = colors.background;
  if (colors.surface) out["--brand-surface"] = colors.surface;
  if (colors.text) out["--brand-text"] = colors.text;
  if (colors.muted) out["--brand-muted"] = colors.muted;
  return out;
}
