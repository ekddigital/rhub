import { C } from "./constants";
import { roleLabel } from "./utils";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, NecMember } from "./types";

const KEY_ORDER = ["CHAIR", "VICE_CHAIR", "SECRETARY", "TREASURER"];

const ROLE_COLORS: Record<
  string,
  { bg: string; text: string; isKey: boolean }
> = {
  CHAIR: { bg: C.blue, text: C.white, isKey: true },
  VICE_CHAIR: { bg: C.red, text: C.white, isKey: true },
  SECRETARY: { bg: `${C.blue}15`, text: C.blue, isKey: true },
  TREASURER: { bg: `${C.red}15`, text: C.red, isKey: true },
  COMMITTEE: { bg: C.lightBlue, text: C.blue, isKey: false },
};

export function CommitteeSection({
  section,
  members,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  members: NecMember[];
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  const filtered = section.committeeScope
    ? members.filter(
        (m) =>
          m.committeeScope === section.committeeScope ||
          (section.type === "NEC" && KEY_ORDER.includes(m.role)),
      )
    : members;

  const sorted = [
    ...KEY_ORDER.flatMap((r) => filtered.filter((m) => m.role === r)),
    ...filtered.filter((m) => !KEY_ORDER.includes(m.role)),
  ];

  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={section.title}
      confName={confName}
      confYear={confYear}
    >
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

      {sorted.length === 0 ? (
        <div
          style={{
            padding: "32px",
            textAlign: "center",
            border: `2px dashed ${C.border}`,
            borderRadius: "10px",
            color: C.muted,
            fontSize: "11px",
          }}
        >
          No members in this committee scope.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "10px",
          }}
        >
          {sorted.map((m) => {
            const colors = ROLE_COLORS[m.role] ?? ROLE_COLORS.COMMITTEE;
            const isChair = m.role === "CHAIR";

            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 14px",
                  borderRadius: "8px",
                  background: colors.isKey ? colors.bg : C.lightBlue,
                  border: `1px solid ${colors.isKey ? "transparent" : C.border}`,
                  gridColumn: isChair ? "1 / -1" : "auto",
                }}
              >
                <Avatar
                  src={m.photoPath}
                  name={m.name}
                  size={isChair ? 52 : 40}
                  borderColor={colors.isKey ? C.white : C.blue}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: colors.isKey ? colors.text : C.blue,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {m.name}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      color: colors.isKey ? `${colors.text}B0` : C.muted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {roleLabel(m)}
                    {m.city ? ` · ${m.city}` : ""}
                  </div>
                </div>
                {isChair && (
                  <div
                    style={{
                      padding: "2px 8px",
                      borderRadius: "20px",
                      background: `${C.gold}30`,
                      border: `1px solid ${C.gold}`,
                      fontSize: "7px",
                      fontWeight: 800,
                      color: C.gold,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      flexShrink: 0,
                    }}
                  >
                    Chairman
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </A4Page>
  );
}

// Re-export constant for use in the color type
export { C as _C };
