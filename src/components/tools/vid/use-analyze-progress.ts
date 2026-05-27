"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { VideoSessionResponse } from "@/lib/download-hub/client";
import { watchSessionPath } from "@/lib/download-hub/client";
import {
  ANALYZE_ABORT_ERROR,
  ANALYZE_CLIENT_TIMEOUT_MS,
  ANALYZE_MESSAGE_INTERVAL_MS,
  ANALYZE_SLOW_WARN_MS,
  ANALYZE_TIMEOUT_ERROR,
  buildAnalyzeMessages,
  type AnalyzeStatusMessage,
} from "@/lib/download-hub/analyze-progress";
import { validateMediaUrlInput } from "@/lib/download-hub/url-validation";
import {
  parseErrorResponse,
  parseJsonResponse,
} from "@/lib/http/client-response";

export type UseAnalyzeProgressOptions = {
  livePlatformNames?: string;
  onSuccess?: (session: VideoSessionResponse) => void;
};

export function useAnalyzeProgress(options?: UseAnalyzeProgressOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [platformId, setPlatformId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const messages = useMemo(
    () => buildAnalyzeMessages(platformId),
    [platformId],
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setError("");
    setStatusMessage("");
    setMessageIndex(0);
    setElapsedMs(0);
    setPlatformId(null);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setStatusMessage("");
  }, []);

  const analyze = useCallback(
    async (
      rawUrl: string,
    ): Promise<
      | { ok: true; session: VideoSessionResponse }
      | { ok: false; error: string }
    > => {
      const validation = validateMediaUrlInput(rawUrl, {
        livePlatformNames: options?.livePlatformNames,
      });

      if (!validation.ok) {
        setError(validation.error);
        return { ok: false, error: validation.error };
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setPlatformId(validation.platform.id);
      setLoading(true);
      setError("");
      setMessageIndex(0);
      setElapsedMs(0);

      const phaseMessages = buildAnalyzeMessages(validation.platform.id);
      setStatusMessage(phaseMessages[0]?.text ?? "Analyzing…");

      const startedAt = Date.now();
      const tickTimer = window.setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setElapsedMs(elapsed);

        setMessageIndex((prev) => {
          const next = (prev + 1) % phaseMessages.length;
          setStatusMessage(phaseMessages[next]?.text ?? "Analyzing…");
          return next;
        });
      }, ANALYZE_MESSAGE_INTERVAL_MS);

      const timeoutTimer = window.setTimeout(() => {
        controller.abort();
      }, ANALYZE_CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch("/api/tools/vid/info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: validation.normalizedUrl }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const message = await parseErrorResponse(
            response,
            "Failed to fetch media info",
          );
          throw new Error(message);
        }

        const session = await parseJsonResponse<VideoSessionResponse>(
          response,
          "Failed to parse session",
        );

        options?.onSuccess?.(session);
        setLoading(false);
        return { ok: true, session };
      } catch (err) {
        let message: string;
        if (controller.signal.aborted) {
          const elapsed = Date.now() - startedAt;
          message =
            elapsed >= ANALYZE_CLIENT_TIMEOUT_MS - 500
              ? ANALYZE_TIMEOUT_ERROR
              : ANALYZE_ABORT_ERROR;
        } else {
          message =
            err instanceof Error ? err.message : "Failed to analyze URL";
        }
        setError(message);
        setLoading(false);
        return { ok: false, error: message };
      } finally {
        window.clearInterval(tickTimer);
        window.clearTimeout(timeoutTimer);
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [options],
  );

  const isSlowWarning =
    elapsedMs >= ANALYZE_SLOW_WARN_MS[0] && loading && !error;

  const slowWarningTier: 0 | 1 | 2 =
    elapsedMs >= ANALYZE_SLOW_WARN_MS[1]
      ? 2
      : elapsedMs >= ANALYZE_SLOW_WARN_MS[0]
        ? 1
        : 0;

  const currentPhase = messages[messageIndex]?.phase ?? "validate";

  return {
    loading,
    error,
    setError,
    statusMessage,
    messageIndex,
    messages,
    currentPhase,
    elapsedMs,
    isSlowWarning,
    slowWarningTier,
    analyze,
    cancel,
    reset,
    watchPath: watchSessionPath,
  };
}
