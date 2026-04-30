"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Printer, Download } from "lucide-react";

export interface BudgetLineItem {
  name: string;
  category: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface BudgetLetterComposerProps {
  isOpen: boolean;
  onClose: () => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  budgetData?: {
    id: string;
    title: string;
    status: string;
    createdBy: string;
    date: string;
    items: BudgetLineItem[];
  };
}

/**
 * Budget Letter Composer Panel
 * Shows a live budget document preview alongside the budget form
 * Auto-generates formal budget proposal document
 * Can be added to any page to show budget preview
 */
export function BudgetLetterComposer({
  isOpen,
  onClose,
  zoomLevel,
  onZoomChange,
  budgetData,
}: BudgetLetterComposerProps) {
  const [printMode, setPrintMode] = useState(false);

  // Format the budget document content
  const documentContent = useMemo(() => {
    if (!budgetData || !budgetData.items) return null;

    const totalAmount = budgetData.items.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    return {
      title: `Budget Proposal: ${budgetData.title}`,
      date: budgetData.date,
      status: budgetData.status,
      totalAmount,
      items: budgetData.items,
    };
  }, [budgetData]);

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => window.print(), 100);
    setTimeout(() => setPrintMode(false), 1000);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Preview Panel */}
      <Card className="fixed right-0 top-16 bottom-0 w-96 rounded-none border-l border-t-0 border-r-0 border-b-0 bg-background shadow-lg z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold text-sm">Budget Proposal Preview</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Toolbar */}
        <div className="border-b p-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
            className="h-8 w-8 p-0"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">
            {zoomLevel}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onZoomChange(Math.min(200, zoomLevel + 10))}
            className="h-8 w-8 p-0"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-8"
          >
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4">
          {documentContent && (
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: "top center",
              }}
            >
              <div
                style={{
                  width: "210mm",
                  height: "297mm",
                  padding: "20px",
                  background: "#fff",
                  fontFamily: "Helvetica, Arial, sans-serif",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  border: "1px solid #ddd",
                }}
              >
                {/* Document header */}
                <div style={{ textAlign: "center", marginBottom: "30px" }}>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: "#002868",
                      marginBottom: "5px",
                    }}
                  >
                    LIBERIAN STUDENT UNION IN CHINA
                  </div>
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    LSUIC 2026 Conference
                  </div>
                </div>

                {/* Proposal title */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#1F1C18",
                    }}
                  >
                    BUDGET PROPOSAL
                  </div>
                  <div style={{ fontSize: "12px", marginBottom: "10px" }}>
                    {documentContent.title}
                  </div>
                </div>

                {/* Budget metadata */}
                <div
                  style={{
                    marginBottom: "20px",
                    fontSize: "11px",
                    borderBottom: "1px solid #ddd",
                    paddingBottom: "10px",
                  }}
                >
                  <div>
                    <strong>Created By:</strong> {budgetData?.createdBy}
                  </div>
                  <div>
                    <strong>Date:</strong> {documentContent.date}
                  </div>
                  <div>
                    <strong>Status:</strong> {documentContent.status}
                  </div>
                </div>

                {/* Budget items table */}
                <div style={{ marginBottom: "20px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "10px",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "2px solid #333" }}>
                        <th style={{ textAlign: "left", padding: "8px 4px" }}>
                          Item Name
                        </th>
                        <th style={{ textAlign: "center", padding: "8px 4px" }}>
                          Category
                        </th>
                        <th style={{ textAlign: "center", padding: "8px 4px" }}>
                          Qty
                        </th>
                        <th style={{ textAlign: "center", padding: "8px 4px" }}>
                          Unit Price
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "8px 4px",
                            fontWeight: "bold",
                          }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentContent.items.map((item, idx) => (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: "1px solid #ddd",
                          }}
                        >
                          <td style={{ padding: "6px 4px" }}>{item.name}</td>
                          <td
                            style={{ textAlign: "center", padding: "6px 4px" }}
                          >
                            {item.category}
                          </td>
                          <td
                            style={{ textAlign: "center", padding: "6px 4px" }}
                          >
                            {item.qty} {item.unit}
                          </td>
                          <td
                            style={{ textAlign: "center", padding: "6px 4px" }}
                          >
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "6px 4px",
                              fontWeight: "bold",
                            }}
                          >
                            ${item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: "2px solid #333" }}>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "right",
                            padding: "10px 4px",
                            fontWeight: "bold",
                          }}
                        >
                          TOTAL BUDGET:
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            padding: "10px 4px",
                            fontWeight: "bold",
                            fontSize: "12px",
                            color: "#8E0E00",
                          }}
                        >
                          ${documentContent.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div
                  style={{
                    borderTop: "1px solid #ddd",
                    paddingTop: "20px",
                    textAlign: "center",
                    fontSize: "9px",
                    color: "#999",
                  }}
                >
                  This budget proposal is subject to review and approval by the
                  conference committee.
                  <br />
                  Generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Print version */}
      {printMode && (
        <div id="budget-proposal-print" className="hidden print:block">
          {/* Content will print */}
        </div>
      )}
    </>
  );
}
