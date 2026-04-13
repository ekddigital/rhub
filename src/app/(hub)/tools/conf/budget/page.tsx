import { BudgetShell } from "@/components/tools/conf/budget-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function BudgetPage() {
  await requireConferencePageAccess("/tools/conf/budget");

  return (
    <div className="py-6">
      <BudgetShell />
    </div>
  );
}
