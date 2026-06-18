import { BookletDownloadKit } from "@/components/tools/conf/booklet-download-kit";
import { requireConferencePageAccess } from "@/lib/conf/access";

export const metadata = {
  title: "Booklet Downloads — LSUIC 2026",
  description:
    "Download LSUIC conference booklet cover pages, interior chrome, logos, and source photography",
};

export default async function BookletDownloadsPage() {
  await requireConferencePageAccess("/tools/conf/booklet/downloads", "manager");

  return (
    <div className="py-6">
      <BookletDownloadKit />
    </div>
  );
}
