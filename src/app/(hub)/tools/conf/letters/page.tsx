import dynamic from "next/dynamic";
import { requireConferencePageAccess } from "@/lib/conf/access";

const LetterComposerShell = dynamic(
  () =>
    import("@/components/tools/conf/letter-composer-shell").then(
      (m) => m.LetterComposerShell,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="py-24 text-center text-sm text-muted-foreground">
        Loading letter composer…
      </div>
    ),
  },
);

export const metadata = {
  title: "Letter Composer — LSUIC 2026",
};

export default async function LettersPage() {
  await requireConferencePageAccess("/tools/conf/letters", "manager");

  return (
    <div className="py-6">
      <LetterComposerShell />
    </div>
  );
}
