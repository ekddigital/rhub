import {
  type CreativeTemplate,
  CreativeTemplateCategory,
  CreativeTemplateStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import {
  canReadTemplate,
  assertTenantWritable,
  isKitAdmin,
  StudioConflictError,
  StudioPermissionError,
} from "./template-policy";
import {
  CreativeTemplateSchemaError,
  isCreativeTemplateTableMissing,
} from "./creative-template-errors";

export type ListStudioTemplatesFilters = {
  tenantKey?: string;
  category?: CreativeTemplateCategory;
};

function listWhereClause(
  user: User | null,
  filters: ListStudioTemplatesFilters,
): Prisma.CreativeTemplateWhereInput {
  const categoryClause = filters.category ? { category: filters.category } : {};

  if (!user) {
    return {
      tenantKey: "system",
      status: CreativeTemplateStatus.PUBLISHED,
      ...categoryClause,
    };
  }

  if (isKitAdmin(user.role)) {
    return {
      ...(filters.tenantKey ? { tenantKey: filters.tenantKey } : {}),
      ...categoryClause,
    };
  }

  return {
    AND: [
      categoryClause,
      {
        OR: [
          { tenantKey: "system", status: CreativeTemplateStatus.PUBLISHED },
          { tenantKey: `user:${user.id}` },
        ],
      },
    ],
  };
}

export async function listStudioTemplates(
  user: User | null,
  filters: ListStudioTemplatesFilters,
): Promise<CreativeTemplate[]> {
  try {
    return await prisma.creativeTemplate.findMany({
      where: listWhereClause(user, filters),
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
    });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[rhub] CreativeTemplate table missing; run `npm run db:push`. Returning empty studio template list.",
        );
      }
      return [];
    }
    throw e;
  }
}

/** Small projection for in-memory merge with code-registry templates (no JSON payloads). */
export type StudioTemplateCatalogRow = Pick<
  CreativeTemplate,
  | "id"
  | "tenantKey"
  | "slug"
  | "name"
  | "description"
  | "category"
  | "status"
  | "registrySourceId"
  | "updatedAt"
>;

/**
 * Lightweight list for unified catalog dedupe; respects same visibility as listStudioTemplates.
 * `take` is higher than listStudioTemplates because merge needs all visible rows that reference a kit id.
 */
export async function listStudioTemplatesForCatalogMerge(
  user: User | null,
  filters: ListStudioTemplatesFilters,
): Promise<StudioTemplateCatalogRow[]> {
  try {
    return await prisma.creativeTemplate.findMany({
      where: listWhereClause(user, filters),
      select: {
        id: true,
        tenantKey: true,
        slug: true,
        name: true,
        description: true,
        category: true,
        status: true,
        registrySourceId: true,
        updatedAt: true,
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 500,
    });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[rhub] CreativeTemplate table missing; run `npm run db:push`. Unified kit catalog uses registry only.",
        );
      }
      return [];
    }
    throw e;
  }
}

export async function getStudioTemplateById(
  user: User | null,
  id: string,
): Promise<CreativeTemplate | null> {
  let row: CreativeTemplate | null;
  try {
    row = await prisma.creativeTemplate.findUnique({ where: { id } });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      throw new CreativeTemplateSchemaError();
    }
    throw e;
  }
  if (!row) return null;
  if (!canReadTemplate(user, row)) {
    throw new StudioPermissionError("Not allowed to read this template.");
  }
  return row;
}

export type CreateStudioTemplateInput = {
  tenantKey: string;
  slug: string;
  name: string;
  description?: string | null;
  category: CreativeTemplateCategory;
  status?: CreativeTemplateStatus;
  registrySourceId?: string | null;
  definition: Prisma.InputJsonValue;
  meta?: Prisma.InputJsonValue | null;
  createdByUserId: string;
};

export async function createStudioTemplate(
  user: User,
  input: CreateStudioTemplateInput,
): Promise<CreativeTemplate> {
  try {
    assertTenantWritable(user, input.tenantKey);

    if (input.registrySourceId) {
      const dup = await prisma.creativeTemplate.findFirst({
        where: {
          tenantKey: input.tenantKey,
          registrySourceId: input.registrySourceId,
          status: { not: CreativeTemplateStatus.ARCHIVED },
        },
        select: { id: true },
      });
      if (dup) {
        throw new StudioConflictError(
          "A non-archived studio template already exists for this catalog identifier. Update the existing row or archive it first.",
        );
      }
    }

    return await prisma.creativeTemplate.create({
      data: {
        tenantKey: input.tenantKey,
        slug: input.slug,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        status: input.status ?? CreativeTemplateStatus.DRAFT,
        registrySourceId: input.registrySourceId ?? null,
        definition: input.definition,
        meta:
          input.meta === null
            ? Prisma.JsonNull
            : (input.meta ?? undefined),
        createdByUserId: input.createdByUserId,
        updatedByUserId: input.createdByUserId,
      },
    });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      throw new CreativeTemplateSchemaError();
    }
    throw e;
  }
}

