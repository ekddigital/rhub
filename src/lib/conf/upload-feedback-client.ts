export type UploadErrorPayload = {
  error?: string;
  message?: string;
  requestId?: string;
  details?: {
    supportedMimeTypes?: string[];
    receivedMime?: string | null;
    inferredMime?: string | null;
  };
};

export async function parseUploadErrorPayload(
  response: Response,
): Promise<UploadErrorPayload> {
  const raw = await response.text();
  if (!raw) return {};

  try {
    return JSON.parse(raw) as UploadErrorPayload;
  } catch {
    return { message: raw };
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

  if (accepted) {
    return `${base}${statusText}${requestRef}. Accepted formats: ${accepted}${
      receivedMime ? `. Detected file type: ${receivedMime}` : ""
    }`;
  }

  return `${base}${statusText}${requestRef}`;
}

