import { C } from "./constants";

export function PageFooter({
  confName,
  confYear,
  pageNum,
  totalPages,
}: {
  confName: string;
  confYear: number;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <div style={{ marginTop: "auto" }}>
      <div
        style={{
          height: "1px",
          margin: "0 40px",
          background: `linear-gradient(90deg, transparent, ${C.blue}40, ${C.red}40, transparent)`,
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 40px",
        }}
      >
        <div style={{ fontSize: "8.5px", color: "#111111" }}>
          {confName} · {confYear}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: C.blue,
              color: C.white,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "7px",
              fontWeight: 700,
            }}
          >
            {pageNum}
          </span>
          <span style={{ fontSize: "9px", color: "#111111" }}>
            of {totalPages}
          </span>
        </div>

        <div style={{ fontSize: "8.5px", color: "#111111", fontStyle: "italic" }}>
          Excellence Through Hard Work
        </div>
      </div>
    </div>
  );
}
