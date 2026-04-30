"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ZoomIn, ZoomOut, Printer, Download } from "lucide-react";
import { useState } from "react";

export interface PaymentLetterComposerProps {
  isOpen: boolean;
  onClose: () => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  paymentData?: {
    id: string;
    amount: number;
    paidBy: string;
    paidTo: string;
    method: string;
    date: string;
    description: string;
    status: string;
  };
  members?: Array<{ id: string; name: string; role: string; phone?: string }>;
  confInfo?: {
    startsAt: string;
    endsAt: string;
    venue: string;
  } | null;
}

/**
 * Payment Letter Composer Panel
 * Shows a live letter preview alongside the payment form
 * Auto-generates formal payment receipt document
 * Can be added to any page to show document preview
 */
export function PaymentLetterComposer({
  isOpen,
  onClose,
  zoomLevel,
  onZoomChange,
  paymentData,
  members = [],
  confInfo = null,
}: PaymentLetterComposerProps) {
  const [printMode, setPrintMode] = useState(false);

  // Format the payment receipt content
  const documentContent = useMemo(() => {
    if (!paymentData) return null;

    return {
      title: `Payment Receipt #${paymentData.id}`,
      date: paymentData.date,
      to: `${paymentData.paidTo}`,
      body: `
Payment Receipt and Acknowledgment

Amount Received: USD $${paymentData.amount.toFixed(2)}
Paid By: ${paymentData.paidBy}
Payment Method: ${paymentData.method}
Payment Status: ${paymentData.status}
Date: ${paymentData.date}

Description:
${paymentData.description}

This payment has been recorded and logged in the conference financial system. A copy of this receipt is being retained for audit and record-keeping purposes.

Thank you for your contribution to LSUIC 2026.
      `.trim(),
    };
  }, [paymentData]);

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
          <h3 className="font-semibold text-sm">Payment Receipt Preview</h3>
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

                {/* Receipt title */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#1F1C18",
                    }}
                  >
                    PAYMENT RECEIPT
                  </div>
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Receipt #: {paymentData?.id}
                  </div>
                </div>

                {/* Receipt details */}
                <div style={{ marginBottom: "20px" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "11px",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{ paddingBottom: "8px", fontWeight: "bold" }}
                        >
                          Amount:
                        </td>
                        <td style={{ paddingBottom: "8px" }}>
                          USD ${paymentData?.amount.toFixed(2)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{ paddingBottom: "8px", fontWeight: "bold" }}
                        >
                          Paid By:
                        </td>
                        <td style={{ paddingBottom: "8px" }}>
                          {paymentData?.paidBy}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{ paddingBottom: "8px", fontWeight: "bold" }}
                        >
                          Method:
                        </td>
                        <td style={{ paddingBottom: "8px" }}>
                          {paymentData?.method}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{ paddingBottom: "8px", fontWeight: "bold" }}
                        >
                          Date:
                        </td>
                        <td style={{ paddingBottom: "8px" }}>
                          {paymentData?.date}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{ paddingBottom: "8px", fontWeight: "bold" }}
                        >
                          Status:
                        </td>
                        <td style={{ paddingBottom: "8px" }}>
                          {paymentData?.status}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Body text */}
                <div
                  style={{
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    marginBottom: "30px",
                    fontSize: "11px",
                    lineHeight: "1.6",
                  }}
                >
                  {documentContent.body}
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
                  Generated on {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Print version */}
      {printMode && (
        <div id="payment-receipt-print" className="hidden print:block">
          {/* Content will print */}
        </div>
      )}
    </>
  );
}
