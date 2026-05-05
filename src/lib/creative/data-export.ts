/**
 * DRY client-side data export (CSV / JSON). Source: credia `lib/utils/export.ts`.
 * Prefer importing from `@/lib/creative/data-export` instead of vendor trees.
 */

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
): void {
  if (!data.length) return;

  const headers = Object.keys(data[0] as object);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          const stringValue = value?.toString() ?? "";
          return `"${stringValue.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

export function exportToJSON<T>(data: T[], filename: string): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}

function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDataForExport<T extends Record<string, unknown>>(
  data: T[],
  exclude: string[] = ["id", "passwordHash"],
): Partial<T>[] {
  return data.map((item) => {
    const cleaned: Partial<T> = {};
    Object.entries(item).forEach(([key, value]) => {
      if (!exclude.includes(key)) {
        if (value instanceof Date) {
          (cleaned as Record<string, unknown>)[key] = value.toISOString();
        } else if (typeof value === "object" && value !== null) {
          (cleaned as Record<string, unknown>)[key] = JSON.stringify(value);
        } else {
          (cleaned as Record<string, unknown>)[key] = value;
        }
      }
    });
    return cleaned;
  });
}
