"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Loader2, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchDefaultConference } from "@/lib/conf/client";

type AuditLog = {
  id: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
};

const ACTION_COLORS: Record<string, string> = {
  PAYMENT_CREATED: "text-blue-600 dark:text-blue-400",
  PAYMENT_COMMITTEE_APPROVED: "text-indigo-600 dark:text-indigo-400",
  PAYMENT_FINAL_APPROVED: "text-green-600 dark:text-green-400",
  PAYMENT_REJECTED: "text-red-600 dark:text-red-400",
  PAYMENT_PROOF_UPLOADED: "text-cyan-600 dark:text-cyan-400",
  BUDGET_CREATED: "text-purple-600 dark:text-purple-400",
  BUDGET_APPROVED: "text-green-600 dark:text-green-400",
  BUDGET_REJECTED: "text-red-600 dark:text-red-400",
  REPORT_CREATED: "text-amber-600 dark:text-amber-400",
  REPORT_EXPORTED: "text-amber-600 dark:text-amber-400",
  MEMBER_CHAIR_ASSIGNED: "text-[#C8A061]",
  MEMBER_SCOPE_SET: "text-[#C8A061]",
  MEMBER_USER_LINKED: "text-emerald-600 dark:text-emerald-400",
};

const ACTION_LABELS: Record<string, string> = {
  PAYMENT_CREATED: "Payment Created",
  PAYMENT_UPDATED: "Payment Updated",
  PAYMENT_COMMITTEE_APPROVED: "Committee Approved",
  PAYMENT_FINAL_APPROVED: "Final Approved & Locked",
  PAYMENT_REJECTED: "Payment Rejected",
  PAYMENT_PROOF_UPLOADED: "Proof Uploaded",
  BUDGET_CREATED: "Budget Created",
  BUDGET_APPROVED: "Budget Approved",
  BUDGET_REJECTED: "Budget Rejected",
  REPORT_CREATED: "Report Created",
  REPORT_EXPORTED: "Report Exported",
  MEMBER_CHAIR_ASSIGNED: "Chair Role Assigned",
  MEMBER_SCOPE_SET: "Committee Scope Set",
  MEMBER_USER_LINKED: "User Account Linked",
};

export function FinanceAuditShell() {
  const [confId, setConfId] = useState("");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterEntity, setFilterEntity] = useState<string>("all");

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const conf = await fetchDefaultConference();
        setConfId(conf.id);
        const params = new URLSearchParams({ limit: "200" });
        if (filterEntity !== "all") params.set("entityType", filterEntity);
        const res = await fetch(`/api/conf/${conf.id}/finance/audit?${params}`);
        if (!res.ok) throw new Error("Failed to load audit log");
        setLogs((await res.json()) as AuditLog[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [filterEntity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-ekd-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Finance Audit Log
          </h1>
          <p className="text-sm text-muted-foreground">
            Full history of all financial actions and approvals
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="size-4 text-muted-foreground" />
        {["all", "payment", "budget", "report", "member"].map((t) => (
          <Button
            key={t}
            size="sm"
            variant={filterEntity === t ? "default" : "outline"}
            className="h-7 text-xs capitalize"
            onClick={() => setFilterEntity(t)}
          >
            {t === "all" ? "All" : t + "s"}
          </Button>
        ))}
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Clock className="mb-4 size-12 text-muted-foreground/30" />
            <p className="text-lg font-medium">No audit entries yet</p>
            <p className="text-sm text-muted-foreground">
              Actions will appear here as they happen
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              {logs.length} entries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="mt-0.5 flex-shrink-0">
                    <Clock className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-semibold ${ACTION_COLORS[log.action] ?? "text-foreground"}`}
                      >
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {log.entityType}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      by{" "}
                      <span className="font-medium text-foreground">
                        {log.actorName}
                      </span>
                      {" · "}
                      <span>
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                    {log.note && (
                      <p className="mt-1 text-xs italic text-muted-foreground">
                        Note: {log.note}
                      </p>
                    )}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(log.details)
                          .filter(
                            ([, v]) =>
                              v !== null && v !== undefined && v !== "",
                          )
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <span
                              key={k}
                              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                            >
                              {k}: {String(v)}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    #{log.id.slice(-6)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
