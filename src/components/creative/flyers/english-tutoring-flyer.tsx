"use client";

import { useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/creative/ui/button";

function EnglishTutoringCanvas() {
  return (
    <div
      style={{
        width: 540,
        height: 540,
        background:
          "linear-gradient(150deg, #fefefe 0%, #f8fafc 52%, #f1f5f9 100%)",
        color: "#0f172a",
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        border: "1px solid #cbd5e1",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(198,32,61,0.14) 0%, rgba(198,32,61,0) 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          background:
            "linear-gradient(135deg, #0f2945 0%, #15456d 70%, #1c4d75 100%)",
          color: "#ffffff",
          padding: "16px 16px 12px",
          borderBottom: "4px solid #c6203d",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ width: 392 }}>
            <p
              style={{
                margin: 0,
                fontSize: 9.6,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#fca5a5",
                fontWeight: 800,
              }}
            >
              Exam-focused English Training
            </p>
            <h1
              style={{
                margin: "3px 0 0",
                fontSize: 31,
                lineHeight: 1.1,
                fontWeight: 900,
                letterSpacing: "-0.01em",
              }}
            >
              KET · PET · IELTS
            </h1>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 16.5,
                fontWeight: 700,
                color: "#fda4af",
              }}
            >
              Online One-on-One English Tutoring
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 10.8,
                color: "#e2e8f0",
                lineHeight: 1.4,
                maxWidth: 380,
              }}
            >
              Professional ESL tutor specializing in Cambridge KET, PET and
              IELTS exam preparation for children, teenagers and adult learners.
            </p>
          </div>
          <div
            style={{
              width: 94,
              height: 48,
              background: "#ffffff",
              borderRadius: 10,
              border: "1px solid #fecdd3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ielts_logo.png"
              alt="IELTS"
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 14px 0", position: "relative", zIndex: 1 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 10 }}
        >
          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11.2,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#0f2945",
                fontWeight: 800,
              }}
            >
              What is included in lessons
            </p>
            <div
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                background: "rgba(255,255,255,0.98)",
                padding: "9px 10px",
              }}
            >
              {[
                "Personalized custom study plans",
                "Exam strategies and past paper training",
                "Full listening, reading, writing and speaking practice",
                "Mock exam simulation and homework feedback",
                "Free 30-40 minute demo class for new students",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    margin: "0 0 5px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 7,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#c6203d",
                      display: "block",
                      marginTop: 5,
                      boxShadow: "0 0 0 2px rgba(198,32,61,0.15)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11.2,
                      lineHeight: 1.35,
                      color: "#0f172a",
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p
              style={{
                margin: "0 0 6px",
                fontSize: 11.2,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#0f2945",
                fontWeight: 800,
              }}
            >
              Pricing Packages
            </p>
            <div
              style={{
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                overflow: "hidden",
                background: "rgba(255,255,255,0.96)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.25fr 0.9fr 1fr",
                  background: "#fee2e2",
                  borderBottom: "1px solid #fecaca",
                }}
              >
                <p style={tableHeadStyle}>Package</p>
                <p style={tableHeadStyle}>Format</p>
                <p style={tableHeadStyle}>Price</p>
              </div>

              <div style={tableRowStyle}>
                <p style={tableCellStyle}>KET / PET Foundation Class</p>
                <p style={tableCellStyle}>45 min</p>
                <p style={tableCellStyle}>¥150/class</p>
              </div>

              <div style={tableRowStyle}>
                <p style={tableCellStyle}>KET / PET Exam Sprint Package</p>
                <p style={tableCellStyle}>10 lessons</p>
                <p style={tableCellStyle}>¥1200 total</p>
              </div>

              <div style={{ ...tableRowStyle, borderBottom: "none" }}>
                <p style={tableCellStyle}>IELTS One-on-One Private Class</p>
                <p style={tableCellStyle}>60 min</p>
                <p style={tableCellStyle}>¥200/class</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "10px 14px 0" }}>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.42,
            color: "#7f1d1d",
            fontWeight: 700,
            background: "rgba(255,241,242,0.96)",
            border: "1px solid #fecdd3",
            borderRadius: 10,
            padding: "12px 12px",
          }}
        >
          Flexible class schedule available on weekday evenings and weekends.
          Message directly to reserve your free trial lesson and check available
          time slots.
        </p>
      </div>

      <div
        style={{
          marginTop: "auto",
          background:
            "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 55%, #991b1b 100%)",
          borderTop: "3px solid #fca5a5",
          color: "#e2e8f0",
          padding: "9px 14px 9px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 70px",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <p style={contactLabelStyle}>Email</p>
            <p style={contactValueStyle}>teacherjoejinan@gmail.com</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={contactLabelStyle}>WeChat ID</p>
            <p style={contactValueStyle}>teacherjoejinan</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={contactLabelStyle}>Phone</p>
            <p style={contactValueStyle}>+8615662759116</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 8.8,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#fecdd3",
                fontWeight: 700,
              }}
            >
              WeChat QR
            </p>
            <div
              style={{
                width: 60,
                height: 60,
                margin: "0 auto",
                background: "#ffffff",
                borderRadius: 8,
                border: "3px solid #ffffff",
                outline: "2px solid #fca5a5",
                overflow: "hidden",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/WeChat-qrcode.png"
                alt="WeChat QR Code"
                crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tableHeadStyle: React.CSSProperties = {
  margin: 0,
  padding: "7px 7px",
  fontSize: 9.2,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  color: "#7f1d1d",
};

const tableRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.25fr 0.9fr 1fr",
  borderBottom: "1px solid #e2e8f0",
};

const tableCellStyle: React.CSSProperties = {
  margin: 0,
  padding: "7px 7px",
  fontSize: 10.4,
  color: "#0f172a",
  lineHeight: 1.3,
};

const contactLabelStyle: React.CSSProperties = {
  margin: "0 0 2px",
  fontSize: 9.2,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#fecdd3",
  fontWeight: 700,
};

const contactValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 9.7,
  color: "#fff1f2",
  lineHeight: 1.25,
  fontWeight: 600,
  whiteSpace: "nowrap",
};

export function EnglishTutoringFlyerShell() {
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
        height: 540,
        canvasWidth: 1080,
        canvasHeight: 1080,
        backgroundColor: "#f8fafc",
      });

      const link = document.createElement("a");
      link.download = "ket-pet-ielts-tutoring-flyer.png";
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
          {downloading ? "Preparing..." : "Download PNG (1080 x 1080)"}
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
          aspectRatio: "1 / 1",
          overflow: "hidden",
          borderRadius: 16,
        }}
      >
        <div
          ref={flyerRef}
          style={{
            width: 540,
            height: 540,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <EnglishTutoringCanvas />
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center print:hidden">
        Preview is 540 x 540 px · Download exports at 1080 x 1080 px (square)
      </p>
    </div>
  );
}
