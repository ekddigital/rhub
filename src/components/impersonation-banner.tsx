"use client";

import { useCallback, useEffect, useState } from "react";
import { LogOut, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/user-context";

type ImpersonationDetails = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type ImpersonationState = {
  impersonating: ImpersonationDetails | null;
  realAdmin?: { id: string; name: string };
};

export function ImpersonationBanner() {
  const [apiState, setApiState] = useState<ImpersonationState | null>(null);
  const [stopping, setStopping] = useState(false);
  const router = useRouter();
  const { user, loading, refresh } = useUser();

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate");
      if (res.ok) {
        setApiState((await res.json()) as ImpersonationState);
      }
    } catch {
      // Silent fail — banner is non-critical
    }
  }, []);

  useEffect(() => {
    void fetchState();
    const id = setInterval(() => void fetchState(), 60_000);
    return () => clearInterval(id);
  }, [fetchState]);

  const stopImpersonating = async () => {
    setStopping(true);
    try {
      const res = await fetch("/api/admin/impersonate", { method: "DELETE" });
      if (!res.ok) return;
      setApiState(null);
      await refresh();
      router.refresh();
    } finally {
      setStopping(false);
    }
  };

  const impersonating = user?.isImpersonating
    ? {
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : apiState?.impersonating;

  const realAdmin = user?.realAdmin ?? apiState?.realAdmin;

  if (loading && !impersonating) return null;
  if (!impersonating) return null;

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md">
      <div className="flex min-w-0 items-center gap-2">
        <AlertTriangle className="size-4 shrink-0" />
        <span className="min-w-0">
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
        className="flex shrink-0 items-center gap-1.5 rounded-md bg-amber-900/20 px-3 py-1 text-xs font-semibold transition-colors hover:bg-amber-900/40 disabled:opacity-60"
      >
        <LogOut className="size-3.5" />
        {stopping ? "Stopping..." : "Stop Impersonating"}
      </button>
    </div>
  );
}
