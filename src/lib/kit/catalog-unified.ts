import type { User } from "@prisma/client";
import {
  CreativeTemplateCategory,
  CreativeTemplateStatus,
} from "@prisma/client";
import { unstable_cache } from "next/cache";
import {
  listStudioTemplatesForCatalogMerge,
  type ListStudioTemplatesFilters,
  type StudioTemplateCatalogRow,
} from "@/lib/creative/studio/template-repository";
import type {
  KitTemplateCategory,
  KitTemplateDefinition,
} from "./templates-registry";
import { getKitTemplates } from "./templates-registry";

export type UnifiedCatalogCategory = KitTemplateCategory | "brand" | "other";

export type UnifiedTemplateEntry = {
  /** Catalog kit id when merged/catalog-only; studio CUID when studio-only. */
  id: string;
  catalogId: string | null;
  studioTemplateId: string | null;
  kind: "catalog" | "merged" | "studio_only";
  category: UnifiedCatalogCategory;
  title: string;
  description: string;
  outputs: KitTemplateDefinition["outputs"];
  implementation: KitTemplateDefinition["implementation"];
  workspacePath?: string;
  catalogStatus?: KitTemplateDefinition["status"];
  studioStatus?: CreativeTemplateStatus;
  tenantKey?: string;
  updatedAt?: string;
};

export type UnifiedCatalogFilters = {
  category?: KitTemplateCategory;
  status?: KitTemplateDefinition["status"];
};

export function kitCategoryToPrismaCategory(
  category: KitTemplateCategory | undefined,
): CreativeTemplateCategory | undefined {
  if (!category || category === "conversion") return undefined;
  const map: Record<
    Exclude<KitTemplateCategory, "conversion">,
    CreativeTemplateCategory
  > = {
    flyer: CreativeTemplateCategory.FLYER,
    brochure: CreativeTemplateCategory.BROCHURE,
    certificate: CreativeTemplateCategory.CERTIFICATE,
    booklet: CreativeTemplateCategory.BOOKLET,
    letter: CreativeTemplateCategory.LETTER,
    document: CreativeTemplateCategory.DOCUMENT,
  };
  return map[category];
}

function prismaCategoryToUnified(
  c: CreativeTemplateCategory,
): UnifiedCatalogCategory {
  switch (c) {
    case CreativeTemplateCategory.CERTIFICATE:
      return "certificate";
    case CreativeTemplateCategory.FLYER:
      return "flyer";
    case CreativeTemplateCategory.DOCUMENT:
      return "document";
    case CreativeTemplateCategory.BROCHURE:
      return "brochure";
    case CreativeTemplateCategory.BOOKLET:
      return "booklet";
    case CreativeTemplateCategory.LETTER:
      return "letter";
    case CreativeTemplateCategory.BRAND_PRESET:
      return "brand";
    default:
      return "other";
  }
}

function guessImplementation(
  c: CreativeTemplateCategory,
): KitTemplateDefinition["implementation"] {
  switch (c) {
    case CreativeTemplateCategory.CERTIFICATE:
      return "creative-certificates";
    case CreativeTemplateCategory.FLYER:
      return "creative-flyers";
    case CreativeTemplateCategory.DOCUMENT:
      return "creative-documents";
    default:
      return "planned";
  }
}

function scoreStudio(row: StudioTemplateCatalogRow): number {
  let s = 0;
  if (row.status === CreativeTemplateStatus.PUBLISHED) s += 1000;
  if (row.status === CreativeTemplateStatus.DRAFT) s += 100;
  if (row.status === CreativeTemplateStatus.ARCHIVED) s -= 500;
  return s + row.updatedAt.getTime() / 1e12;
}

function sortUnified(a: UnifiedTemplateEntry, b: UnifiedTemplateEntry): number {
  const c = a.category.localeCompare(b.category);
  if (c !== 0) return c;
  return a.title.localeCompare(b.title);
}

const getAnonUnifiedFullCatalog = unstable_cache(
  async () => {
    const kits = getKitTemplates();
    const rows = await listStudioTemplatesForCatalogMerge(null, {});
    return buildUnifiedCatalog(kits, rows);
  },
  ["kit-unified-anon-full"],
  { revalidate: 60, tags: ["kit-unified"] },
);

