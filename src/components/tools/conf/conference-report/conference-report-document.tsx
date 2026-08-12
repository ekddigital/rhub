import type { ReactNode } from "react";
import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import { ConferenceReportCoverPage } from "./ConferenceReportCoverPage";
import {
  chunkReportToc,
  ConferenceReportTocPage,
} from "./ConferenceReportTocPage";
import {
  ATTENDANCE_ROWS,
  ATTENDANCE_STATS,
  CONFERENCE_OBJECTIVES,
  DISTINGUISHED_GUESTS,
  EXECUTIVE_SUMMARY,
  FINANCE_SUMMARY,
  INDEPENDENCE_DAY_NARRATIVE,
  LESSONS_LEARNED,
  OUTCOMES,
  PRE_CONFERENCE,
  PROGRAM_GENERAL_NOTES,
  PROGRAM_NARRATIVE,
  REPORT_META,
  REPORT_PHOTOS,
  REPORT_PROGRAM_DAYS,
  REPORT_TOC,
  RESOLUTIONS_SUMMARY,
  chunkAttendance,
  chunkReportPhotos,
  chunkReportProgramDays,
  computeReportTotalPages,
  type AttendanceRow,
} from "./content-data";
import type { ProgramDay, ProgramSlot } from "../detailed-program/program-data";

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

