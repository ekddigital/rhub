import { FinanceAuditShell } from "@/components/tools/conf/finance-audit-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function FinanceAuditPage() {
  await requireConferencePageAccess("/tools/conf/finance/audit");

  return (
    <div className="py-6">
      <FinanceAuditShell />
    </div>
  );
}
