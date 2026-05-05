/**
 * HTML → DocumentModel parser
 * Converts TipTap editor HTML output into a structured DocumentModel AST.
 * Runs client-side using the browser DOMParser.
 */

import type {
  DocumentModel,
  DocumentNode,
  InlineContent,
  InlineText,
  HeadingNode,
  ParagraphNode,
  ListNode,
  ListItemNode,
  TableNode,
  FigureNode,
  CodeBlockNode,
  SignatureBlockNode,
  DocumentMeta,
} from "./types";

/**
 * Parse inline content from an HTML element, preserving formatting marks.
 */
function parseInlineContent(element: Element | ChildNode): InlineContent[] {
  const result: InlineContent[] = [];

  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = sanitizeText(child.textContent || "");
      if (text.trim() || text === " ") {
        result.push({ type: "text", text });
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      // Recursive inline formatting
      if (
        [
          "strong",
          "b",
          "em",
          "i",
          "u",
          "s",
          "del",
          "code",
          "a",
          "span",
        ].includes(tag)
      ) {
        // Extract font-size from span style (set by editor font-size control)
        let spanFontSize: number | undefined;
        if (tag === "span") {
          const spanStyle = el.getAttribute("style") || "";
          const fsMatch = spanStyle.match(/font-size:\s*(\d+(?:\.\d+)?)\s*px/i);
          if (fsMatch) spanFontSize = parseFloat(fsMatch[1]);
        }
        const nested = parseInlineContent(el);
        nested.forEach((item) => {
          if (item.type === "text") {
            if (tag === "strong" || tag === "b") item.bold = true;
            if (tag === "em" || tag === "i") item.italic = true;
            if (tag === "u") item.underline = true;
            if (tag === "s" || tag === "del") item.strikethrough = true;
            if (tag === "code") item.code = true;
            if (tag === "a") item.link = el.getAttribute("href") || undefined;
            if (spanFontSize) item.fontSize = spanFontSize;
          }
          result.push(item);
        });
      } else if (tag === "br") {
        result.push({ type: "text", text: "\n" });
      } else {
        // Unknown inline element — extract text
        const nested = parseInlineContent(el);
        result.push(...nested);
      }
    }
  });

  return result;
}

/**
 * Get plain text content from inline content array.
 */
function getPlainText(content: InlineContent[]): string {
  return content.map((c) => (c.type === "text" ? c.text : "")).join("");
}

/**
 * Parse a list element (<ul> or <ol>) into a ListNode.
 */
function parseList(element: Element): ListNode {
  const ordered = element.tagName.toLowerCase() === "ol";
  const items: ListItemNode[] = [];

  element.querySelectorAll(":scope > li").forEach((li) => {
    const childList = li.querySelector(":scope > ul, :scope > ol");
    const content = parseInlineContent(li);

    // Filter out content from child lists
    const filteredContent = childList
      ? parseInlineContent(
          (() => {
            const clone = li.cloneNode(true) as Element;
            clone.querySelector("ul, ol")?.remove();
            return clone;
          })(),
        )
      : content;

    const item: ListItemNode = {
      type: "list-item",
      content: filteredContent,
      text: getPlainText(filteredContent),
    };

    if (childList) {
      item.children = parseList(childList);
    }

    items.push(item);
  });

  return {
    type: "list",
    ordered,
    items,
    start: ordered
      ? parseInt(element.getAttribute("start") || "1", 10)
      : undefined,
  };
}

/**
 * Parse an HTML table element into a TableNode.
 */
function parseTable(element: Element): TableNode {
  const headers: string[] = [];
  const rows: string[][] = [];

  // Parse <caption> element for table label
  const captionEl = element.querySelector("caption");
  const label = captionEl?.textContent?.trim() || undefined;

  // Try thead first
  const thead = element.querySelector("thead");
  if (thead) {
    thead.querySelectorAll("th, td").forEach((cell) => {
      headers.push(sanitizeText(cell.textContent?.trim() || ""));
    });
  }

  // Body rows
  const tbody = element.querySelector("tbody") || element;
  const trs = tbody.querySelectorAll(":scope > tr");

  trs.forEach((tr, i) => {
    const cells: string[] = [];
    const isHeaderRow = !thead && i === 0;

    tr.querySelectorAll("td, th").forEach((cell) => {
      const text = sanitizeText(cell.textContent?.trim() || "");
      if (isHeaderRow) {
        headers.push(text);
      } else {
        cells.push(text);
      }
    });

    if (!isHeaderRow && cells.length > 0) {
      rows.push(cells);
    }
  });

  return {
    type: "table",
    headers: headers.length ? headers : ["Column 1"],
    rows,
    ...(label ? { label } : {}),
  };
}

