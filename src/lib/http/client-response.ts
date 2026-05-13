type ApiErrorPayload = {
  error?: string;
  errorMessage?: string;
  message?: string;
};

const ERROR_SNIPPET_LIMIT = 220;

function normalizeSnippet(raw: string): string {
  const condensed = raw.replace(/\s+/g, " ").trim();
  if (!condensed) {
    return "";
  }

  if (condensed.length <= ERROR_SNIPPET_LIMIT) {
    return condensed;
  }

  return `${condensed.slice(0, ERROR_SNIPPET_LIMIT)}...`;
}

function isLikelyHtml(payload: string): boolean {
  const normalized = payload.trim().toLowerCase();
  return (
    normalized.startsWith("<!doctype html") || normalized.startsWith("<html")
  );
}

function extractMessage(payload: ApiErrorPayload | null): string | null {
  if (!payload) {
    return null;
  }

  const message = payload.error ?? payload.errorMessage ?? payload.message;
  if (typeof message !== "string") {
    return null;
  }

  const trimmed = message.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function parseErrorResponse(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return `${fallbackMessage} (HTTP ${response.status})`;
  }

  try {
    const parsed = JSON.parse(bodyText) as ApiErrorPayload;
    const parsedMessage = extractMessage(parsed);
    if (parsedMessage) {
      return parsedMessage;
    }
  } catch {
    // Ignore JSON parse errors and use heuristics below.
  }

  if (isLikelyHtml(bodyText)) {
    if (response.status === 413) {
      return "Server returned an HTML error page (HTTP 413). The upload was rejected before reaching the app (likely reverse-proxy body-size limit). Reduce file size or increase proxy limit (for Nginx: client_max_body_size, then reload).";
    }

    return `Server returned an HTML error page (HTTP ${response.status}). Please retry. If this persists, check upstream API/server logs.`;
  }

  const snippet = normalizeSnippet(bodyText);
  if (!snippet) {
    return `${fallbackMessage} (HTTP ${response.status})`;
  }

  return `${fallbackMessage} (HTTP ${response.status}): ${snippet}`;
}

export async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const bodyText = await response.text();

  if (!bodyText.trim()) {
    throw new Error(fallbackMessage);
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    if (isLikelyHtml(bodyText)) {
      throw new Error(
        "Server returned HTML instead of JSON. Please retry. If this persists, check API/server logs.",
      );
    }

    throw new Error(`${fallbackMessage}: invalid JSON response`);
  }
}
