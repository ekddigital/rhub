import { redirect } from "next/navigation";
import { ConferenceFinanceDelegatesBoard } from "@/components/tools/conf/conference-finance-delegates-board";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";
import { canAccessConferenceTreasurerFinance } from "@/lib/conf/conference-finance-access";

export const dynamic = "force-dynamic";

export default async function FinanceTreasurerPage() {
  const conf = await ensureDefaultConference();
  const access = await getConferenceAccess(conf.id);

  if (!access.user) {
    redirect("/login?redirect=/tools/conf/finance/treasurer");
  }

  if (!canAccessConferenceTreasurerFinance(access)) {
    redirect("/tools/conf?forbidden=1");
  }

  return (
    <div className="py-4">
      <ConferenceFinanceDelegatesBoard variant="treasurer" />
    </div>
  );
}
