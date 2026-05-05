import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";
import { getKitSession } from "@/lib/kit/session";
import {
  getStudioTemplateById,
  updateStudioTemplate,
  archiveStudioTemplate,
  CreativeTemplateSchemaError,
} from "@/lib/creative/studio/template-repository";
import { updateStudioTemplateBodySchema } from "@/lib/creative/studio/template-schemas";
import {
  StudioConflictError,
  StudioPermissionError,
} from "@/lib/creative/studio/template-policy";
import { revalidateTag } from "next/cache";

export function OPTIONS() {
  return kitOptions();
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getKitSession();

  try {
    const template = await getStudioTemplateById(session?.user ?? null, id);
    if (!template) {
      return kitError("Not found", 404);
    }
    return kitJson({ template });
  } catch (error) {
    if (error instanceof StudioPermissionError) {
      return kitError(error.message, 403);
    }
    if (error instanceof CreativeTemplateSchemaError) {
      return kitError(error.message, 503);
    }
    console.error("[kit.studio-templates.[id].GET]", error);
    return kitError("Failed to load template", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  try {
    const json: unknown = await req.json();
    const body = updateStudioTemplateBodySchema.parse(json);

    const template = await updateStudioTemplate(session.user, id, {
      name: body.name,
      description: body.description,
      status: body.status,
      definition: body.definition as Prisma.InputJsonValue | undefined,
      meta: body.meta as Prisma.InputJsonValue | null | undefined,
      registrySourceId: body.registrySourceId,
      publishNow: body.publish === true,
    });

    revalidateTag("kit-unified", { expire: 0 });
    return kitJson({ template });
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
    if (error instanceof CreativeTemplateSchemaError) {
      return kitError(error.message, 503);
    }
    console.error("[kit.studio-templates.[id].PATCH]", error);
    return kitError("Failed to update template", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  try {
    const template = await archiveStudioTemplate(session.user, id);
    revalidateTag("kit-unified", { expire: 0 });
    return kitJson({ template });
  } catch (error) {
    if (error instanceof StudioPermissionError) {
      return kitError(error.message, 403);
    }
    if (error instanceof CreativeTemplateSchemaError) {
      return kitError(error.message, 503);
    }
    console.error("[kit.studio-templates.[id].DELETE]", error);
    return kitError("Failed to archive template", 500);
  }
}
