import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";
import {
  canAccessConferenceTreasurerFinance,
  canManageConferenceDelegateFinanceFs,
} from "@/lib/conf/conference-finance-access";
import { FinanceSectionNav } from "@/components/tools/conf/finance-section-nav";

export const dynamic = "force-dynamic";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const conf = await ensureDefaultConference();
  const access = await getConferenceAccess(conf.id);

  const showFs = Boolean(access.user) && canManageConferenceDelegateFinanceFs(access);
  const showTreasurer =
    Boolean(access.user) && canAccessConferenceTreasurerFinance(access);
  const showOps =
    Boolean(access.user) &&
    (access.isManager || access.isSuperAdmin || access.isChair);

  return (
    <div className="space-y-4 py-2">
      <FinanceSectionNav
        showFs={showFs}
        showTreasurer={showTreasurer}
        showOps={showOps}
      />
      {children}
    </div>
  );
}
