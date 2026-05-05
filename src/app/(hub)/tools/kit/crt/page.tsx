import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Certificates (Kit) | rhub",
};

/** Placeholder route: mount certificate issuance UI from `components/creative` + APIs here. */
export default function KitCertificatesPlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">/tools/kit/crt</h1>
      <p className="text-muted-foreground text-sm">
        Certificate studio and APIs are being wired from{" "}
        <code className="rounded bg-muted px-1">src/components/creative</code> and{" "}
        <code className="rounded bg-muted px-1">src/lib/creative</code>.
      </p>
      <Link
        href="/tools/kit"
        className="inline-block text-sm font-medium text-gold underline-offset-4 hover:underline"
      >
        ← Creative Kit
      </Link>
    </div>
  );
}
