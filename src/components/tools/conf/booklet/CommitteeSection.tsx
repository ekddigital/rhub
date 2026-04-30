import { C } from "./constants";
import { roleLabel } from "./utils";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, NecMember } from "./types";

const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];

function chairBadgeLabel(chair: NecMember, isNec?: boolean): string {
  if (isNec) return "National President";
  const preferred = chair.conferencePosition?.trim() || chair.title?.trim();
  return preferred || "Conference Chair";
}

// ─── Section header used on both pages ────────────────────────────────────────
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

// ─── Chair hero card (full-width, compact for NEC sections) ──────────────────────────────────
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
      {/* Large portrait avatar */}
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

      {/* Info block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Gold "Chairman" badge */}
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

        {/* Name */}
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

        {/* Title */}
        {title && (
          <div
            style={{
              fontSize: isNec ? "12px" : "11px",
              fontWeight: 700,
              color: `${C.white}B0`,
              marginBottom: isNec ? "8px" : "8px",
              letterSpacing: "0.03em",
            }}
          >
            {title}
          </div>
        )}

        {/* City / phone / university / code */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNec ? "1fr 1fr" : "1fr",
            gap: isNec ? "8px 14px" : "4px",
            marginBottom: isNec ? "8px" : "6px",
          }}
        >
          {chair.city && (
            <div
              style={{
                fontSize: isNec ? "15px" : "10px",
                color: `${C.white}80`,
              }}
            >
              📍 {chair.city}
              {chair.province ? `, ${chair.province}` : ""}
            </div>
          )}
          {chair.phone && (
            <div
              style={{
                fontSize: isNec ? "16px" : "10px",
                color: `${C.white}95`,
                fontWeight: 600,
              }}
            >
              Phone: {chair.phone}
            </div>
          )}
          <div
            style={{
              fontSize: isNec ? "16px" : "10px",
              color: `${C.white}7A`,
            }}
          >
            🎓 {chair.university?.trim() || "Member"}
          </div>
          <div
            style={{
              fontSize: isNec ? "12px" : "7.5px",
              fontFamily: "monospace",
              color: chair.delegateCode ? C.gold : `${C.white}80`,
              background: chair.delegateCode ? `${C.gold}20` : `${C.white}15`,
              padding: "3px 8px",
              borderRadius: "5px",
              display: "inline-block",
              width: "fit-content",
            }}
          >
            {chair.delegateCode ?? "ID pending"}
          </div>
        </div>

        {/* Bio */}
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

