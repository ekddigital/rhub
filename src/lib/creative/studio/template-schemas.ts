import { z } from "zod";
import {
  CreativeTemplateCategory,
  CreativeTemplateStatus,
} from "@prisma/client";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createStudioTemplateBodySchema = z.object({
  tenantKey: z.string().min(1).max(180).optional(),
  slug: z.string().min(1).max(180).regex(slugRegex),
  name: z.string().min(1).max(240),
  description: z.string().max(8000).optional().nullable(),
  category: z.nativeEnum(CreativeTemplateCategory),
  status: z.nativeEnum(CreativeTemplateStatus).optional(),
  registrySourceId: z.string().max(120).optional().nullable(),
  definition: z.record(z.string(), z.any()),
  meta: z.record(z.string(), z.any()).optional().nullable(),
});

export const updateStudioTemplateBodySchema = z
  .object({
    name: z.string().min(1).max(240).optional(),
    description: z.string().max(8000).optional().nullable(),
    status: z.nativeEnum(CreativeTemplateStatus).optional(),
    definition: z.record(z.string(), z.any()).optional(),
    meta: z.record(z.string(), z.any()).optional().nullable(),
    registrySourceId: z.string().max(120).optional().nullable(),
    publish: z.boolean().optional(),
  })
  .strict();

export const forkStudioTemplateBodySchema = z.object({
  targetTenantKey: z.string().min(1).max(180),
  slug: z.string().min(1).max(180).regex(slugRegex),
  name: z.string().min(1).max(240),
});