/**
 * Pure merge: one row per kit template, plus studio rows not tied to a kit id (or orphan `registrySourceId`).
 * When multiple studio rows reference the same kit id, the highest-score row wins (published & recent first).
 */
export function buildUnifiedCatalog(
  kitTemplates: KitTemplateDefinition[],
  studioRows: StudioTemplateCatalogRow[],
): UnifiedTemplateEntry[] {
  const kitById = new Map(kitTemplates.map((k) => [k.id, k]));
  const kitIds = new Set(kitTemplates.map((k) => k.id));

  const bestByRegistry = new Map<string, StudioTemplateCatalogRow>();
  for (const row of studioRows) {
    if (!row.registrySourceId) continue;
    if (!kitIds.has(row.registrySourceId)) continue;
    const prev = bestByRegistry.get(row.registrySourceId);
    if (!prev || scoreStudio(row) > scoreStudio(prev)) {
      bestByRegistry.set(row.registrySourceId, row);
    }
  }

  const consumedStudioIds = new Set(
    [...bestByRegistry.values()].map((r) => r.id),
  );

  const out: UnifiedTemplateEntry[] = [];

  for (const kit of kitTemplates) {
    const st = bestByRegistry.get(kit.id);
    if (st) {
      out.push({
        id: kit.id,
        catalogId: kit.id,
        studioTemplateId: st.id,
        kind: "merged",
        category: kit.category,
        title: st.name?.trim() ? st.name : kit.title,
        description:
          st.description?.trim() ? st.description : kit.description,
        outputs: kit.outputs,
        implementation: kit.implementation,
        workspacePath: kit.workspacePath,
        catalogStatus: kit.status,
        studioStatus: st.status,
        tenantKey: st.tenantKey,
        updatedAt: st.updatedAt.toISOString(),
      });
    } else {
      out.push({
        id: kit.id,
        catalogId: kit.id,
        studioTemplateId: null,
        kind: "catalog",
        category: kit.category,
        title: kit.title,
        description: kit.description,
        outputs: kit.outputs,
        implementation: kit.implementation,
        workspacePath: kit.workspacePath,
        catalogStatus: kit.status,
      });
    }
  }

  for (const row of studioRows) {
    if (consumedStudioIds.has(row.id)) continue;

    const uCat = prismaCategoryToUnified(row.category);
    const orphanCatalogId =
      row.registrySourceId && !kitIds.has(row.registrySourceId)
        ? row.registrySourceId
        : null;

    out.push({
      id: row.id,
      catalogId: orphanCatalogId,
      studioTemplateId: row.id,
      kind: "studio_only",
      category: uCat,
      title: row.name,
      description: row.description ?? "",
      outputs: [],
      implementation: guessImplementation(row.category),
      catalogStatus: undefined,
      studioStatus: row.status,
      tenantKey: row.tenantKey,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  return out.sort(sortUnified);
}

export async function getUnifiedTemplateCatalog(
  user: User | null,
  filters: UnifiedCatalogFilters = {},
): Promise<{ count: number; entries: UnifiedTemplateEntry[] }> {
  const hasFilters = Boolean(filters.category ?? filters.status);

  if (!user && !hasFilters) {
    const entries = await getAnonUnifiedFullCatalog();
    return { count: entries.length, entries };
  }

  const kits = getKitTemplates({
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.status ? { status: filters.status } : {}),
  });

  let studioRows: StudioTemplateCatalogRow[];
  if (filters.category === "conversion") {
    studioRows = [];
  } else {
    const prismaCat = kitCategoryToPrismaCategory(filters.category);
    const studioFilters: ListStudioTemplatesFilters = {
      ...(prismaCat ? { category: prismaCat } : {}),
    };
    studioRows = await listStudioTemplatesForCatalogMerge(user, studioFilters);
  }

  const entries = buildUnifiedCatalog(kits, studioRows);
  return { count: entries.length, entries };
}
