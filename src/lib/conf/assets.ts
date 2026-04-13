type EKDAssetType = "image" | "video" | "document" | "other";

type EKDAssetUploadParams = {
  file: File;
  assetType: EKDAssetType;
  clientId?: string;
  projectName?: string;
};

type EKDAssetUploadResult = {
  id: string | null;
  publicUrl: string;
  downloadUrl: string | null;
};

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function toAbsoluteUrl(value: string, origin: string) {
  if (isHttpUrl(value)) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}

function normalizeAssetsApiBaseUrl(rawUrl: string) {
  const clean = rawUrl.trim().replace(/\/+$/, "").replace(/\/upload$/i, "");

  if (/\/api\/v1\/assets$/i.test(clean)) return clean;
  if (/\/api\/v1$/i.test(clean)) return `${clean}/assets`;
  if (/\/assets$/i.test(clean)) return clean;

  return `${clean}/api/v1/assets`;
}

function pickString(
  payload: unknown,
  keys: readonly string[],
): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;

  const obj = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  const nested = obj.data;
  if (nested && typeof nested === "object") {
    const nestedObj = nested as Record<string, unknown>;
    for (const key of keys) {
      const value = nestedObj[key];
      if (typeof value === "string" && value.trim()) {
        return value;
      }
    }
  }

  return undefined;
}

function payloadErrorMessage(payload: unknown) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return (
    pickString(payload, ["error", "message", "detail", "details"]) ||
    "Unknown assets API error"
  );
}

function getAuthCandidates(apiKey: string, apiSecret: string) {
  const candidates: Array<Record<string, string>> = [];
  if (apiSecret) {
    candidates.push({ Authorization: `Bearer ${apiSecret}` });
  }
  if (apiKey && apiKey !== apiSecret) {
    candidates.push({ Authorization: `Bearer ${apiKey}` });
  }
  if (apiKey && apiSecret) {
    candidates.push({
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
    });
  }

  return candidates;
}

export async function uploadFileToEKDDigitalAssets(
  params: EKDAssetUploadParams,
): Promise<EKDAssetUploadResult> {
  const apiUrl = process.env.EKD_DIGITAL_ASSETS_API_URL;
  const apiKey = process.env.EKD_DIGITAL_ASSETS_API_KEY || "";
  const apiSecret = process.env.EKD_DIGITAL_ASSETS_API_SECRET || "";

  if (!apiUrl) {
    throw new Error("EKD_DIGITAL_ASSETS_API_URL is not configured");
  }

  const authCandidates = getAuthCandidates(apiKey, apiSecret);
  if (authCandidates.length === 0) {
    throw new Error(
      "Missing EKD assets API credentials. Configure EKD_DIGITAL_ASSETS_API_KEY and/or EKD_DIGITAL_ASSETS_API_SECRET.",
    );
  }

  const baseUrl = normalizeAssetsApiBaseUrl(apiUrl);
  const uploadUrl = `${baseUrl}/upload`;
  const assetsOrigin = new URL(baseUrl).origin;

  const clientId =
    params.clientId || process.env.EKD_DIGITAL_ASSETS_CLIENT_ID || "andgroupco";
  const projectName =
    params.projectName ||
    process.env.EKD_DIGITAL_ASSETS_PROJECT_NAME ||
    "rhub";

  let lastAuthError = "Authentication failed for EKD assets API";

  for (const headers of authCandidates) {
    const formData = new FormData();
    formData.append("file", params.file, params.file.name);
    formData.append("client_id", clientId);
    formData.append("project_name", projectName);
    formData.append("asset_type", params.assetType);

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers,
      body: formData,
      cache: "no-store",
    });

    const rawBody = await response.text();
    let payload: unknown = null;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = rawBody;
      }
    }

    if (response.ok) {
      const primaryUrl =
        pickString(payload, ["public_url", "url", "secure_url"]) ||
        pickString(payload, ["download_url"]);

      if (!primaryUrl) {
        throw new Error("Assets API upload succeeded but no URL was returned");
      }

      const downloadUrl = pickString(payload, ["download_url"]);

      return {
        id: pickString(payload, ["id", "asset_id", "assetId"]) ?? null,
        publicUrl: toAbsoluteUrl(primaryUrl, assetsOrigin),
        downloadUrl: downloadUrl
          ? toAbsoluteUrl(downloadUrl, assetsOrigin)
          : null,
      };
    }

    const errorMessage = payloadErrorMessage(payload);

    if (response.status === 401 || response.status === 403) {
      lastAuthError = `Assets API auth failed (${response.status}): ${errorMessage}`;
      continue;
    }

    throw new Error(`Assets API upload failed (${response.status}): ${errorMessage}`);
  }

  throw new Error(lastAuthError);
}

export function resolveStoredAssetUrl(pathOrUrl: string, origin: string) {
  if (isHttpUrl(pathOrUrl)) return pathOrUrl;
  if (pathOrUrl.startsWith("/")) return `${origin}${pathOrUrl}`;
  return `${origin}/${pathOrUrl}`;
}