import type { ReactNode } from "react";
import { DocumentReceiptPhotosGrid } from "@/lib/conf/document-receipt-photos";
import { chunkReportReceiptEntries } from "@/lib/conf/conference-report/connectors/payments";
import {
  chunkReportRoomPairings,
  type ReportRuntimeContext,
} from "@/lib/conf/conference-report/report-runtime";
import { BOOKLET_A4, C } from "../booklet/constants";
import { PageHeader } from "../booklet/PageHeader";
import { PageFooter } from "../booklet/PageFooter";
import { ConferenceReportCoverPage } from "./ConferenceReportCoverPage";
import {
  chunkReportToc,
  ConferenceReportTocPage,
  resolveReportTocEntries,
} from "./ConferenceReportTocPage";
import { ReportKeynoteCertificateSection } from "./ReportKeynoteCertificateSection";
import {
  ReportBookletBlockSection,
  ReportBookletContinuationLabel,
  ReportBookletProgramOutlineSection,
} from "./ReportBookletSections";
import {
  ReportRoomPairingsContinuationLabel,
  ReportRoomPairingsTable,
} from "./ReportRoomPairingsSection";
import {
  ACKNOWLEDGEMENTS,
  buildCookingAppendixPages,
  buildPreConferencePages,
  buildReportProgramPages,
  chunkAttendance,
  chunkReportPhotos,
  chunkVenuePhotos,
  computeReportTotalPages,
  CONFERENCE_COMMITTEE,
  CONFERENCE_CHALLENGES,
  CONFERENCE_OBJECTIVES,
  COOKING_CERTIFICATION,
  COOKING_COMMITTEE_NARRATIVE,
  COOKING_REIMBURSEMENTS,
  COOKING_TRANSPORTATION,
  DISTINGUISHED_GUESTS,
  ELECTION_SUMMARY,
  EXECUTIVE_SUMMARY,
  FUTURE_ADVISORIES,
  getIecParticipationMetrics,
  IEC_COMMISSIONERS,
  IEC_ELECTORAL_INITIATIVES,
  LESSONS_LEARNED,
  OUTCOMES,
  PROGRAM_GENERAL_NOTES,
  REPORT_META,
  REPORT_PHOTOS,
  REPORT_PROGRAM_DAYS,
  RESOLUTIONS_SUMMARY,
  RHUB_PLATFORM,
  RHUB_PLATFORM_LINKS,
  VENUE_AND_ACCOMMODATION,
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
  REPORT_LINK,
  REPORT_LIST_ITEM,
  REPORT_PHOTO,
  REPORT_PROGRAM,
  REPORT_SECTION_TITLE,
  REPORT_STATS,
  REPORT_SUBSECTION,
  REPORT_TABLE,
  REPORT_TABLE_PROSE,
} from "./report-typography";

export function computeConferenceReportTotalPages(
  runtime: ReportRuntimeContext,
): number {
  return computeReportTotalPages(runtime);
}

function ReportA4Page({
  children,
  pageNum,
  sectionLabel,
  totalPages,
}: {
  children: ReactNode;
  pageNum: number;
  sectionLabel: string;
  totalPages: number;
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
        totalPages={totalPages}
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

function ReportLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: REPORT_LINK.color,
        textDecoration: REPORT_LINK.textDecoration,
        textUnderlineOffset: REPORT_LINK.textUnderlineOffset,
        fontWeight: REPORT_LINK.fontWeight,
      }}
    >
      {children}
    </a>
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

