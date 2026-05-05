"use client";

/**
 * ContentRenderer
 * Renders an array of DocumentNode[] to styled React elements.
 * Applies brand typography, gold-accent table headings, figure captions,
 * blockquote styling, inline formatting, and signature blocks.
 */

import React, { type ElementType } from "react";
import { TYPOGRAPHY, TABLE_STYLES, LETTERHEAD } from "@/lib/creative/documents/constants";
import { WEB_HEADING_COLORS } from "@/lib/creative/documents/shared-styles";
import type {
  DocumentNode,
  InlineContent,
  HeadingNode,
  ParagraphNode,
  ListNode,
  ListItemNode,
  TableNode,
  FigureNode,
  BlockquoteNode,
  CodeBlockNode,
  SignatureBlockNode,
} from "@/lib/creative/documents/types";
import { SignatureBlock } from "./SignatureBlock";
import { DraggablePreviewImage } from "./DraggablePreviewImage";

/* ================================================================
   Inline content renderer
   ================================================================ */

function renderInline(content: InlineContent[], key?: string): React.ReactNode {
  return content.map((item, i) => {
    if (item.type === "text") {
      // Split by \n to properly render <br> line breaks
      // (The HTML parser converts <br> to \n text nodes, but React
      // treats \n as whitespace — we need explicit <br /> elements.)
      const segments = item.text.split("\n");

      let node: React.ReactNode =
        segments.length > 1
          ? segments.map((seg, si) => (
              <React.Fragment key={`${key}-seg-${i}-${si}`}>
                {seg}
                {si < segments.length - 1 && <br />}
              </React.Fragment>
            ))
          : item.text;

      if (item.code) {
        node = (
          <code
            key={`${key}-code-${i}`}
            style={{
              fontFamily: TYPOGRAPHY.mono.fontFamily,
              fontSize: TYPOGRAPHY.mono.fontSize,
              backgroundColor: "#f4f0ea",
              padding: "1px 4px",
              borderRadius: "3px",
            }}
          >
            {node}
          </code>
        );
      }
      if (item.bold) node = <strong key={`${key}-b-${i}`}>{node}</strong>;
      if (item.italic) node = <em key={`${key}-i-${i}`}>{node}</em>;
      if (item.underline) node = <u key={`${key}-u-${i}`}>{node}</u>;
      if (item.strikethrough) node = <s key={`${key}-s-${i}`}>{node}</s>;
      if (item.link) {
        node = (
          <a
            key={`${key}-a-${i}`}
            href={item.link}
            style={{ color: LETTERHEAD.goldColor, textDecoration: "underline" }}
          >
            {node}
          </a>
        );
      }
      if (item.fontSize) {
        node = (
          <span
            key={`${key}-fs-${i}`}
            style={{ fontSize: `${item.fontSize}px` }}
          >
            {node}
          </span>
        );
      }

      return <React.Fragment key={`${key}-${i}`}>{node}</React.Fragment>;
    }
    return null;
  });
}

/**
 * Resolve text from a node that can have either `content` or `text` shorthand.
 */
function resolveText(
  node: { content?: InlineContent[]; text?: string },
  key: string,
): React.ReactNode {
  if (node.content && node.content.length > 0) {
    return renderInline(node.content, key);
  }
  return node.text ?? "";
}

/* ================================================================
   Block renderers
   ================================================================ */

function renderHeading(node: HeadingNode, key: string) {
  const styles: Record<number, React.CSSProperties> = {
    1: {
      ...TYPOGRAPHY.heading.h1,
      fontFamily: TYPOGRAPHY.heading.fontFamily,
      color: WEB_HEADING_COLORS[1],
      marginTop: "8px",
      marginBottom: "3px",
    },
    2: {
      ...TYPOGRAPHY.heading.h2,
      fontFamily: TYPOGRAPHY.heading.fontFamily,
      color: WEB_HEADING_COLORS[2],
      marginTop: "7px",
      marginBottom: "3px",
    },
    3: {
      ...TYPOGRAPHY.heading.h3,
      fontFamily: TYPOGRAPHY.heading.fontFamily,
      color: WEB_HEADING_COLORS[3],
      marginTop: "6px",
      marginBottom: "2px",
    },
    4: {
      ...TYPOGRAPHY.heading.h4,
      fontFamily: TYPOGRAPHY.heading.fontFamily,
      color: WEB_HEADING_COLORS[4],
      marginTop: "5px",
      marginBottom: "2px",
    },
  };

  const Tag = `h${node.level}` as ElementType;
  const style = styles[node.level] || styles[4];
  const text = node.number ? `${node.number}  ${node.text}` : node.text;

  return (
    <Tag key={key} id={node.id} style={style}>
      {text}
    </Tag>
  );
}

