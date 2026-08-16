/**
 * Regenerate attendance.generated.json from conference-attendance.xlsx.
 *
 * Usage: npm run conf:attendance-json
 */
import fs from "node:fs";
import path from "node:path";
import { parseConferenceAttendanceXlsx } from "../src/lib/conf/conference-report/connectors/attendance-register";

const root = process.cwd();
const xlsxPath = path.join(
  root,
  "public/conf/assets/before-after-conf/conference-attendance.xlsx",
);
const outPath = path.join(
  root,
  "src/components/tools/conf/conference-report/attendance.generated.json",
);

const rows = parseConferenceAttendanceXlsx(fs.readFileSync(xlsxPath));
fs.writeFileSync(outPath, `${JSON.stringify(rows, null, 2)}\n`);
console.log(
  `Wrote ${rows.length} attendance rows to ${path.relative(root, outPath)}`,
);
