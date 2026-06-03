import { ConferenceKeynoteCertificateShell } from "@/components/tools/conf/conference-keynote-certificate-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export const metadata = {
  title: "Keynote Certificate - LSUIC 2026",
};

export default async function ConferenceCertificatesPage() {
  await requireConferencePageAccess("/tools/conf/certificates", "manager");

  return (
    <div className="py-6">
      <ConferenceKeynoteCertificateShell />
    </div>
  );
}
