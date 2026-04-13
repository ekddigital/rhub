import { prisma } from "@/lib/prisma";

export type AdminAuditEntryInput = {
  actorUserId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  targetName?: string | null;
  action: string;
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  note?: string | null;
};

function serializeAuditValue(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export async function writeAdminAuditEntries(entries: AdminAuditEntryInput[]) {
  if (!entries.length) return;

  await prisma.userAccessAuditLog.createMany({
    data: entries.map((entry) => ({
      actorUserId: entry.actorUserId,
      actorEmail: entry.actorEmail,
      targetUserId: entry.targetUserId,
      targetEmail: entry.targetEmail,
      targetName: entry.targetName ?? null,
      action: entry.action,
      field: entry.field ?? null,
      oldValue: serializeAuditValue(entry.oldValue),
      newValue: serializeAuditValue(entry.newValue),
      note: entry.note ?? null,
    })),
  });
}
