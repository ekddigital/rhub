import { C } from "./constants";
import { roleLabel } from "./utils";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import {
  ProfileContactDetails,
  ProfileDelegateCodeBadge,
} from "./ProfileContactDetails";
import {
  BOOKLET_DENSE_GRID_COLS,
  BOOKLET_OFFICER_GRID_COLS,
  paginateCommitteeSection,
  type CommitteeSectionContinuation,
} from "./booklet-pagination";
import type { BookletSection, NecMember } from "./types";

const KEY_ORDER = [
  "CHAIR",
  "VICE_CHAIR",
  "SECRETARY",
  "FINANCIAL_SECRETARY",
  "TREASURER",
];

function chairBadgeLabel(chair: NecMember, isNec?: boolean): string {
  if (isNec) return "National President";
  const preferred = chair.conferencePosition?.trim() || chair.title?.trim();
  return preferred || "Conference Chair";
}

function SectionHeading({ section }: { section: BookletSection }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "24px",
            borderRadius: "2px",
            background: `linear-gradient(${C.blue}, ${C.red})`,
          }}
        />
        <div style={{ fontSize: "16px", fontWeight: 800, color: C.blue }}>
          {section.title}
        </div>
      </div>
      {section.subtitle && (
        <div
          style={{
            fontSize: "11px",
            color: "#000000",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginLeft: "14px",
          }}
        >
          {section.subtitle}
        </div>
      )}
      {section.bodyText && (
        <div
          style={{
            fontSize: "11.5px",
            color: "#111111",
            lineHeight: 1.6,
            marginTop: "8px",
            marginLeft: "14px",
          }}
        >
          {section.bodyText}
        </div>
      )}
    </div>
  );
}

function ChairHeroCard({
  chair,
  isNec,
}: {
  chair: NecMember;
  isNec?: boolean;
}) {
  const photoWidth = isNec ? 140 : 118;
  const photoHeight = isNec ? 176 : 118;
  const title =
    chair.conferencePosition?.trim() ?? chair.title ?? roleLabel(chair);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "stretch",
        gap: isNec ? "18px" : "20px",
        padding: isNec ? "18px 20px" : "20px 22px",
        borderRadius: "12px",
        background: C.blue,
        marginBottom: isNec ? "12px" : "18px",
        boxShadow: "0 4px 18px rgba(0,40,104,0.18)",
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {chair.photoPath ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={chair.photoPath}
            alt={chair.name}
            crossOrigin={
              chair.photoPath.startsWith("http") ||
              chair.photoPath.startsWith("/api/assets/proxy")
                ? "anonymous"
                : undefined
            }
            style={{
              width: `${photoWidth}px`,
              height: `${photoHeight}px`,
              borderRadius: "8px",
              objectFit: "cover",
              objectPosition: "top center",
              border: `2px solid ${C.gold}55`,
              display: "block",
            }}
          />
        ) : (
          <div
            style={{
              width: `${photoWidth}px`,
              height: `${photoHeight}px`,
              borderRadius: "8px",
              border: `2px solid ${C.gold}55`,
              background: `${C.white}0F`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Avatar
              src={chair.photoPath}
              name={chair.name}
              size={Math.min(photoWidth - 18, 108)}
              square
              silhouette={!chair.photoPath}
              borderColor={C.gold}
            />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 10px",
            borderRadius: "20px",
            background: `${C.gold}28`,
            border: `1px solid ${C.gold}80`,
            fontSize: isNec ? "9px" : "8px",
            fontWeight: 800,
            color: C.gold,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: isNec ? "5px" : "8px",
          }}
        >
          ★ {chairBadgeLabel(chair, isNec)}
        </div>

        <div
          style={{
            fontSize: isNec ? "18px" : "20px",
            fontWeight: 900,
            color: C.white,
            lineHeight: 1.1,
            marginBottom: isNec ? "3px" : "5px",
          }}
        >
          {chair.name}
        </div>

        {title && (
          <div
            style={{
              fontSize: isNec ? "12px" : "11px",
              fontWeight: 700,
              color: `${C.white}B0`,
              marginBottom: "8px",
              letterSpacing: "0.03em",
            }}
          >
            {title}
          </div>
        )}

        <div style={{ marginBottom: isNec ? "8px" : "6px" }}>
          <ProfileContactDetails
            member={chair}
            tone="hero"
            fontSize={isNec ? "15px" : "12px"}
            showIcons
          />
          <ProfileDelegateCodeBadge
            delegateCode={chair.delegateCode}
            tone="hero"
            fontSize={isNec ? "12px" : "7.5px"}
          />
        </div>

        {chair.bookletBio && (
          <div
            style={{
              fontSize: isNec ? "13px" : "10.5px",
              color: `${C.white}CC`,
              lineHeight: isNec ? 1.6 : 1.65,
              marginTop: isNec ? "4px" : "6px",
              borderTop: `1px solid ${C.white}18`,
              paddingTop: isNec ? "10px" : "8px",
            }}
          >
            {chair.bookletBio}
          </div>
        )}
      </div>
    </div>
  );
}

