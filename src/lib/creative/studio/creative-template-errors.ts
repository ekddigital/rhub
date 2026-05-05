import { Prisma } from "@prisma/client";

/** Thrown when `CreativeTemplate` (or related) tables are not applied to the database yet. */
export class CreativeTemplateSchemaError extends Error {
  constructor() {
    super(
      "Creative kit database tables are missing. From the rhub directory run: npm run db:push",
    );
    this.name = "CreativeTemplateSchemaError";
  }
}

export function isCreativeTemplateTableMissing(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2021"
  ) {
    return false;
  }
  const meta = error.meta as { table?: string; modelName?: string } | undefined;
  const hint = `${meta?.table ?? ""} ${meta?.modelName ?? ""}`.toLowerCase();
  return hint.includes("creativetemplate");
}
