import type { ReactNode } from "react";
import { C, ASSETS } from "./constants";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";

export function A4Page({
  children,
  pageNum,
  totalPages,
  sectionLabel,
  confName,
  confYear,
}: {
  children: ReactNode;
  pageNum: number;
  totalPages: number;
  sectionLabel: string;
  confName: string;
  confYear: number;
}) {
  return (
    <div
      className="booklet-page"
      style={{
        width: "680px",
        minHeight: "962px",
        background: C.white,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle LSUIC watermark */}
      <div
        style={{
          position: "absolute",
          right: "30px",
          bottom: "60px",
          opacity: 0.03,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ASSETS.lsuicLogo}
          alt=""
          style={{ width: "200px", height: "200px", objectFit: "contain" }}
        />
      </div>

      <PageHeader
        confName={confName}
        sectionLabel={sectionLabel}
        pageNum={pageNum}
      />

      <div
        style={{
          flex: 1,
          padding: "28px 40px 20px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </div>

      <PageFooter
        confName={confName}
        confYear={confYear}
        pageNum={pageNum}
        totalPages={totalPages}
      />
    </div>
  );
}
