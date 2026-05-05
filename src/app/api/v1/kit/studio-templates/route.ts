import { NextRequest } from "next/server";
import { ZodError } from "zod";
import {
  CreativeTemplateCategory,
  Prisma,
} from "@prisma/client";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";
import { getKitSession } from "@/lib/kit/session";
import {
  listStudioTemplates,
  createStudioTemplate,
  CreativeTemplateSchemaError,
} from "@/lib/creative/studio/template-repository";
import { createStudioTemplateBodySchema } from "@/lib/creative/studio/template-schemas";
import {
  StudioConflictError,
  StudioPermissionError,
  isKitAdmin,
} from "@/lib/creative/studio/template-policy";
import { revalidateTag } from "next/cache";
import {
  SYSTEM_TENANT_KEY,
  userTenantKey,
} from "@/lib/creative/studio/tenant-keys";

function parseCategory(
  raw: string | null,
): CreativeTemplateCategory | undefined {
  if (!raw) return undefined;
  const key = raw.toUpperCase().replace(/-/g, "_");
  return CreativeTemplateCategory[
    key as keyof typeof CreativeTemplateCategory
  ];
}

export function OPTIONS() {
  return kitOptions();
}

export async function GET(req: NextRequest) {
  const session = await getKitSession();
  const user = session?.user ?? null;
  const { searchParams } = req.nextUrl;
  const category = parseCategory(searchParams.get("category"));
  if (searchParams.get("category") && category === undefined) {
    return kitError("Invalid category", 400);
  }
  const tenantKey = searchParams.get("tenantKey") ?? undefined;

  try {
    const templates = await listStudioTemplates(user, {
      category,
      tenantKey: tenantKey ?? undefined,
    });
    return kitJson({ count: templates.length, templates });
  } catch (error) {
    console.error("[kit.studio-templates.GET]", error);
    return kitError("Failed to list studio templates", 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  try {
    const json: unknown = await req.json();
    const body = createStudioTemplateBodySchema.parse(json);
    const tenantKey =
      body.tenantKey ??
      (isKitAdmin(session.user.role)
        ? SYSTEM_TENANT_KEY
        : userTenantKey(session.user.id));

    const template = await createStudioTemplate(session.user, {
      tenantKey,
      slug: body.slug,
      name: body.name,
      description: body.description,
      category: body.category,
      status: body.status,
      registrySourceId: body.registrySourceId,
      definition: body.definition as Prisma.InputJsonValue,
      meta: body.meta as Prisma.InputJsonValue | null | undefined,
      createdByUserId: session.user.id,
    });

    revalidateTag("kit-unified", { expire: 0 });
    return kitJson({ template }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return kitError(
        error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
        400,
      );
    }
    if (error instanceof StudioPermissionError) {
      return kitError(error.message, 403);
    }
    if (error instanceof StudioConflictError) {
      return kitError(error.message, 409);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return kitError("A template with this slug already exists for the tenant.", 409);
    }
    if (error instanceof CreativeTemplateSchemaError) {
      return kitError(error.message, 503);
    }
    console.error("[kit.studio-templates.POST]", error);
    return kitError("Failed to create studio template", 500);
  }
}
