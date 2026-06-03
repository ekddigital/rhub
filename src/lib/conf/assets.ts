type EKDAssetType = "image" | "video" | "document" | "other";

type EKDAssetUploadParams = {
  file: File;
  assetType: EKDAssetType;
  clientId?: string;
  projectName?: string;
  requestId?: string;
  source?: string;
};

type EKDAssetUploadResult = {
  id: string | null;
  publicUrl: string;
  downloadUrl: string | null;
};

type UploadRequestPayload = {
  file: File;
  assetType: EKDAssetType;
  clientId: string;
  projectName: string;
};

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function extractAssetId(value: string) {
  const direct = value.match(
    /\/api\/v1\/assets\/([0-9a-fA-F-]{36})\/download/i,
  );
  if (direct?.[1]) return direct[1];

  const fromFilePath = value.match(
    /\/([0-9a-fA-F-]{36})\.[A-Za-z0-9]+(?:\?.*)?$/,
  );
  if (fromFilePath?.[1]) return fromFilePath[1];

  return null;
}

function buildAssetsDownloadPath(assetId: string) {
  return `/api/v1/assets/${assetId}/download`;
}

function toAbsoluteUrl(value: string, origin: string) {
  if (isHttpUrl(value)) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
}

function normalizeAssetsApiBaseUrl(rawUrl: string) {
  const clean = rawUrl
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/upload$/i, "");

  if (/\/api\/v1\/assets$/i.test(clean)) return clean;
  if (/\/api\/v1$/i.test(clean)) return `${clean}/assets`;
  if (/\/assets$/i.test(clean)) return clean;

  return `${clean}/api/v1/assets`;
}

