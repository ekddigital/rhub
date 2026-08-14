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
  ACKNOWLEDGEMENTS,
  CONFERENCE_CHALLENGES,
  CONFERENCE_COMMITTEE,
  CONFERENCE_OBJECTIVES,
  COOKING_BUDGET_CATEGORIES,
  COOKING_CERTIFICATION,
  COOKING_COMMITTEE_NARRATIVE,
  COOKING_REIMBURSEMENTS,
  COOKING_TRANSPORTATION,
  buildCookingAppendixPages,
  DISTINGUISHED_GUESTS,
  ELECTION_SUMMARY,
  EXECUTIVE_SUMMARY,
  FINANCE_SUMMARY,
  FUTURE_ADVISORIES,
  IEC_EXPENDITURE_ITEMS,
  LESSONS_LEARNED,
  OUTCOMES,
  PROGRAM_GENERAL_NOTES,
  REPORT_META,
  REPORT_PHOTOS,
  REPORT_PROGRAM_DAYS,
  RESOLUTIONS_SUMMARY,
  RHUB_PLATFORM,
  VENUE_AND_ACCOMMODATION,
  buildPreConferencePages,
  buildReportProgramPages,
  chunkAttendance,
  chunkReportPhotos,
  chunkVenuePhotos,
  computeReportTotalPages,
  type AttendanceRow,
  type ReportImageItem,
} from "./content-data";
import type { ProgramDay, ProgramSlot } from "../detailed-program/program-data";
import {
  computeFlyerGridLayout,
  computePhotoGridLayout,
  estimateBodyParagraphsHeight,
  flyerGridCols,
  photoGridAvailableHeight,
  REPORT_IMAGE_GRID_GAP_X,
  REPORT_IMAGE_GRID_GAP_Y,
  reportUsableHeight,
  type FlyerItem,
} from "./report-layout";
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
  REPORT_SUBSECTION,
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

