"use client";

/**
 * DocumentBookmarks
 * Sidebar bookmark navigation panel (like LaTeX PDF bookmarks).
 * Always visible regardless of whether TOC is enabled in the document.
 * Clicking an entry scrolls to the corresponding heading in the preview.
 */

import React, { useCallback } from "react";
import { LETTERHEAD, TYPOGRAPHY } from "@/lib/creative/documents/constants";
import type {
  DocumentModel,
  HeadingNode,
  TableNode,
} from "@/lib/creative/documents/types";
import { ChevronRight, BookOpen } from "lucide-react";

interface BookmarkEntry {
  id: string;
  text: string;
  level: number;
  number?: string;
  type: "heading" | "table";
}

interface DocumentBookmarksProps {
  document: DocumentModel;
  /** The scrollable container element ref for smooth scrolling */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** Collapse the panel */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

/**
 * Build bookmark entries from a DocumentModel.
 * Includes numbered headings and tables.
 */
function buildBookmarks(doc: DocumentModel): BookmarkEntry[] {
  const entries: BookmarkEntry[] = [];

  for (const node of doc.children) {
    if (node.type === "heading") {
      const heading = node as HeadingNode;
      if (heading.id && heading.level <= 4) {
        entries.push({
          id: heading.id,
          text: heading.text,
          level: heading.level,
          number: heading.number,
          type: "heading",
        });
      }
    }

    if (node.type === "table") {
      const table = node as TableNode;
      if (table.number) {
        entries.push({
          id: `table-${table.number}`,
          text: table.caption || `Table ${table.number}`,
          level: 99,
          number: `T${table.number}`,
          type: "table",
        });
      }
    }
  }

  return entries;
}

export function DocumentBookmarks({
  document: doc,
  scrollContainerRef,
  collapsed = false,
  onToggleCollapse,
}: DocumentBookmarksProps) {
  const entries = buildBookmarks(doc);

  const handleClick = useCallback(
    (id: string) => {
      // Try to find the element within the scroll container first
      const container = scrollContainerRef?.current;
      const target = container
        ? container.querySelector(`[id="${id}"]`)
        : window.document.getElementById(id);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [scrollContainerRef],
  );

  if (entries.length === 0) return null;

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleCollapse}
        title="Show Bookmarks"
      >
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span
          className="text-[9px] text-muted-foreground mt-1"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          Bookmarks
        </span>
      </div>
    );
  }

  return (
    <nav className="document-bookmarks flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
        <div className="flex items-center gap-1.5">
          <BookOpen
            className="h-3.5 w-3.5"
            style={{ color: LETTERHEAD.goldColor }}
          />
          <span
            style={{
              fontFamily: TYPOGRAPHY.body.fontFamily,
              fontSize: "11px",
              fontWeight: 600,
              color: LETTERHEAD.primaryColor,
            }}
          >
            Bookmarks
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-0.5 rounded hover:bg-muted/80 transition-colors"
            title="Collapse bookmarks"
          >
            <ChevronRight className="h-3 w-3 text-muted-foreground rotate-180" />
          </button>
        )}
      </div>

      {/* Bookmark entries */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {entries.map((entry) => {
            const isTable = entry.type === "table";
            const indent = isTable ? 16 : (entry.level - 1) * 12;
            const isH1 = entry.level === 1;
            const isH2 = entry.level === 2;

            return (
              <li key={entry.id} style={{ margin: 0 }}>
                <button
                  onClick={() => handleClick(entry.id)}
                  className="w-full text-left px-2 py-1 rounded-sm hover:bg-muted/80 transition-colors group"
                  style={{ paddingLeft: `${indent + 8}px` }}
                  title={entry.text}
                >
                  <div className="flex items-start gap-1.5 min-w-0">
                    {/* Number badge */}
                    {entry.number && (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.body.fontFamily,
                          fontSize: isTable ? "8px" : isH1 ? "10px" : "9px",
                          fontWeight: 600,
                          color: isTable ? "#888" : LETTERHEAD.goldColor,
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                          marginTop: "1px",
                        }}
                      >
                        {entry.number}
                      </span>
                    )}

                    {/* Text */}
                    <span
                      className="truncate"
                      style={{
                        fontFamily: TYPOGRAPHY.body.fontFamily,
                        fontSize: isH1 ? "10.5px" : isH2 ? "9.5px" : "9px",
                        fontWeight: isH1 ? 600 : isH2 ? 500 : 400,
                        color: isH1
                          ? LETTERHEAD.primaryColor
                          : isTable
                            ? "#888"
                            : "#555",
                        lineHeight: 1.3,
                      }}
                    >
                      {entry.text}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