function resolveAssetsOrigin(fallbackOrigin: string) {
  const apiUrl = process.env.EKD_DIGITAL_ASSETS_API_URL;
  if (!apiUrl) return fallbackOrigin;

  try {
    return new URL(normalizeAssetsApiBaseUrl(apiUrl)).origin;
  } catch {
    return fallbackOrigin;
  }
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

function payloadToLogSnippet(payload: unknown, maxLength = 500) {
  if (typeof payload === "string") {
    return payload.slice(0, maxLength);
  }
  if (payload == null) return "";

  try {
    return JSON.stringify(payload).slice(0, maxLength);
  } catch {
    return "[unserializable payload]";
  }
}

function getAuthCandidates(apiKey: string, apiSecret: string) {
  const candidates: Array<{
    label: string;
    headers: Record<string, string>;
  }> = [];
  if (apiSecret) {
    candidates.push({
      label: "bearer_secret",
      headers: { Authorization: `Bearer ${apiSecret}` },
    });
  }
  if (apiKey && apiKey !== apiSecret) {
    candidates.push({
      label: "bearer_key",
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }
  if (apiKey && apiSecret) {
    candidates.push({
      label: "x_api_key_secret",
      headers: {
        "X-API-Key": apiKey,
        "X-API-Secret": apiSecret,
      },
    });
  }

  return candidates;
}

function createUploadFormData(payload: UploadRequestPayload) {
  const formData = new FormData();
  formData.append("file", payload.file, payload.file.name);
  formData.append("client_id", payload.clientId);
  formData.append("project_name", payload.projectName);
  formData.append("asset_type", payload.assetType);
  return formData;
}

function isRedirectStatus(status: number) {
  return status === 301 || status === 302 || status === 303 || status === 307 || status === 308;
}

async function postUploadPreservingMethod(
  uploadUrl: string,
  headers: Record<string, string>,
  payload: UploadRequestPayload,
  requestId: string,
  authMethod: string,
) {
  const doPost = async (targetUrl: string) =>
    fetch(targetUrl, {
      method: "POST",
      headers,
      body: createUploadFormData(payload),
      cache: "no-store",
      redirect: "manual",
    });

  const response = await doPost(uploadUrl);
  if (!isRedirectStatus(response.status)) {
    return response;
  }

  const locationHeader = response.headers.get("location");
  if (!locationHeader) {
    return response;
  }

  const redirectUrl = new URL(locationHeader, uploadUrl).toString();
  console.warn("[assets.upload.redirect_detected]", {
    requestId,
    authMethod,
    status: response.status,
    from: uploadUrl,
    to: redirectUrl,
  });

  return doPost(redirectUrl);
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
  const requestId = params.requestId || crypto.randomUUID();
  const uploadSource = params.source || "unknown";

  const clientId =
    params.clientId || process.env.EKD_DIGITAL_ASSETS_CLIENT_ID || "andgroupco";
  const projectName =
    params.projectName || process.env.EKD_DIGITAL_ASSETS_PROJECT_NAME || "rhub";

  let lastAuthError = "Authentication failed for EKD assets API";
  console.info("[assets.upload.start]", {
    requestId,
    source: uploadSource,
    assetType: params.assetType,
    uploadUrl,
    clientId,
    projectName,
    fileName: params.file.name,
    fileType: params.file.type || null,
    fileSize: params.file.size,
  });

  for (const candidate of authCandidates) {
    const response = await postUploadPreservingMethod(
      uploadUrl,
      candidate.headers,
      {
        file: params.file,
        assetType: params.assetType,
        clientId,
        projectName,
      },
      requestId,
      candidate.label,
    );

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
      const assetId =
        pickString(payload, ["id", "asset_id", "assetId"]) ?? null;
      const canonicalDownloadPath = assetId
        ? buildAssetsDownloadPath(assetId)
        : undefined;

      const primaryUrl =
        canonicalDownloadPath ||
        pickString(payload, ["public_url", "url", "secure_url"]) ||
        pickString(payload, ["download_url"]);

      if (!primaryUrl) {
        throw new Error("Assets API upload succeeded but no URL was returned");
      }

      const downloadUrl =
        canonicalDownloadPath ||
        pickString(payload, [
          "download_url",
          "public_url",
          "url",
          "secure_url",
        ]);

      const result = {
        id: assetId,
        publicUrl: toAbsoluteUrl(primaryUrl, assetsOrigin),
        downloadUrl: downloadUrl
          ? toAbsoluteUrl(downloadUrl, assetsOrigin)
          : null,
      };
      console.info("[assets.upload.success]", {
        requestId,
        source: uploadSource,
        authMethod: candidate.label,
        status: response.status,
        assetId: result.id,
      });
      return result;
    }

    const errorMessage = payloadErrorMessage(payload);
    console.warn("[assets.upload.attempt_failed]", {
      requestId,
      source: uploadSource,
      authMethod: candidate.label,
      status: response.status,
      errorMessage,
      responseSnippet: payloadToLogSnippet(payload),
    });

    if (response.status === 401 || response.status === 403) {
      lastAuthError = `Assets API auth failed (${response.status}): ${errorMessage}`;
      continue;
    }

    throw new Error(
      `Assets API upload failed (${response.status}): ${errorMessage}`,
    );
  }

  console.error("[assets.upload.failed]", {
    requestId,
    source: uploadSource,
    message: lastAuthError,
  });
  throw new Error(lastAuthError);
}

export type EKDAssetListParams = {
  clientId?: string;
  projectName?: string;
  assetType?: string;
  page?: number;
  size?: number;
  search?: string;
  tags?: string;
};

/**
 * List assets from EKD Digital Assets API (GET /api/v1/assets).
 */
export async function listAssetsFromEKDDigital(
  params: EKDAssetListParams = {},
): Promise<unknown> {
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
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 1));
  searchParams.set("size", String(params.size ?? 30));
  const clientId =
    params.clientId ||
    process.env.EKD_DIGITAL_ASSETS_CLIENT_ID ||
    "andgroupco";
  const projectName =
    params.projectName ||
    process.env.EKD_DIGITAL_ASSETS_PROJECT_NAME ||
    "rhub";
  searchParams.set("client_id", clientId);
  searchParams.set("project_name", projectName);
  if (params.assetType) searchParams.set("asset_type", params.assetType);
  if (params.search) searchParams.set("search", params.search);
  if (params.tags) searchParams.set("tags", params.tags);

  const listUrl = `${baseUrl}?${searchParams.toString()}`;
  let lastAuthError = "Authentication failed for EKD assets API";

  for (const candidate of authCandidates) {
    const response = await fetch(listUrl, {
      method: "GET",
      headers: { ...candidate.headers, Accept: "application/json" },
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
      return payload;
    }

    const errorMessage = payloadErrorMessage(payload);
    if (response.status === 401 || response.status === 403) {
      lastAuthError = `Assets API auth failed (${response.status}): ${errorMessage}`;
      continue;
    }

    throw new Error(
      `Assets API list failed (${response.status}): ${errorMessage}`,
    );
  }

  throw new Error(lastAuthError);
}

export function resolveStoredAssetUrl(pathOrUrl: string, origin: string) {
  const assetsOrigin = resolveAssetsOrigin(origin);

  if (isHttpUrl(pathOrUrl)) {
    try {
      const parsed = new URL(pathOrUrl);
      const assetId = extractAssetId(`${parsed.pathname}${parsed.search}`);
      if (assetId) {
        return `${parsed.origin}${buildAssetsDownloadPath(assetId)}`;
      }
      return pathOrUrl;
    } catch {
      return pathOrUrl;
    }
  }

  if (pathOrUrl.startsWith("/api/v1/assets/")) {
    return `${assetsOrigin}${pathOrUrl}`;
  }

  if (pathOrUrl.startsWith("/assets/")) {
    const assetId = extractAssetId(pathOrUrl);
    if (assetId) {
      return `${assetsOrigin}${buildAssetsDownloadPath(assetId)}`;
    }

    return `${assetsOrigin}${pathOrUrl}`;
  }

  const embeddedAssetId = extractAssetId(pathOrUrl);
  if (embeddedAssetId) {
    return `${assetsOrigin}${buildAssetsDownloadPath(embeddedAssetId)}`;
  }

  if (pathOrUrl.startsWith("/")) return `${origin}${pathOrUrl}`;
  return `${origin}/${pathOrUrl}`;
}
