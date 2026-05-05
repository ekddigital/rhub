"use client";

/**
 * TOCRenderer
 * Professional Table of Contents with dot leaders.
 * Uses comfortable consistent spacing (~1.5 line-height).
 * Multi-page overflow is handled naturally by LetterheadLayout.
 * Also reused for List of Tables / List of Figures pages.
 */

import React, { useCallback } from "react";
import { LETTERHEAD, TYPOGRAPHY } from "@/lib/creative/documents/constants";
import type { TOCEntry } from "@/lib/creative/documents/types";

interface TOCRendererProps {
  entries: TOCEntry[];
  title?: string;
  /** When true, all entries are rendered at same level (no indentation) */
  flat?: boolean;
}

export function TOCRenderer({
  entries,
  title = "Table of Contents",
  flat = false,
}: TOCRendererProps) {
  if (!entries.length) return null;

  // Normalize indentation: if the doc uses H2 as top level, treat it as level 1
  const minLevel = Math.min(...entries.map((e) => e.level));

  const handleEntryClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      e.preventDefault();
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [],
  );

  return (
    <nav
      className="document-toc"
      style={{
        padding: "0 8px",
      }}
    >
      {/* Title — only on first page */}
      {title && (
        <>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.heading.fontFamily,
              fontSize: "18px",
              fontWeight: 700,
              color: LETTERHEAD.primaryColor,
              textAlign: "center",
              margin: "0 0 6px 0",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </h2>
          {/* Gold accent under title */}
          <div
            style={{
              width: "60px",
              height: "2px",
              backgroundColor: LETTERHEAD.goldColor,
              margin: "0 auto 20px auto",
            }}
          />
        </>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {entries.map((entry, idx) => {
          const depth = flat ? 0 : entry.level - minLevel;
          const isTopLevel = depth === 0;
          return (
            <li
              key={entry.id}
              style={{
                paddingLeft: `${depth * 20}px`,
                marginBottom: isTopLevel ? "4px" : "2px",
                marginTop: isTopLevel && idx !== 0 ? "5px" : "0",
              }}
            >
              <a
                href={`#${entry.id}`}
                onClick={(e) => handleEntryClick(e, entry.id)}
                title={
                  [entry.number, entry.text].filter(Boolean).join(" ") +
                  (entry.page != null ? ` — page ${entry.page}` : "")
                }
                style={{
                  fontFamily: TYPOGRAPHY.body.fontFamily,
                  fontSize: isTopLevel ? "11px" : "10px",
                  fontWeight: isTopLevel ? 700 : 400,
                  color: isTopLevel ? LETTERHEAD.primaryColor : "#444",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "0",
                  cursor: "pointer",
                  lineHeight: "1.5",
                }}
              >
                {/* Number + Text */}
                <span
                  style={{
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.number && (
                    <span
                      style={{
                        color: isTopLevel ? LETTERHEAD.goldColor : "#888",
                        marginRight: "6px",
                        fontWeight: isTopLevel ? 700 : 500,
                        fontSize: isTopLevel ? "11px" : "9.5px",
                      }}
                    >
                      {entry.number}
                    </span>
                  )}
                  <span>{entry.text}</span>
                </span>

                {/* Dot leader */}
                <span
                  style={{
                    flex: 1,
                    borderBottom: "1px dotted #ccc",
                    margin: "0 4px",
                    minWidth: "16px",
                    height: "0",
                    alignSelf: "baseline",
                    position: "relative",
                    top: "-3px",
                  }}
                />

                {/* Page number */}
                {entry.page != null && (
                  <span
                    style={{
                      flexShrink: 0,
                      color: isTopLevel ? LETTERHEAD.primaryColor : "#666",
                      fontWeight: isTopLevel ? 700 : 400,
                      fontSize: isTopLevel ? "11px" : "10px",
                    }}
                  >
                    {entry.page}
                  </span>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
