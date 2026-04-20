import { LetterComposerShell } from "@/components/tools/conf/letter-composer-shell";
import { requireConferencePageAccess } from "@/lib/conf/access";

export const metadata = {
  title: "Letter Composer — LSUIC 2026",
};

export default async function LettersPage() {
  await requireConferencePageAccess("/tools/conf/letters");

  return (
    <div className="py-6">
      <LetterComposerShell />
    </div>
  );
}
