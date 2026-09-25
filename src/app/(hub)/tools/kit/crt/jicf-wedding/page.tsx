import type { Metadata } from "next";
import { JicfWeddingCertificateShell } from "@/components/jicf/jicf-wedding-certificate-shell";
import {
  JICF_WEDDING_BLANK,
  JICF_WEDDING_HARMON_BARVOR,
} from "@/lib/jicf/wedding-certificate-data";

export const metadata: Metadata = {
  title: "JICF Wedding Certificate | rhub",
  description:
    "Official Jinan International Christian Fellowship wedding certificate — landscape, printable church record.",
};

export default async function JicfWeddingCertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const initialData =
    template === "blank" ? JICF_WEDDING_BLANK : JICF_WEDDING_HARMON_BARVOR;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4 lg:px-6">
      <JicfWeddingCertificateShell initialData={initialData} />
    </div>
  );
}
