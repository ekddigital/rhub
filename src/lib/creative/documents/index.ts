/**
 * Document Engine Barrel Export — lib/document
 */

export * from "./constants";
export * from "./types";
export * from "./numberingEngine";
export * from "./tocBuilder";
export * from "./htmlParser";
// PDF and DOCX exports are dynamically imported to keep bundle small
// Use: const { exportToPDF } = await import("@/lib/creative/documents/pdfExport");
// Use: const { exportToDocx } = await import("@/lib/creative/documents/docxExport");
