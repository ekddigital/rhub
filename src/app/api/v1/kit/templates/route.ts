import { NextRequest } from "next/server";
import {
  getKitTemplates,
  type KitTemplateCategory,
} from "@/lib/kit/templates-registry";
import { getUnifiedTemplateCatalog } from "@/lib/kit/catalog-unified";
import { getKitSession } from "@/lib/kit/session";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";

export function OPTIONS() {
  return kitOptions();
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const mode = searchParams.get("mode");
  const category = searchParams.get("category") as KitTemplateCategory | null;
  const status = searchParams.get("status") as
    | "live"
    | "beta"
    | "planned"
    | null;

  const validCategories: KitTemplateCategory[] = [
    "flyer",
    "brochure",
    "certificate",
    "booklet",
    "letter",
    "document",
    "conversion",
  ];

  if (category && !validCategories.includes(category)) {
    return kitError(`Invalid category. Use one of: ${validCategories.join(", ")}`, 400);
  }

  if (mode === "unified") {
    try {
      const session = await getKitSession();
      const user = session?.user ?? null;
      const unified = await getUnifiedTemplateCatalog(user, {
        ...(category ? { category } : {}),
        ...(status ? { status } : {}),
      });
      return kitJson({
        mode: "unified" as const,
        count: unified.count,
        templates: unified.entries,
      });
    } catch (error) {
      console.error("[kit.templates.GET unified]", error);
      return kitError("Failed to load unified template catalog", 500);
    }
  }

  const templates = getKitTemplates({
    ...(category ? { category } : {}),
    ...(status ? { status } : {}),
  });

  return kitJson({
    mode: "catalog" as const,
    count: templates.length,
    templates,
  });
}
