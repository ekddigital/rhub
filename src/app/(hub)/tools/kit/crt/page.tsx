import type { Metadata } from "next";
import Link from "next/link";
import { JICF_TEMPLATES as JICF_HTML_TEMPLATES } from "@/lib/creative/certificates/html-export/templates/jicf";
import { JICF_TEMPLATES as JICF_BUILDER_TEMPLATES } from "@/lib/creative/certificates/template-builder/certificates/jicf";
import { JICF_WEDDING_COLORS } from "@/lib/jicf/wedding-certificate-data";

export const metadata: Metadata = {
  title: "Certificates (Kit) | rhub",
  description:
    "Printable certificate studio — JICF wedding record and catalog templates.",
};

const LIVE_CERTIFICATES = [
  {
    href: "/tools/kit/crt/jicf-wedding",
    title: "JICF Wedding Certificate",
    org: "Jinan International Christian Fellowship",
    detail:
      "Landscape official marriage record. Editable template plus the Harmon–Barvor filled instance. Print, PNG, or PDF.",
    status: "Live",
  },
] as const;

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
        <p
          className="text-xs font-semibold tracking-[0.18em] uppercase"
          style={{ color: JICF_WEDDING_COLORS.red }}
        >
          Creative Kit · Certificates
        </p>
        <h1
          className="text-2xl font-semibold"
          style={{ color: JICF_WEDDING_COLORS.navy }}
        >
          Certificate studio
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Printable church and conference certificates. The JICF wedding
          certificate is a landscape official record — open it, edit fields,
          then print.
        </p>
      </header>

      <section className="grid gap-4">
        {LIVE_CERTIFICATES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border p-5 transition-colors hover:bg-muted/40"
            style={{ borderColor: `${JICF_WEDDING_COLORS.gold}99` }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                className="text-lg font-semibold"
                style={{ color: JICF_WEDDING_COLORS.navy }}
              >
                {item.title}
              </h2>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: `${JICF_WEDDING_COLORS.yellow}55`,
                  color: JICF_WEDDING_COLORS.navy,
                }}
              >
                {item.status}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {item.org}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{item.detail}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              Opens the Harmon–Barvor filled record. Use{" "}
              <span className="font-medium">?template=blank</span> for an empty
              church template.
            </p>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2
          className="text-sm font-semibold tracking-wide uppercase"
          style={{ color: JICF_WEDDING_COLORS.navy }}
        >
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
          style={{ color: JICF_WEDDING_COLORS.navy }}
        >
          ← Creative Kit
        </Link>
      </p>
    </div>
  );
}
