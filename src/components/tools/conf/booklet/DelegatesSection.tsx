import { C } from "./constants";
import { A4Page } from "./A4Page";
import { Avatar } from "./Avatar";
import type { BookletSection, Delegate } from "./types";

export function DelegatesSection({
  section,
  delegates,
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  section: BookletSection;
  delegates: Delegate[];
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
      {/* Header row */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
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
          <div
            style={{
              padding: "3px 10px",
              borderRadius: "20px",
              background: C.blue,
              color: C.white,
              fontSize: "9px",
              fontWeight: 700,
            }}
          >
            {delegates.length} Delegates
          </div>
        </div>
        {section.bodyText && (
          <div style={{ fontSize: "10px", color: C.muted, marginLeft: "14px" }}>
            {section.bodyText}
          </div>
        )}
      </div>

      {delegates.length === 0 ? (
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
          No confirmed delegates yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
          }}
        >
          {delegates.map((d) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "14px 8px 10px",
                borderRadius: "10px",
                border: `1px solid ${C.border}`,
                background: C.lightBlue,
                boxShadow: `0 1px 4px rgba(0,40,104,0.06)`,
              }}
            >
              {/* Photo — 80px passport-style; silhouette shown until delegate links account */}
              <div
                style={{
                  width: "80px",
                  height: "90px",
                  borderRadius: "7px",
                  overflow: "hidden",
                  border: `2px solid ${C.blue}30`,
                  marginBottom: "2px",
                  flexShrink: 0,
                }}
              >
                <Avatar
                  src={d.bookletPhotoPath}
                  name={d.name}
                  size={90}
                  square
                  silhouette
                  borderColor={C.blue}
                />
              </div>
              <div
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  color: C.blue,
                  marginTop: "8px",
                  lineHeight: 1.3,
                  maxHeight: "30px",
                  overflow: "hidden",
                  width: "100%",
                  textAlign: "center",
                }}
              >
                {d.name}
              </div>
              {d.city && (
                <div
                  style={{ fontSize: "8px", color: C.muted, marginTop: "2px" }}
                >
                  {d.city}
                </div>
              )}
              {d.delegateCode && (
                <div
                  style={{
                    marginTop: "5px",
                    padding: "1px 6px",
                    borderRadius: "4px",
                    background: `${C.red}15`,
                    color: C.red,
                    fontSize: "7.5px",
                    fontFamily: "monospace",
                    fontWeight: 600,
                  }}
                >
                  {d.delegateCode}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {delegates.length > 0 && (
        <div
          style={{
            marginTop: "16px",
            textAlign: "right",
            fontSize: "8.5px",
            color: C.muted,
            fontStyle: "italic",
          }}
        >
          {delegates.length} confirmed delegate
          {delegates.length !== 1 ? "s" : ""} as of{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      )}
    </A4Page>
  );
}
