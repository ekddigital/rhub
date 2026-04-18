"use client";

import { useEffect, useState, useCallback } from "react";
import { UserRound, X, LogOut, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type ImpersonationState = {
  impersonating: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  realAdmin?: { id: string; name: string };
};

export function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [stopping, setStopping] = useState(false);
  const router = useRouter();

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate");
      if (res.ok) {
        setState((await res.json()) as ImpersonationState);
      }
    } catch {
      // Silent fail — banner is non-critical
    }
  }, []);

  useEffect(() => {
    void fetchState();
    // Poll every 60s to stay in sync
    const id = setInterval(() => void fetchState(), 60_000);
    return () => clearInterval(id);
  }, [fetchState]);

  const stopImpersonating = async () => {
    setStopping(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      router.refresh();
    } finally {
      setStopping(false);
      setState(null);
    }
  };

  if (!state?.impersonating) return null;

  const { impersonating, realAdmin } = state;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" />
        <span>
          Viewing as{" "}
          <strong>
            {impersonating.name} ({impersonating.email})
          </strong>
          {" — "}
          <span className="opacity-80">
            Role: {impersonating.role.replace(/_/g, " ")}
          </span>
        </span>
        {realAdmin && (
          <span className="hidden text-xs opacity-70 sm:inline">
            · Admin: {realAdmin.name}
          </span>
        )}
      </div>
      <button
        onClick={() => void stopImpersonating()}
        disabled={stopping}
        className="flex items-center gap-1.5 rounded-md bg-amber-900/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-amber-900/40 disabled:opacity-60"
      >
        <LogOut className="size-3.5" />
        {stopping ? "Stopping..." : "Stop Impersonating"}
      </button>
    </div>
  );
}
