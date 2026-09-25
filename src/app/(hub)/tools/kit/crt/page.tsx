import type { Metadata } from "next";
import Link from "next/link";
import { JICF_TEMPLATES as JICF_HTML_TEMPLATES } from "@/lib/creative/certificates/html-export/templates/jicf";
import { JICF_TEMPLATES as JICF_BUILDER_TEMPLATES } from "@/lib/creative/certificates/template-builder/certificates/jicf";

export const metadata: Metadata = {
  title: "Certificates (Kit) | rhub",
  description: "Printable certificate studio — JICF catalog templates.",
};

export default function KitCertificatesPage() {
  const catalog = [
    ...JICF_HTML_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      source: "HTML export",
    })),
    ...JICF_BUILDER_TEMPLATES.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      source: "Template builder",
    })),
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          Creative Kit · Certificates
        </p>
        <h1 className="text-2xl font-semibold">Certificate studio</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Printable church and conference certificates from the JICF catalog.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          JICF catalog templates
        </h2>
        <ul className="divide-y rounded-xl border">
          {catalog.map((template) => (
            <li key={`${template.source}-${template.id}`} className="px-4 py-3">
              <p className="text-sm font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.source} · {template.id}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {template.description}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm">
        <Link
          href="/tools/kit"
          className="underline-offset-4 hover:underline"
        >
          ← Creative Kit
        </Link>
      </p>
    </div>
  );
}