/**
 * Parse a top-level HTML element into a DocumentNode.
 */
function parseElement(element: Element): DocumentNode | null {
  const tag = element.tagName.toLowerCase();

  // Headings
  if (/^h[1-6]$/.test(tag)) {
    const level = parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
    return {
      type: "heading",
      level,
      text: element.textContent?.trim() || "",
    } as HeadingNode;
  }

  // Paragraph
  if (tag === "p") {
    const content = parseInlineContent(element);
    // Extract text-align from style attribute (set by TipTap TextAlign extension)
    const style = element.getAttribute("style") || "";
    const alignMatch = style.match(
      /text-align:\s*(left|center|right|justify)/i,
    );
    const textAlign = alignMatch
      ? (alignMatch[1].toLowerCase() as "left" | "center" | "right" | "justify")
      : undefined;
    // Preserve empty paragraphs as spacer nodes (editor line-break / Enter)
    if (content.length === 0) {
      return {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
        text: "",
        ...(textAlign ? { textAlign } : {}),
      } as ParagraphNode;
    }
    return {
      type: "paragraph",
      content,
      text: getPlainText(content),
      ...(textAlign ? { textAlign } : {}),
    } as ParagraphNode;
  }

  // Lists
  if (tag === "ul" || tag === "ol") {
    return parseList(element);
  }

  // Table
  if (tag === "table") {
    return parseTable(element);
  }

  // Blockquote — convert to paragraph (blockquotes are flattened by
  // parseElementFlat, but this fallback handles nested contexts)
  if (tag === "blockquote") {
    // Extract children as paragraphs; return the first one
    const children: DocumentNode[] = [];
    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const node = parseElement(child as Element);
        if (node) children.push(node);
      }
    });
    if (children.length > 0) return children[0];
    // Fallback: treat as inline text paragraph
    const content = parseInlineContent(element);
    return {
      type: "paragraph",
      content,
      text: getPlainText(content),
    } as ParagraphNode;
  }

  // Code block
  if (tag === "pre") {
    const codeEl = element.querySelector("code");
    const code = codeEl?.textContent || element.textContent || "";
    const language =
      codeEl?.className.match(/language-(\w+)/)?.[1] || undefined;
    return {
      type: "code-block",
      code,
      language,
    } as CodeBlockNode;
  }

  // Horizontal rule
  if (tag === "hr") {
    return { type: "horizontal-rule" };
  }

  // Image / figure
  if (tag === "figure" || tag === "img") {
    const img = tag === "img" ? element : element.querySelector("img");
    if (img) {
      // Caption can come from:
      // 1. data-caption attribute (ResizableImage extension)
      // 2. <figcaption> element (standard HTML figure)
      const caption =
        img.getAttribute("data-caption") ||
        element.querySelector("figcaption")?.textContent ||
        undefined;
      // Capture alignment from data-alignment attribute (set by ResizableImage extension)
      const alignment =
        (img.getAttribute("data-alignment") as "left" | "center" | "right") ||
        (element.getAttribute("data-alignment") as
          | "left"
          | "center"
          | "right") ||
        undefined;
      // Capture width from style or attribute (as string, e.g. "300px")
      const widthAttr = img.getAttribute("width");
      const styleWidth = (img as HTMLElement).style?.width;
      const width = widthAttr
        ? `${widthAttr}${widthAttr.match(/\D/) ? "" : "px"}`
        : styleWidth || undefined;
      // Capture absolute positioning from data-pos-x/y attributes
      const posXAttr = img.getAttribute("data-pos-x");
      const posYAttr = img.getAttribute("data-pos-y");
      const posX = posXAttr ? parseFloat(posXAttr) : undefined;
      const posY = posYAttr ? parseFloat(posYAttr) : undefined;
      return {
        type: "figure" as const,
        src: img.getAttribute("src") || "",
        alt: img.getAttribute("alt") || undefined,
        caption,
        ...(alignment ? { alignment } : {}),
        ...(width ? { width } : {}),
        ...(posX !== undefined ? { posX } : {}),
        ...(posY !== undefined ? { posY } : {}),
      };
    }
  }

  // Div — recurse into children (TipTap sometimes wraps in divs)
  // Returns first child for single-child divs; multi-child divs are
  // handled by parseElementFlat() which flattens them into the parent list.
  if (tag === "div") {
    const children: DocumentNode[] = [];
    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const node = parseElement(child as Element);
        if (node) children.push(node);
      }
    });
    if (children.length === 1) return children[0];
    // For multi-child divs, return first; parseElementFlat handles the rest
    if (children.length > 0) return children[0];
  }

  return null;
}

