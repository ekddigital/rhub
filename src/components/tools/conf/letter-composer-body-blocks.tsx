"use client";

import type { CSSProperties } from "react";
import type { LetterBodyBlock } from "./letter-composer-blocks";
import { letterPreviewPalette } from "./letter-composer-preview-palette";

export function renderLetterBodyBlocks(blocks: LetterBodyBlock[], keyPrefix: string) {
  const C = letterPreviewPalette();

  return blocks.map((block, idx) => {
    const key = `${keyPrefix}-${idx}`;

    if (block.type === "heading") {
      const fontSize = block.level === 1 ? 17 : block.level === 2 ? 15 : 13;
      return (
        <div
          key={key}
          style={{
            fontSize,
            fontWeight: 700,
            color: C.navy,
            marginTop: block.level <= 2 ? 8 : 6,
            marginBottom: 6,
            lineHeight: 1.4,
          }}
        >
          {block.text}
        </div>
      );
    }

    if (block.type === "paragraph") {
      const style: CSSProperties = {
        fontSize: 12,
        color: "#222",
        lineHeight: 1.8,
        margin: "0 0 8px",
        whiteSpace: "pre-wrap",
        overflowWrap: "break-word",
      };
      if (block.richHtmlInner?.trim()) {
        return (
          <p
            key={key}
            className="letter-composer-rich-p"
            style={style}
            dangerouslySetInnerHTML={{ __html: block.richHtmlInner }}
          />
        );
      }
      return (
        <p key={key} style={style}>
          {block.text}
        </p>
      );
    }

    if (block.type === "blockquote") {
      return (
        <blockquote
          key={key}
          style={{
            margin: "6px 0 10px",
            padding: "2px 0 2px 10px",
            borderLeft: `3px solid ${C.gold}`,
            color: "#444",
            fontStyle: "italic",
            fontSize: 11.5,
            lineHeight: 1.7,
          }}
        >
          {block.text}
        </blockquote>
      );
    }

    if (block.type === "divider") {
      return (
        <div
          key={key}
          style={{ height: 1, background: `${C.gold}80`, margin: "10px 0" }}
        />
      );
    }

    if (block.type === "list") {
      return (
        <div key={key} style={{ marginBottom: 10 }}>
          {block.items.map((item, itemIdx) => (
            <div
              key={`${key}-item-${itemIdx}`}
              style={{
                fontSize: 12,
                color: "#222",
                lineHeight: 1.8,
                marginBottom: 3,
                paddingLeft: 2,
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <span style={{ minWidth: 18 }}>
                {block.ordered ? `${itemIdx + 1}.` : "•"}
              </span>
              <span
                style={{
                  flex: 1,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (block.type === "table") {
      return (
        <div key={key} style={{ margin: "8px 0 12px", overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 10.5,
              color: "#222",
            }}
          >
            {block.headers.length > 0 && (
              <thead>
                <tr>
                  {block.headers.map((header, headerIdx) => (
                    <th
                      key={`${key}-head-${headerIdx}`}
                      style={{
                        border: `1px solid ${C.divider}55`,
                        background: `${C.navy}10`,
                        padding: "4px 6px",
                        textAlign: "left",
                        fontWeight: 700,
                        color: C.navy,
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, rowIdx) => (
                <tr key={`${key}-row-${rowIdx}`}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={`${key}-cell-${rowIdx}-${cellIdx}`}
                      style={{
                        border: `1px solid ${C.divider}40`,
                        padding: "4px 6px",
                        verticalAlign: "top",
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  });
}
