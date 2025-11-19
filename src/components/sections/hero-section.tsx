import { Button } from "@/components/ui/button";
import { brandGradients } from "@/lib/utils";
import Link from "next/link";

const stats = [
  { label: "References converted", value: "2.4M+" },
  { label: "APIs integrated", value: "6" },
  { label: "Latency budget", value: "<80ms" },
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#120F0C] px-6 py-12 text-white shadow-[0_20px_80px_rgba(23,18,12,0.45)] sm:px-10">
      <div
        className="absolute inset-0 opacity-80"
        style={{ backgroundImage: brandGradients.aurum }}
      />
      <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
            EKD Digital Resource Hub
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Launch-grade tools for references, research, and rapid publishing
          </h1>
          <p className="max-w-2xl text-lg text-white/85">
            Convert XML, RIS, and EndNote exports into intelligent BibTeX,
            enrich metadata with Semantic Scholar, and soon hand off LaTeX
            documents to brand-safe Word templates.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/tools/ref">Open reference converter</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="#resources">Browse resources</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap justify-end gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="min-w-[140px] flex-1 rounded-2xl border border-white/20 bg-black/20 p-4 text-center"
            >
              <div className="text-3xl font-semibold text-white">
                {stat.value}
              </div>
              <div className="text-sm uppercase tracking-wide text-white/70">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