/**
 * Parse an element, flattening wrapper divs into an array of DocumentNodes.
 * Divs with multiple children yield all children instead of just the first.
 */
function parseElementFlat(element: Element): DocumentNode[] {
  const tag = element.tagName.toLowerCase();

  // Flatten wrapper divs and blockquotes — extract their children as
  // top-level nodes so blockquotes become regular paragraphs and divs
  // don't silently drop children.
  if (tag === "div" || tag === "blockquote") {
    const results: DocumentNode[] = [];
    element.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        results.push(...parseElementFlat(child as Element));
      }
    });
    // If the blockquote/div had no element children but has text,
    // create a paragraph from its inline content.
    if (results.length === 0) {
      const content = parseInlineContent(element);
      if (content.length > 0) {
        results.push({
          type: "paragraph",
          content,
          text: getPlainText(content),
        } as ParagraphNode);
      }
    }
    return results;
  }

  const node = parseElement(element);
  return node ? [node] : [];
}

/**
 * Post-process: absorb "**Table: Label**" paragraphs into the next table's label.
 * This prevents duplication between the user's bold caption paragraph and the
 * auto-generated "Table N" numbering caption.
 *
 * Patterns matched:
 *   - "Table: Some Label"
 *   - "Table — Some Label"
 *   - "Table – Some Label"
 *   - "Table - Some Label"
 */
function absorbTableCaptions(nodes: DocumentNode[]): DocumentNode[] {
  const result: DocumentNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const next = nodes[i + 1];

    // Check if this paragraph is a table caption pattern
    if (node.type === "paragraph" && next?.type === "table") {
      const text = node.text?.trim() || "";
      // Match "Table: Label" or "Table — Label" or "Table – Label" or "Table - Label"
      const match = text.match(/^Table\s*(?::|—|–|-)\s*(.+)$/i);
      if (match) {
        // Set as the table's label (will be used by numberingEngine)
        (next as TableNode).label = match[1].trim();
        // Skip this paragraph — the table caption will show via numbering
        continue;
      }
    }

    result.push(node);
  }
  return result;
}

/**
 * Sanitize common UTF-8 mojibake / encoding artifacts.
 * Fixes garbled characters from latin-1 / CP-1252 misinterpretation.
 */
function sanitizeText(text: string): string {
  return (
    text
      .replace(/\u00e2\u0080\u0094/g, "\u2014") // â€" → —
      .replace(/\u00e2\u0080\u0093/g, "\u2013") // â€" → –
      .replace(/\u00e2\u0080\u0099/g, "\u2019") // â€™ → '
      .replace(/\u00e2\u0080\u009c/g, "\u201c") // â€œ → "
      .replace(/\u00e2\u0080\u009d/g, "\u201d") // â€ → "
      .replace(/\u00e2\u0080\u00a2/g, "\u2022") // â€¢ → •
      .replace(/\u00c2\u00a0/g, " ") // Â  → (space)
      // Standalone â followed by a space — likely a corrupted en/em dash
      .replace(/\u00e2\s/g, "\u2013 ") // â  → –
      .replace(/\u00e2$/g, "\u2013")
  ); // trailing â → –
}

/**
 * Post-process: Detect signature patterns and create signature-block nodes.
 *
 * When a user uploads a signature image via the asset browser, the editor
 * produces a sequence like:
 *   paragraph: "Signed: _____" or "Signed:"
 *   [optional] figure: { src: "..." }  ← uploaded signature image
 *   paragraph: "Name: ..."
 *   paragraph: "Title: ..."
 *   [optional] paragraph: "Authorized representative of..." / "Duly authorized..."
 *   [optional] paragraph: company name
 *   [optional] paragraph: "Address: ..."
 *   [optional] paragraph: "Date: ..."
 *
 * This function detects such patterns and collapses them into a single
 * signature-block node, preserving the dynamically uploaded image URL.
 */
