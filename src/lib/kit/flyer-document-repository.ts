import {
  CreativeTemplateCategory,
  CreativeTemplateStatus,
  type CreativeTemplate,
  type User,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  assertTenantWritable,
} from "@/lib/creative/studio/template-policy";
import {
  CreativeTemplateSchemaError,
  isCreativeTemplateTableMissing,
} from "@/lib/creative/studio/creative-template-errors";

const KIT_FLYER_SLUG = "kit-flyer-studio";
const MAX_DEFINITION_BYTES = 1_200_000;

export function userFlyerTenantKey(userId: string) {
  return `user:${userId}`;
}

function assertDefinitionPayload(definition: unknown) {
  if (definition === undefined || definition === null) {
    throw new Error("definition is required");
  }
  const s = JSON.stringify(definition);
  const bytes = new TextEncoder().encode(s).length;
  if (bytes > MAX_DEFINITION_BYTES) {
    throw new Error(
      "Flyer document is too large. Upload images via Kit assets instead of embedding huge files.",
    );
  }
}

/** Per-user Creative Kit flyer draft (stored as `CreativeTemplate` JSON definition). */
export async function getUserFlyerDocument(
  user: User,
): Promise<CreativeTemplate | null> {
  try {
    return await prisma.creativeTemplate.findUnique({
      where: {
        tenantKey_slug: {
          tenantKey: userFlyerTenantKey(user.id),
          slug: KIT_FLYER_SLUG,
        },
      },
    });
  } catch (e) {
    if (isCreativeTemplateTableMissing(e)) {
      throw new CreativeTemplateSchemaError();
    }
    throw e;
  }
}

export async function upsertUserFlyerDocument(
  user: User,
  definition: Prisma.InputJsonValue,
): Promise<CreativeTemplate> {
  assertDefinitionPayload(definition);
  const tenantKey = userFlyerTenantKey(user.id);
  assertTenantWritable(user, tenantKey);

  try {
    return await prisma.creativeTemplate.upsert({
      where: {
        tenantKey_slug: { tenantKey, slug: KIT_FLYER_SLUG },
      },
      create: {
        tenantKey,
        slug: KIT_FLYER_SLUG,
        name: "Creative Kit flyer draft",
        description: "Cloud-synced flyer studio state from Creative Kit",
        category: CreativeTemplateCategory.FLYER,
        status: CreativeTemplateStatus.DRAFT,
        registrySourceId: "conf-flyer-studio",
        definition,
        createdByUserId: user.id,
        updatedByUserId: user.id,
      },
      update: {
        definition,
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
