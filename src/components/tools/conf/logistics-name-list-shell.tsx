"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Eye,
  Loader2,
  Printer,
  RefreshCw,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogisticsDocCell } from "@/components/tools/conf/logistics-doc-cell";
import { LogisticsNameListDocument } from "@/components/tools/conf/logistics-name-list-document";
import { LogisticsRoomPairingsPanel } from "@/components/tools/conf/logistics-room-pairings-panel";
import { fetchDefaultConference } from "@/lib/conf/client";
import {
  formatUploadError,
  parseUploadErrorPayload,
} from "@/lib/conf/upload-feedback-client";
import { validateDelegateUploadFile } from "@/lib/conf/file-upload-client";
import { fmtRmb } from "@/lib/conf/currency";
import {
  isDelegateFullyPaid,
  logisticsProfileHref,
  type LogisticsNameListEntry,
  type LogisticsNameListResponse,
} from "@/lib/conf/logistics-name-list";

function DocCell({
  confId,
  delegateId,
  kind,
  previewUrl,
  proxyUrl,
  isPdf,
  label,
  uploading,
  onUpload,
  readOnly = false,
}: {
  confId: string;
  delegateId: string;
  kind: "passport" | "entry-stamp" | "visa";
  previewUrl: string | null;
  proxyUrl: string;
  isPdf: boolean;
  label: string;
  uploading: boolean;
  onUpload: (file: File | null) => void;
  readOnly?: boolean;
}) {
  return (
    <LogisticsDocCell
      kind={kind}
      previewUrl={previewUrl}
      proxyUrl={proxyUrl}
      isPdf={isPdf}
      label={label}
      uploading={uploading}
      onUpload={onUpload}
      readOnly={readOnly}
    />
  );
}

