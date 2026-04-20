"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FileUp,
  Search,
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
import { fmtRmb } from "@/lib/conf/currency";
import { AdaptivePhotoFrame } from "@/components/tools/conf/adaptive-photo-frame";

export type ParticipantRow = {
  id: string;
  userId: string | null;
  name: string;
  passportNo: string | null;
  delegateCode: string | null;
  email: string | null;
  university: string | null;
  province: string | null;
  city: string;
  phone: string | null;
  wechat: string | null;
  gender: "MALE" | "FEMALE" | null;
  feeAmount: number | null;
  feePaid: boolean;
  roomPref: "PAIR" | "SINGLE";
  passportPhotoPath: string | null;
  bookletPhotoPath: string | null;
  conferencePosition: string | null;
  flyerReady: boolean;
  status: "REGISTERED" | "CONFIRMED" | "ATTENDED" | "CANCELLED";
  createdAt: string;
};

type Props = {
  delegates: ParticipantRow[];
  confId: string;
  currentUserId: string | null;
  currentUserEmail: string | null;
  isAdminControl: boolean;
  uploadingDocKey: string | null;
  onTogglePaid: (delegate: ParticipantRow) => void | Promise<void>;
  onReplaceDocument: (
    delegateId: string,
    kind: "passport" | "booklet",
    file: File | null,
  ) => void | Promise<void>;
};

const STATUS_LABELS: Record<ParticipantRow["status"], string> = {
  REGISTERED: "Registered",
  CONFIRMED: "Confirmed",
  ATTENDED: "Attended",
  CANCELLED: "Cancelled",
};

const STATUS_BADGE_CLASS: Record<ParticipantRow["status"], string> = {
  REGISTERED:
    "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  CONFIRMED:
    "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ATTENDED:
    "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  CANCELLED:
    "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",
};

