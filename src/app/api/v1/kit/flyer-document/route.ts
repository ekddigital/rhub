import type { Prisma } from "@prisma/client";
import { getKitSession } from "@/lib/kit/session";
import { kitError, kitJson, kitOptions } from "@/lib/kit/http";
import {
  getUserFlyerDocument,
  upsertUserFlyerDocument,
} from "@/lib/kit/flyer-document-repository";
import { CreativeTemplateSchemaError } from "@/lib/creative/studio/creative-template-errors";
import { StudioPermissionError } from "@/lib/creative/studio/template-policy";

export function OPTIONS() {
  return kitOptions();
}

/** GET — load the signed-in user's Creative Kit flyer document from the database. */
export async function GET() {
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  try {
    const row = await getUserFlyerDocument(session.user);
    if (!row) {
      return kitJson(
        { saved: false, definition: null, updatedAt: null, id: null },
        { status: 200 },
      );
    }
    return kitJson({
      saved: true,
      id: row.id,
      definition: row.definition,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof CreativeTemplateSchemaError) {
      return kitError(
        "Creative studio tables are not migrated. Run `npx prisma db push` (or apply migrations) so flyer documents can sync.",
        503,
      );
    }
    if (e instanceof StudioPermissionError) {
      return kitError(e.message, 403);
    }
    console.error("[kit.flyer-document.GET]", e);
    return kitError("Failed to load flyer document", 500);
  }
}

/** PUT — save (upsert) flyer studio JSON for the signed-in user. */
export async function PUT(req: Request) {
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return kitError("Invalid JSON body", 400);
  }

  if (!body || typeof body !== "object") {
    return kitError("Body must be an object with a definition field", 400);
  }

  const definition = (body as { definition?: unknown }).definition;
  if (definition === undefined || definition === null) {
    return kitError("Missing definition", 400);
  }

  try {
    const row = await upsertUserFlyerDocument(
      session.user,
      definition as Prisma.InputJsonValue,
    );
    return kitJson({
      saved: true,
      id: row.id,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    if (e instanceof CreativeTemplateSchemaError) {
      return kitError(
        "Creative studio tables are not migrated. Run `npx prisma db push` (or apply migrations) so flyer documents can sync.",
        503,
      );
    }
    if (e instanceof StudioPermissionError) {
      return kitError(e.message, 403);
    }
    const msg = e instanceof Error ? e.message : "Save failed";
    if (msg.includes("too large")) {
      return kitError(msg, 413);
    }
    console.error("[kit.flyer-document.PUT]", e);
    return kitError("Failed to save flyer document", 500);
  }
}
