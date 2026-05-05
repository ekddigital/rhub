import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";
import { getKitSession } from "@/lib/kit/session";
import { forkStudioTemplate, CreativeTemplateSchemaError } from "@/lib/creative/studio/template-repository";
import { forkStudioTemplateBodySchema } from "@/lib/creative/studio/template-schemas";
import { StudioPermissionError } from "@/lib/creative/studio/template-policy";
import { revalidateTag } from "next/cache";

export function OPTIONS() {
  return kitOptions();
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id: sourceId } = await ctx.params;
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  try {
    const json: unknown = await req.json();
    const body = forkStudioTemplateBodySchema.parse(json);

    const template = await forkStudioTemplate(session.user, sourceId, {
      targetTenantKey: body.targetTenantKey,
      slug: body.slug,
      name: body.name,
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
    if (error instanceof CreativeTemplateSchemaError) {
      return kitError(error.message, 503);
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return kitError("A template with this slug already exists for the tenant.", 409);
    }
    console.error("[kit.studio-templates.fork.POST]", error);
    return kitError("Failed to fork template", 500);
  }
}
