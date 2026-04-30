/**
 * Report Document Viewer with live PDF preview and export.
 * Displays financial reports in document format with letterhead, table, and totals.
 */

"use client";

import React, { useState, useCallback } from "react";
import { Download, Printer, Copy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DocumentLayout,
  DocumentTable,
  type TableColumn,
} from "@/lib/conf/document-layout";
import {
  DOCUMENT_COLORS as C,
  FONT_SIZES,
  formatDate,
} from "@/lib/conf/document-constants";

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
  reportId,
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
  const [printMode, setPrintMode] = useState(false);

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

  const confirmedEntries = entries.filter((entry) => entry.status === "APPROVED");

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

  // ── Document content (shared by preview and print) ────────────────────────

  const documentContent = (
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

      {/* Payment entries table */}
      <DocumentTable
        columns={columns}
        data={confirmedEntries.map((e) => ({
          displayOrder: e.displayOrder,
          description: e.description,
          paymentType: e.paymentType,
          amount: e.amount,
          currency: e.currency,
          committeeScope: e.committeeScope,
          lineComment: e.lineComment,
        }))}
        caption="Payment Entries"
        forPrint={printMode}
      />

      {/* Totals section */}
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

      {/* Document preview */}
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
            <DocumentLayout
              confInfo={confInfo}
              officeLabel="Office of Finance"
              members={members}
              forPrint={printMode}
            >
              {documentContent}
            </DocumentLayout>
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