function formatRmb(amount: number): string {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function CookingLineItemsTable({
  items,
}: {
  items: readonly { no: number; description: string; amount: number }[];
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: `${REPORT_TABLE.fontSize}px`,
        marginBottom: "8px",
      }}
    >
      <thead>
        <tr style={{ background: "#F0F7FF" }}>
          {["No.", "Description", "Amount (RMB)"].map((h) => (
            <th
              key={h}
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                textAlign: h === "Amount (RMB)" ? "right" : "left",
                fontWeight: 700,
                fontSize: `${REPORT_TABLE.headerFontSize}px`,
                color: C.blue,
              }}
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((row, idx) => (
          <tr
            key={`${row.no}-${row.description}`}
            style={{
              background: idx % 2 === 0 ? "#F8FAFC" : C.white,
              borderBottom: "1px solid #E5E7EB",
            }}
          >
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                textAlign: "center",
                width: "32px",
              }}
            >
              {row.no}
            </td>
            <td style={{ padding: REPORT_TABLE.compactCellPadding }}>{row.description}</td>
            <td
              style={{
                padding: REPORT_TABLE.compactCellPadding,
                textAlign: "right",
                fontWeight: 600,
              }}
            >
              {formatRmb(row.amount)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FlyerGrid({
  flyers,
  availableHeight,
}: {
  flyers: readonly FlyerItem[];
  availableHeight: number;
}) {
  if (flyers.length === 0) return null;

  const cols = flyerGridCols(flyers);
  const meanAspect =
    flyers.reduce((sum, f) => sum + f.aspectRatio, 0) / flyers.length;
  const layout = computeFlyerGridLayout(
    flyers.length,
    availableHeight,
    cols,
    meanAspect,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gap: `${REPORT_IMAGE_GRID_GAP_Y}px ${REPORT_IMAGE_GRID_GAP_X}px`,
        flex: 1,
        minHeight: 0,
        alignContent: "start",
        marginTop: "8px",
      }}
    >
      {flyers.map((flyer) => (
        <div
          key={flyer.src}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              height: `${layout.imageHeight}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#F8FAFC",
              borderRadius: "4px",
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flyer.src}
              alt={flyer.caption}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <div
            style={{
              fontSize: `${REPORT_PHOTO.caption.fontSize}px`,
              color: REPORT_PHOTO.caption.color,
              marginTop: "3px",
              fontWeight: REPORT_PHOTO.caption.fontWeight,
              textAlign: "center",
              lineHeight: REPORT_PHOTO.caption.lineHeight,
              minHeight: `${layout.captionHeight}px`,
            }}
          >
            {flyer.caption}
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotoGrid({
  photos,
  showSectionTitle,
  showContinuation,
}: {
  photos: readonly ReportImageItem[];
  showSectionTitle: boolean;
  showContinuation: boolean;
}) {
  const availableHeight = photoGridAvailableHeight(
    showSectionTitle,
    showContinuation,
  );
  const layout = computePhotoGridLayout(photos.length, availableHeight);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
        gap: `${REPORT_IMAGE_GRID_GAP_Y}px ${REPORT_IMAGE_GRID_GAP_X}px`,
        flex: 1,
        minHeight: 0,
      }}
    >
      {photos.map((photo) => (
        <div
          key={photo.src}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              minHeight: `${layout.imageHeight}px`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#F8FAFC",
              borderRadius: "4px",
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.src}
              alt={photo.caption}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>
          <div
            style={{
              fontSize: `${REPORT_PHOTO.caption.fontSize}px`,
              color: REPORT_PHOTO.caption.color,
              marginTop: "3px",
              fontWeight: REPORT_PHOTO.caption.fontWeight,
              textAlign: "center",
              lineHeight: REPORT_PHOTO.caption.lineHeight,
              flexShrink: 0,
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
  const venuePhotoChunks = chunkVenuePhotos();
  const programPages = buildReportProgramPages(REPORT_PROGRAM_DAYS);
  const preConferencePages = buildPreConferencePages();
  const cookingAppendixPages = buildCookingAppendixPages();

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

      {/* Pre-Conference Preparation */}
      {preConferencePages.map((plan) => {
        const chrome =
          plan.showSectionTitle
            ? "sectionTitle"
            : plan.pageIndex > 0 && plan.flyers.length > 0
              ? "continuation"
              : "none";
        const flyerHeightBudget =
          reportUsableHeight(chrome) -
          estimateBodyParagraphsHeight(plan.paragraphs);

        return (
          <ReportA4Page
            key={`pre-conf-${plan.pageIndex}`}
            pageNum={nextPage()}
            sectionLabel={
              plan.pageIndex === 0
                ? "Pre-Conference"
                : "Pre-Conference (cont.)"
            }
          >
            {plan.showSectionTitle && (
              <SectionTitle>3. Pre-Conference Preparation</SectionTitle>
            )}
            {plan.pageIndex > 0 && plan.flyers.length > 0 && (
              <div
                style={{
                  fontSize: `${REPORT_CONTINUATION.fontSize}px`,
                  fontWeight: REPORT_CONTINUATION.fontWeight,
                  color: REPORT_CONTINUATION.color,
                  marginBottom: "8px",
                }}
              >
                3. Pre-Conference Preparation — campaign flyers
              </div>
            )}
            {plan.paragraphs.map((p) => (
              <BodyParagraph key={p.slice(0, 40)}>{p}</BodyParagraph>
            ))}
            <FlyerGrid
              flyers={plan.flyers}
              availableHeight={Math.max(200, flyerHeightBudget)}
            />
          </ReportA4Page>
        );
      })}

      {/* Venue and Accommodation */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Venue & Accommodation">
        <SectionTitle>4. Venue and Accommodation</SectionTitle>
        <BodyParagraph>
          The conference was hosted at the {VENUE_AND_ACCOMMODATION.nameEn} (
          {VENUE_AND_ACCOMMODATION.nameZh}) in {VENUE_AND_ACCOMMODATION.location}.
          Jinan — the City of Springs and capital of Shandong Province — provided a
          fitting setting for LSUIC&apos;s twentieth anniversary assembly.
        </BodyParagraph>
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
              ["Hotel", VENUE_AND_ACCOMMODATION.nameEn],
              ["Chinese name", VENUE_AND_ACCOMMODATION.nameZh],
              ["Address", VENUE_AND_ACCOMMODATION.address],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    fontWeight: 700,
                    color: C.blue,
                    width: "28%",
                    background: "#F0F7FF",
                  }}
                >
                  {label}
                </td>
                <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, color: "#222" }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
            fontWeight: 700,
            color: C.blue,
            marginBottom: "6px",
          }}
        >
          Conference facilities used
        </div>
        {VENUE_AND_ACCOMMODATION.facilities.map((item) => (
          <div
            key={item.slice(0, 30)}
            style={{
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              color: REPORT_LIST_ITEM.color,
              marginBottom: "4px",
              paddingLeft: "10px",
              lineHeight: REPORT_LIST_ITEM.lineHeight,
            }}
          >
            • {item}
          </div>
        ))}
        <BodyParagraph>{VENUE_AND_ACCOMMODATION.travelNote}</BodyParagraph>
      </ReportA4Page>

      {venuePhotoChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`venue-photos-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "Venue & Accommodation"
              : "Venue & Accommodation (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>4. Venue and Accommodation — Hotel Photos</SectionTitle>
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
              4. Venue and Accommodation — hotel photos (cont.)
            </div>
          )}
          <PhotoGrid
            photos={chunk}
            showSectionTitle={chunkIdx === 0}
            showContinuation={chunkIdx > 0}
          />
        </ReportA4Page>
      ))}

      {/* Conference Committee + Overview (shared page) */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Committee & Overview">
        <SectionTitle>5. Conference Committee</SectionTitle>
        <BodyParagraph>
          The LSUIC 2026 Conference Committee — constitutionally capped at eleven
          appointed members — executed planning, logistics, communications, and
          on-site operations for the Jinan conference. The committee met weekly
          from appointment through conference adjournment.
        </BodyParagraph>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE.fontSize}px`,
            marginBottom: "16px",
          }}
        >
          <thead>
            <tr style={{ background: C.blue, color: C.white }}>
              {["Role", "Name", "City"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    textAlign: "left",
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
            {CONFERENCE_COMMITTEE.map((member, idx) => (
              <tr
                key={`${member.name}-${member.role}`}
                style={{
                  background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                  {member.role}
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{member.name}</td>
                <td style={{ padding: REPORT_TABLE.cellPadding, color: "#444" }}>
                  {member.city}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <SectionTitle>6. Conference Overview</SectionTitle>
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
          {page.sectionNum === 10 &&
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

      {/* Election Report Summary */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Election Report">
        <SectionTitle>11. Election Report Summary</SectionTitle>
        <BodyParagraph>
          The Independent Elections Commission (IEC-2026) administered the 2026
          LSUIC General Elections on {ELECTION_SUMMARY.electionDate}, introducing
          the union&apos;s first online voter registration and remote voting
          platform. Of {ELECTION_SUMMARY.voterStats.platformUsers} platform
          users, {ELECTION_SUMMARY.voterStats.eligibleVoters} members were
          confirmed as eligible voters ({ELECTION_SUMMARY.voterStats.inPersonVoters}{" "}
          in person, {ELECTION_SUMMARY.voterStats.onlineVoters} online).
        </BodyParagraph>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE.fontSize}px`,
            marginBottom: "10px",
          }}
        >
          <thead>
            <tr style={{ background: C.blue, color: C.white }}>
              {["Position", "Elected Officer", "Votes"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    textAlign: h === "Votes" ? "center" : "left",
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
            {ELECTION_SUMMARY.outcomes.map((row, idx) => (
              <tr
                key={row.position}
                style={{
                  background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                  {row.position}
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.winner}</td>
                <td
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    textAlign: "center",
                    fontWeight: 700,
                    color: C.blue,
                  }}
                >
                  {row.votes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ELECTION_SUMMARY.highlights.map((item) => (
          <div
            key={item.slice(0, 30)}
            style={{
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              color: REPORT_LIST_ITEM.color,
              marginBottom: "5px",
              paddingLeft: "10px",
              lineHeight: REPORT_LIST_ITEM.lineHeight,
            }}
          >
            • {item}
          </div>
        ))}

        <div
          style={{
            fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
            fontWeight: 700,
            color: C.blue,
            marginTop: "10px",
            marginBottom: "6px",
          }}
        >
          IEC-2026 Financial Summary
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
          }}
        >
          <tbody>
            {[
              ["Candidate registration fee revenue", FINANCE_SUMMARY.iecRevenue],
              ["Total expenditure", FINANCE_SUMMARY.iecExpenditure],
              ["Balance turned over to outgoing NEC", FINANCE_SUMMARY.iecBalanceTurnover],
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
                  {formatRmb(Number(value))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            fontSize: `${REPORT_TABLE.fontSize}px`,
            color: "#555",
            marginTop: "6px",
            lineHeight: 1.45,
          }}
        >
          {IEC_EXPENDITURE_ITEMS.map((item) => item.description).join(" · ")}
        </div>
      </ReportA4Page>

      {/* Attendance & Finance — summary */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Attendance & Finance">
        <SectionTitle>12. Attendance and Finance Summary</SectionTitle>
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
              ["Cooking Committee — balance returned", FINANCE_SUMMARY.cookingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["IEC election revenue", FINANCE_SUMMARY.iecRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["IEC election expenditure", FINANCE_SUMMARY.iecExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["IEC balance turned over to NEC", FINANCE_SUMMARY.iecBalanceTurnover.toLocaleString(undefined, { minimumFractionDigits: 2 })],
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

      {/* Cooking Committee budget detail */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Cooking Committee Report">
        <SectionTitle>12. Attendance and Finance Summary (cont.)</SectionTitle>
        <div
          style={{
            fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
            fontWeight: 700,
            color: C.blue,
            marginBottom: "8px",
          }}
        >
          Cooking Committee Report
        </div>
        {COOKING_COMMITTEE_NARRATIVE.slice(0, 2).map((paragraph) => (
          <BodyParagraph key={paragraph.slice(0, 40)}>{paragraph}</BodyParagraph>
        ))}

        <div
          style={{
            fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
            fontWeight: 700,
            color: C.blue,
            marginBottom: "8px",
          }}
        >
          Cooking Committee Expenditure by Category
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
            marginBottom: "12px",
          }}
        >
          <thead>
            <tr style={{ background: "#F0F7FF" }}>
              {["Category", "Amount (RMB)"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    textAlign: "left",
                    fontWeight: 700,
                    color: C.blue,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COOKING_BUDGET_CATEGORIES.map((row) => (
              <tr key={row.label} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: REPORT_TABLE_PROSE.cellPadding }}>{row.label}</td>
                <td
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            <tr style={{ background: C.blue, color: C.white }}>
              <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 700 }}>
                Total Cooking Committee expenditure
              </td>
              <td
                style={{
                  padding: REPORT_TABLE_PROSE.cellPadding,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {FINANCE_SUMMARY.cookingExpenditure.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          style={{
            fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
            fontWeight: 700,
            color: C.blue,
            marginBottom: "6px",
          }}
        >
          Member Reimbursements
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE.fontSize}px`,
          }}
        >
          <thead>
            <tr style={{ background: "#F0F7FF" }}>
              {["Recipient", "Purpose", "Amount (RMB)"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    textAlign: "left",
                    fontWeight: 700,
                    fontSize: `${REPORT_TABLE.headerFontSize}px`,
                    color: C.blue,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COOKING_REIMBURSEMENTS.map((row) => (
              <tr key={`${row.recipient}-${row.purpose}`} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                  {row.recipient}
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.purpose}</td>
                <td
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    textAlign: "right",
                  }}
                >
                  {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <BodyParagraph>
          Certified by Kukor Brooks, Cooking Committee Chairperson, 1 August 2026.
          Funds disbursed: RMB {FINANCE_SUMMARY.cookingFundsDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}; unexpended balance returned: RMB {FINANCE_SUMMARY.cookingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
        </BodyParagraph>
      </ReportA4Page>

      {/* Attendance register pages */}
      {attendanceChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`attendance-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "13. Delegate Register"
              : "13. Delegate Register (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>13. Full Attendance Register</SectionTitle>
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
        <SectionTitle>14. Distinguished Guests and Speakers</SectionTitle>
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

        <SectionTitle>15. Outcomes and Resolutions</SectionTitle>
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

      {/* Challenges Faced */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Challenges">
        <SectionTitle>16. Challenges Faced During the Conference</SectionTitle>
        <BodyParagraph>
          The Jinan 2026 conference executed successfully within its four-day
          program, but several operational challenges required active management
          by the Conference Committee and supporting ad hoc committees. The
          following items reflect documented constraints drawn from registration
          records, committee financial reports, and on-site program execution.
        </BodyParagraph>
        {CONFERENCE_CHALLENGES.map((item) => (
          <BulletItem key={item.label} label={item.label} detail={item.detail} />
        ))}
      </ReportA4Page>

      {/* EKD Digital Resources (rhub) */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Conference Platform">
        <SectionTitle>
          17. EKD Digital Resources — Conference Management Platform
        </SectionTitle>
        {RHUB_PLATFORM.intro.map((paragraph) => (
          <BodyParagraph key={paragraph.slice(0, 40)}>{paragraph}</BodyParagraph>
        ))}
        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginBottom: "8px",
            marginTop: "4px",
          }}
        >
          Platform capabilities used for Jinan 2026
        </div>
        {RHUB_PLATFORM.capabilities.map((item) => (
          <div
            key={item.slice(0, 30)}
            style={{
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              color: REPORT_LIST_ITEM.color,
              marginBottom: "5px",
              paddingLeft: "10px",
              lineHeight: REPORT_LIST_ITEM.lineHeight,
            }}
          >
            • {item}
          </div>
        ))}
        <BodyParagraph>{RHUB_PLATFORM.closing}</BodyParagraph>
      </ReportA4Page>

      {/* Lessons Learned + Advisories */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Lessons & Advisories">
        <SectionTitle>18. Lessons Learned for Future Conferences</SectionTitle>
        {LESSONS_LEARNED.map((item) => (
          <BulletItem key={item.label} label={item.label} detail={item.detail} />
        ))}

        <SectionTitle>
          19. Advisories and Recommendations for Future Conferences
        </SectionTitle>
        <BodyParagraph>
          The Conference Committee and NEC plenary session recommend the
          following practices for future LSUIC annual conferences, drawing on
          Jinan 2026 execution, the Cooking Committee report, and prior
          conference reporting standards.
        </BodyParagraph>
        {FUTURE_ADVISORIES.map((item, idx) => (
          <div
            key={item.slice(0, 30)}
            style={{
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              color: REPORT_LIST_ITEM.color,
              marginBottom: "6px",
              paddingLeft: "10px",
              lineHeight: REPORT_LIST_ITEM.lineHeight,
            }}
          >
            {idx + 1}. {item}
          </div>
        ))}
      </ReportA4Page>

      {/* Acknowledgements */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Acknowledgements">
        <SectionTitle>21. Acknowledgements</SectionTitle>
        <BodyParagraph>
          The Conference Committee extends sincere gratitude to:
        </BodyParagraph>
        {ACKNOWLEDGEMENTS.map((item) => (
          <div
            key={item.slice(0, 30)}
            style={{
              fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
              color: REPORT_LIST_ITEM.color,
              marginBottom: "6px",
              paddingLeft: "10px",
              lineHeight: REPORT_LIST_ITEM.lineHeight,
            }}
          >
            • {item}
          </div>
        ))}
      </ReportA4Page>

      {/* Photo highlight pages */}
      {photoChunks.map((chunk, chunkIdx) => (
        <ReportA4Page
          key={`photos-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "20. Photographic Record"
              : "20. Photographic Record (cont.)"
          }
        >
          {chunkIdx === 0 && (
            <SectionTitle>20. Conference Photographs</SectionTitle>
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
              20. Conference Photographs — continued
            </div>
          )}
          <PhotoGrid
            photos={chunk}
            showSectionTitle={chunkIdx === 0}
            showContinuation={chunkIdx > 0}
          />
        </ReportA4Page>
      ))}

      {/* Certification */}
      <ReportA4Page pageNum={nextPage()} sectionLabel="Certification">
        <SectionTitle>22. Certification</SectionTitle>
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

      {cookingAppendixPages.map((page, pageIdx) => (
        <ReportA4Page
          key={`cooking-appendix-${pageIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            pageIdx === 0
              ? "Appendix A — Cooking Committee"
              : "Appendix A (cont.)"
          }
        >
          {pageIdx === 0 && (
            <SectionTitle>23. Appendices — Appendix A</SectionTitle>
          )}
          {pageIdx > 0 && (
            <div
              style={{
                fontSize: `${REPORT_CONTINUATION.fontSize}px`,
                fontWeight: REPORT_CONTINUATION.fontWeight,
                color: REPORT_CONTINUATION.color,
                marginBottom: "8px",
              }}
            >
              Appendix A — Cooking Committee Financial Report (continued)
            </div>
          )}

          {page.showIntro &&
            COOKING_COMMITTEE_NARRATIVE.map((paragraph) => (
              <BodyParagraph key={paragraph.slice(0, 40)}>{paragraph}</BodyParagraph>
            ))}

          {page.showFundsReceived && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
                marginBottom: "10px",
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
                <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 600 }}>
                    Total Funds Disbursed
                  </td>
                  <td
                    style={{
                      padding: REPORT_TABLE_PROSE.cellPadding,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    {formatRmb(FINANCE_SUMMARY.cookingFundsDisbursed)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {page.sections.map((section) => (
            <div key={section.key} style={{ marginBottom: "6px" }}>
              <div
                style={{
                  fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
                  fontWeight: 700,
                  color: C.blue,
                  marginBottom: "4px",
                }}
              >
                {section.title}
              </div>
              <CookingLineItemsTable items={section.items} />
            </div>
          ))}

          {page.showTransfers && (
            <>
              <div
                style={{
                  fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
                  fontWeight: 700,
                  color: C.blue,
                  marginBottom: "4px",
                }}
              >
                D. Money Transfers / Reimbursements
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: `${REPORT_TABLE.fontSize}px`,
                  marginBottom: "8px",
                }}
              >
                <thead>
                  <tr style={{ background: "#F0F7FF" }}>
                    {["Recipient", "Purpose", "Amount (RMB)"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: REPORT_TABLE.cellPadding,
                          textAlign: "left",
                          fontWeight: 700,
                          fontSize: `${REPORT_TABLE.headerFontSize}px`,
                          color: C.blue,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COOKING_REIMBURSEMENTS.map((row) => (
                    <tr
                      key={`${row.recipient}-${row.purpose}`}
                      style={{ borderBottom: "1px solid #E5E7EB" }}
                    >
                      <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                        {row.recipient}
                      </td>
                      <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.purpose}</td>
                      <td style={{ padding: REPORT_TABLE.cellPadding, textAlign: "right" }}>
                        {formatRmb(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {page.showTransportation && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
                marginBottom: "8px",
              }}
            >
              <tbody>
                <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 600 }}>
                    E. Transportation Expenses
                  </td>
                  <td
                    style={{
                      padding: REPORT_TABLE_PROSE.cellPadding,
                      textAlign: "right",
                      fontWeight: 700,
                    }}
                  >
                    {formatRmb(COOKING_TRANSPORTATION)}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          {page.showReconciliation && (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
                marginBottom: "10px",
              }}
            >
              <thead>
                <tr style={{ background: C.blue, color: C.white }}>
                  {["Financial Reconciliation", "Amount (RMB)"].map((h) => (
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
                  ["Funds Received", FINANCE_SUMMARY.cookingFundsDisbursed],
                  ["Less: Total Expenditure", FINANCE_SUMMARY.cookingExpenditure],
                  ["Closing Balance", FINANCE_SUMMARY.cookingBalance],
                ].map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 600 }}>
                      {label}
                    </td>
                    <td
                      style={{
                        padding: REPORT_TABLE_PROSE.cellPadding,
                        textAlign: "right",
                        fontWeight: 700,
                      }}
                    >
                      {formatRmb(Number(value))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {page.showCertification && (
            <BodyParagraph>
              Certified by {COOKING_CERTIFICATION.reviewedBy},{" "}
              {COOKING_CERTIFICATION.reviewedRole}, {COOKING_CERTIFICATION.reviewDate}.
              Approved by the {COOKING_CERTIFICATION.approvedRole}.
            </BodyParagraph>
          )}
        </ReportA4Page>
      ))}

      <ReportA4Page pageNum={nextPage()} sectionLabel="Appendix B — IEC-2026">
        <div
          style={{
            fontSize: `${REPORT_CONTINUATION.fontSize}px`,
            fontWeight: REPORT_CONTINUATION.fontWeight,
            color: REPORT_CONTINUATION.color,
            marginBottom: "8px",
          }}
        >
          Appendix B — IEC-2026 Election Report
        </div>
        <BodyParagraph>
          Source: Independent Elections Commission comprehensive election administrative
          report, submitted 28 July 2026. IEC-2026 administered hybrid in-person and online
          voting on {ELECTION_SUMMARY.electionDate}.
        </BodyParagraph>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE.fontSize}px`,
            marginBottom: "10px",
          }}
        >
          <thead>
            <tr style={{ background: C.blue, color: C.white }}>
              {["Metric", "Count"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE.cellPadding,
                    textAlign: "left",
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
            {[
              ["Platform users", ELECTION_SUMMARY.voterStats.platformUsers],
              ["Eligible registered voters", ELECTION_SUMMARY.voterStats.eligibleVoters],
              ["In-person voters (Jinan)", ELECTION_SUMMARY.voterStats.inPersonVoters],
              ["Online voters", ELECTION_SUMMARY.voterStats.onlineVoters],
              ["Registered candidates", ELECTION_SUMMARY.voterStats.candidatesRegistered],
            ].map(([label, value], idx) => (
              <tr
                key={String(label)}
                style={{
                  background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                  {label}
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE_PROSE.fontSize}px`,
            marginBottom: "10px",
          }}
        >
          <thead>
            <tr style={{ background: "#F0F7FF" }}>
              {["IEC Expenditure", "Amount (RMB)"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    textAlign: "left",
                    fontWeight: 700,
                    color: C.blue,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IEC_EXPENDITURE_ITEMS.map((row) => (
              <tr key={row.description} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ padding: REPORT_TABLE_PROSE.cellPadding }}>{row.description}</td>
                <td
                  style={{
                    padding: REPORT_TABLE_PROSE.cellPadding,
                    textAlign: "right",
                    fontWeight: 600,
                  }}
                >
                  {formatRmb(row.amount)}
                </td>
              </tr>
            ))}
            <tr style={{ background: C.blue, color: C.white }}>
              <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 700 }}>
                Total IEC expenditure
              </td>
              <td
                style={{
                  padding: REPORT_TABLE_PROSE.cellPadding,
                  textAlign: "right",
                  fontWeight: 700,
                }}
              >
                {formatRmb(FINANCE_SUMMARY.iecExpenditure)}
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid #E5E7EB" }}>
              <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 600 }}>
                Balance turned over to outgoing NEC
              </td>
              <td
                style={{
                  padding: REPORT_TABLE_PROSE.cellPadding,
                  textAlign: "right",
                  fontWeight: 700,
                  color: C.blue,
                }}
              >
                {formatRmb(FINANCE_SUMMARY.iecBalanceTurnover)}
              </td>
            </tr>
          </tbody>
        </table>
      </ReportA4Page>
    </div>
  );
}