export function ConferenceReportDocument({
  gap = 0,
  runtime,
}: {
  gap?: number;
  runtime: ReportRuntimeContext;
}) {
  const totalPages = computeConferenceReportTotalPages(runtime);
  const attendanceRows = runtime.attendanceRows;
  const attendanceStats = runtime.attendanceStats;
  const financeSummary = runtime.financeSummary;
  const cookingBudgetCategories = runtime.cookingBudgetCategories;
  const roomPairingChunks = chunkReportRoomPairings(runtime.roomPairings);
  const receiptAppendixChunks = chunkReportReceiptEntries(
    runtime.cookingReceiptEntries,
  );

  const attendanceChunks = chunkAttendance(attendanceRows);
  const tocChunks = chunkReportToc(resolveReportTocEntries(runtime));
  const photoChunks = chunkReportPhotos(REPORT_PHOTOS);
  const venuePhotoChunks = chunkVenuePhotos();
  const programPages = buildReportProgramPages(REPORT_PROGRAM_DAYS);
  const preConferencePages = buildPreConferencePages();
  const cookingAppendixPages = buildCookingAppendixPages();
  const bookletPages = runtime.bookletPages;

  let pageNum = 1;
  const nextPage = () => ++pageNum;

  const ReportPage = (
    props: Omit<Parameters<typeof ReportA4Page>[0], "totalPages">,
  ) => <ReportA4Page {...props} totalPages={totalPages} />;

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
      <ReportPage pageNum={nextPage()} sectionLabel="Executive Summary">
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
      </ReportPage>

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
          <ReportPage
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
          </ReportPage>
        );
      })}

      {/* Venue and Accommodation */}
      <ReportPage pageNum={nextPage()} sectionLabel="Venue & Accommodation">
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
      </ReportPage>

      {venuePhotoChunks.map((chunk, chunkIdx) => (
        <ReportPage
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
        </ReportPage>
      ))}

      {/* Conference Committee + Overview (shared page) */}
      <ReportPage pageNum={nextPage()} sectionLabel="Committee & Overview">
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
      </ReportPage>

      {/* Conference Booklet — major sections from /tools/conf/booklet */}
      {bookletPages.map((plan, idx) => (
        <ReportPage
          key={`booklet-${plan.kind}-${idx}`}
          pageNum={nextPage()}
          sectionLabel={
            plan.kind === "block"
              ? plan.pageIndex === 0
                ? `Booklet — ${plan.block.title}`
                : `Booklet — ${plan.block.title} (cont.)`
              : plan.pageIndex === 0
                ? "Booklet — Program Outline"
                : "Booklet — Program Outline (cont.)"
          }
        >
          {plan.kind === "block" ? (
            <>
              {plan.pageIndex === 0 ? (
                plan.block.key === "introduction" ? (
                  <SectionTitle>
                    Conference Booklet — {plan.block.title}
                  </SectionTitle>
                ) : (
                  <SectionTitle>{plan.block.title}</SectionTitle>
                )
              ) : (
                <ReportBookletContinuationLabel title={plan.block.title} />
              )}
              <ReportBookletBlockSection
                block={{ ...plan.block, paragraphs: plan.paragraphs }}
                showSource={
                  plan.pageIndex === 0 && plan.block.key === "introduction"
                }
              />
            </>
          ) : (
            <>
              {plan.pageIndex > 0 && (
                <ReportBookletContinuationLabel title="Program Outline" />
              )}
              <ReportBookletProgramOutlineSection
                content={runtime.booklet}
                days={plan.days}
                showIntro={plan.showIntro}
              />
            </>
          )}
        </ReportPage>
      ))}

      {/* Detailed program schedule — one section per day (§7–§10), sourced from Detailed Program */}
      {programPages.map((page) => (
        <ReportPage
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
        </ReportPage>
      ))}

      {/* Election Report Summary */}
      <ReportPage pageNum={nextPage()} sectionLabel="Election Report">
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
            fontSize: `${REPORT_PROGRAM.footnote.fontSize}px`,
            color: REPORT_PROGRAM.footnote.color,
            marginTop: "8px",
            lineHeight: REPORT_PROGRAM.footnote.lineHeight,
          }}
        >
          Source: IEC-2026 Comprehensive Election Administrative Report, submitted{" "}
          {ELECTION_SUMMARY.reportSubmittedDate}. IEC financial reconciliation is
          summarized in Section 12.
        </div>
      </ReportPage>

      {/* Attendance & Finance — summary */}
      <ReportPage pageNum={nextPage()} sectionLabel="Attendance & Finance">
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
            ["Registered", attendanceStats.totalRegistered],
            ["Cities represented", attendanceStats.uniqueCities],
            ["Fully paid", attendanceStats.fullyPaid],
            ["Veteran placements", attendanceStats.veteranPlacements],
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

        {runtime.approvedBudgets.length > 0 && (
          <>
            <div
              style={{
                fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
                fontWeight: 700,
                color: C.blue,
                marginBottom: "8px",
              }}
            >
              Approved Committee Budgets (Budget Tool)
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
                  {["Budget", "Category", "Approved Total (RMB)"].map((h) => (
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
                {runtime.approvedBudgets.map((budget) => (
                  <tr key={budget.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                    <td style={{ padding: REPORT_TABLE_PROSE.cellPadding, fontWeight: 600 }}>
                      {budget.title}
                    </td>
                    <td style={{ padding: REPORT_TABLE_PROSE.cellPadding }}>
                      {budget.category}
                    </td>
                    <td
                      style={{
                        padding: REPORT_TABLE_PROSE.cellPadding,
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {budget.grandTotal.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

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
              ["Delegate fees collected", financeSummary.delegateFeesCollected.toLocaleString()],
              ["Cooking Committee — disbursed", financeSummary.cookingFundsDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["Cooking Committee — expended", financeSummary.cookingExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["Cooking Committee — balance returned", financeSummary.cookingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["IEC election revenue", financeSummary.iecRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["IEC election expenditure", financeSummary.iecExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })],
              ["IEC balance turned over to NEC", financeSummary.iecBalanceTurnover.toLocaleString(undefined, { minimumFractionDigits: 2 })],
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
      </ReportPage>

      {/* Cooking Committee budget detail */}
      <ReportPage pageNum={nextPage()} sectionLabel="Cooking Committee Report">
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
            {cookingBudgetCategories.map((row) => (
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
                {financeSummary.cookingExpenditure.toLocaleString(undefined, {
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
          Funds disbursed: RMB {financeSummary.cookingFundsDisbursed.toLocaleString(undefined, { minimumFractionDigits: 2 })}; unexpended balance returned: RMB {financeSummary.cookingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}.
        </BodyParagraph>
      </ReportPage>

      {/* Attendance register pages */}
      {attendanceChunks.map((chunk, chunkIdx) => (
        <ReportPage
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
        </ReportPage>
      ))}

      {roomPairingChunks.map((chunk, chunkIdx) => (
        <ReportPage
          key={`room-pairings-${chunkIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            chunkIdx === 0
              ? "13. Room Assignments"
              : "13. Room Assignments (cont.)"
          }
        >
          {chunkIdx === 0 ? (
            <SectionTitle>13. Full Attendance Register (cont.)</SectionTitle>
          ) : (
            <ReportRoomPairingsContinuationLabel />
          )}
          {chunkIdx === 0 && (
            <div
              style={{
                fontSize: `${REPORT_LIST_ITEM.fontSize}px`,
                fontWeight: 700,
                color: C.blue,
                marginBottom: "8px",
              }}
            >
              Room Assignments and Pairings
            </div>
          )}
          <ReportRoomPairingsTable rows={chunk} />
          {chunkIdx === 0 && (
            <BodyParagraph>
              Source: Delegate workspace room assignments (
              <ReportLink href="https://rhub.ekddigital.com/tools/conf/delegates">
                rhub delegates tool
              </ReportLink>
              ).
            </BodyParagraph>
          )}
        </ReportPage>
      ))}

      {/* Distinguished Guests */}
      <ReportPage pageNum={nextPage()} sectionLabel="Distinguished Guests">
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
      </ReportPage>

      <ReportPage pageNum={nextPage()} sectionLabel="Keynote Certificate">
        <ReportKeynoteCertificateSection certificate={runtime.keynoteCertificate} />
      </ReportPage>

      {/* Outcomes + Resolutions */}
      <ReportPage pageNum={nextPage()} sectionLabel="Outcomes">
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
      </ReportPage>

      {/* Challenges Faced */}
      <ReportPage pageNum={nextPage()} sectionLabel="Challenges">
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
      </ReportPage>

      {/* EKD Digital Resources (rhub) */}
      <ReportPage pageNum={nextPage()} sectionLabel="Conference Platform">
        <SectionTitle>
          17. EKD Digital Resources — Conference Management Platform
        </SectionTitle>
        <BodyParagraph>
          The EKD Digital Resource Hub (rhub) — developed and operated by EKD Digital
          — served as the integrated conference management platform for LSUIC Jinan
          2026. From pre-conference mobilization through post-conference reporting,{" "}
          the{" "}
          <ReportLink href={RHUB_PLATFORM_LINKS[0].url}>
            Conference Hub
          </ReportLink>{" "}
          provided a single operational environment for delegate data, finance,
          communications, and program documentation.
        </BodyParagraph>
        <BodyParagraph>{RHUB_PLATFORM.intro[1]}</BodyParagraph>
        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginBottom: "6px",
            marginTop: "2px",
          }}
        >
          Platform access
        </div>
        <BodyParagraph>{RHUB_PLATFORM.platformAccessIntro}</BodyParagraph>
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
              {["Entry point", "URL"].map((h) => (
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
            {RHUB_PLATFORM_LINKS.map((row, idx) => (
              <tr
                key={row.url}
                style={{
                  background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                  {row.label}
                  <div
                    style={{
                      fontSize: `${REPORT_PROGRAM.footnote.fontSize}px`,
                      fontWeight: 400,
                      color: REPORT_PROGRAM.footnote.color,
                      marginTop: "2px",
                      lineHeight: REPORT_PROGRAM.footnote.lineHeight,
                    }}
                  >
                    {row.description}
                  </div>
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>
                  <ReportLink href={row.url}>{row.url}</ReportLink>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      </ReportPage>

      {/* Lessons Learned + Advisories */}
      <ReportPage pageNum={nextPage()} sectionLabel="Lessons & Advisories">
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
      </ReportPage>

      {/* Acknowledgements */}
      <ReportPage pageNum={nextPage()} sectionLabel="Acknowledgements">
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
      </ReportPage>

      {/* Photo highlight pages */}
      {photoChunks.map((chunk, chunkIdx) => (
        <ReportPage
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
        </ReportPage>
      ))}

      {/* Certification */}
      <ReportPage pageNum={nextPage()} sectionLabel="Certification">
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
      </ReportPage>

      {cookingAppendixPages.map((page, pageIdx) => (
        <ReportPage
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
                    {formatRmb(financeSummary.cookingFundsDisbursed)}
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
                  ["Funds Received", financeSummary.cookingFundsDisbursed],
                  ["Less: Total Expenditure", financeSummary.cookingExpenditure],
                  ["Closing Balance", financeSummary.cookingBalance],
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
        </ReportPage>
      ))}

      {receiptAppendixChunks.map((chunk, pageIdx) => (
        <ReportPage
          key={`receipt-appendix-${pageIdx}`}
          pageNum={nextPage()}
          sectionLabel={
            pageIdx === 0
              ? "Appendix B — Receipt Photos"
              : "Appendix B — Receipt Photos (cont.)"
          }
        >
          {pageIdx === 0 && (
            <SectionTitle>23. Appendices — Appendix B</SectionTitle>
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
              Appendix B — Cooking Committee Receipt Screenshots (continued)
            </div>
          )}
          {pageIdx === 0 && (
            <BodyParagraph>
              Receipt screenshots from approved Cooking Committee payment records (
              <ReportLink href="https://rhub.ekddigital.com/tools/conf/payments">
                rhub payments register
              </ReportLink>
              ).
            </BodyParagraph>
          )}
          <DocumentReceiptPhotosGrid entries={chunk} availableHeight={520} />
        </ReportPage>
      ))}

      <ReportPage pageNum={nextPage()} sectionLabel="Appendix C — IEC-2026">
        <div
          style={{
            fontSize: `${REPORT_CONTINUATION.fontSize}px`,
            fontWeight: REPORT_CONTINUATION.fontWeight,
            color: REPORT_CONTINUATION.color,
            marginBottom: "8px",
          }}
        >
          Appendix C — IEC-2026 Election Report
        </div>
        <BodyParagraph>
          Source: Independent Elections Commission comprehensive election administrative
          report, submitted {ELECTION_SUMMARY.reportSubmittedDate}. IEC-2026 administered
          hybrid in-person and online voting on {ELECTION_SUMMARY.electionDate}; newly
          elected officers were certified and inducted on {ELECTION_SUMMARY.certificationDate}.
        </BodyParagraph>

        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginBottom: "6px",
          }}
        >
          Voter Registration Summary
        </div>
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
              {["Category", "Count"].map((h) => (
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
              ["Total platform users", ELECTION_SUMMARY.voterStats.platformUsers],
              ["Eligible registered voters", ELECTION_SUMMARY.voterStats.eligibleVoters],
              ["In-person voters (Jinan conference)", ELECTION_SUMMARY.voterStats.inPersonVoters],
              ["Online voters", ELECTION_SUMMARY.voterStats.onlineVoters],
              ["Registered candidates (NEC positions)", ELECTION_SUMMARY.voterStats.candidatesRegistered],
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

        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginBottom: "6px",
          }}
        >
          Participation & Turnout
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: `${REPORT_TABLE.fontSize}px`,
            marginBottom: "10px",
          }}
        >
          <thead>
            <tr style={{ background: "#F0F7FF" }}>
              {["Metric", "Value"].map((h) => (
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
            {(() => {
              const metrics = getIecParticipationMetrics();
              const { min, max } = ELECTION_SUMMARY.voteTallyRange;
              return [
                [
                  "Vote tallies (certified results)",
                  `${min}–${max} across NEC positions`,
                ],
                [
                  "Estimated turnout (of 85 eligible voters)",
                  `${metrics.turnoutPctMin}%–${metrics.turnoutPctMax}%`,
                ],
                [
                  "Eligible voters — in-person share",
                  `${metrics.inPersonShare}% (${ELECTION_SUMMARY.voterStats.inPersonVoters})`,
                ],
                [
                  "Eligible voters — online share",
                  `${metrics.onlineShare}% (${ELECTION_SUMMARY.voterStats.onlineVoters})`,
                ],
              ];
            })().map(([label, value], idx) => (
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

        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginBottom: "6px",
          }}
        >
          Election Results — {ELECTION_SUMMARY.electionDate}
        </div>
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
      </ReportPage>

      <ReportPage pageNum={nextPage()} sectionLabel="Appendix C — IEC-2026 (cont.)">
        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginBottom: "6px",
          }}
        >
          Electoral Process & Initiatives
        </div>
        {IEC_ELECTORAL_INITIATIVES.map((item) => (
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

        <div
          style={{
            fontSize: `${REPORT_SUBSECTION.fontSize}px`,
            fontWeight: REPORT_SUBSECTION.fontWeight,
            color: REPORT_SUBSECTION.color,
            marginTop: "8px",
            marginBottom: "6px",
          }}
        >
          IEC-2026 Commission
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
              {["Name", "Position", "City"].map((h) => (
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
            {IEC_COMMISSIONERS.map((row, idx) => (
              <tr
                key={row.name}
                style={{
                  background: idx % 2 === 0 ? "#F8FAFC" : C.white,
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                <td style={{ padding: REPORT_TABLE.cellPadding, fontWeight: 600 }}>
                  {row.name}
                </td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.role}</td>
                <td style={{ padding: REPORT_TABLE.cellPadding }}>{row.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReportPage>
    </div>
  );
}
