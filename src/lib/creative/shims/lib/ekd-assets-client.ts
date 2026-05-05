/** Response shape for EKD Digital asset API uploads/lists (implementations may normalize fields here). */
export type UploadedAssetResult = {
  id: string | null;
  url?: string;
  download_url?: string | null;
  public_url?: string;
  secure_url?: string;
  width?: number;
  height?: number;
  format?: string;
  file_size?: number;
  size?: number;
  mime_type?: string;
  created_at?: string;
  public_id?: string;
  name?: string;
};

/**
 * Upload via rhub Kit proxy (`POST /api/v1/kit/assets/upload`) → EKD Digital Assets API.
 * Uses cookie session; do not call EKD with secrets from the browser.
 */
export async function uploadAssetClient(
  file: File,
  options?: {
    assetType?: string;
    projectName?: string;
    clientId?: string;
    tags?: string[];
    publicId?: string;
    folder?: string;
  },
): Promise<UploadedAssetResult> {
  const form = new FormData();
  form.append("file", file);
  const assetType = options?.assetType ?? "images";
  form.append("asset_type", assetType.replace(/s$/, ""));
  if (options?.projectName) {
    form.append("project_name", options.projectName);
  }
  if (options?.clientId) {
    form.append("client_id", options.clientId);
  }
  form.append("source", "creative-studio");

  const res = await fetch("/api/v1/kit/assets/upload", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    id?: string | null;
    url?: string;
    public_url?: string;
    download_url?: string | null;
  };

  if (!res.ok) {
    throw new Error(payload.error || `Upload failed (${res.status})`);
  }

  return {
    id: payload.id ?? null,
    url: payload.url ?? payload.public_url,
    public_url: payload.public_url,
    download_url: payload.download_url ?? null,
  };
}

/**
 * List assets via Kit proxy (`GET /api/v1/kit/assets`).
 */
export async function listAssetsClient(params?: {
  assetType?: string;
  projectName?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  items: unknown[];
  total: number;
  assets: unknown[];
}> {
  const q = new URLSearchParams();
  if (params?.projectName) q.set("project_name", params.projectName);
  if (params?.assetType) q.set("asset_type", params.assetType);
  const limit = params?.limit ?? 30;
  const offset = params?.offset ?? 0;
  const page = Math.floor(offset / limit) + 1;
  q.set("page", String(page));
  q.set("size", String(limit));

  const res = await fetch(`/api/v1/kit/assets?${q}`, {
    credentials: "include",
  });

  const payload = (await res.json().catch(() => ({}))) as {
    error?: string;
    assets?: unknown[];
    total?: number;
    count?: number;
  };

  if (!res.ok) {
    throw new Error(payload.error || `List failed (${res.status})`);
  }

  const assets = Array.isArray(payload.assets) ? payload.assets : [];
  const total =
    typeof payload.total === "number" ? payload.total : assets.length;

  return { items: assets, total, assets };
}
