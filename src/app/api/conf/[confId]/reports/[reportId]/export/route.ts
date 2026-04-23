import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireConferenceApiAccess } from "@/lib/conf/access";

// GET /api/conf/[confId]/reports/[reportId]/export?format=pdf|csv
export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{ confId: string; reportId: string }>;
  },
) {
  try {
    const { confId, reportId } = await params;
    const auth = await requireConferenceApiAccess(confId, "manager");
    if (!auth.ok) return auth.response;

    const url = new URL(req.url);
    const format = url.searchParams.get("format") as "pdf" | "csv" | null;

    if (!format || !["pdf", "csv"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid format. Use 'pdf' or 'csv'" },
        { status: 400 },
      );
    }

    const report = await prisma.confReport.findUnique({
      where: { id: reportId },
      include: {
        entries: {
          include: {
            payment: true,
          },
          orderBy: { displayOrder: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (format === "csv") {
      return exportAsCSV(report);
    } else {
      // For now, return CSV as placeholder for PDF
      // TODO: Implement full PDF export with html-to-pdf library
      return exportAsCSV(report);
    }
  } catch (error) {
    console.error("Failed to export report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 },
    );
  }
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportAsCSV(report: any) {
  const rows: string[][] = [
    [
      "#",
      "Description",
      "Type",
      "Amount",
      "Currency",
      "Scope",
      "Notes",
    ],
  ];

  // Add entries
  report.entries.forEach((entry: any, idx: number) => {
    rows.push([
      String(idx + 1),
      entry.payment?.description || "",
      entry.payment?.paymentType || "",
      String(entry.payment?.amount || 0),
      entry.payment?.currency || "USD",
      entry.payment?.committeeScope || "",
      entry.lineComment || "",
    ]);
  });

  // Add blank line
  rows.push([]);

  // Add totals
  const expenses = report.entries
    .filter((e: any) => e.payment?.paymentType === "EXPENSE")
    .reduce((sum: number, e: any) => sum + (e.payment?.amount || 0), 0);

  const income = report.entries
    .filter((e: any) => e.payment?.paymentType === "INCOME")
    .reduce((sum: number, e: any) => sum + (e.payment?.amount || 0), 0);

  rows.push(["Total Expenses", String(expenses)]);
  rows.push(["Total Income", String(income)]);
  rows.push(["Net", String(income - expenses)]);
  rows.push([]);

  // Add metadata
  rows.push(["Report Title:", report.title]);
  if (report.description) rows.push(["Description:", report.description]);
  if (report.dateFrom) rows.push(["Date From:", report.dateFrom]);
  if (report.dateTo) rows.push(["Date To:", report.dateTo]);
  if (report.committeeScope) rows.push(["Scope:", report.committeeScope]);
  if (report.generalComment) rows.push(["General Notes:", report.generalComment]);
  rows.push(["Created By:", report.createdByName || "System"]);
  rows.push(["Created At:", new Date(report.createdAt).toISOString()]);

  const csv = rows
    .map((r) =>
      r
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv;charset=utf-8",
      "Content-Disposition": `attachment; filename="${report.title || "report"}.csv"`,
    },
  });
}
