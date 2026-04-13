"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ChevronLeft, History, Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppShell } from "@/components/app-shell";
import { RoleChangeBanner } from "@/components/role-change-banner";

type AuditEntry = {
  id: string;
  actorUserId: string;
  actorEmail: string;
  targetUserId: string;
  targetEmail: string;
  targetName: string | null;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  role: string;
  canAccessAdmin?: boolean | null;
  roleChangedAt?: string | null;
  sessionCreatedAt?: string;
};

const ACTION_FILTERS = [
  "USER_CREATED",
  "USER_DELETED",
  "ROLE_CHANGED",
  "ACCESS_APPROVED",
  "ACCESS_RESTRICTED",
  "ACCESS_REJECTED",
  "ACCESS_PENDING",
  "ACCOUNT_ENABLED",
  "ACCOUNT_DISABLED",
  "HUB_ACCESS_ENABLED",
  "HUB_ACCESS_DISABLED",
  "CONFERENCE_ACCESS_CHANGED",
  "ADMIN_ACCESS_CHANGED",
  "ACCESS_NOTE_CHANGED",
  "NAME_CHANGED",
];

function AuditPageContent() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [tableLoading, setTableLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchEntries = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setEntries(data.entries || []);
        setTotal(data.total || 0);
      }
    } catch {
      // ignore transient fetch errors
    } finally {
      setTableLoading(false);
    }
  }, [search, actionFilter]);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (
          !data.id ||
          !["SUPER_ADMIN", "ADMIN"].includes(data.role) ||
          data.canAccessAdmin === false
        ) {
          router.replace(
            data.id ? "/dashboard" : "/login?redirect=/admin/audit",
          );
          return;
        }

        setAdminUser({
          id: data.id,
          name: data.name,
          role: data.role,
          canAccessAdmin: data.canAccessAdmin,
          roleChangedAt: data.roleChangedAt,
          sessionCreatedAt: data.sessionCreatedAt,
        });
        setLoading(false);
      })
      .catch(() => router.replace("/login?redirect=/admin/audit"));
  }, [router]);

  useEffect(() => {
    if (!loading) fetchEntries();
  }, [loading, fetchEntries]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) fetchEntries();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, actionFilter, loading, fetchEntries]);

  if (loading || !adminUser) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-ekd-gold" />
      </div>
    );
  }

  return (
    <AppShell user={adminUser}>
      <div className="max-w-6xl space-y-6 py-2">
        <RoleChangeBanner
          roleChangedAt={adminUser.roleChangedAt ?? null}
          sessionCreatedAt={adminUser.sessionCreatedAt ?? null}
        />

        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to Admin Panel
          </Link>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-ekd-gold" />
              <h1 className="text-2xl font-bold text-foreground">
                Access Audit Log
              </h1>
              <span className="ml-2 text-xs font-mono bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                {total} entries
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-50 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, actor, action, note…"
              className={cn(
                "w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
              )}
            />
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={cn(
              "rounded-xl border border-border bg-background px-3 py-2 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ekd-gold/30 focus:border-ekd-gold",
            )}
          >
            <option value="">All Actions</option>
            {ACTION_FILTERS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>

          <button
            onClick={fetchEntries}
            disabled={tableLoading}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <RefreshCw
              className={cn("h-4 w-4", tableLoading && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {tableLoading && entries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No audit entries found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      When
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Target
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Actor
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Action
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Field
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Change
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-foreground">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-muted/20 transition-colors align-top"
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 min-w-45">
                        <p className="font-medium text-foreground truncate max-w-56">
                          {entry.targetName || "Unnamed user"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate max-w-56">
                          {entry.targetEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground min-w-42.5 break-all">
                        {entry.actorEmail}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-ekd-gold/15 text-ekd-dark-brown dark:text-ekd-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {entry.field || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground min-w-55">
                        {entry.oldValue === null && entry.newValue === null
                          ? "-"
                          : `${entry.oldValue ?? "-"} -> ${entry.newValue ?? "-"}`}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground min-w-55">
                        {entry.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default function AdminAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-ekd-gold" />
        </div>
      }
    >
      <AuditPageContent />
    </Suspense>
  );
}