function detectSignatureBlocks(nodes: DocumentNode[]): DocumentNode[] {
  const result: DocumentNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    // Check if this paragraph starts with "Signed:"
    if (node.type === "paragraph") {
      const text = (node.text || "").trim();
      const signedMatch = /^Signed\s*:/i.test(text);

      if (signedMatch) {
        let j = i + 1;
        let signatureImage: string | undefined;

        // Check for figure (signature image) immediately after
        if (j < nodes.length && nodes[j].type === "figure") {
          signatureImage = (nodes[j] as FigureNode).src;
          j++;
        }

        // Extract name from "Name: ..."
        let name: string | undefined;
        if (j < nodes.length && nodes[j].type === "paragraph") {
          const nameText = ((nodes[j] as ParagraphNode).text || "").trim();
          const nameMatch = nameText.match(/^Name\s*:\s*(.+)/i);
          if (nameMatch) {
            name = nameMatch[1].trim();
            j++;
          }
        }

        // Only create a signature-block if we found at least a name
        if (name) {
          let title = "";
          let company = "";
          let date: string | undefined;

          // Extract title from "Title: ..."
          if (j < nodes.length && nodes[j].type === "paragraph") {
            const titleText = ((nodes[j] as ParagraphNode).text || "").trim();
            const titleMatch = titleText.match(/^Title\s*:\s*(.+)/i);
            if (titleMatch) {
              title = titleMatch[1].trim();
              j++;
            }
          }

          // Extract authorization/company from "Authorized representative of:"
          if (j < nodes.length && nodes[j].type === "paragraph") {
            const authText = ((nodes[j] as ParagraphNode).text || "").trim();
            if (/^(Authorized|Duly authorized)/i.test(authText)) {
              // Company might be embedded in this paragraph
              const companyMatch = authText.match(
                /(?:of|behalf of)\s*:?\s*\n?(.+)/i,
              );
              if (companyMatch) {
                company = companyMatch[1].trim();
              }
              j++;

              // If company wasn't in the auth paragraph, check next
              if (
                !company &&
                j < nodes.length &&
                nodes[j].type === "paragraph"
              ) {
                const nextText = (
                  (nodes[j] as ParagraphNode).text || ""
                ).trim();
                // If not a labeled field, treat it as the company name
                if (
                  nextText &&
                  !/^(Address|Date|Signed|Name|Title)\s*:/i.test(nextText)
                ) {
                  company = nextText;
                  j++;
                }
              }
            }
          }

          // Skip address paragraph if present
          if (j < nodes.length && nodes[j].type === "paragraph") {
            const addrText = ((nodes[j] as ParagraphNode).text || "").trim();
            if (/^Address\s*:/i.test(addrText)) {
              j++;
            }
          }

          // Extract date from "Date: ..."
          if (j < nodes.length && nodes[j].type === "paragraph") {
            const dateText = ((nodes[j] as ParagraphNode).text || "").trim();
            const dateMatch = dateText.match(/^Date\s*:\s*(.+)/i);
            if (dateMatch) {
              date = dateMatch[1].trim();
              j++;
            }
          }

          // Create the signature-block node with the dynamic image URL
          const sigBlock: SignatureBlockNode = {
            type: "signature-block",
            name,
            title,
            company,
            ...(date ? { date } : {}),
            ...(signatureImage ? { signatureImage } : {}),
          };
          result.push(sigBlock);
          i = j; // Skip past all consumed nodes
          continue;
        }
      }
    }

    result.push(node);
    i++;
  }

  return result;
}

/**
 * Strip hardcoded "Table of Contents" sections from the AST.
 * Detects a heading whose text matches "Table of Contents" (case-insensitive)
 * and removes it along with any immediately following list(s) that serve as
 * manual TOC navigation — the auto-generated TOC system replaces these.
 */
