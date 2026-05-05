import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Brochure (Kit) | rhub",
};

export default function KitBrochurePlaceholderPage() {
  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">/tools/kit/bro</h1>
      <p className="text-sm text-muted-foreground">
        Brochure workspace: merge tri-fold patterns from{" "}
        <code className="rounded bg-muted px-1">components/creative</code>
        with <code className="rounded bg-muted px-1">OrganizationBrandKit</code>.
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