// ─── Key officer card (Vice-Chair, Secretary, Treasurer) ──────────────────────
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
        flexDirection: "row",
        alignItems: "stretch",
        minWidth: 0,
        gap: "10px",
        padding: "14px 12px",
        borderRadius: "10px",
        background: bg,
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          width: "76px",
        }}
      >
        <Avatar
          src={member.photoPath}
          name={member.name}
          size={74}
          silhouette={!member.photoPath}
          borderColor={textColor}
        />
        <div
          style={{
            fontSize: "7px",
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {member.delegateCode ?? "Member"}
        </div>
      </div>
      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: "12.5px",
            fontWeight: 700,
            color: textColor,
            marginBottom: "3px",
            lineHeight: 1.25,
            overflowWrap: "anywhere",
            wordBreak: "break-word",
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
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {member.conferencePosition?.trim() || roleLabel(member)}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            gap: "2px 10px",
            marginTop: "3px",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              color: C.muted,
              lineHeight: 1.3,
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {(member.city ?? "Member") +
              (member.province ? `, ${member.province}` : "")}
          </div>
          <div
            style={{
              fontSize: "9px",
              color: C.blue,
              lineHeight: 1.3,
              fontWeight: 600,
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {member.phone ?? "Phone pending"}
          </div>
          <div
            style={{
              gridColumn: "1 / span 2",
              fontSize: "9px",
              color: C.muted,
              lineHeight: 1.3,
              minWidth: 0,
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            }}
          >
            {member.university?.trim() || "Member"}
          </div>
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "8px",
            fontFamily: "monospace",
            color: member.delegateCode ? C.red : C.muted,
            background: member.delegateCode ? `${C.red}15` : `${C.border}60`,
            padding: "1px 6px",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          {member.delegateCode ?? "ID pending"}
        </div>
      </div>
    </div>
  );
}

// ─── General committee member card (3-col grid) ───────────────────────────────
function MemberCard({ member }: { member: NecMember }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        minWidth: 0,
        gap: "10px",
        padding: "12px 10px",
        borderRadius: "8px",
        background: C.lightBlue,
        border: `1px solid ${C.border}`,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "5px",
          width: "68px",
        }}
      >
        <Avatar
          src={member.photoPath}
          name={member.name}
          size={66}
          silhouette={!member.photoPath}
          borderColor={C.blue}
        />
        <div
          style={{
            fontSize: "7px",
            color: C.muted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          {member.delegateCode ?? "Member"}
        </div>
      </div>
      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: C.blue,
            lineHeight: 1.25,
            marginBottom: "3px",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: "9.5px",
            color: C.muted,
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 500 }}>
            {member.conferencePosition?.trim() || member.title || "Member"}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: "2px 10px",
            }}
          >
            <div
              style={{
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {(member.city ?? "Member") +
                (member.province ? `, ${member.province}` : "")}
            </div>
            <div
              style={{
                color: C.blue,
                fontWeight: 600,
                fontSize: "9px",
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {member.phone ?? "Phone pending"}
            </div>
            <div
              style={{
                gridColumn: "1 / span 2",
                minWidth: 0,
                overflowWrap: "anywhere",
                wordBreak: "break-word",
              }}
            >
              {member.university?.trim() || "Member"}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: "4px",
            fontSize: "8px",
            fontFamily: "monospace",
            color: member.delegateCode ? C.red : C.muted,
            background: member.delegateCode ? `${C.red}15` : `${C.border}60`,
            padding: "1px 6px",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          {member.delegateCode ?? "ID pending"}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
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

  // Filter by scope if defined
  const filtered = section.committeeScope
    ? members.filter(
        (m) =>
          m.committeeScope === section.committeeScope ||
          (section.type === "NEC" && KEY_ORDER.includes(m.role)),
      )
    : members;

  const chair = filtered.find((m) => m.role === "CHAIR");
  const keyOfficers = KEY_ORDER.slice(1).flatMap((r) =>
    filtered.filter((m) => m.role === r),
  );
  const generalMembers = filtered.filter((m) => !KEY_ORDER.includes(m.role));
  const generalMemberChunks: NecMember[][] = [];
  for (let i = 0; i < generalMembers.length; i += 9) {
    generalMemberChunks.push(generalMembers.slice(i, i + 9));
  }

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

  const officerColors: Record<string, { bg: string; text: string }> = {
    VICE_CHAIR: { bg: `${C.red}12`, text: C.red },
    SECRETARY: { bg: `${C.blue}0E`, text: C.blue },
    TREASURER: { bg: `${C.blue}0E`, text: C.blue },
  };

  // Keep a one-page dense layout only when committee size is manageable.
  if (
    (isNecSection && filtered.length <= 10) ||
    (isMainConferenceCommittee && filtered.length <= 7)
  ) {
    return (
      <A4Page
        pageNum={startPageNum}
        totalPages={totalPages}
        sectionLabel={section.title}
        confName={confName}
        confYear={confYear}
      >
        <SectionHeading section={section} />

        {chair ? (
          <ChairHeroCard chair={chair} isNec={isNecSection} />
        ) : (
          <div
            style={{
              padding: "24px",
              textAlign: "center",
              border: `2px dashed ${C.border}`,
              borderRadius: "10px",
              color: C.muted,
              fontSize: "11px",
              marginBottom: "12px",
            }}
          >
            {isNecSection
              ? "NEC board lead not yet assigned."
              : "Conference committee lead not yet assigned."}
          </div>
        )}

        {/* Keep all officers and members on one compact page */}
        {(keyOfficers.length > 0 || generalMembers.length > 0) && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "9px",
            }}
          >
            {keyOfficers.map((m) => {
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
            {generalMembers.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </A4Page>
    );
  }

  // For non-NEC or larger committees: use multi-page layout
  return (
    <>
      {/* ── PAGE 1: Chair hero + key officers ── */}
      <A4Page
        pageNum={startPageNum}
        totalPages={totalPages}
        sectionLabel={section.title}
        confName={confName}
        confYear={confYear}
      >
        <SectionHeading section={section} />

        {chair ? (
          <ChairHeroCard chair={chair} isNec={false} />
        ) : (
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
        )}

        {keyOfficers.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "12px",
            }}
          >
            {keyOfficers.map((m) => {
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
      </A4Page>

      {/* ── PAGE 2+: General committee members (paginated in chunks) ── */}
      {generalMemberChunks.map((membersChunk, chunkIndex) => (
        <A4Page
          key={`general-page-${chunkIndex}`}
          pageNum={startPageNum + 1 + chunkIndex}
          totalPages={totalPages}
          sectionLabel={section.title}
          confName={confName}
          confYear={confYear}
        >
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
            {isNecSection ? "NEC Board Members" : "Committee Members"}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "14px",
            }}
          >
            {membersChunk.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </A4Page>
      ))}
    </>
  );
}
