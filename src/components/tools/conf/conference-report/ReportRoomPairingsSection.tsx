import type { ReportRoomPairingRow } from "@/lib/conf/conference-report/connectors/types";
import { C } from "../booklet/constants";
import { REPORT_CONTINUATION, REPORT_TABLE } from "./report-typography";

export function ReportRoomPairingsTable({
  rows,
}: {
  rows: readonly ReportRoomPairingRow[];
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: `${REPORT_TABLE.fontSize}px`,
      }}
    >
      <thead>
        <tr style={{ background: C.blue, color: "#fff" }}>
          {["Room", "Type", "Occupants", "Cities"].map((h) => (
            <th
              key={h}
              style={{
                padding: REPORT_TABLE.cellPadding,
                textAlign: "left",
                fontWeight: 700,
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => (
          <tr
            key={`${row.roomCode}-${row.occupants}`}
            style={{
              background: idx % 2 === 0 ? "#F8FAFC" : "#fff",
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 700 }}>
              {row.roomCode}
            </td>
            <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.type}</td>
            <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.occupants}</td>
            <td
              style={{
                padding: REPORT_TABLE.cellPadding,
                color: "#444",
                fontSize: `${REPORT_TABLE.fontSize - 0.5}px`,
              }}
            >
              {row.cities}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ReportRoomPairingsContinuationLabel() {
  return (
    <div
      style={{
        fontSize: `${REPORT_CONTINUATION.fontSize}px`,
        fontWeight: REPORT_CONTINUATION.fontWeight,
        color: REPORT_CONTINUATION.color,
        marginBottom: "8px",
      }}
    >
      Room Assignments and Pairings — continued
    </div>
  );
}
