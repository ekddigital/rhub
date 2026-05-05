"use client";

import { useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/creative/ui/button";

function JICFGraduatesCelebrationCanvas() {
  return (
    <div
      style={{
        position: "relative",
        width: 540,
        height: 675,
        overflow: "hidden",
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jicf/graduates.png"
          alt="Graduates celebration"
          crossOrigin="anonymous"
          style={{
            width: 540,
            height: 675,
            objectFit: "cover",
            objectPosition: "center 30%",
            display: "block",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(23,37,84,0.55) 0%, rgba(12,67,106,0.2) 30%, rgba(12,67,106,0.4) 48%, rgba(23,37,84,0.92) 66%, #172554 85%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 170,
            background:
              "linear-gradient(to bottom, rgba(12,67,106,0.76) 0%, transparent 100%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 130,
          height: 130,
          opacity: 0.2,
          overflow: "hidden",
        }}
      >
        {[0, 18, 36, 54].map((offset) => (
          <div
            key={offset}
            style={{
              position: "absolute",
              width: 210,
              height: 2,
              background:
                "linear-gradient(to right, transparent, #2596be, transparent)",
              top: offset,
              right: -50,
              transform: "rotate(-45deg)",
              transformOrigin: "right center",
            }}
          />
        ))}
      </div>

      {/* Celebration dots for a distinct graduates look */}
      <div
        style={{
          position: "absolute",
          top: 88,
          left: 24,
          zIndex: 9,
          display: "flex",
          gap: 6,
        }}
      >
        {[
          "rgba(251,191,36,0.9)",
          "rgba(37,150,190,0.85)",
          "rgba(255,255,255,0.8)",
          "rgba(251,191,36,0.6)",
        ].map((color, idx) => (
          <span
            key={idx}
            style={{
              width: idx % 2 === 0 ? 5 : 4,
              height: idx % 2 === 0 ? 5 : 4,
              borderRadius: "50%",
              background: color,
              display: "block",
            }}
          />
        ))}
      </div>

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "18px 22px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              background: "#ffffff",
              border: "2.5px solid rgba(37,150,190,0.7)",
              boxShadow:
                "0 0 18px rgba(37,150,190,0.45), 0 2px 8px rgba(0,0,0,0.3)",
              overflow: "hidden",
              marginRight: 10,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/JICF_LOGO1.png"
              alt="JICF"
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div style={{ marginTop: 15 }}>
            <p
              style={{
                fontSize: 9,
                color: "#fbbf24",
                fontWeight: 900,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                lineHeight: 1,
                margin: 0,
              }}
            >
              JICF
            </p>
            <p
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.82)",
                fontWeight: 600,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Jinan International
            </p>
            <p
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.82)",
                fontWeight: 600,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Christian Fellowship
            </p>
          </div>
        </div>

        <div
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.5)",
            borderRadius: 20,
            height: 26,
            minWidth: 64,
            textAlign: "center",
            marginTop: 21,
          }}
        >
          <p
            style={{
              fontSize: 9,
              color: "#fbbf24",
              fontWeight: 800,
              letterSpacing: "0.12em",
              margin: 0,
              lineHeight: "24px",
            }}
          >
            2026
          </p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 22px 8px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              background: "rgba(12,67,106,0.78)",
              border: "1px solid rgba(251,191,36,0.45)",
              borderRadius: 22,
              padding: "5px 14px",
            }}
          >
            <span style={{ fontSize: 11 }}>🎓</span>
            <p
              style={{
                fontSize: 8.3,
                color: "#f8fafc",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              JICF Graduates Service, Celebration &amp; Dinner
            </p>
          </div>
        </div>

        <div style={{ padding: "0 22px 2px" }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 8,
              color: "rgba(251,191,36,0.9)",
              letterSpacing: "0.18em",
              fontWeight: 800,
              textTransform: "uppercase",
            }}
          >
            Class of 2026
          </p>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: "white",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textShadow:
                "0 3px 18px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.4)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            GRADUATES
          </h1>
          <h1
            style={{
              fontSize: 52,
              fontWeight: 900,
              color: "white",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textShadow:
                "0 3px 18px rgba(0,0,0,0.7), 0 1px 4px rgba(0,0,0,0.4)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            CELEBRATION
          </h1>

          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: "#fbbf24",
              lineHeight: 0.95,
              letterSpacing: "-0.01em",
              textShadow:
                "0 3px 14px rgba(0,0,0,0.5), 0 1px 3px rgba(251,191,36,0.25)",
              textTransform: "uppercase",
              margin: "1px 0 0",
            }}
          >
            SERVICE
          </h1>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              margin: "6px 0 2px",
            }}
          >
            <div
              style={{
                height: 2,
                width: 22,
                background: "#2596be",
                borderRadius: 2,
              }}
            />
            <p
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.5)",
                fontWeight: 700,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              followed by
            </p>
            <div
              style={{
                height: 2,
                width: 190,
                background: "rgba(37,150,190,0.35)",
                borderRadius: 2,
              }}
            />
          </div>

          <h1
            style={{
              fontSize: 46,
              fontWeight: 900,
              color: "#fbbf24",
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              textShadow:
                "0 3px 16px rgba(0,0,0,0.55), 0 1px 4px rgba(251,191,36,0.35)",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            DINNER
          </h1>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 8,
              color: "rgba(255,255,255,0.7)",
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            after the service
          </p>
        </div>

        <div style={{ padding: "8px 22px 10px" }}>
          <p
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.6)",
              fontStyle: "italic",
              lineHeight: 1.5,
              margin: "0 0 2px",
              borderLeft: "2px solid rgba(251,191,36,0.6)",
              paddingLeft: 8,
            }}
          >
            &ldquo;We celebrate God&rsquo;s faithfulness over every graduate and
            pray for a fruitful new season ahead.&rdquo;
          </p>
          <p
            style={{
              fontSize: 7.5,
              color: "#fbbf24",
              fontWeight: 700,
              letterSpacing: "0.08em",
              margin: 0,
              paddingLeft: 10,
            }}
          >
            — JICF 2026 Graduates
          </p>
        </div>

        <div
          style={{
            height: 3,
            background:
              "linear-gradient(to right, #172554, #2596be 25%, #fbbf24 50%, #2596be 75%, #172554)",
          }}
        />

        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(23,37,84,0.97) 0%, rgba(18,31,74,0.98) 100%)",
            padding: "16px 22px 14px",
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
          }}
        >
          <p
            style={{
              fontSize: 8,
              color: "#fbbf24",
              fontWeight: 800,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              margin: "0 0 10px",
            }}
          >
            Event Details
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              {
                icon: "📅",
                label: "Sunday, June 14, 2026",
                sub: "JICF Graduates Service, Celebration & Dinner",
              },
              {
                icon: "🕑",
                label: "Service: 14:30 — 17:00",
                sub: "Graduate dinner follows immediately after service",
              },
              {
                icon: "📍",
                label: "Venue — To Be Announced",
                sub: "Details will be shared soon",
              },
            ].map(({ icon, label, sub }) => (
              <div
                key={label}
                style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "rgba(37,150,190,0.12)",
                    border: "1px solid rgba(37,150,190,0.3)",
                    fontSize: 12,
                    flexShrink: 0,
                    textAlign: "center",
                    lineHeight: "28px",
                  }}
                >
                  {icon}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 11.5,
                      color: "white",
                      fontWeight: 700,
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.45)",
                      lineHeight: 1.3,
                      margin: 0,
                    }}
                  >
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <p
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.4)",
                margin: "0 0 7px",
                textAlign: "center",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Highlights:
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                gap: 4,
                justifyContent: "space-between",
              }}
            >
              {[
                { label: "🎓 Graduate Prayer", highlight: true },
                { label: "🙏 Thanksgiving", highlight: false },
                { label: "🍽 Dinner", highlight: true },
                { label: "🤝 Fellowship", highlight: false },
              ].map(({ label, highlight }) => (
                <span
                  key={label}
                  style={{
                    background: highlight
                      ? "rgba(251,191,36,0.1)"
                      : "rgba(255,255,255,0.06)",
                    border: highlight
                      ? "1px solid rgba(251,191,36,0.4)"
                      : "1px solid rgba(255,255,255,0.11)",
                    borderRadius: 20,
                    padding: "4px 8px",
                    fontSize: 7.5,
                    color: highlight ? "#fbbf24" : "rgba(255,255,255,0.78)",
                    fontWeight: highlight ? 600 : 500,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#0a3050",
            borderTop: "1px solid rgba(251,191,36,0.15)",
            padding: "5px 22px",
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 8.5 }}>🌐</span>
            <span
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                marginLeft: 4,
                whiteSpace: "nowrap",
              }}
            >
              jinanicf.com
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 8.5 }}>✉</span>
            <span
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                marginLeft: 4,
                whiteSpace: "nowrap",
              }}
            >
              admin@jinanicf.com
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 8.5 }}>📞</span>
            <span
              style={{
                fontSize: 7.5,
                color: "rgba(255,255,255,0.65)",
                fontWeight: 500,
                marginLeft: 4,
                whiteSpace: "nowrap",
              }}
            >
              +86 185 0683 2159
            </span>
          </div>
        </div>

        <div
          style={{
            background: "#0c436a",
            padding: "7px 22px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.9)",
              padding: 2,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/JICF_LOGO1.png"
              alt="JICF"
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <p
            style={{
              fontSize: 10.5,
              color: "rgba(255,255,255,0.75)",
              fontStyle: "italic",
              fontWeight: 500,
              margin: 0,
              letterSpacing: "0.02em",
              whiteSpace: "nowrap",
              marginTop: 6,
            }}
          >
            Celebrating every graduate, together
          </p>
          <p
            style={{
              fontSize: 8,
              color: "#fbbf24",
              fontWeight: 700,
              margin: 0,
              marginTop: 8,
              whiteSpace: "nowrap",
            }}
          >
            #JICFGraduates2026
          </p>
        </div>
      </div>
    </div>
  );
}

