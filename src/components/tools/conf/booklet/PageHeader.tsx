import { C, ASSETS, FLAG_STRIPES_9 } from "./constants";

export function PageHeader({
  confName,
  sectionLabel,
  pageNum,
}: {
  confName: string;
  sectionLabel: string;
  pageNum: number;
}) {
  return (
    <div>
      {/* Liberian flag stripe bar */}
      <div style={{ display: "flex", height: "10px" }}>
        {FLAG_STRIPES_9.map((color, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              borderBottom: color === C.white ? "0.5px solid #e0e0e0" : "none",
            }}
          />
        ))}
      </div>

      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 40px",
          background: C.white,
          borderBottom: `1.5px solid ${C.blue}`,
        }}
      >
        {/* Left: logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.lsuicLogo}
            alt="LSUIC"
            style={{ width: 30, height: 30, objectFit: "contain" }}
          />
          <div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#000000",
                lineHeight: 1.2,
              }}
            >
              Liberian Student Union in China
            </div>
            <div
              style={{
                fontSize: "8.5px",
                color: "#000000",
                lineHeight: 1.3,
                marginTop: "1px",
              }}
            >
              {confName}
            </div>
          </div>
        </div>

        {/* Right: section label + page circle */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#000000",
              textAlign: "right",
            }}
          >
            {sectionLabel}
          </div>
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: C.blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              fontWeight: 700,
              color: C.white,
            }}
          >
            {pageNum}
          </div>
        </div>
      </div>
    </div>
  );
}
