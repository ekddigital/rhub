import { PaymentShell } from "@/components/tools/conf/payment-shell-v2";
import {
  requireConferencePageAccess,
  getConferenceAccess,
} from "@/lib/conf/access";
import { ensureDefaultConference } from "@/lib/conf/bootstrap";

export default async function PaymentsPage() {
  await requireConferencePageAccess("/tools/conf/payments", "manager");

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
    // fallback — shell will show read-only view
  }

  return (
    <div className="py-6">
      <PaymentShell accessInfo={accessInfo} />
    </div>
  );
}
