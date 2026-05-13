import { redirect } from "next/navigation";
import { ConferenceFinanceDelegatesBoard } from "@/components/tools/conf/conference-finance-delegates-board";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";
import { canManageConferenceDelegateFinanceFs } from "@/lib/conf/conference-finance-access";

export const dynamic = "force-dynamic";

export default async function FinanceFsPage() {
  const conf = await ensureDefaultConference();
  const access = await getConferenceAccess(conf.id);

  if (!access.user) {
    redirect("/login?redirect=/tools/conf/finance/fs");
  }

  if (!canManageConferenceDelegateFinanceFs(access)) {
    redirect("/tools/conf?forbidden=1");
  }

  return (
    <div className="py-4">
      <ConferenceFinanceDelegatesBoard variant="fs" />
    </div>
  );
}