function safe(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function csvEscape(value: string | number | null | undefined): string {
  const text = safe(value).replace(/"/g, '""');
  return `"${text}"`;
}

function downloadBlob(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function normalizeForSearch(text: string | null | undefined): string {
  return (text || "").toLowerCase();
}

export function ParticipantsDataTable({
  delegates,
  confId,
  currentUserId,
  currentUserEmail,
  isAdminControl,
  uploadingDocKey,
  onTogglePaid,
  onReplaceDocument,
}: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ParticipantRow["status"]>("ALL");
  const [paidFilter, setPaidFilter] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return delegates.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (paidFilter === "PAID" && !row.feePaid) return false;
      if (paidFilter === "UNPAID" && row.feePaid) return false;

      if (!normalized) return true;

      return (
        normalizeForSearch(row.name).includes(normalized) ||
        normalizeForSearch(row.delegateCode).includes(normalized) ||
        normalizeForSearch(row.passportNo).includes(normalized) ||
        normalizeForSearch(row.phone).includes(normalized) ||
        normalizeForSearch(row.email).includes(normalized) ||
        normalizeForSearch(row.city).includes(normalized) ||
        normalizeForSearch(row.university).includes(normalized) ||
        normalizeForSearch(row.conferencePosition).includes(normalized)
      );
    });
  }, [delegates, paidFilter, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, query, statusFilter, paidFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const exportRows = useMemo(() => {
    return filtered.map((row) => ({
      conferenceId: row.delegateCode || "",
      name: row.name,
      passportNo: row.passportNo || "",
      gender: row.gender || "",
      university: row.university || "",
      province: row.province || "",
      city: row.city,
      phone: row.phone || "",
      wechat: row.wechat || "",
      email: row.email || "",
      roomPref: row.roomPref,
      feePaid: row.feePaid ? "Yes" : "No",
      feeAmount: row.feeAmount ?? "",
      status: row.status,
      flyerReady: row.flyerReady ? "Yes" : "No",
      conferencePosition: row.conferencePosition || "",
      bookletPhoto: row.bookletPhotoPath || "",
      passportFile: row.passportPhotoPath || "",
      createdAt: row.createdAt,
    }));
  }, [filtered]);

  const handleExportCsv = () => {
    const header = [
      "Conference ID",
      "Name",
      "Passport No",
      "Gender",
      "University",
      "Province",
      "City",
      "Phone",
      "WeChat",
      "Email",
      "Room Preference",
      "Fee Paid",
      "Fee Amount",
      "Status",
      "Flyer Ready",
      "Conference Position",
      "Booklet Photo URL",
      "Passport File URL",
      "Registered At",
    ];

    const lines = [
      header.map((h) => csvEscape(h)).join(","),
      ...exportRows.map((row) =>
        [
          row.conferenceId,
          row.name,
          row.passportNo,
          row.gender,
          row.university,
          row.province,
          row.city,
          row.phone,
          row.wechat,
          row.email,
          row.roomPref,
          row.feePaid,
          row.feeAmount,
          row.status,
          row.flyerReady,
          row.conferencePosition,
          row.bookletPhoto,
          row.passportFile,
          row.createdAt,
        ]
          .map((v) => csvEscape(v))
          .join(","),
      ),
    ];

    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    downloadBlob("conference-participants.csv", blob);
  };

  const handleExportTxt = () => {
    const header = [
      "Conference ID",
      "Name",
      "Passport No",
      "Gender",
      "University",
      "Province",
      "City",
      "Phone",
      "WeChat",
      "Email",
      "Room Preference",
      "Fee Paid",
      "Fee Amount",
      "Status",
      "Flyer Ready",
      "Conference Position",
      "Booklet Photo URL",
      "Passport File URL",
      "Registered At",
    ];

    const lines = [
      header.join("\t"),
      ...exportRows.map((row) =>
        [
          row.conferenceId,
          row.name,
          row.passportNo,
          row.gender,
          row.university,
          row.province,
          row.city,
          row.phone,
          row.wechat,
          row.email,
          row.roomPref,
          row.feePaid,
          row.feeAmount,
          row.status,
          row.flyerReady,
          row.conferencePosition,
          row.bookletPhoto,
          row.passportFile,
          row.createdAt,
        ]
          .map((v) => safe(v).replace(/\t/g, " ").replace(/\n/g, " "))
          .join("\t"),
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    downloadBlob("conference-participants.txt", blob);
  };

  const handleExportExcel = () => {
    const headers = [
      "Conference ID",
      "Name",
      "Passport No",
      "Gender",
      "University",
      "Province",
      "City",
      "Phone",
      "WeChat",
      "Email",
      "Room Preference",
      "Fee Paid",
      "Fee Amount",
      "Status",
      "Flyer Ready",
      "Conference Position",
      "Booklet Photo URL",
      "Passport File URL",
      "Registered At",
    ];

    const encode = (text: string) =>
      text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");

    const rowsHtml = exportRows
      .map((row) => {
        const values = [
          row.conferenceId,
          row.name,
          row.passportNo,
          row.gender,
          row.university,
          row.province,
          row.city,
          row.phone,
          row.wechat,
          row.email,
          row.roomPref,
          row.feePaid,
          String(row.feeAmount),
          row.status,
          row.flyerReady,
          row.conferencePosition,
          row.bookletPhoto,
          row.passportFile,
          row.createdAt,
        ];

        return `<tr>${values.map((v) => `<td>${encode(safe(v))}</td>`).join("")}</tr>`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head><body><table border="1"><thead><tr>${headers
      .map((h) => `<th>${encode(h)}</th>`)
      .join("")}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`;

    const blob = new Blob([html], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    downloadBlob("conference-participants.xls", blob);
  };

  const offset = (page - 1) * pageSize;
  const normalizedUserEmail = normalizeForSearch(currentUserEmail);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Participants Registry Table</CardTitle>
            <CardDescription>
              Full registration data with photos, passport files, pagination, and exports.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="size-4" /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportTxt}>
              <FileText className="size-4" /> TXT
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="size-4" /> Excel
            </Button>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_180px_170px_120px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search name, passport, phone, email, city, or ID"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "ALL" | ParticipantRow["status"])
            }
          >
            <option value="ALL">All status</option>
            <option value="REGISTERED">Registered</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ATTENDED">Attended</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={paidFilter}
            onChange={(e) =>
              setPaidFilter(e.target.value as "ALL" | "PAID" | "UNPAID")
            }
          >
            <option value="ALL">All payment</option>
            <option value="PAID">Paid only</option>
            <option value="UNPAID">Unpaid only</option>
          </select>

          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={String(pageSize)}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="30">30 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="min-w-370 w-full text-xs">
            <thead className="bg-muted/40">
              <tr className="border-b border-border text-left">
                <th className="px-3 py-2 font-semibold">#</th>
                <th className="px-3 py-2 font-semibold">Participant</th>
                <th className="px-3 py-2 font-semibold">Contact</th>
                <th className="px-3 py-2 font-semibold">Passport</th>
                <th className="px-3 py-2 font-semibold">Booklet Photo</th>
                <th className="px-3 py-2 font-semibold">Location / School</th>
                <th className="px-3 py-2 font-semibold">Payment</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-8 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    No participants match your current filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((row, index) => {
                  const canOpenDetail =
                    isAdminControl ||
                    (Boolean(currentUserId) && row.userId === currentUserId) ||
                    (Boolean(normalizedUserEmail) &&
                      Boolean(row.email) &&
                      normalizeForSearch(row.email) === normalizedUserEmail);

                  return (
                    <tr key={row.id} className="border-b border-border align-top">
                      <td className="px-3 py-3 text-muted-foreground">
                        {offset + index + 1}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          <div className="h-10 w-10 overflow-hidden rounded-md border border-border bg-muted">
                            {row.bookletPhotoPath ? (
                              <AdaptivePhotoFrame
                                src={row.bookletPhotoPath}
                                alt={row.name}
                                containerClassName="h-10 w-10 border-0 rounded-none"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                N/A
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{row.name}</p>
                            <p className="text-muted-foreground">
                              {row.delegateCode || "Pending ID"}
                            </p>
                            {row.conferencePosition && (
                              <p className="text-[#8E0E00]">{row.conferencePosition}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <p>{row.phone || "-"}</p>
                        <p className="text-muted-foreground">{row.email || "-"}</p>
                        <p className="text-muted-foreground">WeChat: {row.wechat || "-"}</p>
                      </td>

                      <td className="px-3 py-3">
                        <p>{row.passportNo || "-"}</p>
                        {row.passportPhotoPath ? (
                          <a
                            href={row.passportPhotoPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium hover:bg-accent"
                          >
                            <Eye className="size-3" /> View File
                          </a>
                        ) : (
                          <p className="text-muted-foreground">No file</p>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {row.bookletPhotoPath ? (
                          <a
                            href={row.bookletPhotoPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium hover:bg-accent"
                          >
                            <Eye className="size-3" /> Open Image
                          </a>
                        ) : (
                          <span className="text-muted-foreground">No photo</span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <p>{row.city}{row.province ? `, ${row.province}` : ""}</p>
                        <p className="text-muted-foreground">{row.university || "-"}</p>
                        <p className="text-muted-foreground">{row.gender || "-"}</p>
                      </td>

                      <td className="px-3 py-3">
                        <p>{row.feeAmount ? fmtRmb(row.feeAmount) : "-"}</p>
                        <p className="text-muted-foreground">Room: {row.roomPref}</p>
                        <button
                          className={`mt-1 rounded-md px-2 py-1 text-[11px] font-medium ${
                            row.feePaid
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-yellow-500/10 text-yellow-700"
                          }`}
                          onClick={() => void onTogglePaid(row)}
                        >
                          {row.feePaid ? "Paid" : "Unpaid"}
                        </button>
                      </td>

                      <td className="px-3 py-3">
                        <Badge variant="outline" className={STATUS_BADGE_CLASS[row.status]}>
                          {STATUS_LABELS[row.status]}
                        </Badge>
                        <p className="mt-1 text-muted-foreground">
                          Flyer: {row.flyerReady ? "Ready" : "Pending"}
                        </p>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex max-w-55 flex-wrap gap-1.5">
                          {canOpenDetail && (
                            <Link
                              href={`/tools/conf/delegates/${row.id}`}
                              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[11px] font-medium hover:bg-accent"
                            >
                              <Eye className="size-3" /> Details
                            </Link>
                          )}

                          {row.flyerReady && (
                            <a
                              href={`/api/conf/${confId}/delegates/${row.id}/flyer`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-md bg-[#0B4FD9]/10 px-2 py-1 text-[11px] font-medium text-[#0B4FD9]"
                            >
                              <Eye className="size-3" /> Flyer
                            </a>
                          )}

                          {canOpenDetail && (
                            <label
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent ${
                                uploadingDocKey
                                  ? "pointer-events-none opacity-60"
                                  : ""
                              }`}
                            >
                              <Camera className="size-3" />
                              {uploadingDocKey === `${row.id}:booklet`
                                ? "Uploading..."
                                : "Booklet"}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  void onReplaceDocument(row.id, "booklet", file);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                          )}

                          {isAdminControl && (
                            <label
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent ${
                                uploadingDocKey
                                  ? "pointer-events-none opacity-60"
                                  : ""
                              }`}
                            >
                              <FileUp className="size-3" />
                              {uploadingDocKey === `${row.id}:passport`
                                ? "Uploading..."
                                : "Passport"}
                              <input
                                type="file"
                                className="hidden"
                                accept="image/png,image/jpeg,image/webp,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  void onReplaceDocument(row.id, "passport", file);
                                  e.currentTarget.value = "";
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>
            Showing {pageRows.length === 0 ? 0 : offset + 1} - {offset + pageRows.length} of {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span>
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
