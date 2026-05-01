export type UploadErrorPayload = {
  error?: string;
  message?: string;
  requestId?: string;
  details?: {
    supportedMimeTypes?: string[];
    receivedMime?: string | null;
    inferredMime?: string | null;
    maxSizeBytes?: number;
  };
};

const DEFAULT_UPLOAD_MAX_SIZE_LABEL = "5 MB";

function isLikelyHtml(raw: string) {
  return /<\s*html[\s>]|<\s*body[\s>]|<\s*\/?[a-z][^>]*>/i.test(raw);
}

function stripHtmlTags(raw: string) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatMaxSize(maxSizeBytes?: number) {
  if (!maxSizeBytes || !Number.isFinite(maxSizeBytes) || maxSizeBytes <= 0) {
    return null;
  }
  const mb = maxSizeBytes / (1024 * 1024);
  const rounded = Number.isInteger(mb) ? String(mb) : mb.toFixed(1);
  return `${rounded}MB`;
}

export async function parseUploadErrorPayload(
  response: Response,
): Promise<UploadErrorPayload> {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as UploadErrorPayload;
  } catch {
    const lower = raw.toLowerCase();
    const text = isLikelyHtml(raw) ? stripHtmlTags(raw) : raw.trim();
    const isPayloadTooLarge =
      response.status === 413 ||
      lower.includes("request entity too large") ||
      lower.includes("payload too large");

    if (isPayloadTooLarge) {
      return {
        message:
          `Upload failed because the file is too large. Maximum file size is ${DEFAULT_UPLOAD_MAX_SIZE_LABEL}. Please reduce file size and try again.`,
      };
    }

    return {
      message:
        text.length > 240
          ? `${text.slice(0, 237)}...`
          : text || "Unexpected upload error response from server.",
    };
  }
}

export function formatUploadError(
  payload: UploadErrorPayload,
  fallback: string,
  statusCode?: number,
): string {
  const base = payload.error || payload.message || fallback;
  const statusText = statusCode ? ` [HTTP ${statusCode}]` : "";
  const requestRef = payload.requestId ? ` (Ref: ${payload.requestId})` : "";
  const receivedMime = payload.details?.receivedMime || payload.details?.inferredMime;
  const accepted = payload.details?.supportedMimeTypes?.join(", ");
  const maxSizeLabel = formatMaxSize(payload.details?.maxSizeBytes);
  const sizeHint = maxSizeLabel ? `. Maximum file size: ${maxSizeLabel}` : "";

  if (accepted) {
    return `${base}${statusText}${requestRef}. Accepted formats: ${accepted}${
      receivedMime ? `. Detected file type: ${receivedMime}` : ""
    }${sizeHint}`;
  }

  return `${base}${statusText}${requestRef}${sizeHint}`;
}