function OfficerCard({
  member,
  bg,
  textColor,
  featured = false,
}: {
  member: NecMember;
  bg: string;
  textColor: string;
  featured?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        gap: "8px",
        padding: featured ? "16px 14px" : "14px 12px",
        borderRadius: "10px",
        background: featured ? `${C.blue}10` : bg,
        border: `1px solid ${C.border}`,
        boxShadow: featured ? "0 2px 10px rgba(0,40,104,0.12)" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
          minWidth: 0,
        }}
      >
        <Avatar
          src={member.photoPath}
          name={member.name}
          size={featured ? 102 : 84}
          silhouette={!member.photoPath}
          borderColor={textColor}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: featured ? "17px" : "15px",
              fontWeight: 700,
              color: featured ? "#000000" : textColor,
              marginBottom: "3px",
              lineHeight: 1.25,
              overflowWrap: "break-word",
              wordBreak: "normal",
            }}
          >
            {member.name}
          </div>
          <div
            style={{
              fontSize: featured ? "12.5px" : "11.5px",
              fontWeight: 600,
              color: featured ? "#111111" : `${textColor}90`,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              lineHeight: 1.35,
              overflowWrap: "break-word",
              wordBreak: "normal",
            }}
          >
            {member.conferencePosition?.trim() || roleLabel(member)}
          </div>
        </div>
      </div>
      <ProfileContactDetails
        member={member}
        tone="light"
        fontSize={featured ? "12.5px" : "11.5px"}
      />
      <ProfileDelegateCodeBadge delegateCode={member.delegateCode} />
    </div>
  );
}

function MemberCard({
  member,
  dense = false,
}: {
  member: NecMember;
  dense?: boolean;
}) {
  const avatarSize = dense ? 62 : 78;
  const padding = dense ? "8px 6px" : "12px 10px";
  const nameSize = dense ? "13px" : "15px";
  const titleSize = dense ? "10.5px" : "11.5px";
  const contactSize = dense ? "10.5px" : "11.5px";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        gap: dense ? "6px" : "8px",
        padding,
        borderRadius: dense ? "7px" : "8px",
        background: C.lightBlue,
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: dense ? "6px" : "10px",
          minWidth: 0,
        }}
      >
        <Avatar
          src={member.photoPath}
          name={member.name}
          size={avatarSize}
          silhouette={!member.photoPath}
          borderColor={C.blue}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: nameSize,
              fontWeight: 700,
              color: "#000000",
              lineHeight: 1.25,
              marginBottom: "3px",
              overflowWrap: "break-word",
              wordBreak: "normal",
            }}
          >
            {member.name}
          </div>
          <div
            style={{
              fontSize: titleSize,
              color: "#111111",
              lineHeight: 1.35,
              fontWeight: 500,
              overflowWrap: "break-word",
              wordBreak: "normal",
            }}
          >
            {member.conferencePosition?.trim() || member.title || "Member"}
          </div>
        </div>
      </div>
      <ProfileContactDetails
        member={member}
        tone="light"
        fontSize={contactSize}
      />
      <ProfileDelegateCodeBadge delegateCode={member.delegateCode} />
    </div>
  );
}

function MembersSubheading({
  isNec,
  sectionTitle,
}: {
  isNec: boolean;
  sectionTitle: string;
}) {
  const sectionLower = sectionTitle.toLowerCase();
  const isJudicial = sectionLower.includes("judicial board");
  const isCity = sectionLower.includes("city president");
  return (
    <div
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: "#000000",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "18px",
          borderRadius: "2px",
          background: `linear-gradient(${C.blue}, ${C.red})`,
        }}
      />
      {isNec
        ? "NEC Board Members"
        : isJudicial
          ? "Board Members"
          : isCity
            ? "City Presidents"
            : "Committee Members"}
    </div>
  );
}

