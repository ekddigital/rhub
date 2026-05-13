import { redirect } from "next/navigation";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";
import {
  canAccessConferenceTreasurerFinance,
  canManageConferenceDelegateFinanceFs,
} from "@/lib/conf/conference-finance-access";

export const dynamic = "force-dynamic";

export default async function FinanceIndexPage() {
  const conf = await ensureDefaultConference();
  const access = await getConferenceAccess(conf.id);

  if (!access.user) {
    redirect("/login?redirect=/tools/conf/finance");
  }

  if (canManageConferenceDelegateFinanceFs(access)) {
    redirect("/tools/conf/finance/fs");
  }
  if (canAccessConferenceTreasurerFinance(access)) {
    redirect("/tools/conf/finance/treasurer");
  }

  redirect("/tools/conf?forbidden=1");
}
