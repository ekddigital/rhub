import type { Metadata } from "next";
import { KitCreativeWorkspace } from "@/components/tools/kit/kit-creative-workspace";
import { getUnifiedTemplateCatalog } from "@/lib/kit/catalog-unified";
import { getKitSession } from "@/lib/kit/session";

export const metadata: Metadata = {
  title: "Creative Kit · Workspace | rhub",
  description:
    "Design workspace — surfaces, templates, preview, and links into org-aware editors.",
};

export default async function KitHubPage() {
  const session = await getKitSession();
  const { entries } = await getUnifiedTemplateCatalog(session?.user ?? null, {});
  return (
    <div className="mx-auto w-full max-w-[1920px] px-3 pb-12 sm:px-4 lg:px-6">
      <KitCreativeWorkspace unifiedEntries={entries} />
    </div>
  );
}
