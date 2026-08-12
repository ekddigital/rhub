import type { ReactNode } from "react";
import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import { ConferenceReportCoverPage } from "./ConferenceReportCoverPage";
import {
  ATTENDANCE_ROWS,
  ATTENDANCE_STATS,
  EXECUTIVE_SUMMARY,
  OUTCOMES,
  PROGRAM_NARRATIVE,
  REPORT_META,
  REPORT_PHOTOS,
  chunkAttendance,
  computeReportTotalPages,
  type AttendanceRow,
} from "./content-data";

export const CONFERENCE_REPORT_TOTAL_PAGES = computeReportTotalPages();

function ReportA4Page({
  children,
  pageNum,
  sectionLabel,
}: {
  children: ReactNode;
  pageNum: number;
  sectionLabel: string;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        maxHeight: `${BOOKLET_A4.height}px`,
        background: C.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PageHeader
        confName={REPORT_META.confName}
        sectionLabel={sectionLabel}
        pageNum={pageNum}
      />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          padding: "18px 40px 10px",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
      <PageFooter
        confName={REPORT_META.confName}
        confYear={REPORT_META.confYear}
        pageNum={pageNum}
        totalPages={CONFERENCE_REPORT_TOTAL_PAGES}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontSize: "17px",
        fontWeight: 800,
        color: C.blue,
        marginBottom: "10px",
        paddingBottom: "6px",
        borderBottom: `2px solid ${C.gold}`,
      }}
    >
      {children}
    </div>
  );
}

function BodyParagraph({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        fontSize: "13px",
        lineHeight: 1.65,
        color: "#222",
        marginBottom: "10px",
      }}
    >
      {children}
    </p>
  );
}