/**
 * When a document has exactly one H1, render it as bold body-size text
 * with center alignment. This avoids the large heading style that looks
 * redundant in formal (letterhead) documents where the title is already
 * in the header area. Keeps the boldness and centering for emphasis.
 */
function renderTitleAsBoldText(node: HeadingNode, key: string) {
  const text = node.number ? `${node.number}  ${node.text}` : node.text;
  return (
    <p
      key={key}
      id={node.id}
      style={{
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: TYPOGRAPHY.body.fontSize,
        lineHeight: TYPOGRAPHY.body.lineHeight,
        fontWeight: 700,
        color: LETTERHEAD.primaryColor,
        textAlign: "center",
        margin: "4px 0",
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {text}
    </p>
  );
}

function renderParagraph(node: ParagraphNode, key: string) {
  // Empty paragraph → render as spacing (preserves editor line-breaks)
  const isEmpty =
    !node.text &&
    (!node.content || node.content.every((c) => c.type === "text" && !c.text));
  if (isEmpty) {
    return (
      <p
        key={key}
        style={{
          fontFamily: TYPOGRAPHY.body.fontFamily,
          fontSize: TYPOGRAPHY.body.fontSize,
          lineHeight: TYPOGRAPHY.body.lineHeight,
          margin: "3px 0",
          minHeight: "1.2em",
        }}
      >
        &nbsp;
      </p>
    );
  }

  // Detect label-value lines like **Signed:** or **Date:** — skip text-indent
  const isLabelValue =
    node.content &&
    node.content.length > 0 &&
    node.content[0].type === "text" &&
    node.content[0].bold &&
    node.content[0].text?.trimEnd().endsWith(":");

  // Respect explicit text alignment from the editor
  const explicitAlign = node.textAlign;
  const effectiveAlign =
    explicitAlign || (isLabelValue ? undefined : "justify");

  return (
    <p
      key={key}
      style={{
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: TYPOGRAPHY.body.fontSize,
        lineHeight: TYPOGRAPHY.body.lineHeight,
        margin: "3px 0",
        ...(isLabelValue || explicitAlign
          ? { textIndent: 0 }
          : { textIndent: "1.5em" }),
        ...(effectiveAlign
          ? { textAlign: effectiveAlign as React.CSSProperties["textAlign"] }
          : {}),
        color: "#333",
      }}
    >
      {resolveText(node, key)}
    </p>
  );
}

function renderList(node: ListNode, key: string) {
  const Tag = node.ordered ? "ol" : "ul";
  return (
    <Tag
      key={key}
      start={node.ordered ? node.start : undefined}
      style={{
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: TYPOGRAPHY.body.fontSize,
        lineHeight: TYPOGRAPHY.body.lineHeight,
        margin: "3px 0",
        paddingLeft: "28px",
        color: "#333",
        listStyleType: node.ordered ? "decimal" : "disc",
        textAlign: "justify" as const,
      }}
    >
      {node.items.map((item, i) => renderListItem(item, `${key}-li-${i}`))}
    </Tag>
  );
}

function renderListItem(node: ListItemNode, key: string) {
  return (
    <li
      key={key}
      style={{
        margin: "1px 0",
        paddingLeft: "4px",
        lineHeight: TYPOGRAPHY.body.lineHeight,
        listStylePosition: "outside",
      }}
    >
      <span style={{ verticalAlign: "baseline" }}>
        {resolveText(node, key)}
      </span>
      {node.children && renderList(node.children, `${key}-sub`)}
    </li>
  );
}

function renderTable(node: TableNode, key: string) {
  // Continued table fragments should not produce a duplicate anchor ID
  const tableId =
    node.number && !node.continued ? `table-${node.number}` : undefined;
  return (
    <div key={key} id={tableId} style={{ margin: "6px 0", overflowX: "auto" }}>
      {/* Table caption — centered, uses auto-numbered caption from numberingEngine */}
      {node.caption && (
        <p
          style={{
            fontFamily: TYPOGRAPHY.body.fontFamily,
            fontSize: "10px",
            fontWeight: 700,
            color: LETTERHEAD.goldColor,
            margin: "0 0 4px 0",
            textAlign: "center",
            letterSpacing: "0.3px",
          }}
        >
          {node.caption}
        </p>
      )}

      {/* Table container with rounded corners & subtle shadow */}
      <div
        style={{
          borderRadius: "4px",
          overflow: "hidden",
          border: `1px solid ${TABLE_STYLES.borderColor}`,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: TYPOGRAPHY.table.fontFamily,
            fontSize: TYPOGRAPHY.table.bodyFontSize,
            lineHeight: TYPOGRAPHY.table.lineHeight,
          }}
        >
          <thead>
            <tr>
              {node.headers.map((header, i) => (
                <th
                  key={`${key}-th-${i}`}
                  style={{
                    backgroundColor: TABLE_STYLES.headerBg,
                    color: TABLE_STYLES.headerColor,
                    fontWeight: TABLE_STYLES.headerFontWeight,
                    fontSize: TYPOGRAPHY.table.headerFontSize,
                    padding: "6px 10px",
                    textAlign: "left",
                    borderBottom: `2px solid ${LETTERHEAD.goldColor}`,
                    borderRight:
                      i < node.headers.length - 1
                        ? "1px solid rgba(255,255,255,0.2)"
                        : "none",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {node.rows.map((row, ri) => (
              <tr
                key={`${key}-tr-${ri}`}
                style={{
                  backgroundColor:
                    ri % 2 === 1 ? TABLE_STYLES.stripedBg : "#FFFFFF",
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={`${key}-td-${ri}-${ci}`}
                    style={{
                      padding: "5px 10px",
                      borderBottom:
                        ri < node.rows.length - 1
                          ? `1px solid ${TABLE_STYLES.borderColor}`
                          : "none",
                      borderRight:
                        ci < row.length - 1
                          ? `1px solid ${TABLE_STYLES.borderColor}`
                          : "none",
                      verticalAlign: "top",
                      fontSize: TYPOGRAPHY.table.bodyFontSize,
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
    </div>
  );
}

function renderFigure(
  node: FigureNode,
  key: string,
  draggableImages: boolean = false,
  onImageMove?: (src: string, posX: number, posY: number) => void,
) {
  const alignment = node.alignment || "center";
  const imgWidth = node.width
    ? typeof node.width === "number"
      ? `${node.width}px`
      : node.width
    : undefined;

  // If draggable mode is enabled, always use DraggablePreviewImage
  if (draggableImages) {
    return (
      <DraggablePreviewImage
        key={key}
        imageKey={key}
        src={node.src}
        alt={node.alt || ""}
        width={imgWidth}
        initialPosX={node.posX}
        initialPosY={node.posY}
        onPositionChange={(posX, posY) => {
          console.log("Image position changed:", posX, posY);
          if (onImageMove) {
            onImageMove(node.src, posX, posY);
          }
        }}
        caption={node.caption}
        figureNumber={node.number}
      />
    );
  }

  // Standard flow-based layout for PDF/print (when drag mode is OFF)
  const figureStyle: React.CSSProperties = {
    margin: "6px 0",
  };

  if (alignment === "center") {
    figureStyle.textAlign = "center";
    figureStyle.display = "block";
  } else if (alignment === "left") {
    figureStyle.float = "left";
    figureStyle.marginRight = "12px";
    figureStyle.marginBottom = "4px";
    figureStyle.textAlign = "left";
  } else if (alignment === "right") {
    figureStyle.float = "right";
    figureStyle.marginLeft = "12px";
    figureStyle.marginBottom = "4px";
    figureStyle.textAlign = "right";
  }

  return (
    <figure
      key={key}
      id={node.number != null ? `figure-${node.number}` : undefined}
      style={figureStyle}
    >
      <div
        style={{
          position: "relative",
          ...(imgWidth ? { width: imgWidth } : {}),
          ...(alignment === "center" ? { margin: "0 auto" } : {}),
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={node.src}
          alt={node.alt || ""}
          style={{
            maxWidth: "100%",
            width: imgWidth || "auto",
            height: "auto",
            border: "none",
            display: "block",
          }}
        />
      </div>
      {node.caption && (
        <figcaption
          style={{
            fontFamily: TYPOGRAPHY.body.fontFamily,
            fontSize: "10px",
            fontWeight: 700,
            color: LETTERHEAD.goldColor,
            marginTop: "4px",
            textAlign: "center",
            letterSpacing: "0.3px",
          }}
        >
          {node.number != null
            ? `Figure ${node.number}: ${node.caption}`
            : node.caption}
        </figcaption>
      )}
    </figure>
  );
}

function renderBlockquote(node: BlockquoteNode, key: string) {
  return (
    <blockquote
      key={key}
      style={{
        margin: "6px 0",
        paddingLeft: "14px",
        paddingTop: "4px",
        paddingBottom: "4px",
        borderLeft: `3px solid ${LETTERHEAD.goldColor}`,
        color: "#555",
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontSize: TYPOGRAPHY.body.fontSize,
        fontStyle: "italic",
        textAlign: "justify" as const,
      }}
    >
      {resolveText(node, key)}
    </blockquote>
  );
}

function renderCodeBlock(node: CodeBlockNode, key: string) {
  return (
    <pre
      key={key}
      style={{
        margin: "8px 0",
        padding: "12px 14px",
        backgroundColor: "#1F1C18",
        color: "#e0dcd5",
        borderRadius: "4px",
        fontFamily: TYPOGRAPHY.mono.fontFamily,
        fontSize: TYPOGRAPHY.mono.fontSize,
        lineHeight: TYPOGRAPHY.mono.lineHeight,
        overflow: "auto",
      }}
    >
      <code>{node.code}</code>
    </pre>
  );
}

function renderHorizontalRule(key: string) {
  return (
    <hr
      key={key}
      style={{
        margin: "2px 0",
        border: "none",
        borderTop: `1px solid ${TABLE_STYLES.borderColor}`,
      }}
    />
  );
}

function renderPageBreak(key: string) {
  return (
    <div
      key={key}
      className="document-page-break"
      style={{
        pageBreakAfter: "always",
        borderBottom: `1px dashed ${LETTERHEAD.goldColor}`,
        margin: "20px 0",
        opacity: 0.5,
      }}
    />
  );
}

function renderSignatureBlock(node: SignatureBlockNode, key: string) {
  return (
    <SignatureBlock
      key={key}
      name={node.name}
      title={node.title}
      company={node.company}
      date={node.date}
      signatureImage={node.signatureImage}
    />
  );
}

/* ================================================================
   Public component
   ================================================================ */

interface ContentRendererProps {
  nodes: DocumentNode[];
  className?: string;
  /** Enable draggable positioning for images in preview */
  draggableImages?: boolean;
  /** Callback when image position changes (src, posX, posY) */
  onImageMove?: (src: string, posX: number, posY: number) => void;
}

/**
 * Renders an array of DocumentNode into styled React elements.
 * Each node type maps to a branded component with proper typography.
 */
export function ContentRenderer({
  nodes,
  className,
  draggableImages = false,
  onImageMove,
}: ContentRendererProps) {
  // Render a single node with context
  function renderNode(node: DocumentNode, index: number): React.ReactNode {
    const key = `node-${index}`;
    switch (node.type) {
      case "heading":
        return renderHeading(node, key);
      case "paragraph":
        return renderParagraph(node, key);
      case "list":
        return renderList(node, key);
      case "table":
        return renderTable(node, key);
      case "figure":
        return renderFigure(node, key, draggableImages, onImageMove);
      case "blockquote":
        return renderBlockquote(node, key);
      case "code-block":
        return renderCodeBlock(node, key);
      case "signature-block":
        return renderSignatureBlock(node, key);
      case "horizontal-rule":
        return renderHorizontalRule(key);
      case "page-break":
        return renderPageBreak(key);
      default:
        return null;
    }
  }

  return (
    <div
      className={className}
      style={{
        width: "100%",
        position: draggableImages ? "relative" : undefined,
        minHeight: draggableImages ? "500px" : undefined,
      }}
    >
      {nodes.map((node, i) => renderNode(node, i))}
    </div>
  );
}
