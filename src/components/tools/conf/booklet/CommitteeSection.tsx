import { C } from "./constants";
import { roleLabel } from "./utils";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, NecMember } from "./types";

const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];

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

// ─── Chair hero card (full-width, prominent) ──────────────────────────────────
function ChairHeroCard({ chair }: { chair: NecMember }) {
  return (
    <div
      style={{
        display: "flex",
        gap: "20px",
        padding: "20px 22px",
        borderRadius: "12px",
        background: C.blue,
        marginBottom: "18px",
        boxShadow: "0 4px 18px rgba(0,40,104,0.18)",
      }}
    >
      {/* Large portrait avatar */}
      <div style={{ flexShrink: 0 }}>
        <Avatar
          src={chair.photoPath}
          name={chair.name}
          size={96}
          square
          silhouette={!chair.photoPath}
          borderColor={C.gold}
        />
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
            fontSize: "8px",
            fontWeight: 800,
            color: C.gold,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            marginBottom: "8px",
          }}
        >
          ★ General Chairman
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: "20px",
            fontWeight: 900,
            color: C.white,
            lineHeight: 1.1,
            marginBottom: "5px",
          }}
        >
          {chair.name}
        </div>

        {/* Title */}
        {(chair.title ?? roleLabel(chair)) && (
          <div
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: `${C.white}B0`,
              marginBottom: "8px",
              letterSpacing: "0.03em",
            }}
          >
            {chair.conferencePosition?.trim() ??
              chair.title ??
              roleLabel(chair)}
          </div>
        )}

        {/* City */}
        {chair.city && (
          <div
            style={{
              fontSize: "10px",
              color: `${C.white}70`,
              marginBottom: "8px",
            }}
          >
            📍 {chair.city}
            {chair.province ? `, ${chair.province}` : ""}
          </div>
        )}
        {chair.phone && (
          <div
            style={{
              fontSize: "10px",
              color: `${C.white}90`,
              marginBottom: "6px",
              fontWeight: 600,
            }}
          >
            Phone: {chair.phone}
          </div>
        )}

        <div
          style={{
            fontSize: "10px",
            color: `${C.white}75`,
            marginBottom: "6px",
          }}
        >
          🎓 {chair.university?.trim() || "Member"}
        </div>

        <div
          style={{
            marginBottom: "8px",
            fontSize: "8px",
            fontFamily: "monospace",
            color: chair.delegateCode ? C.gold : `${C.white}80`,
            background: chair.delegateCode ? `${C.gold}20` : `${C.white}15`,
            padding: "2px 8px",
            borderRadius: "5px",
            display: "inline-block",
          }}
        >
          {chair.delegateCode ?? "ID pending"}
        </div>

        {/* Bio */}
        {chair.bookletBio && (
          <div
            style={{
              fontSize: "10.5px",
              color: `${C.white}CC`,
              lineHeight: 1.65,
              marginTop: "6px",
              borderTop: `1px solid ${C.white}18`,
              paddingTop: "8px",
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
        flexDirection: "column",
        alignItems: "center",
        gap: "10px",
        padding: "16px 14px",
        borderRadius: "10px",
        background: bg,
        border: `1px solid ${C.border}`,
        textAlign: "center",
      }}
    >
      <Avatar
        src={member.photoPath}
        name={member.name}
        size={64}
        silhouette={!member.photoPath}
        borderColor={textColor}
      />
      <div>
        <div
          style={{
            fontSize: "11.5px",
            fontWeight: 700,
            color: textColor,
            marginBottom: "3px",
          }}
        >
          {member.name}
        </div>
        <div
          style={{
            fontSize: "9px",
            fontWeight: 600,
            color: `${textColor}90`,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          {member.conferencePosition?.trim() || roleLabel(member)}
        </div>
        <div
          style={{
            fontSize: "8.5px",
            color: C.muted,
            marginTop: "3px",
            lineHeight: 1.3,
          }}
        >
          {(member.city ?? "Member") +
            (member.province ? `, ${member.province}` : "")}
        </div>
        <div
          style={{
            fontSize: "8.5px",
            color: C.muted,
            lineHeight: 1.3,
          }}
        >
          {member.university?.trim() || "Member"}
        </div>
        {member.phone && (
          <div
            style={{
              fontSize: "8.5px",
              color: C.blue,
              lineHeight: 1.3,
              fontWeight: 600,
            }}
          >
            {member.phone}
          </div>
        )}
        <div
          style={{
            marginTop: "4px",
            fontSize: "7.5px",
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
        flexDirection: "column",
        alignItems: "center",
        gap: "9px",
        padding: "14px 10px",
        borderRadius: "8px",
        background: C.lightBlue,
        border: `1px solid ${C.border}`,
        textAlign: "center",
      }}
    >
      <Avatar
        src={member.photoPath}
        name={member.name}
        size={56}
        silhouette={!member.photoPath}
        borderColor={C.blue}
      />
      <div>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: C.blue,
            lineHeight: 1.25,
            marginBottom: "3px",
          }}
        >
          {member.name}
        </div>
        {(member.title ?? member.city) && (
          <div
            style={{
              fontSize: "9px",
              color: C.muted,
              lineHeight: 1.4,
            }}
          >
            <div style={{ fontWeight: 500 }}>
              {member.conferencePosition?.trim() || member.title || "Member"}
            </div>
            <div>
              {(member.city ?? "Member") +
                (member.province ? `, ${member.province}` : "")}
            </div>
            <div>{member.university?.trim() || "Member"}</div>
            {member.phone && (
              <div style={{ color: C.blue, fontWeight: 600 }}>
                {member.phone}
              </div>
            )}
          </div>
        )}
        <div
          style={{
            marginTop: "4px",
            fontSize: "7.5px",
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
          <ChairHeroCard chair={chair} />
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
              gridTemplateColumns: "repeat(3, 1fr)",
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

      {/* ── PAGE 2: General committee members (only if any exist) ── */}
      {generalMembers.length > 0 && (
        <A4Page
          pageNum={startPageNum + 1}
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
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "14px",
            }}
          >
            {generalMembers.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </A4Page>
      )}
    </>
  );
}
