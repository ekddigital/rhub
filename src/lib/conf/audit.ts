import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type AuditAction =
  | "PAYMENT_CREATED"
  | "PAYMENT_UPDATED"
  | "PAYMENT_DELETED"
  | "PAYMENT_COMMITTEE_APPROVED"
  | "PAYMENT_FINAL_APPROVED"
  | "PAYMENT_REJECTED"
  | "PAYMENT_PROOF_UPLOADED"
  | "BUDGET_CREATED"
  | "BUDGET_UPDATED"
  | "BUDGET_APPROVED"
  | "BUDGET_REJECTED"
  | "BUDGET_DELETED"
  | "BUDGET_EDIT_UNLOCK_REQUESTED"
  | "BUDGET_EDIT_UNLOCK_GRANTED"
  | "BUDGET_EDIT_UNLOCK_REJECTED"
  | "BUDGET_EDIT_RELOCKED"
  | "REPORT_CREATED"
  | "REPORT_EXPORTED"
  | "MEMBER_CHAIR_ASSIGNED"
  | "MEMBER_SCOPE_SET"
  | "MEMBER_USER_LINKED";

export async function logFinanceAction(opts: {
  confId: string;
  actorUserId?: string | null;
  actorName: string;
  action: AuditAction;
  entityType: "payment" | "budget" | "report" | "member";
  entityId: string;
  details?: Prisma.InputJsonValue;
  note?: string | null;
}) {
  await prisma.confFinanceAuditLog.create({
    data: {
      confId: opts.confId,
      actorUserId: opts.actorUserId ?? null,
      actorName: opts.actorName,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId,
      details: opts.details ?? Prisma.JsonNull,
      note: opts.note ?? null,
    },
  });
}
