"use client";

import dynamic from "next/dynamic";

/**
 * Letters route only: load the shell without SSR so preview HTML→blocks uses
 * `DOMParser` (inline bold survives). Next.js forbids `ssr:false` dynamic() in Server Components.
 */
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

export function LetterComposerLettersGate() {
  return <LetterComposerShell />;
}