function stripHardcodedTOC(nodes: DocumentNode[]): DocumentNode[] {
  const result: DocumentNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];

    // Check if this is a "Table of Contents" heading
    if (
      node.type === "heading" &&
      /^table\s+of\s+contents$/i.test((node as HeadingNode).text.trim())
    ) {
      // Skip this heading and any following list nodes (the manual TOC links)
      i++;
      while (i < nodes.length && nodes[i].type === "list") {
        i++;
      }
      continue;
    }

    result.push(node);
    i++;
  }

  return result;
}

/**
 * Parse TipTap HTML output into a DocumentModel.
 */
export function htmlToDocumentModel(
  html: string,
  meta: Partial<DocumentMeta> = {},
): DocumentModel {
  if (typeof window === "undefined") {
    return {
      meta: { title: meta.title || "Untitled", ...meta },
      children: [],
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const children: DocumentNode[] = [];

  doc.body.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      // Use parseElementFlat to properly flatten wrapper divs
      const nodes = parseElementFlat(child as Element);
      children.push(...nodes);
    }
  });

  // Post-process: merge "Table: Label" paragraphs into following table nodes
  // NOTE: empty paragraphs are preserved as-is — every Enter press the user
  // makes is respected for manual content positioning (no collapsing).
  const processed = absorbTableCaptions(children);

  // Post-process: detect signature patterns and create signature-block nodes
  // This handles dynamically uploaded signature images from the asset browser
  const withSignatures = detectSignatureBlocks(processed);

  // Post-process: strip hardcoded "Table of Contents" heading + its following
  // navigation list so the auto-generated TOC is used instead
  const withoutHardcodedTOC = stripHardcodedTOC(withSignatures);

  return {
    meta: {
      title: meta.title || "Untitled",
      ...meta,
    },
    children: withoutHardcodedTOC,
  };
}

/* ─── DocumentModel → HTML serialiser ────────────────────────── */

/** Serialise InlineContent[] to an HTML string, preserving formatting. */
function inlineToHtml(items: InlineContent[]): string {
  return items
    .map((item) => {
      if (item.type !== "text") return "";
      let html = item.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      if (item.bold) html = `<strong>${html}</strong>`;
      if (item.italic) html = `<em>${html}</em>`;
      if (item.underline) html = `<u>${html}</u>`;
      if (item.strikethrough) html = `<s>${html}</s>`;
      if (item.code) html = `<code>${html}</code>`;
      if (item.link) html = `<a href="${item.link}">${html}</a>`;
      return html;
    })
    .join("");
}

/** Serialise a ListNode to <ul>/<ol> HTML. */
function listNodeToHtml(node: ListNode): string {
  const tag = node.ordered ? "ol" : "ul";
  const startAttr =
    node.ordered && node.start && node.start !== 1
      ? ` start="${node.start}"`
      : "";
  const items = node.items
    .map((li) => {
      let inner = inlineToHtml(li.content);
      if (li.children) inner += listNodeToHtml(li.children);
      return `<li>${inner}</li>`;
    })
    .join("");
  return `<${tag}${startAttr}>${items}</${tag}>`;
}

