import type { KeynoteCertificateData } from "@/lib/conf/keynote-certificate-data";
import { C } from "../booklet/constants";
import {
  REPORT_BODY,
  REPORT_CERT,
  REPORT_SECTION_TITLE,
  REPORT_TABLE,
  REPORT_TABLE_PROSE,
} from "./report-typography";

export function ReportKeynoteCertificateSection({
  certificate,
}: {
  certificate: KeynoteCertificateData;
}) {
  return (
    <>
      <div
        style={{
          fontSize: `${REPORT_SECTION_TITLE.fontSize - 2}px`,
          fontWeight: REPORT_SECTION_TITLE.fontWeight,
          color: REPORT_SECTION_TITLE.color,
          marginBottom: "10px",
          marginTop: "12px",
        }}
      >
        Keynote Certificate of Appreciation — Fundraising Session
      </div>
      <p
        style={{
          fontSize: `${REPORT_BODY.fontSize}px`,
          lineHeight: REPORT_BODY.lineHeight,
          color: REPORT_BODY.color,
          marginBottom: "10px",
          textAlign: "justify",
        }}
      >
        During the pre-conference fundraising program, the Conference Committee
        presented a formal Certificate of Appreciation to the keynote speaker in
        recognition of leadership and support for LSUIC mobilization. The
        certificate was composed and issued through the{" "}
        <a
          href="https://rhub.ekddigital.com/tools/conf/certificates"
          style={{ color: C.blue, fontWeight: 600 }}
        >
          rhub Keynote Certificate tool
        </a>
        .
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
          marginBottom: "12px",
        }}
      >
        <tbody>
          {[
            ["Recipient", certificate.speakerName],
            ["Title", certificate.speakerTitle],
            ["Organization", certificate.companyName],
            ["Program Date", certificate.displayDate],
            ["Certificate ID", certificate.certificateId],
            ["Theme", certificate.theme],
          ].map(([label, value]) => (
            <tr key={label} style={{ borderBottom: "1px solid #E5E7EB" }}>
              <td
                style={{
                  padding: REPORT_TABLE_PROSE.cellPadding,
                  fontWeight: 700,
                  color: C.blue,
                  width: "32%",
                  background: "#F0F7FF",
                }}
              >
                {label}
              </td>
              <td style={{ padding: REPORT_TABLE_PROSE.cellPadding }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p
        style={{
          fontSize: `${REPORT_BODY.fontSize}px`,
          lineHeight: REPORT_BODY.lineHeight,
          color: REPORT_BODY.color,
          marginBottom: "12px",
          textAlign: "justify",
          fontStyle: "italic",
        }}
      >
        {certificate.citationText}
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: `${REPORT_TABLE.fontSize}px`,
        }}
      >
        <thead>
          <tr style={{ background: C.blue, color: "#fff" }}>
            {["Signatory", "Name", "Title"].map((h) => (
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
          {certificate.signatories.map((slot, idx) => (
            <tr
              key={`${slot.name}-${idx}`}
              style={{
                background: idx % 2 === 0 ? "#F8FAFC" : "#fff",
                borderBottom: "1px solid #E5E7EB",
              }}
            >
              <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                {slot.label}
              </td>
              <td style={{ padding: REPORT_TABLE.cellPadding }}>{slot.name}</td>
              <td style={{ padding: REPORT_TABLE.cellPadding, color: "#444" }}>
                {slot.title}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: "10px",
          fontSize: `${REPORT_CERT.date.fontSize}px`,
          color: REPORT_CERT.date.color,
        }}
      >
        Date of issue: {certificate.displayDate}
      </div>
    </>
  );
}
