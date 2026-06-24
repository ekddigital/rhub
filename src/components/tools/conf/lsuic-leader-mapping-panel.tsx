"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link2, Loader2, RefreshCcw, Search, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type RosterRow = {
  rosterKey: string;
  committeeFormalName: string;
  committeeShortName: string;
  leaderName: string;
  leaderRole: string;
  csvPhotoUrl: string | null;
  resolvedPhotoPath: string | null;
  link: {
    delegateId: string | null;
    userId: string | null;
    linkSource: string | null;
  } | null;
  isMapped: boolean;
};

type DelegateOption = {
  id: string;
  name: string;
  email: string | null;
  city: string;
};

export function LsuicLeaderMappingPanel({ confId }: { confId: string }) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [delegates, setDelegates] = useState<DelegateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [autoLinking, setAutoLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rosterRes, delegateRes] = await Promise.all([
        fetch(`/api/conf/${confId}/lsuic-leaders`),
        fetch(`/api/conf/${confId}/delegates`),
      ]);
      if (!rosterRes.ok) throw new Error("Failed to load LSUIC roster");
      const rosterPayload = (await rosterRes.json()) as { rows: RosterRow[] };
      setRows(rosterPayload.rows ?? []);

      if (delegateRes.ok) {
        const delegatePayload = (await delegateRes.json()) as
          | DelegateOption[]
          | { delegates?: DelegateOption[] };
        setDelegates(
          Array.isArray(delegatePayload)
            ? delegatePayload
            : (delegatePayload.delegates ?? []),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [confId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rows.filter((row) => {
      if (showUnmappedOnly && row.isMapped) return false;
      if (!q) return true;
      return (
        row.leaderName.toLowerCase().includes(q) ||
        row.committeeShortName.toLowerCase().includes(q) ||
        row.leaderRole.toLowerCase().includes(q)
      );
    });
  }, [rows, filter, showUnmappedOnly]);

  const counts = useMemo(
    () => ({
      total: rows.length,
      mapped: rows.filter((r) => r.isMapped).length,
      unmapped: rows.filter((r) => !r.isMapped).length,
    }),
    [rows],
  );

  const handleAutoLink = async () => {
    setAutoLinking(true);
    setError(null);
    try {
      const res = await fetch(`/api/conf/${confId}/lsuic-leaders`, {
        method: "POST",
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Auto-link failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auto-link failed");
    } finally {
      setAutoLinking(false);
    }
  };

  const handleLink = async (rosterKey: string, delegateId: string | null) => {
    setSavingKey(rosterKey);
    setError(null);
    try {
      const res = await fetch(
        `/api/conf/${confId}/lsuic-leaders/${encodeURIComponent(rosterKey)}/link`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delegateId, userId: null }),
        },
      );
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Link update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link update failed");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border-[#C8A061]/30">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">LSUIC Leader Account Mapping</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Link platform registrations to CSV roster leaders. Booklet photos use
              the delegate upload when mapped; otherwise the CSV photo URL is used.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void load()}
              disabled={loading}
            >
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => void handleAutoLink()}
              disabled={autoLinking}
            >
              {autoLinking ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Link2 className="size-4" />
              )}
              Auto-link by name
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="secondary">{counts.total} roster leaders</Badge>
          <Badge variant="outline">{counts.mapped} mapped</Badge>
          <Badge variant="outline">{counts.unmapped} unmapped</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search leader, committee, role..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showUnmappedOnly}
              onChange={(e) => setShowUnmappedOnly(e.target.checked)}
            />
            Show unmapped only
          </label>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {filteredRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No roster rows match the current filter.
            </p>
          ) : (
            filteredRows.map((row) => (
              <div
                key={row.rosterKey}
                className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-[180px] flex-1">
                  <p className="font-medium leading-tight">{row.leaderName}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.committeeShortName} · {row.leaderRole}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {row.resolvedPhotoPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={row.resolvedPhotoPath}
                      alt=""
                      className="size-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="size-10 rounded-md bg-muted" />
                  )}
                  <select
                    className="h-9 min-w-[200px] rounded-md border border-input bg-transparent px-2 text-sm"
                    value={row.link?.delegateId ?? ""}
                    disabled={savingKey === row.rosterKey}
                    onChange={(e) => {
                      const value = e.target.value || null;
                      void handleLink(row.rosterKey, value);
                    }}
                  >
                    <option value="">— Select delegate signup —</option>
                    {delegates.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.city ? ` · ${d.city}` : ""}
                      </option>
                    ))}
                  </select>
                  {row.isMapped && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      title="Clear link"
                      disabled={savingKey === row.rosterKey}
                      onClick={() => void handleLink(row.rosterKey, null)}
                    >
                      <Unlink className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