const officerColors: Record<string, { bg: string; text: string }> = {
  VICE_CHAIR: { bg: `${C.red}12`, text: C.red },
  SECRETARY: { bg: `${C.blue}0E`, text: C.blue },
  FINANCIAL_SECRETARY: { bg: `${C.gold}18`, text: C.blue },
  TREASURER: { bg: `${C.blue}0E`, text: C.blue },
};

export function CommitteeSection({
  section,
  members,
  confName,
  confYear,
  startPageNum,
  totalPages,
  continuation,
}: {
  section: BookletSection;
  members: NecMember[];
  confName: string;
  confYear: number;
  startPageNum: number;
  totalPages: number;
  continuation?: CommitteeSectionContinuation;
}) {
  const isNecSection = section.type === "NEC";
  const isMainConferenceCommittee =
    section.type === "COMMITTEE" && !section.committeeScope?.trim();

  const filtered = section.committeeScope
    ? members.filter(
        (m) =>
          m.committeeScope === section.committeeScope ||
          (section.type === "NEC" && KEY_ORDER.includes(m.role)),
      )
    : isMainConferenceCommittee
      ? members.filter((m) => m.committeeScope === null)
      : members;

  if (filtered.length === 0) {
    return (
      <A4Page
        pageNum={startPageNum}
        totalPages={totalPages}
        sectionLabel={section.title}
        confName={confName}
        confYear={confYear}
      >
        <SectionHeading section={section} />
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            border: `2px dashed ${C.border}`,
            borderRadius: "10px",
            color: C.muted,
            fontSize: "11px",
            marginTop: "40px",
          }}
        >
          No members in this committee scope yet.
        </div>
      </A4Page>
    );
  }

  const pages = paginateCommitteeSection(section, filtered, isNecSection, {
    continuation,
  });

  return (
    <>
      {pages.map((page, pageIndex) => (
        <A4Page
          key={`${section.id}-page-${pageIndex}`}
          pageNum={startPageNum + pageIndex}
          totalPages={totalPages}
          sectionLabel={section.title}
          confName={confName}
          confYear={confYear}
        >
          {page.showSectionHeading && <SectionHeading section={section} />}

          {page.chair ? (
            <ChairHeroCard chair={page.chair} isNec={isNecSection} />
          ) : page.showChairPlaceholder ? (
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                border: `2px dashed ${C.border}`,
                borderRadius: "10px",
                color: C.muted,
                fontSize: "11px",
                marginBottom: "18px",
              }}
            >
              {isNecSection
                ? "NEC board lead not yet assigned."
                : "Conference Chair not yet assigned."}
            </div>
          ) : null}

          {page.officerRows.map((row, rowIndex) => (
            <div
              key={`officers-row-${rowIndex}`}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${Math.max(1, row.length)}, minmax(0, 1fr))`,
                gap: "12px",
                marginBottom:
                  rowIndex < page.officerRows.length - 1 ||
                  page.memberRows.length > 0 ||
                  page.showMembersHeading
                    ? "12px"
                    : 0,
              }}
            >
              {row.map((m) => {
                const colors = officerColors[m.role] ?? {
                  bg: C.lightBlue,
                  text: C.blue,
                };
                return (
                  <OfficerCard
                    key={m.id}
                    member={m}
                    bg={colors.bg}
                    textColor={colors.text}
                    featured={isNecSection && m.role === "VICE_CHAIR"}
                  />
                );
              })}
            </div>
          ))}

          {page.showMembersHeading && (
            <MembersSubheading isNec={isNecSection} sectionTitle={section.title} />
          )}

          {page.showSubsectionHeading && page.subsectionTitle && (
            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "4px",
                }}
              >
                <div
                  style={{
                    width: "4px",
                    height: "20px",
                    borderRadius: "2px",
                    background: `linear-gradient(${C.blue}, ${C.red})`,
                  }}
                />
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: C.blue,
                  }}
                >
                  {page.subsectionTitle}
                </div>
              </div>
            </div>
          )}

          {page.memberRows.map((row, rowIndex) => {
            const dense = page.memberGridCols >= BOOKLET_DENSE_GRID_COLS;
            return (
            <div
              key={`members-row-${rowIndex}`}
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${page.memberGridCols}, minmax(0, 1fr))`,
                gap: "12px",
                marginBottom:
                  rowIndex < page.memberRows.length - 1 ? "12px" : 0,
              }}
            >
              {row.map((m) => (
                <MemberCard key={m.id} member={m} dense={dense} />
              ))}
            </div>
            );
          })}
        </A4Page>
      ))}
    </>
  );
}
