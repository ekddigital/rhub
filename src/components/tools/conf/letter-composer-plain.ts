function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function plainBodyToRichHtml(body: string): string {
  if (!body.trim()) return "<p></p>";
  return body
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`,
    )
    .join("");
}

export function richHtmlToPlainText(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return "";

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    const lines: string[] = [];

    const pushLine = (line: string) => {
      lines.push(line);
    };
    const pushBlankLine = () => {
      if (lines.length === 0 || lines[lines.length - 1] !== "") {
        lines.push("");
      }
    };

    const parseList = (listEl: Element, ordered: boolean) => {
      const items = Array.from(listEl.children).filter(
        (child) => child.tagName.toLowerCase() === "li",
      );
      items.forEach((item, index) => {
        const marker = ordered ? `${index + 1}. ` : "• ";
        const text = item.textContent?.trim() || "";
        if (text) pushLine(`${marker}${text}`);
      });
      pushBlankLine();
    };

    Array.from(doc.body.children).forEach((el) => {
      const tag = el.tagName.toLowerCase();

      if (tag === "table") {
        const rows = Array.from(el.querySelectorAll("tr"));
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("th,td"))
            .map((cell) => cell.textContent?.trim() || "")
            .filter(Boolean);
          if (cells.length > 0) pushLine(cells.join(" | "));
        });
        pushBlankLine();
        return;
      }

      if (tag === "ul") {
        parseList(el, false);
        return;
      }

      if (tag === "ol") {
        parseList(el, true);
        return;
      }

      const text = el.textContent?.trim() || "";
      if (!text) {
        pushBlankLine();
        return;
      }

      pushLine(text);
      if (
        ["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(
          tag,
        )
      ) {
        pushBlankLine();
      }
    });

    return lines
      .join("\n")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  const withBreaks = trimmed
    .replace(/<\/th>\s*<th[^>]*>/gi, " | ")
    .replace(/<\/td>\s*<td[^>]*>/gi, " | ")
    .replace(/<(th|td)[^>]*>/gi, "")
    .replace(/<\/(th|td)>/gi, "")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/thead>/gi, "\n")
    .replace(/<\/tbody>/gi, "\n")
    .replace(/<\/table>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, " ");

  return withBreaks
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
