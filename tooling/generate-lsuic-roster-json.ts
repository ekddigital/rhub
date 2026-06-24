/**
 * Regenerate src/lib/conf/lsuic-leaders-roster.generated.json from the CSV export.
 *
 * Usage: npm run lsuic:roster-json
 */
import fs from "node:fs";
import path from "node:path";

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQ = !inQ;
      continue;
    }
    if (!inQ && c === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out.map((s) => s.replace(/^"|"$/g, "").trim());
}

const root = process.cwd();
const csvPath = path.join(
  root,
  "scripts/conference-2026/lsuic-leaders/lsuic-leaders.csv",
);
const outPath = path.join(
  root,
  "src/lib/conf/lsuic-leaders-roster.generated.json",
);

const text = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "");
const lines = text.split(/\r?\n/).filter((line) => line.length > 0);
const headers = parseCsvLine(lines[0]);
const rows = lines.slice(1).map((line) => {
  const cells = parseCsvLine(line);
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    row[header] = cells[index] ?? "";
  });
  return row;
});

fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(`Wrote ${rows.length} roster rows to ${path.relative(root, outPath)}`);
