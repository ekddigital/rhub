import type {
  ConfEvent,
  ConfMember,
  ConfBudget,
  ConfBudgetItem,
  ConfPayment,
  ConfPaymentProof,
  ConfDelegate,
  ConfMeeting,
  ConfTimeline,
  ConfPairRequest,
  ConfRoomAssignment,
  ConfFinanceAuditLog,
  ConfReport,
  ConfReportEntry,
  BudgetCat,
  BudgetStatus,
  PayMethod,
  PayStatus,
  PaymentType,
  ConfRole,
  DelStatus,
  MeetStatus,
  ConfStatus,
  Gender,
  RoomPref,
  PairReqType,
  PairReqStatus,
  RoomAssignStatus,
} from "@prisma/client";

// Re-export Prisma types
export type {
  ConfEvent,
  ConfMember,
  ConfBudget,
  ConfBudgetItem,
  ConfPayment,
  ConfPaymentProof,
  ConfDelegate,
  ConfMeeting,
  ConfTimeline,
  ConfPairRequest,
  ConfRoomAssignment,
  ConfFinanceAuditLog,
  ConfReport,
  ConfReportEntry,
};

// Re-export enums
export {
  BudgetCat,
  BudgetStatus,
  PayMethod,
  PayStatus,
  PaymentType,
  ConfRole,
  DelStatus,
  MeetStatus,
  ConfStatus,
  Gender,
  RoomPref,
  PairReqType,
  PairReqStatus,
  RoomAssignStatus,
};

// Extended types with relations
export type BudgetWithItems = ConfBudget & {
  items: ConfBudgetItem[];
  creator: ConfMember;
  _count?: { payments: number };
};

export type PaymentWithProofs = ConfPayment & {
  proofs: ConfPaymentProof[];
  budget?: ConfBudget | null;
  item?: ConfBudgetItem | null;
  submittedBy?: ConfMember | null;
  committeeApprover?: ConfMember | null;
};

export type EventWithRelations = ConfEvent & {
  members: ConfMember[];
  budgets: BudgetWithItems[];
  _count?: {
    delegates: number;
    meetings: number;
    payments: number;
  };
};

// Budget summary for dashboard
export type BudgetSummary = {
  totalBudgeted: number;
  totalPaid: number;
  totalPending: number;
  byCategory: Record<string, { budgeted: number; paid: number }>;
};

// Form input types
export type BudgetItemInput = {
  no: number;
  name: string;
  desc?: string;
  qty: number;
  unit: string;
  unitPrice: number;
  notes?: string;
};

export type CreateBudgetInput = {
  confId: string;
  createdBy: string;
  title: string;
  category: BudgetCat;
  notes?: string;
  items: BudgetItemInput[];
};

export type CreatePaymentInput = {
  confId: string;
  budgetId?: string;
  itemId?: string;
  amount: number;
  paidBy: string;
  paidTo?: string;
  method: PayMethod;
  ref?: string;
  note?: string;
  paymentType?: PaymentType;
  incomeSource?: string;
  committeeScope?: string;
  submittedByMemberId?: string;
};

// Report types
export type ReportWithEntries = ConfReport & {
  entries: (ConfReportEntry & {
    payment:
      | (ConfPayment & {
          proofs: ConfPaymentProof[];
        })
      | null;
  })[];
};

// Audit log type
export type AuditLogEntry = ConfFinanceAuditLog;

// Committee member with permissions
export type MemberWithPermissions = ConfMember & {
  user?: { id: string; name: string; email: string } | null;
};
