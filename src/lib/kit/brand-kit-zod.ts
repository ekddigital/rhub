import { z } from "zod";

/** Zod schemas for REST body parsing — keep in sync with `lib/creative/brand-kit.ts`. */

export const brandColorTokensSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
  accent: z.string().optional(),
  background: z.string().optional(),
  surface: z.string().optional(),
  text: z.string().optional(),
  muted: z.string().optional(),
});

export const brandAssetRefsSchema = z.object({
  logoUrl: z.string().optional(),
  logoMarkUrl: z.string().optional(),
  watermarkUrl: z.string().optional(),
  assetBaseKey: z.string().optional(),
});

export const brandTypographySchema = z.object({
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
});

export const organizationBrandKitSchema = z.object({
  orgId: z.string().min(1),
  slug: z.string().min(1),
  displayName: z.string().min(1),
  colors: brandColorTokensSchema,
  assets: brandAssetRefsSchema.default({}),
  typography: brandTypographySchema.default({}),
  templateDefaults: z.record(z.string(), z.unknown()).optional(),
});

export const mergeBrandKitBodySchema = z.object({
  base: organizationBrandKitSchema,
  override: organizationBrandKitSchema.partial(),
});

export type MergeBrandKitBody = z.infer<typeof mergeBrandKitBodySchema>;
