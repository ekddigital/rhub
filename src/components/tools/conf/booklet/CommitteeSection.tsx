import { C } from "./constants";
import { roleLabel } from "./utils";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import {
  ProfileContactDetails,
  ProfileDelegateCodeBadge,
} from "./ProfileContactDetails";
import { paginateCommitteeSection } from "./booklet-pagination";
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
            fontSize: "10px",
            color: C.red,
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
            fontSize: "10.5px",
            color: C.muted,
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
            fontSize={isNec ? "15px" : "10px"}
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
}: {
  member: NecMember;
  bg: string;
  textColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        gap: "8px",
        padding: "14px 12px",
        borderRadius: "10px",
        background: bg,
        border: `1px solid ${C.border}`,
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
          size={74}
          silhouette={!member.photoPath}
          borderColor={textColor}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "12.5px",
              fontWeight: 700,
              color: textColor,
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
              fontSize: "9.5px",
              fontWeight: 600,
              color: `${textColor}90`,
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
      <ProfileContactDetails member={member} tone="light" fontSize="9px" />
      <ProfileDelegateCodeBadge delegateCode={member.delegateCode} />
    </div>
  );
}

function MemberCard({ member }: { member: NecMember }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        gap: "8px",
        padding: "12px 10px",
        borderRadius: "8px",
        background: C.lightBlue,
        border: `1px solid ${C.border}`,
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
          size={66}
          silhouette={!member.photoPath}
          borderColor={C.blue}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: C.blue,
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
              fontSize: "9.5px",
              color: C.muted,
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
      <ProfileContactDetails member={member} tone="light" fontSize="9px" />
      <ProfileDelegateCodeBadge delegateCode={member.delegateCode} />
    </div>
  );
}

function MembersSubheading({ isNec }: { isNec: boolean }) {
  return (
    <div
      style={{
        fontSize: "12px",
        fontWeight: 700,
        color: C.blue,
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
      {isNec ? "NEC Board Members" : "Committee Members"}
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
}: {
  section: BookletSection;
  members: NecMember[];
  confName: string;
  confYear: number;
  startPageNum: number;
  totalPages: number;
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

  const pages = paginateCommitteeSection(section, filtered, isNecSection);

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
          ) : page.showSectionHeading && pageIndex === 0 ? (
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

          {page.officers.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
                marginBottom: page.members.length > 0 ? "12px" : 0,
              }}
            >
              {page.officers.map((m) => {
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
                  />
                );
              })}
            </div>
          )}

          {page.showMembersHeading && (
            <MembersSubheading isNec={isNecSection} />
          )}

          {page.members.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "12px",
              }}
            >
              {page.members.map((m) => (
                <MemberCard key={m.id} member={m} />
              ))}
            </div>
          )}
        </A4Page>
      ))}
    </>
  );
}
