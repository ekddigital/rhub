import type { ReactNode } from "react";
import { BOOKLET_A4, C, ASSETS } from "./constants";
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
        width: `${BOOKLET_A4.width}px`,
        height: `${BOOKLET_A4.height}px`,
        maxHeight: `${BOOKLET_A4.height}px`,
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
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: "22px 32px 14px",
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