/** Serialise a single DocumentNode to HTML. */
function nodeToHtml(node: DocumentNode): string {
  switch (node.type) {
    case "heading":
      return `<h${node.level}>${node.text}</h${node.level}>`;
    case "paragraph":
      return `<p>${node.content ? inlineToHtml(node.content) : (node.text ?? "")}</p>`;
    case "list":
      return listNodeToHtml(node);
    case "table": {
      const caption = node.label ? `<caption>${node.label}</caption>` : "";
      const hdr = `<thead><tr>${node.headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
      const body = `<tbody>${node.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
      return `<table>${caption}${hdr}${body}</table>`;
    }
    case "figure": {
      const captionHtml = node.caption
        ? `<figcaption>${node.caption}</figcaption>`
        : "";
      return `<figure><img src="${node.src}" alt="${node.alt ?? ""}" />${captionHtml}</figure>`;
    }
    case "blockquote":
      return `<blockquote><p>${node.content ? inlineToHtml(node.content) : (node.text ?? "")}</p></blockquote>`;
    case "code-block":
      return `<pre><code${node.language ? ` class="language-${node.language}"` : ""}>${node.code}</code></pre>`;
    case "horizontal-rule":
      return "<hr />";
    case "page-break":
      return "";
    case "signature-block": {
      let s = `<p><strong>Signed:</strong> ________________________</p>`;
      s += `<p><strong>Name:</strong> ${node.name}</p>`;
      s += `<p><strong>Title:</strong> ${node.title}</p>`;
      if (node.company)
        s += `<p><em>Duly authorized to sign on behalf of</em></p><p><strong>${node.company}</strong></p>`;
      if (node.date) s += `<p><strong>Date:</strong> ${node.date}</p>`;
      return s;
    }
    default:
      return "";
  }
}

/**
 * Convert a DocumentModel (AST) back to HTML that the TipTap editor
 * understands. This is used by the "Load Sample" action so we can
 * populate the rich-text editor with structured content.
 */
export function documentModelToHtml(model: DocumentModel): string {
  return model.children.map(nodeToHtml).join("\n");
}

/**
 * Create a sample document for demo/testing purposes.
 */
export function createSampleDocument(): DocumentModel {
  return {
    meta: {
      title: "Sample Business Letter",
      subtitle: "Document Studio Demo",
      author: "EKD Digital",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      reference: "EKD/2025/DEMO-001",
      showTOC: true,
    },
    children: [
      {
        type: "heading",
        level: 1,
        text: "Executive Summary",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "This document demonstrates the ",
          },
          {
            type: "text",
            text: "Enterprise Document Authoring Engine",
            bold: true,
          },
          {
            type: "text",
            text: " built into the EKD Digital platform. It showcases letterhead enforcement, automatic numbering, professional table formatting, and multi-page pagination.",
          },
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Project Overview",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "The EKD Digital Document Studio enables creation of professionally formatted documents with consistent branding. All documents automatically include the company letterhead, gold accent styling, and proper typographic hierarchy.",
          },
        ],
      },
      {
        type: "table",
        label: "Deliverable Timeline",
        headers: ["Phase", "Description", "Duration", "Status"],
        rows: [
          ["Phase 1", "Requirements & Design", "2 weeks", "Complete"],
          ["Phase 2", "Core Development", "4 weeks", "In Progress"],
          ["Phase 3", "Testing & QA", "2 weeks", "Planned"],
          ["Phase 4", "Deployment & Training", "1 week", "Planned"],
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Technical Approach",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Our approach leverages modern web technologies including Next.js, React, and TipTap for rich text editing. The document engine supports:",
          },
        ],
      },
      {
        type: "list",
        ordered: false,
        items: [
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text: "A4 letterhead enforcement with branded headers and footers",
              },
            ],
            text: "A4 letterhead enforcement with branded headers and footers",
          },
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text: "Automatic hierarchical numbering for headings, tables, and figures",
              },
            ],
            text: "Automatic hierarchical numbering for headings, tables, and figures",
          },
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text: "Table of Contents generation with anchor links",
              },
            ],
            text: "Table of Contents generation with anchor links",
          },
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text: "Export to PDF with exact A4 page rendering",
              },
            ],
            text: "Export to PDF with exact A4 page rendering",
          },
          {
            type: "list-item",
            content: [
              {
                type: "text",
                text: "Signature block with company seal placeholder",
              },
            ],
            text: "Signature block with company seal placeholder",
          },
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Budget Summary",
      },
      {
        type: "table",
        label: "Cost Breakdown",
        headers: ["Item", "Unit Cost (USD)", "Quantity", "Total (USD)"],
        rows: [
          ["Software Development", "5,000", "1", "5,000"],
          ["UI/UX Design", "2,500", "1", "2,500"],
          ["Quality Assurance", "1,500", "1", "1,500"],
          ["Training & Documentation", "800", "1", "800"],
          ["Contingency (10%)", "", "", "980"],
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "EKD Digital is committed to delivering innovative technology solutions that drive meaningful impact across Liberia and beyond.",
            italic: true,
          },
        ],
        text: "EKD Digital is committed to delivering innovative technology solutions that drive meaningful impact across Liberia and beyond.",
      },
      {
        type: "heading",
        level: 1,
        text: "Conclusion",
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "We look forward to the opportunity to collaborate on this project. Please do not hesitate to contact us for any clarification or additional information.",
          },
        ],
      },
      {
        type: "signature-block",
        name: "Enoch Kwateh Dongbo",
        title: "Chief Executive Officer (CEO) & Founder",
        company: "EKD Digital (a subsidiary of A.N.D. GROUP OF COMPANIES LLC)",
        date: new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      },
    ],
  };
}
