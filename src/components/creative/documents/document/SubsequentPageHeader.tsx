"use client";

/**
 * Document Header — Subsequent Pages
 * Simpler header for pages 2+: gold accent line with company name.
 * Left padding accounts for the gold vertical strip.
 */

import React from "react";
import { COMPANY, LETTERHEAD } from "@/lib/creative/documents/constants";

export function SubsequentPageHeader() {
  return (
    <div
      className="document-header-subsequent"
      style={{
        width: "100%",
        paddingTop: "46px", // clear thick top gold bar (36px) + 10px gap
        paddingLeft: "68px", // match content left padding
        paddingRight: "68px", // match content right padding
        paddingBottom: "8px",
      }}
    >
      {/* Company name + gold divider */}
      <div
        className="flex justify-between items-center"
        style={{
          borderBottom: `1.5px solid ${LETTERHEAD.goldColor}`,
          paddingBottom: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "13px",
            fontWeight: 600,
            color: LETTERHEAD.goldColor,
            letterSpacing: "0.04em",
          }}
        >
          {COMPANY.name}
        </span>
        <span
          style={{
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "9px",
            color: "#999",
          }}
        >
          Business Reg. No. {COMPANY.registrationNo} | TIN: {COMPANY.tinNo}
        </span>
      </div>
    </div>
  );
}
