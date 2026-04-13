import { PaymentShell } from "@/components/tools/conf/payment-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export default async function PaymentsPage() {
  await requireConferencePageAccess("/tools/conf/payments");

  return (
    <div className="py-6">
      <PaymentShell />
    </div>
  );
}
