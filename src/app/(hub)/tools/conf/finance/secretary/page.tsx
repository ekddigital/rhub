import { redirect } from "next/navigation";
import { FinanceSecretaryShell } from "@/components/tools/conf/finance-secretary-shell";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";
import { getConferenceAccess } from "@/lib/conf/access";

export const dynamic = "force-dynamic";

export default async function FinanceSecretaryPage() {
  const conf = await ensureDefaultConference();
  const access = await getConferenceAccess(conf.id);

  if (!access.user) {
    redirect("/login?redirect=/tools/conf/finance/secretary");
  }

  const canAccessSecretaryView =
    access.isSuperAdmin ||
    access.isChair ||
    access.memberRole === "TREASURER";

  if (!canAccessSecretaryView) {
    redirect("/tools/conf?forbidden=1");
  }

  return (
    <div className="py-6">
      <FinanceSecretaryShell />
    </div>
  );
}
