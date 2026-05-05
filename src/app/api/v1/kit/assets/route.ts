import { NextRequest } from "next/server";
import { listAssetsFromEKDDigital } from "@/lib/conf/assets";
import { normalizeEkdAssetsList } from "@/lib/kit/ekd-assets-normalize";
import { kitJson, kitError, kitOptions } from "@/lib/kit/http";
import { getKitSession } from "@/lib/kit/session";

export function OPTIONS() {
  return kitOptions();
}

export async function GET(req: NextRequest) {
  const session = await getKitSession();
  if (!session?.user) {
    return kitError("Authentication required", 401);
  }

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const size = Number(searchParams.get("size") ?? "30");

  try {
    const raw = await listAssetsFromEKDDigital({
      page: Number.isFinite(page) ? page : 1,
      size: Number.isFinite(size) ? Math.min(size, 100) : 30,
      projectName: searchParams.get("project_name") ?? undefined,
      assetType: searchParams.get("asset_type") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      tags: searchParams.get("tags") ?? undefined,
      clientId: searchParams.get("client_id") ?? undefined,
    });

    const { items, total } = normalizeEkdAssetsList(raw);
    return kitJson({ count: items.length, total, assets: items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assets list failed";
    console.error("[kit.assets.GET]", error);
    return kitError(message, 502);
  }
}
