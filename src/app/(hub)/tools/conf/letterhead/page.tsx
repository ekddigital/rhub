import { LetterheadDownloadKit } from "@/components/tools/conf/letterhead-download-kit";
import { requireConferencePageAccess } from "@/lib/conf/access";

export const metadata = {
  title: "Letterhead Downloads — LSUIC 2026",
  description:
    "Download LSUIC conference letterhead pieces for Word and Google Docs",
};

export default async function LetterheadDownloadsPage() {
  await requireConferencePageAccess("/tools/conf/letterhead", "manager");

  return (
    <div className="py-6">
      <LetterheadDownloadKit />
    </div>
  );
}