function BulletItem({ label, detail }: { label: string; detail: string }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        marginBottom: "7px",
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
      <div style={{ fontSize: "12.5px", color: "#333", lineHeight: 1.55 }}>
        <span style={{ fontWeight: 800, color: C.blue }}>{label}</span>
        {" — "}
        {detail}
      </div>
    </div>
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
            <td style={{ padding: "3px", textAlign: "center", width: "28px" }}>
              {row.no}
            </td>
            <td style={{ padding: "3px 5px", fontWeight: 600 }}>{row.name}</td>
            <td style={{ padding: "3px 5px", color: "#444" }}>{row.city}</td>
            <td style={{ padding: "3px 4px", fontSize: "9.5px" }}>{row.room}</td>
            <td style={{ padding: "3px", textAlign: "center" }}>{row.fee}</td>
            <td style={{ padding: "3px", textAlign: "center" }}>{row.paid}</td>
            <td
              style={{
                padding: "3px",
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
  const cols = photos.length <= 6 ? 2 : 3;
  const rows = Math.ceil(photos.length / cols);
  const imageHeight =
    rows >= 3 ? "148px" : rows === 2 ? "210px" : "280px";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "6px 8px",
        flex: 1,
        alignContent: "start",
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
              height: imageHeight,
              objectFit: "cover",
              borderRadius: "4px",
              border: `1px solid ${C.border}`,
            }}
          />
          <div
            style={{
              fontSize: "9px",
              color: "#555",
              marginTop: "2px",
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.25,
            }}
          >
            {photo.caption}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramSlotRow({ slot }: { slot: ProgramSlot }) {
  return (
    <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
      <td
        style={{
          padding: "3px 4px",
          fontSize: "9px",
          fontWeight: 700,
          color: C.blue,
          verticalAlign: "top",
          width: "18%",
          whiteSpace: "nowrap",
        }}
      >
        {slot.time}
      </td>
      <td
        style={{
          padding: "3px 5px",
          fontSize: "9.5px",
          color: "#222",
          verticalAlign: "top",
          lineHeight: 1.35,
        }}
      >
        {slot.activity}
        {slot.meal && (
          <span style={{ color: "#047857", fontWeight: 700 }}>
            {" "}
            · {slot.meal}
          </span>
        )}
        {slot.subs?.map((sub) => (
          <div
            key={sub.label}
            style={{
              fontSize: "8.5px",
              color: "#555",
              paddingLeft: "8px",
              marginTop: "1px",
            }}
          >
            – {sub.label}
          </div>
        ))}
      </td>
      <td
        style={{
          padding: "3px 4px",
          fontSize: "8.5px",
          color: "#444",
          verticalAlign: "top",
          width: "28%",
        }}
      >
        {slot.by ?? "—"}
      </td>
    </tr>
  );
}

function ProgramDayBlock({ day }: { day: ProgramDay }) {
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 800,
          color: C.blue,
          marginBottom: "2px",
        }}
      >
        Day {day.day} — {day.label}
      </div>
      <div
        style={{
          fontSize: "9.5px",
          color: "#666",
          marginBottom: "4px",
        }}
      >
        {day.dayOfWeek}, {day.date}
        {day.theme ? ` · ${day.theme}` : ""}
      </div>
      {day.dressCodes.length > 0 && (
        <div
          style={{
            fontSize: "8.5px",
            color: "#555",
            marginBottom: "4px",
            lineHeight: 1.35,
          }}
        >
          {day.dressCodes.map((dc) => (
            <span key={dc.session} style={{ marginRight: "8px" }}>
              <strong>{dc.session}:</strong> {dc.code}
            </span>
          ))}
        </div>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "9.5px",
        }}
      >
        <thead>
          <tr style={{ background: "#F0F7FF" }}>
            {["Time", "Activity", "Responsible"].map((h) => (
              <th
                key={h}
                style={{
                  padding: "3px 4px",
                  textAlign: "left",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  color: C.blue,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {day.slots.map((slot) => (
            <ProgramSlotRow key={`${slot.time}-${slot.activity.slice(0, 20)}`} slot={slot} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConferenceReportDocument({ gap = 0 }: { gap?: number }) {
  const attendanceChunks = chunkAttendance(ATTENDANCE_ROWS);
  const tocChunks = chunkReportToc(REPORT_TOC);
  const photoChunks = chunkReportPhotos(REPORT_PHOTOS);
  const programChunks = chunkReportProgramDays(REPORT_PROGRAM_DAYS);

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

      {/* Table of Contents */}
      {tocChunks.map((chunk, idx) => (
        <ConferenceReportTocPage
          key={`toc-${idx}`}
          pageNum={nextPage()}
          pageIndex={idx}
          entries={chunk}
        />
      ))}

      {/* Executive Summary + Objectives */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Executive Summary">
        <SectionTitle>1. Executive Summary</SectionTitle>
        {EXECUTIVE_SUMMARY.map((p) => (
          <BodyParagraph key={p.slice(0, 40)}>{p}</BodyParagraph>
        ))}

        <SectionTitle>2. Conference Objectives and Theme</SectionTitle>
        <BodyParagraph>
          Theme: &ldquo;{REPORT_META.theme}&rdquo; · Sub-theme: &ldquo;
          {REPORT_META.subTheme}&rdquo;
        </BodyParagraph>
        {CONFERENCE_OBJECTIVES.map((obj) => (
          <div
            key={obj.slice(0, 30)}
            style={{
              fontSize: "12.5px",
              color: "#333",
              marginBottom: "5px",
              paddingLeft: "12px",
              lineHeight: 1.5,
            }}
          >
            • {obj}
          </div>
        ))}
      </ReportA4Page>

      {/* Pre-Conference + Overview */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Pre-Conference">
        <SectionTitle>3. Pre-Conference Preparation</SectionTitle>
        {PRE_CONFERENCE.map((p) => (
          <BodyParagraph key={p.slice(0, 40)}>{p}</BodyParagraph>
        ))}

        <SectionTitle>4. Conference Overview</SectionTitle>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
            marginBottom: "10px",
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
              ["Conference Chair", "Enoch Kwateh Dongbo"],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td
                  style={{
                    padding: "6px 8px",
                    fontWeight: 700,
                    color: C.blue,
                    width: "30%",
                    background: "#F0F7FF",
                  }}
                >
                  {label}
                </td>
                <td style={{ padding: "6px 10px", color: "#222" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportA4Page>

      {/* Detailed program schedule — sourced from Detailed Program */}
      {programChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`program-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "5–8. Detailed Program"
              : "5–8. Detailed Program (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <>
              <SectionTitle>5–8. Conference Program — Detailed Schedule</SectionTitle>
              {PROGRAM_NARRATIVE.slice(0, 2).map((section) => (
                <div key={section.heading} style={{ marginBottom: "6px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 800,
                      color: C.blue,
                      marginBottom: "2px",
                    }}
                  >
                    {section.heading}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      lineHeight: 1.45,
                      color: "#333",
                      marginBottom: "4px",
                    }}
                  >
                    {section.body}
                  </div>
                </div>
              ))}
            </>
          )}
          {chunk.map((day) => (
            <ProgramDayBlock key={day.day} day={day} />
          ))}
          {chunkIdx === programChunks.length - 1 && (
            <>
              <div style={{ marginTop: "6px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: C.blue,
                    marginBottom: "4px",
                  }}
                >
                  Independence Day Ceremonies — Summary
                </div>
                {INDEPENDENCE_DAY_NARRATIVE.map((p) => (
                  <div
                    key={p.slice(0, 30)}
                    style={{
                      fontSize: "10px",
                      lineHeight: 1.45,
                      color: "#333",
                      marginBottom: "4px",
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "8px",
                  color: "#666",
                  lineHeight: 1.35,
                }}
              >
                {PROGRAM_GENERAL_NOTES.slice(0, 3).join(" · ")}
              </div>
            </>
          )}
        </ReportA4Page>
      ))}

      {/* Attendance & Finance */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Attendance & Finance">
        <SectionTitle>9. Attendance and Finance Summary</SectionTitle>
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
            ["Veteran placements", ATTENDANCE_STATS.veteranPlacements],
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

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr style={{ background: C.blue, color: C.white }}>
              {["Description", "Amount (RMB)"].map((h) => (
                <th
                  key={h}
                  style={{ padding: "6px 8px", textAlign: "left" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Delegate fees collected", FINANCE_SUMMARY.delegateFeesCollected.toLocaleString()],
              ["Cooking Committee — disbursed", FINANCE_SUMMARY.cookingFundsDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["Cooking Committee — expended", FINANCE_SUMMARY.cookingExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["Cooking Committee — balance", FINANCE_SUMMARY.cookingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: "6px 8px", fontWeight: 600 }}>{label}</td>
                <td style={{ padding: "6px 8px", textAlign: "right" }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportA4Page>

      {/* Attendance register pages */}
      {attendanceChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`attendance-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "10. Delegate Register"
              : "10. Delegate Register (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>10. Full Attendance Register</SectionTitle>
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

      {/* Distinguished Guests + Outcomes + Resolutions */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Outcomes">
        <SectionTitle>11. Distinguished Guests and Speakers</SectionTitle>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "11px",
            marginBottom: "12px",
          }}
        >
          <tbody>
            {DISTINGUISHED_GUESTS.map((g) => (
              <tr key={g.name} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td
                  style={{
                    padding: "5px 6px",
                    fontWeight: 700,
                    color: C.blue,
                    width: "42%",
                  }}
                >
                  {g.role}
                </td>
                <td style={{ padding: "5px 6px" }}>{g.name}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle>12. Outcomes and Resolutions</SectionTitle>
        {OUTCOMES.map((item) => (
          <BulletItem key={item.label} label={item.label} detail={item.detail} />
        ))}
        <div style={{ marginTop: "8px" }}>
          {RESOLUTIONS_SUMMARY.map((r) => (
            <div
              key={r.slice(0, 30)}
              style={{
                fontSize: "12px",
                color: "#333",
                marginBottom: "4px",
                paddingLeft: "10px",
              }}
            >
              • {r}
            </div>
          ))}
        </div>
      </ReportA4Page>

      {/* Lessons Learned + Acknowledgements */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Lessons Learned">
        <SectionTitle>13. Lessons Learned for Future Conferences</SectionTitle>
        {LESSONS_LEARNED.map((item) => (
          <BulletItem key={item.label} label={item.label} detail={item.detail} />
        ))}

        <SectionTitle>15. Acknowledgements</SectionTitle>
        <BodyParagraph>
          The Conference Committee extends sincere gratitude to H.E. Dudley
          McKinley Thomas and the Embassy of Liberia in Beijing; the NEC and all
          standing and ad hoc committees; K-Visuals Studio; the Arcadia Spa Golf
          International Hotel; and every delegate, veteran, guest, and volunteer
          who traveled to Jinan.
        </BodyParagraph>
      </ReportA4Page>

      {/* Photo highlight pages */}
      {photoChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`photos-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "14. Photographic Record"
              : "14. Photographic Record (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>14. Conference Photographs</SectionTitle>
          )}
          <PhotoGrid photos={chunk} />
        </ReportA4Page>
      ))}

      {/* Certification */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Certification">
        <SectionTitle>16. Certification</SectionTitle>
        <BodyParagraph>
          We hereby certify that this report accurately reflects the attendance,
          program execution, financial summary, and thematic outcomes of the
          LSUIC 20th Annual Conference held in Jinan, Shandong Province, from 24
          to 27 July 2026. Committee financial data is cross-referenced against
          the Cooking Committee report (Appendix A).
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
              Conference Committee — Documentation &amp; Reporting
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
              Harris M. Bowulo
              <br />
              <span style={{ color: "#666" }}>
                General Secretary, Conference Committee
              </span>
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
            Enoch Kwateh Dongbo
            <br />
            <span style={{ color: "#666" }}>
              General Chairman, Conference Committee
            </span>
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
          Date: 13 August 2026
        </div>
      </ReportA4Page>
    </div>
  );
}
