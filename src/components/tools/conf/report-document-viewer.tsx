/**
 * Report Document Viewer with live PDF preview and export.
 * Displays financial reports in document format with letterhead, table, and totals.
 */

"use client";

import React, { useCallback } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DocumentLayout,
  DocumentTable,
  type TableColumn,
  normalizeConfInfo,
  normalizeSidebarMembers,
} from "@/lib/conf/document-layout";
import {
  DOCUMENT_COLORS as C,
  FONT_SIZES,
  formatDate,
} from "@/lib/conf/document-constants";
import {
  computePageChunks,
  estimateTextBlockH,
} from "@/lib/conf/document-pagination";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReportEntry {
  paymentId: string;
  description: string;
  amount: number;
  currency: string;
  paymentType: "EXPENSE" | "INCOME";
  status?: string;
  committeeScope?: string | null;
  lineComment?: string | null;
  displayOrder: number;
}

export interface ReportDocumentViewerProps {
  reportId: string;
  title: string;
  description?: string | null;
  entries: ReportEntry[];
  generalComment?: string | null;
  createdByName?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  committeeScope?: string | null;
  confInfo?: {
    name: string;
    city: string;
    venue?: string;
    startsAt: string;
    endsAt: string;
  };
  members?: Array<{
    id: string;
    name: string;
    role: string;
    title?: string | null;
    city?: string | null;
    phone?: string | null;
    committeeScope?: string | null;
  }>;
  onExport?: (format: "pdf" | "csv") => Promise<void>;
  isExporting?: boolean;
}

// ── Report Document Viewer ───────────────────────────────────────────────────

