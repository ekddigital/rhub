import { C } from "./constants";
import { A4Page } from "./A4Page";
import type { BookletSection, LeaderProfile } from "./types";

export function LeaderSection({
  section,
  leaders,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  leaders: LeaderProfile[];
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <A4Page
      pageNum={pageNum}
      totalPages={totalPages}
      sectionLabel={section.title}
      confName={confName}
      confYear={confYear}
    >
      {/* Section heading */}
      <div style={{ marginBottom: "22px" }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 14px",
            borderRadius: "4px",
            background: C.blue,
            color: C.white,
            fontSize: "8.5px",
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: "10px",
          }}
        >
          Leadership Profiles
        </div>
        <div
          style={{
            height: "2px",
            background: `linear-gradient(90deg, ${C.red}, ${C.blue}, transparent)`,
            marginBottom: "6px",
          }}
        />
      </div>

      {leaders.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            border: `2px dashed ${C.border}`,
            borderRadius: "10px",
            color: C.muted,
            fontSize: "11px",
          }}
        >
          No leader profiles stored yet. Add them in the Leadership Profiles
          tab.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {leaders.map((l) => (
            <div
              key={l.id}
              style={{
                display: "flex",
                gap: "20px",
                padding: "18px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: C.lightBlue,
              }}
            >
              {/* Photo */}
              <div style={{ flexShrink: 0 }}>
                {l.photoPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.photoPath}
                    alt={l.name}
                    style={{
                      width: "120px",
                      height: "150px",
                      objectFit: "cover",
                      objectPosition: "top",
                      borderRadius: "8px",
                      border: `3px solid ${C.blue}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "120px",
                      height: "150px",
                      borderRadius: "8px",
                      background: `linear-gradient(145deg, ${C.blue}, ${C.darkBlue})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
                      color: `${C.white}40`,
                      border: `3px solid ${C.blue}40`,
                    }}
                  >
                    {l.name[0]}
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {l.country && (
                  <div
                    style={{
                      fontSize: "8.5px",
                      fontWeight: 800,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: C.red,
                      marginBottom: "6px",
                    }}
                  >
                    {l.role} · {l.country}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: C.blue,
                    lineHeight: 1.2,
                    marginBottom: "4px",
                  }}
                >
                  {l.name}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: C.muted,
                    fontStyle: "italic",
                    marginBottom: "12px",
                    paddingBottom: "12px",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {l.title}
                </div>
                {l.bio ? (
                  <div
                    style={{
                      fontSize: "10.5px",
                      lineHeight: 1.75,
                      color: C.text,
                      maxHeight: "80px",
                      overflow: "hidden",
                    }}
                  >
                    {l.bio}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "10px",
                      color: `${C.muted}80`,
                      fontStyle: "italic",
                    }}
                  >
                    Biography to be added.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </A4Page>
  );
}