export function LogisticsNameListShell() {
  const [confId, setConfId] = useState("");
  const [data, setData] = useState<LogisticsNameListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [selectedDelegateId, setSelectedDelegateId] = useState("");
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [generatedAt] = useState(() => new Date().toISOString());

  const loadRoster = useCallback(async (id: string) => {
    const res = await fetch(`/api/conf/${id}/logistics/name-list`, {
      cache: "no-store",
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      throw new Error(payload?.error || "Failed to load logistics name list");
    }
    return res.json() as Promise<LogisticsNameListResponse>;
  }, []);

  const refresh = useCallback(async () => {
    if (!confId) return;
    setError(null);
    try {
      const payload = await loadRoster(confId);
      setData(payload);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh roster");
    }
  }, [confId, loadRoster]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);
      setError(null);
      try {
        const conf = await fetchDefaultConference();
        if (!mounted) return;
        setConfId(conf.id);

        const accessRes = await fetch("/api/conf/default/access", {
          cache: "no-store",
        });
        if (accessRes.ok) {
          const accessPayload = (await accessRes.json()) as {
            isHotelCheckinOnly?: boolean;
          };
          if (mounted) {
            setReadOnly(Boolean(accessPayload.isHotelCheckinOnly));
          }
        }

        const roster = await loadRoster(conf.id);

        if (!mounted) return;
        setData(roster);
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e.message : "Failed to load page");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void init();
    return () => {
      mounted = false;
    };
  }, [loadRoster]);

  const filteredAvailable = useMemo(() => {
    const list = data?.availableDelegates ?? [];
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.passportNo || "").toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q),
    );
  }, [data?.availableDelegates, pickerQuery]);

  const handleAddDelegate = async () => {
    if (!confId || !selectedDelegateId || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/conf/${confId}/logistics/name-list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegateId: selectedDelegateId }),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to add delegate");
      }
      setSelectedDelegateId("");
      setPickerQuery("");
      await refresh();
      setNotice("Delegate added to logistics name list.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add delegate");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (entry: LogisticsNameListEntry) => {
    if (!confId || !entry.entryId || !entry.canRemove || busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(
        `/api/conf/${confId}/logistics/name-list/${entry.entryId}`,
        { method: "DELETE" },
      );
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to remove entry");
      }
      await refresh();
      setNotice(`${entry.name} removed from manual roster.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to remove entry");
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceDocument = async (
    delegateId: string,
    kind: "passport" | "entry-stamp" | "visa",
    file: File | null,
  ) => {
    if (!confId || !file || uploadingDocKey) return;
    const validation = await validateDelegateUploadFile(file, kind);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }

    const key = `${delegateId}:${kind}`;
    setUploadingDocKey(key);
    setError(null);
    setNotice(null);

    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);

      const res = await fetch(
        `/api/conf/${confId}/delegates/${delegateId}/self-documents`,
        { method: "POST", body: fd },
      );
      const payload = await parseUploadErrorPayload(res);
      if (!res.ok) {
        throw new Error(
          formatUploadError(
            payload,
            `Failed to upload ${kind}`,
            res.status,
          ),
        );
      }
      await refresh();
      setNotice("Document updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document upload failed");
    } finally {
      setUploadingDocKey(null);
    }
  };

  const handleExportPdf = async () => {
    if (!data || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const { exportToPDF } = await import("@/lib/creative/documents/pdfExport");
      await exportToPDF(
        "logistics-name-list-print-root",
        "logistics-name-list",
        undefined,
        {
          pageSelector: ".document-page",
          pageWrapperSelector: null,
          mode: "download",
          canvasScale: 2,
          jpegQuality: 0.85,
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-[#C8A061]" />
      </div>
    );
  }

  const entries = data?.entries ?? [];
  const roomPairings = data?.roomPairings ?? [];

  const roomAssignmentLabel = (
    assignment: LogisticsNameListEntry["roomAssignment"],
  ) => {
    if (!assignment) return null;
    if (assignment.assignmentType === "PAIR") {
      return `Pair · ${assignment.pairPartnerName ?? "partner"}`;
    }
    if (assignment.assignmentType === "SINGLE_WITH_GUEST") {
      return "Single + guest";
    }
    return "Single";
  };

  return (
    <div className="space-y-6">
      <style>{`
        #logistics-name-list-print-root {
          position: fixed;
          left: -9999px;
          top: 0;
          width: 794px;
          pointer-events: none;
        }
        @media print {
          body * { visibility: hidden; }
          #logistics-name-list-print-root,
          #logistics-name-list-print-root * { visibility: visible !important; }
          #logistics-name-list-print-root {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            pointer-events: auto !important;
          }
          .logistics-no-print { display: none !important; }
          .document-page {
            width: 210mm !important;
            min-height: 297mm !important;
            height: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            break-after: page;
            page-break-after: always;
          }
          .document-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          @page { size: A4 portrait; margin: 0; }
        }
      `}</style>

      <div className="logistics-no-print flex flex-wrap items-center gap-4">
        <Link href="/tools/conf">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-[200px]">
          <h1 className="text-2xl font-bold tracking-tight">
            Logistics Name List
          </h1>
          <p className="text-sm text-muted-foreground">
            Paid delegates, room pairings, and travel document review for hotel
            logistics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="size-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={exporting || entries.length === 0}
            onClick={() => void handleExportPdf()}
          >
            <Download className="size-4" />
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="logistics-no-print rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="logistics-no-print rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {!readOnly && (
      <Card className="logistics-no-print border-[#C8A061]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="size-4 text-[#C8A061]" />
            Add Delegate Manually
          </CardTitle>
          <CardDescription>
            Pick a registered delegate who is not yet on the list (e.g. comped
            or special-case travel).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Input
              placeholder="Search by name, passport, or city…"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
            />
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedDelegateId}
              onChange={(e) => setSelectedDelegateId(e.target.value)}
            >
              <option value="">Select delegate…</option>
              {filteredAvailable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.passportNo ? ` · ${d.passportNo}` : ""} · {d.city}
                </option>
              ))}
            </select>
          </div>
          <Button
            disabled={!selectedDelegateId || busy}
            onClick={() => void handleAddDelegate()}
          >
            Add to list
          </Button>
        </CardContent>
      </Card>
      )}

      <LogisticsRoomPairingsPanel pairings={roomPairings} />

      <Card className="logistics-no-print border-[#C8A061]/30">
        <CardHeader>
          <CardTitle className="text-base">
            Roster ({entries.length})
          </CardTitle>
          <CardDescription>
            Auto-includes fully paid delegates. Manual rows can be removed unless
            the delegate is also paid.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3">#</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Room</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Passport</th>
                <th className="px-3 py-3">Visa</th>
                <th className="px-3 py-3">Entry stamp</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-10 text-center text-muted-foreground"
                  >
                    No delegates on the logistics name list yet.
                  </td>
                </tr>
              ) : (
                entries.map((row, index) => {
                  const paid = isDelegateFullyPaid(row);
                  const profileHref = logisticsProfileHref(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/70 align-top hover:bg-muted/20"
                    >
                      <td className="px-3 py-4 text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-medium leading-snug">{row.name}</p>
                        <p className="mt-0.5 text-xs">
                          {row.passportNo ? (
                            <Link
                              href={profileHref}
                              className="text-[#C8A061] hover:underline"
                            >
                              {row.passportNo}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </p>
                        {paid ? (
                          <Badge
                            variant="outline"
                            className="mt-1.5 border-emerald-500/40 text-emerald-700"
                          >
                            Paid
                          </Badge>
                        ) : row.isManual ? (
                          <Badge variant="outline" className="mt-1.5">
                            Manual
                          </Badge>
                        ) : null}
                        {row.isGuest ? (
                          <p className="mt-1 text-xs text-violet-700">
                            Guest of {row.hostDelegateName || "registrant"}
                            {row.guestNationality
                              ? ` · ${row.guestNationality}`
                              : ""}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-3 py-4">
                        {row.roomAssignment ? (
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {row.roomAssignment.roomCode}
                            </p>
                            <Badge variant="outline" className="text-[10px]">
                              {roomAssignmentLabel(row.roomAssignment)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <p className="text-xs text-muted-foreground">
                          {row.feeAmount ? fmtRmb(row.feeAmount) : "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Paid: {fmtRmb(row.amountPaid ?? 0)}
                        </p>
                        {!paid && !row.isManual && (
                          <Badge variant="outline" className="mt-1">
                            Pending
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        <DocCell
                          confId={confId}
                          delegateId={row.id}
                          kind="passport"
                          previewUrl={row.passportPhotoPath}
                          proxyUrl={
                            row.passportDocUrl ||
                            `/api/conf/${confId}/delegates/${row.id}/secure-document?kind=passport`
                          }
                          isPdf={row.passportPhotoIsPdf}
                          label="Passport"
                          uploading={uploadingDocKey === `${row.id}:passport`}
                          onUpload={(file) =>
                            void handleReplaceDocument(row.id, "passport", file)
                          }
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <DocCell
                          confId={confId}
                          delegateId={row.id}
                          kind="visa"
                          previewUrl={row.currentVisaPath}
                          proxyUrl={
                            row.visaDocUrl ||
                            `/api/conf/${confId}/delegates/${row.id}/secure-document?kind=visa`
                          }
                          isPdf={row.currentVisaIsPdf}
                          label="Visa"
                          uploading={uploadingDocKey === `${row.id}:visa`}
                          onUpload={(file) =>
                            void handleReplaceDocument(row.id, "visa", file)
                          }
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <DocCell
                          confId={confId}
                          delegateId={row.id}
                          kind="entry-stamp"
                          previewUrl={row.lastEntryStampPath}
                          proxyUrl={
                            row.entryStampDocUrl ||
                            `/api/conf/${confId}/delegates/${row.id}/secure-document?kind=entry-stamp`
                          }
                          isPdf={row.lastEntryStampIsPdf}
                          label="Entry stamp"
                          uploading={
                            uploadingDocKey === `${row.id}:entry-stamp`
                          }
                          onUpload={(file) =>
                            void handleReplaceDocument(
                              row.id,
                              "entry-stamp",
                              file,
                            )
                          }
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="px-3 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.canRemove && !readOnly && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={busy}
                              onClick={() => void handleRemove(row)}
                            >
                              <Trash2 className="size-3" />
                              Remove
                            </Button>
                          )}
                          <Link
                            href={profileHref}
                            className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs font-medium hover:bg-accent"
                          >
                            <Eye className="size-3" />
                            Profile
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {data && (
        <Card className="border-[#C8A061]/30">
          <CardHeader className="logistics-no-print">
            <CardTitle className="text-base">Document Preview</CardTitle>
            <CardDescription>
              Letterhead preview for print and PDF export — full-width document
              thumbnails, no committee sidebar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="overflow-auto rounded-lg bg-muted/20 p-4"
              style={{ maxHeight: 820 }}
            >
              <div style={{ width: 794, margin: "0 auto" }}>
                <LogisticsNameListDocument
                  confInfo={data.conf}
                  entries={entries}
                  generatedAt={generatedAt}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <div id="logistics-name-list-print-root">
          <LogisticsNameListDocument
            confInfo={data.conf}
            entries={entries}
            generatedAt={generatedAt}
            forPrint
          />
        </div>
      )}
    </div>
  );
}
