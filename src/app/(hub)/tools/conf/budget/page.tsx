import { BudgetShell } from "@/components/tools/conf/budget-shell";
import {
  requireConferencePageAccess,
  getConferenceAccess,
} from "@/lib/conf/access";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";

export default async function BudgetPage() {
  await requireConferencePageAccess("/tools/conf/budget", "manager");

  let accessInfo = {
    isManager: false,
    isChair: false,
    isSuperAdmin: false,
    canApprovePayments: false,
    memberId: null as string | null,
    committeeScope: null as string | null,
  };

  try {
    const conf = await ensureDefaultConference();
    const access = await getConferenceAccess(conf.id);
    accessInfo = {
      isManager: access.isManager,
      isChair: access.isChair,
      isSuperAdmin: access.isSuperAdmin,
      canApprovePayments: access.canApprovePayments,
      memberId: access.memberId,
      committeeScope: access.committeeScope,
    };
  } catch {
    // fallback
  }

  return (
    <div className="py-6">
      <BudgetShell accessInfo={accessInfo} />
    </div>
  );
}
