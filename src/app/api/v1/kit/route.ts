import { kitJson, kitOptions } from "@/lib/kit/http";

export function OPTIONS() {
  return kitOptions();
}

export async function GET() {
  return kitJson({
    name: "rhub-creative-kit",
    version: 1,
    docs: "/docs/CREATIVE_WORKSPACE.md",
    endpoints: {
      health: { method: "GET", path: "/api/v1/kit/health" },
      surfaces: { method: "GET", path: "/api/v1/kit/surfaces" },
      templates: {
        method: "GET",
        path: "/api/v1/kit/templates",
        note: "Default: code registry. ?mode=unified merges DB studio rows (deduped by registrySourceId).",
      },
      studioTemplates: {
        method: "GET,POST",
        path: "/api/v1/kit/studio-templates",
        note: "DB-backed CRUD + fork; session cookie auth",
      },
      studioTemplateById: {
        method: "GET,PATCH,DELETE",
        path: "/api/v1/kit/studio-templates/{id}",
      },
      forkStudioTemplate: {
        method: "POST",
        path: "/api/v1/kit/studio-templates/{id}/fork",
      },
      assetsList: { method: "GET", path: "/api/v1/kit/assets" },
      assetsUpload: { method: "POST", path: "/api/v1/kit/assets/upload" },
      flyerDocument: {
        method: "GET,PUT",
        path: "/api/v1/kit/flyer-document",
        note: "Per-user flyer studio state (CreativeTemplate row); session cookie auth",
      },
      brandKitMerge: {
        method: "POST",
        path: "/api/v1/kit/brand-kit/merge",
      },
    },
  });
}
