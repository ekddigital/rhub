import type { ReactNode } from "react";
import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import { ConferenceReportCoverPage } from "./ConferenceReportCoverPage";
import {
  chunkReportToc,
  ConferenceReportTocPage,
  resolveReportTocEntries,
} from "./ConferenceReportTocPage";
import {
  ATTENDANCE_ROWS,
  ATTENDANCE_STATS,
  CONFERENCE_OBJECTIVES,
  DISTINGUISHED_GUESTS,
  EXECUTIVE_SUMMARY,
  FINANCE_SUMMARY,
  LESSONS_LEARNED,
  OUTCOMES,
  PRE_CONFERENCE,
  PROGRAM_GENERAL_NOTES,
  REPORT_META,
  REPORT_PHOTOS,
  REPORT_PROGRAM_DAYS,
  RESOLUTIONS_SUMMARY,
  buildReportProgramPages,
  chunkAttendance,
  chunkReportPhotos,
  computeReportTotalPages,
  type AttendanceRow,
} from "./content-data";
import type { ProgramDay, ProgramSlot } from "../detailed-program/program-data";
import {
  REPORT_BODY,
  REPORT_BULLET,
  REPORT_CERT,
  REPORT_CONTINUATION,
  REPORT_LIST_ITEM,
  REPORT_PHOTO,
  REPORT_PROGRAM,
  REPORT_SECTION_TITLE,
  REPORT_STATS,
  REPORT_TABLE,
  REPORT_TABLE_PROSE,
} from "./report-typography";

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
        fontSize: `${REPORT_SECTION_TITLE.fontSize}px`,
        fontWeight: REPORT_SECTION_TITLE.fontWeight,
        color: REPORT_SECTION_TITLE.color,
        marginBottom: `${REPORT_SECTION_TITLE.marginBottom}px`,
        paddingBottom: `${REPORT_SECTION_TITLE.paddingBottom}px`,
        borderBottom: REPORT_SECTION_TITLE.borderBottom,
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
        fontSize: `${REPORT_BODY.fontSize}px`,
        lineHeight: REPORT_BODY.lineHeight,
        color: REPORT_BODY.color,
        marginBottom: "10px",
        textAlign: "justify",
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
      <div
        style={{
          fontSize: `${REPORT_BULLET.fontSize}px`,
          color: REPORT_BULLET.color,
          lineHeight: REPORT_BULLET.lineHeight,
        }}
      >
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
        fontSize: `${REPORT_TABLE.fontSize}px`,
      }}
    >
      <thead>
        <tr style={{ background: C.blue, color: C.white }}>
          {["No.", "Name", "City", "Room", "Fee", "Paid", "Bal."].map((h) => (
            <th
              key={h}
              style={{
                padding: REPORT_TABLE.cellPadding,
                textAlign: h === "Name" || h === "City" ? "left" : "center",
                fontWeight: 700,
                fontSize: `${REPORT_TABLE.headerFontSize}px`,
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
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                textAlign: "center",
                width: "30px",
              }}
            >
              {row.no}
            </td>
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                fontWeight: 600,
              }}
            >
              {row.name}
            </td>
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                color: "#444",
              }}
            >
              {row.city}
            </td>
            <td style={{ padding: REPORT_TABLE.compactCellPadding }}>
              {row.room}
            </td>
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                textAlign: "center",
              }}
            >
              {row.fee}
            </td>
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                textAlign: "center",
              }}
            >
              {row.paid}
            </td>
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
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
  const cols = photos.length <= 4 ? 2 : 3;
  const rows = Math.ceil(photos.length / cols);
  const imageHeight =
    rows >= 3 ? "132px" : rows === 2 ? "188px" : "260px";

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
              fontSize: `${REPORT_PHOTO.caption.fontSize}px`,
              color: REPORT_PHOTO.caption.color,
              marginTop: "3px",
              fontWeight: REPORT_PHOTO.caption.fontWeight,
              textAlign: "center",
              lineHeight: REPORT_PHOTO.caption.lineHeight,
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
          padding: REPORT_TABLE.compactCellPadding,
          fontSize: `${REPORT_PROGRAM.time.fontSize}px`,
          fontWeight: REPORT_PROGRAM.time.fontWeight,
          color: REPORT_PROGRAM.time.color,
          verticalAlign: "top",
          width: "18%",
          whiteSpace: "nowrap",
        }}
      >
        {slot.time}
      </td>
      <td
        style={{
          padding: REPORT_TABLE.compactCellPadding,
          fontSize: `${REPORT_PROGRAM.activity.fontSize}px`,
          color: REPORT_PROGRAM.activity.color,
          verticalAlign: "top",
          lineHeight: REPORT_PROGRAM.activity.lineHeight,
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
              fontSize: `${REPORT_PROGRAM.subItem.fontSize}px`,
              color: REPORT_PROGRAM.subItem.color,
              paddingLeft: "8px",
              marginTop: "2px",
            }}
          >
            – {sub.label}
          </div>
        ))}
      </td>
      <td
        style={{
          padding: REPORT_TABLE.compactCellPadding,
          fontSize: `${REPORT_PROGRAM.responsible.fontSize}px`,
          color: REPORT_PROGRAM.responsible.color,
          verticalAlign: "top",
          width: "28%",
        }}
      >
        {slot.by ?? "—"}
      </td>
    </tr>
  );
}