export function GraduatesCelebrationFlyerShell() {
  const flyerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPng = async () => {
    if (!flyerRef.current || downloading) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const el = flyerRef.current;

      if ("fonts" in document) {
        await (document as Document & { fonts: { ready: Promise<unknown> } })
          .fonts.ready;
      }

      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 2,
        width: 540,
        height: 675,
        canvasWidth: 1080,
        canvasHeight: 1350,
        backgroundColor: "#172554",
      });

      const link = document.createElement("a");
      link.download = "jicf-graduates-celebration-2026.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  const printFlyer = () => window.print();

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button
          onClick={() => void downloadPng()}
          disabled={downloading}
          className="bg-[#0c436a] hover:bg-[#172554] text-white"
        >
          <Download className="size-4 mr-2" />
          {downloading ? "Preparing..." : "Download PNG (1080 × 1350)"}
        </Button>
        <Button
          variant="outline"
          onClick={printFlyer}
          className="border-[#0c436a] text-[#0c436a] hover:bg-[#ccdce3]"
        >
          <Printer className="size-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>

      <div
        className="shadow-2xl print:shadow-none"
        style={{
          width: "100%",
          maxWidth: 540,
          aspectRatio: "4 / 5",
          overflow: "hidden",
          borderRadius: 16,
        }}
      >
        <div
          ref={flyerRef}
          style={{
            width: 540,
            height: 675,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <JICFGraduatesCelebrationCanvas />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center print:hidden">
        Preview is 540 × 675 px · Download exports at 1080 × 1350 px (Instagram
        portrait, 4:5)
      </p>
    </div>
  );
}
