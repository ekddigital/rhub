import { BudgetShell } from "@/components/tools/conf/budget-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const access = await requireConferencePageAccess(
    "/tools/conf/budget",
    "manager",
  );

  const accessInfo = {
    isManager: access.isManager,
    isChair: access.isChair,
    isSuperAdmin: access.isSuperAdmin,
    canApprovePayments: access.canApprovePayments,
    memberId: access.memberId,
    committeeScope: access.committeeScope,
  };

  return (
    <div className="py-6">
      <BudgetShell accessInfo={accessInfo} />
    </div>
  );
}