export type UpdateStudioTemplateInput = {
  name?: string;
  description?: string | null;
  status?: CreativeTemplateStatus;
  definition?: Prisma.InputJsonValue;
  meta?: Prisma.InputJsonValue | null;
  registrySourceId?: string | null;
  publishedAt?: Date | null;
  publishNow?: boolean;
};

export async function updateStudioTemplate(
  user: User,
  id: string,
  patch: UpdateStudioTemplateInput,
): Promise<CreativeTemplate> {
  try {
    const row = await prisma.creativeTemplate.findUnique({ where: { id } });
    if (!row) {
      throw new StudioPermissionError("Template not found.");
    }
    if (!canReadTemplate(user, row)) {
      throw new StudioPermissionError("Not allowed to update this template.");
    }
    assertTenantWritable(user, row.tenantKey);

    const data: Prisma.CreativeTemplateUpdateInput = {
      updatedByUserId: user.id,
    };

    if (patch.name !== undefined) data.name = patch.name;
    if (patch.description !== undefined) data.description = patch.description;
    if (patch.definition !== undefined) data.definition = patch.definition;
    if (patch.meta !== undefined) {
      data.meta =
        patch.meta === null ? Prisma.JsonNull : (patch.meta as Prisma.InputJsonValue);
    }
    if (patch.registrySourceId !== undefined) {
      if (patch.registrySourceId !== null) {
        const dup = await prisma.creativeTemplate.findFirst({
          where: {
            tenantKey: row.tenantKey,
            registrySourceId: patch.registrySourceId,
            status: { not: CreativeTemplateStatus.ARCHIVED },
            NOT: { id: row.id },
          },
          select: { id: true },
        });
        if (dup) {
          throw new StudioConflictError(
            "Another non-archived template already uses this catalog identifier for this tenant.",
          );
        }
      }
      data.registrySourceId = patch.registrySourceId;
    }
    if (patch.status !== undefined) data.status = patch.status;
    if (patch.publishedAt !== undefined) data.publishedAt = patch.publishedAt;
    if (patch.publishNow) {
      data.status = CreativeTemplateStatus.PUBLISHED;
      data.publishedAt = new Date();
    }

    return await prisma.creativeTemplate.update({
      where: { id },
      data,
    });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      throw new CreativeTemplateSchemaError();
    }
    throw e;
  }
}

export async function archiveStudioTemplate(
  user: User,
  id: string,
): Promise<CreativeTemplate> {
  return updateStudioTemplate(user, id, {
    status: CreativeTemplateStatus.ARCHIVED,
  });
}

export type ForkStudioTemplateInput = {
  targetTenantKey: string;
  slug: string;
  name: string;
};

export async function forkStudioTemplate(
  user: User,
  sourceId: string,
  input: ForkStudioTemplateInput,
): Promise<CreativeTemplate> {
  try {
    const src = await prisma.creativeTemplate.findUnique({
      where: { id: sourceId },
    });
    if (!src) {
      throw new StudioPermissionError("Source template not found.");
    }
    if (!canReadTemplate(user, src)) {
      throw new StudioPermissionError("Not allowed to fork this template.");
    }
    assertTenantWritable(user, input.targetTenantKey);

    return await prisma.creativeTemplate.create({
      data: {
        tenantKey: input.targetTenantKey,
        slug: input.slug,
        name: input.name,
        description: src.description,
        category: src.category,
        status: CreativeTemplateStatus.DRAFT,
        registrySourceId: null,
        definition: src.definition as Prisma.InputJsonValue,
        meta:
          src.meta === null
            ? Prisma.JsonNull
            : (src.meta as Prisma.InputJsonValue),
        forkedFromId: src.id,
        createdByUserId: user.id,
        updatedByUserId: user.id,
      },
    });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      throw new CreativeTemplateSchemaError();
    }
    throw e;
  }
}

export { CreativeTemplateSchemaError } from "./creative-template-errors";
export { CreativeTemplateCategory, CreativeTemplateStatus };