function ProgramDayBlock({
  day,
  slots,
  showHeader = true,
}: {
  day: ProgramDay;
  slots?: ProgramSlot[];
  showHeader?: boolean;
}) {
  const displaySlots = slots ?? day.slots;

  return (
    <div style={{ marginBottom: "10px" }}>
      {showHeader && (
        <>
          <div
            style={{
              fontSize: `${REPORT_PROGRAM.dayTitle.fontSize}px`,
              fontWeight: REPORT_PROGRAM.dayTitle.fontWeight,
              color: REPORT_PROGRAM.dayTitle.color,
              marginBottom: "3px",
            }}
          >
            Day {day.day} — {day.label}
          </div>
          <div
            style={{
              fontSize: `${REPORT_PROGRAM.dayMeta.fontSize}px`,
              color: REPORT_PROGRAM.dayMeta.color,
              marginBottom: "5px",
            }}
          >
            {day.dayOfWeek}, {day.date}
            {day.theme ? ` · ${day.theme}` : ""}
          </div>
          {day.dressCodes.length > 0 && (
            <div
              style={{
                fontSize: `${REPORT_PROGRAM.dressCode.fontSize}px`,
                color: REPORT_PROGRAM.dressCode.color,
                marginBottom: "5px",
                lineHeight: REPORT_PROGRAM.dressCode.lineHeight,
              }}
            >
              {day.dressCodes.map((dc) => (
                <span key={dc.session} style={{ marginRight: "8px" }}>
                  <strong>{dc.session}:</strong> {dc.code}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: `${REPORT_TABLE.fontSize}px`,
        }}
      >
        <thead>
          <tr style={{ background: "#F0F7FF" }}>
            {["Time", "Activity", "Responsible"].map((h) => (
              <th
                key={h}
                style={{
                  padding: REPORT_TABLE.cellPadding,
                  textAlign: "left",
                  fontWeight: REPORT_PROGRAM.tableHeader.fontWeight,
                  fontSize: `${REPORT_PROGRAM.tableHeader.fontSize}px`,
                  color: REPORT_PROGRAM.tableHeader.color,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displaySlots.map((slot) => (
            <ProgramSlotRow key={`${slot.time}-${slot.activity.slice(0, 20)}`} slot={slot} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConferenceReportDocument({ gap = 0 }: { gap?: number }) {
  const attendanceChunks = chunkAttendance(ATTENDANCE_ROWS);
  const tocChunks = chunkReportToc(resolveReportTocEntries());
  const photoChunks = chunkReportPhotos(REPORT_PHOTOS);
  const programPages = buildReportProgramPages(REPORT_PROGRAM_DAYS);

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
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              color: REPORT_LIST_ITEM.color,
              marginBottom: "6px",
              paddingLeft: "12px",
              lineHeight: REPORT_LIST_ITEM.lineHeight,
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
            fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
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
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    fontWeight: 700,
                    color: C.blue,
                    width: "30%",
                    background: "#F0F7FF",
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    color: "#222",
                  }}
                >
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportA4Page>

      {/* Detailed program schedule — one section per day (§5–§8), sourced from Detailed Program */}
      {programPages.map((page) => (
        <ReportA4Page
          key={`program-${page.sectionNum}-${page.pageIndex}`}
          pageNum={nextPage()}
          sectionLabel={
            page.pageIndex === 0
              ? `${page.sectionNum}. ${page.sectionTitle}`
              : `${page.sectionNum}. ${page.sectionTitle} (cont.)`
          }
        >
          {page.pageIndex === 0 ? (
            <SectionTitle>
              {page.sectionNum}. {page.sectionTitle}
            </SectionTitle>
          ) : (
            <div
              style={{
                fontSize: `${REPORT_CONTINUATION.fontSize}px`,
                fontWeight: REPORT_CONTINUATION.fontWeight,
                color: REPORT_CONTINUATION.color,
                marginBottom: "8px",
              }}
            >
              {page.sectionNum}. {page.sectionTitle} — continued
            </div>
          )}
          <ProgramDayBlock
            day={page.day}
            slots={page.slots}
            showHeader={page.pageIndex === 0}
          />
          {page.sectionNum === 8 &&
            page.pageIndex === page.pageCount - 1 && (
              <div
                style={{
                  marginTop: "8px",
                  fontSize: `${REPORT_PROGRAM.footnote.fontSize}px`,
                  color: REPORT_PROGRAM.footnote.color,
                  lineHeight: REPORT_PROGRAM.footnote.lineHeight,
                }}
              >
                {PROGRAM_GENERAL_NOTES.slice(0, 3).join(" · ")}
              </div>
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
              <div
                style={{
                  fontSize: `${REPORT_STATS.label.fontSize}px`,
                  color: REPORT_STATS.label.color,
                  fontWeight: REPORT_STATS.label.fontWeight,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: `${REPORT_STATS.value.fontSize}px`,
                  fontWeight: REPORT_STATS.value.fontWeight,
                  color: REPORT_STATS.value.color,
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
            fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
          }}
        >
          <thead>
            <tr style={{ background: C.blue, color: C.white }}>
              {["Description", "Amount (RMB)"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    textAlign: "left",
                  }}
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
                <td
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    textAlign: "right",
                  }}
                >
                  {value}
                </td>
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
                fontSize: `${REPORT_CONTINUATION.fontSize}px`,
                fontWeight: REPORT_CONTINUATION.fontWeight,
                color: REPORT_CONTINUATION.color,
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
            fontSize: `${REPORT_TABLE.fontSize}px`,
            marginBottom: "12px",
          }}
        >
          <tbody>
            {DISTINGUISHED_GUESTS.map((g) => (
              <tr key={g.name} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    fontWeight: 700,
                    color: C.blue,
                    width: "42%",
                  }}
                >
                  {g.role}
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{g.name}</td>
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
                fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
                color: REPORT_LIST_ITEM.color,
                marginBottom: "5px",
                paddingLeft: "10px",
                lineHeight: REPORT_LIST_ITEM.lineHeight,
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
                fontSize: `${REPORT_CERT.label.fontSize}px`,
                fontWeight: REPORT_CERT.label.fontWeight,
                color: REPORT_CERT.label.color,
                marginBottom: "40px",
              }}
            >
              Prepared by:
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.blue}`,
                paddingTop: "6px",
                fontSize: `${REPORT_CERT.signature.fontSize}px`,
              }}
            >
              Conference Committee — Documentation &amp; Reporting
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: `${REPORT_CERT.label.fontSize}px`,
                fontWeight: REPORT_CERT.label.fontWeight,
                color: REPORT_CERT.label.color,
                marginBottom: "40px",
              }}
            >
              Reviewed by:
            </div>
            <div
              style={{
                borderTop: `1px solid ${C.blue}`,
                paddingTop: "6px",
                fontSize: `${REPORT_CERT.signature.fontSize}px`,
              }}
            >
              Harris M. Bowulo
              <br />
              <span style={{ color: REPORT_CERT.role.color, fontSize: `${REPORT_CERT.role.fontSize}px` }}>
                General Secretary, Conference Committee
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "36px" }}>
          <div
            style={{
              fontSize: `${REPORT_CERT.label.fontSize}px`,
              fontWeight: REPORT_CERT.label.fontWeight,
              color: REPORT_CERT.label.color,
              marginBottom: "40px",
            }}
          >
            Approved by:
          </div>
          <div
            style={{
              borderTop: `1px solid ${C.blue}`,
              paddingTop: "6px",
              fontSize: `${REPORT_CERT.signature.fontSize}px`,
              maxWidth: "280px",
            }}
          >
            Enoch Kwateh Dongbo
            <br />
            <span style={{ color: REPORT_CERT.role.color, fontSize: `${REPORT_CERT.role.fontSize}px` }}>
              General Chairman, Conference Committee
            </span>
          </div>
        </div>

        <div
          style={{
            marginTop: "auto",
            paddingTop: "24px",
            fontSize: `${REPORT_CERT.date.fontSize}px`,
            color: REPORT_CERT.date.color,
            fontStyle: REPORT_CERT.date.fontStyle,
          }}
        >
          Date: 13 August 2026
        </div>
      </ReportA4Page>
    </div>
  );
}