export function ReportDocumentViewer({
  reportId: _reportId,
  title,
  description,
  entries,
  generalComment,
  createdByName,
  dateFrom,
  dateTo,
  committeeScope,
  confInfo,
  members,
  onExport,
  isExporting = false,
}: ReportDocumentViewerProps) {
  // printMode is always false (window.print() handles media queries); no state setter needed.
  const printMode = false;

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExport = useCallback(
    async (format: "pdf" | "csv") => {
      if (onExport) {
        try {
          await onExport(format);
        } catch (error) {
          console.error(`Failed to export as ${format}:`, error);
        }
      }
    },
    [onExport],
  );

  // ── Calculate totals ────────────────────────────────────────────────────────

  const confirmedEntries = entries.filter(
    (entry) => entry.status === "APPROVED",
  );

  const expenses = confirmedEntries
    .filter((e) => e.paymentType === "EXPENSE")
    .reduce((sum, e) => sum + e.amount, 0);

  const income = confirmedEntries
    .filter((e) => e.paymentType === "INCOME")
    .reduce((sum, e) => sum + e.amount, 0);

  const net = income - expenses;

  // ── Format currency ────────────────────────────────────────────────────────

  const formatCurrency = (amount: number, currency = "USD") =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);

  // ── Table columns ───────────────────────────────────────────────────────────

  const columns: TableColumn[] = [
    {
      key: "displayOrder",
      label: "#",
      width: 5,
      align: "center",
      format: (val) => (typeof val === "number" ? val + 1 : ""),
    },
    {
      key: "description",
      label: "Description",
      width: 25,
      align: "left",
    },
    {
      key: "paymentType",
      label: "Type",
      width: 12,
      align: "center",
      format: (val) =>
        val === "EXPENSE" ? (
          <span style={{ color: C.red, fontWeight: 600 }}>EXPENSE</span>
        ) : (
          <span style={{ color: "#047857", fontWeight: 600 }}>INCOME</span>
        ),
    },
    {
      key: "amount",
      label: "Amount",
      width: 15,
      align: "right",
      format: (val) => formatCurrency(typeof val === "number" ? val : 0),
    },
    {
      key: "currency",
      label: "Currency",
      width: 10,
      align: "center",
    },
    {
      key: "committeeScope",
      label: "Scope",
      width: 15,
      align: "left",
      format: (val) => String(val ?? "—"),
    },
    {
      key: "lineComment",
      label: "Notes",
      width: 18,
      align: "left",
      format: (val) => (
        <span style={{ fontSize: 9 }}>{String(val ?? "—")}</span>
      ),
    },
  ];

  // ── Table rows + pagination ────────────────────────────────────────────────

  const tableRows = confirmedEntries.map((e) => ({
    displayOrder: e.displayOrder,
    description: e.description,
    paymentType: e.paymentType,
    amount: e.amount,
    currency: e.currency,
    committeeScope: e.committeeScope,
    lineComment: e.lineComment,
  }));

  // Page-1 overhead: h1 (~32px) + h2 (~32px) + metadata grid (~54px) + description block.
  // Trailing: summary totals + general comment estimate (~155px).
  // Continuation pages: "Continued…" label (~28px).
  const descH = estimateTextBlockH(description ?? "", 80, 40, 13);
  const rowChunks = computePageChunks(tableRows, {
    page1OverheadPx: 120 + descH,
    trailingPx: 155,
    contHeaderPx: 28,
  });

  const normalizedConfInfo = normalizeConfInfo(confInfo);
  const sidebarMembers = normalizeSidebarMembers(members ?? []);

  // ── Page-1 header (title + metadata + description — first page only) ──────

  const page1Header = (
    <div style={{ fontSize: FONT_SIZES.tableBody }}>
      {/* Title */}
      <h1
        style={{
          fontSize: FONT_SIZES.documentTitle,
          fontWeight: 700,
          color: C.navy,
          marginBottom: 4,
          letterSpacing: "0.5px",
        }}
      >
        Financial Report
      </h1>
      <h2
        style={{
          fontSize: FONT_SIZES.sectionHeading,
          fontWeight: 600,
          color: C.navy,
          marginBottom: 12,
        }}
      >
        {title}
      </h2>

      {/* Report metadata */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
          fontSize: FONT_SIZES.caption,
          color: "#555",
        }}
      >
        {dateFrom && (
          <div>
            <span style={{ fontWeight: 600 }}>Period From:</span>{" "}
            {formatDate(dateFrom)}
          </div>
        )}
        {dateTo && (
          <div>
            <span style={{ fontWeight: 600 }}>Period To:</span>{" "}
            {formatDate(dateTo)}
          </div>
        )}
        {committeeScope && (
          <div>
            <span style={{ fontWeight: 600 }}>Committee:</span> {committeeScope}
          </div>
        )}
        {createdByName && (
          <div>
            <span style={{ fontWeight: 600 }}>Prepared By:</span>{" "}
            {createdByName}
          </div>
        )}
      </div>

      {description && (
        <div
          style={{
            background: "#f0f7ff",
            padding: 12,
            borderLeft: `3px solid ${C.gold}`,
            marginBottom: 16,
            fontSize: FONT_SIZES.caption,
            lineHeight: 1.5,
          }}
        >
          <strong>Description:</strong> {description}
        </div>
      )}
    </div>
  );

  // ── Trailing block (totals + general notes — last page only) ─────────────

  const trailingBlock = (
    <div
      style={{
        marginTop: 20,
        paddingTop: 12,
        borderTop: `2px solid ${C.navy}`,
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 40,
          marginBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: FONT_SIZES.tableBody,
              fontWeight: 600,
              color: C.navy,
              marginBottom: 8,
            }}
          >
            Summary
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: FONT_SIZES.tableBody,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: C.red, fontWeight: 600 }}>
                Total Expenses:
              </span>
              <span style={{ color: C.red, fontWeight: 700 }}>
                {formatCurrency(expenses)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#047857", fontWeight: 600 }}>
                Total Income:
              </span>
              <span style={{ color: "#047857", fontWeight: 700 }}>
                {formatCurrency(income)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: 8,
                borderTop: `1px solid ${C.divider}`,
              }}
            >
              <span style={{ color: C.navy, fontWeight: 700 }}>Net:</span>
              <span
                style={{
                  color: net >= 0 ? "#047857" : C.red,
                  fontWeight: 700,
                  fontSize: FONT_SIZES.sectionHeading,
                }}
              >
                {formatCurrency(net)}
              </span>
            </div>
          </div>
        </div>

        {/* General comment */}
        {generalComment && (
          <div>
            <div
              style={{
                fontSize: FONT_SIZES.tableBody,
                fontWeight: 600,
                color: C.navy,
                marginBottom: 8,
              }}
            >
              General Notes
            </div>
            <div
              style={{
                fontSize: FONT_SIZES.caption,
                lineHeight: 1.6,
                color: "#555",
                fontStyle: "italic",
                background: "#f9f9f9",
                padding: 10,
                borderRadius: 4,
              }}
            >
              {generalComment}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── UI Layout ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Control buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          onClick={handlePrint}
          disabled={isExporting}
        >
          <Printer className="size-4 mr-1.5" />
          Print
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleExport("pdf")}
          disabled={isExporting || !onExport}
        >
          <Download className="size-4 mr-1.5" />
          {isExporting ? "Exporting..." : "Download PDF"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleExport("csv")}
          disabled={isExporting || !onExport}
        >
          <Download className="size-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Document preview — one DocumentLayout per page chunk */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div
            style={{
              maxHeight: "800px",
              overflowY: "auto",
              background: "#f5f5f5",
              padding: "20px",
            }}
          >
            {rowChunks.map((pageRows, pageIdx) => {
              const isFirst = pageIdx === 0;
              const isLast = pageIdx === rowChunks.length - 1;
              return (
                <DocumentLayout
                  key={`report-page-${pageIdx}`}
                  confInfo={normalizedConfInfo}
                  officeLabel="Office of Finance"
                  members={sidebarMembers}
                  forPrint={printMode}
                  className={pageIdx > 0 ? "mt-4" : ""}
                  pageNumber={pageIdx + 1}
                  totalPages={rowChunks.length}
                >
                  {isFirst ? (
                    page1Header
                  ) : (
                    <div
                      style={{ fontSize: 11, color: "#777", marginBottom: 12 }}
                    >
                      Continued Report Entries (Page {pageIdx + 1})
                    </div>
                  )}
                  <DocumentTable
                    columns={columns}
                    data={pageRows}
                    caption={
                      isFirst ? "Payment Entries" : "Payment Entries (cont.)"
                    }
                    forPrint={printMode}
                  />
                  {isLast && trailingBlock}
                </DocumentLayout>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">
              Total Expenses
            </div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">
              Total Income
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(income)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-1">Net</div>
            <div
              className="text-2xl font-bold"
              style={{ color: net >= 0 ? "#047857" : "#b91c1c" }}
            >
              {formatCurrency(net)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