function AttendanceTable({ rows }: { rows: AttendanceRow[] }) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "10.5px",
      }}
    >
      <thead>
        <tr style={{ background: C.blue, color: C.white }}>
          {["No.", "Name", "City", "Room", "Fee", "Paid", "Bal."].map((h) => (
            <th
              key={h}
              style={{
                padding: "5px 4px",
                textAlign: h === "Name" || h === "City" ? "left" : "center",
                fontWeight: 700,
                fontSize: "9.5px",
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
            key={`${row.no}-${row.name}`}
            style={{
              background: idx % 2 === 0 ? "#F8FAFC" : C.white,
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <td style={{ padding: "4px", textAlign: "center", width: "28px" }}>
              {row.no}
            </td>
            <td style={{ padding: "4px 6px", fontWeight: 600 }}>{row.name}</td>
            <td style={{ padding: "4px 6px", color: "#444" }}>{row.city}</td>
            <td style={{ padding: "4px 4px", fontSize: "9.5px" }}>{row.room}</td>
            <td style={{ padding: "4px", textAlign: "center" }}>{row.fee}</td>
            <td style={{ padding: "4px", textAlign: "center" }}>{row.paid}</td>
            <td
              style={{
                padding: "4px",
                textAlign: "center",
                color: row.balance === "0" ? "#047857" : C.red,
                fontWeight: 700,
              }}
            >
              {row.balance}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PhotoGrid({
  photos,
}: {
  photos: (typeof REPORT_PHOTOS)[number][];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "12px",
        flex: 1,
      }}
    >
      {photos.map((photo) => (
        <div key={photo.src} style={{ minHeight: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.src}
            alt={photo.caption}
            style={{
              width: "100%",
              height: "200px",
              objectFit: "cover",
              borderRadius: "6px",
              border: `1px solid ${C.border}`,
            }}
          />
          <div
            style={{
              fontSize: "10px",
              color: "#555",
              marginTop: "4px",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            {photo.caption}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConferenceReportDocument({ gap = 0 }: { gap?: number }) {
  const attendanceChunks = chunkAttendance(ATTENDANCE_ROWS);
  const photoChunks: (typeof REPORT_PHOTOS)[number][][] = [];
  for (let i = 0; i < REPORT_PHOTOS.length; i += 4) {
    photoChunks.push(REPORT_PHOTOS.slice(i, i + 4));
  }

  let pageNum = 1;
  const nextPage = () => ++pageNum;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: `${gap}px`,
      }}
    >
      <ConferenceReportCoverPage />

      {/* Executive Summary + Overview */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Executive Summary">
        <SectionTitle>1. Executive Summary</SectionTitle>
        {EXECUTIVE_SUMMARY.map((p) => (
          <BodyParagraph key={p.slice(0, 40)}>{p}</BodyParagraph>
        ))}

        <SectionTitle>2. Conference Overview</SectionTitle>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            marginBottom: "12px",
          }}
        >
          <tbody>
            {[
              ["Event", REPORT_META.confName],
              ["Theme", REPORT_META.theme],
              ["Sub-theme", REPORT_META.subTheme],
              ["Dates", REPORT_META.dates],
              ["Venue", REPORT_META.venueEn],
              ["Location", `${REPORT_META.city}, PRC`],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td
                  style={{
                    padding: "7px 8px",
                    fontWeight: 700,
                    color: C.blue,
                    width: "28%",
                    background: "#F0F7FF",
                  }}
                >
                  {label}
                </td>
                <td style={{ padding: "7px 10px", color: "#222" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <BodyParagraph>
          The conference opened with arrival and meet-and-greet, proceeded through
          plenary business and elections, Independence Day observance and awards,
          and concluded with departure on Monday, 27 July — a unified four-day
          program under the Legacy and Influence theme.
        </BodyParagraph>
      </ReportA4Page>

      {/* Attendance Summary + Program Highlights */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Attendance & Program">
        <SectionTitle>3. Attendance Summary</SectionTitle>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
            marginBottom: "14px",
          }}
        >
          {[
            ["Registered", ATTENDANCE_STATS.totalRegistered],
            ["Cities represented", ATTENDANCE_STATS.uniqueCities],
            ["Fully paid", ATTENDANCE_STATS.fullyPaid],
            ["VIP guests", ATTENDANCE_STATS.vipGuests],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "#F0F7FF",
                border: `1px solid ${C.blue}22`,
              }}
            >
              <div style={{ fontSize: "10px", color: "#666", fontWeight: 700 }}>
                {label}
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: C.blue,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        <SectionTitle>5. Program Highlights</SectionTitle>
        {PROGRAM_NARRATIVE.map((section) => (
          <div key={section.heading} style={{ marginBottom: "10px" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: C.blue,
                marginBottom: "3px",
              }}
            >
              {section.heading}
            </div>
            <BodyParagraph>{section.body}</BodyParagraph>
          </div>
        ))}
      </ReportA4Page>

      {/* Attendance register pages */}
      {attendanceChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`attendance-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "4. Attendance Register"
              : "4. Attendance Register (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>4. Full Attendance Register</SectionTitle>
          )}
          {chunkIdx > 0 && (
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: C.blue,
                marginBottom: "8px",
              }}
            >
              Attendance Register — continued
            </div>
          )}
          <AttendanceTable rows={chunk} />
        </ReportA4Page>
      ))}

      {/* Outcomes + Distinguished Guests */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Outcomes & Ceremonies">
        <SectionTitle>6. Distinguished Guests and Ceremonies</SectionTitle>
        <BodyParagraph>
          The conference welcomed His Excellency the Ambassador of the Republic
          of Liberia to the People&apos;s Republic of China, national executive
          officers, conference committee leadership, veterans of the union,
          keynote speakers, and invited guests. Ceremonies included the inaugural
          address of the incoming national president, ambassador engagements,
          Independence Day formalities, and the awards night program.
        </BodyParagraph>

        <SectionTitle>7. Outcomes and Legacy</SectionTitle>
        {OUTCOMES.map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "8px",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: C.gold,
                marginTop: "6px",
                flexShrink: 0,
              }}
            />
            <div>
              <span style={{ fontWeight: 800, color: C.blue, fontSize: "13px" }}>
                {item.label}
              </span>
              <span style={{ fontSize: "13px", color: "#333" }}>
                {" "}
                — {item.detail}
              </span>
            </div>
          </div>
        ))}
        <BodyParagraph>
          The Conference Committee expresses gratitude to the National Executive
          Committee, hotel staff, cooking and logistics teams, media partners
          including K-VISUALS, and every delegate who traveled to Jinan for this
          milestone assembly.
        </BodyParagraph>
      </ReportA4Page>

      {/* Photo highlight pages */}
      {photoChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`photos-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "Conference Photographs"
              : "Conference Photographs (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>Conference Photographs</SectionTitle>
          )}
          <PhotoGrid photos={chunk} />
        </ReportA4Page>
      ))}

      {/* Certification */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Certification">
        <SectionTitle>8. Certification</SectionTitle>
        <BodyParagraph>
          We hereby certify that this report represents an official summary of
          the Liberian Student Union in China (LSUIC) 20th Annual Conference held
          in Jinan, Shandong Province, from 24 to 27 July 2026. The attendance
          records and program summary recorded herein have been reconciled
          against conference committee documentation.
        </BodyParagraph>

        <div
          style={{
            marginTop: "32px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "40px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: C.blue,
                marginBottom: "40px",
              }}
            >
              Prepared by:
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.blue}`,
                paddingTop: "6px",
                fontSize: "12px",
              }}
            >
              Conference Committee Secretariat
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: C.blue,
                marginBottom: "40px",
              }}
            >
              Reviewed by:
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.blue}`,
                paddingTop: "6px",
                fontSize: "12px",
              }}
            >
              Enoch Kwateh Dongbo
              <br />
              <span style={{ color: "#666" }}>Conference Committee Chairman</span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "36px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: C.blue,
              marginBottom: "40px",
            }}
          >
            Approved by:
          </div>
          <div
            style={{
              borderTop: `1px solid ${C.blue}`,
              paddingTop: "6px",
              fontSize: "12px",
              maxWidth: "280px",
            }}
          >
            National Executive Committee, LSUIC
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "24px",
            fontSize: "10px",
            color: "#888",
            fontStyle: "italic",
          }}
        >
          Date: August 2026 · Source markdown: {REPORT_META.markdownPath}
        </div>
      </ReportA4Page>
    </div>
  );
}
