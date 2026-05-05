/**
 * Rich Text Renderer
 * Renders markdown/rich text with embedded images from EKD Assets
 */

"use client";

import { useMemo, type ElementType, type ReactElement } from "react";
import { EKDAssetImage } from "@/components/creative/ui/ekd-asset-image";
import { cn } from "@/lib/utils";

interface RichTextRendererProps {
  content: string;
  className?: string;
  imageClassName?: string;
}

export function RichTextRenderer({
  content,
  className,
  imageClassName = "max-w-full h-auto rounded-lg shadow-sm my-4",
}: RichTextRendererProps) {
  // Parse inline markdown (bold, italic, code, links)
  // Declared before useMemo to avoid temporal dead zone
  const parseInlineMarkdown = (text: string): (string | ReactElement)[] => {
    const elements: (string | ReactElement)[] = [];
    let currentIndex = 0;
    let elementKey = 0;

    // Patterns for inline formatting
    const patterns = [
      {
        regex: /\*\*([^*]+)\*\*/g,
        component: (match: string) => (
          <strong key={elementKey++}>{match}</strong>
        ),
      },
      {
        regex: /\*([^*]+)\*/g,
        component: (match: string) => <em key={elementKey++}>{match}</em>,
      },
      {
        regex: /<u>([^<]+)<\/u>/g,
        component: (match: string) => <u key={elementKey++}>{match}</u>,
      },
      {
        regex: /`([^`]+)`/g,
        component: (match: string) => (
          <code
            key={elementKey++}
            className="bg-muted px-1 py-0.5 rounded text-sm"
          >
            {match}
          </code>
        ),
      },
      {
        regex: /\[([^\]]+)\]\(([^)]+)\)/g,
        component: (match: string, url: string) => (
          <a
            key={elementKey++}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {match}
          </a>
        ),
      },
    ];

    // Find all matches
    const allMatches: Array<{
      start: number;
      end: number;
      element: ReactElement;
    }> = [];

    patterns.forEach(({ regex, component }) => {
      let match;
      const localRegex = new RegExp(regex.source, regex.flags);

      while ((match = localRegex.exec(text)) !== null) {
        const fullMatch = match[0];
        const innerMatch = match[1];
        const secondMatch = match[2];

        allMatches.push({
          start: match.index,
          end: match.index + fullMatch.length,
          element: component(innerMatch, secondMatch),
        });
      }
    });

    // Sort matches by start position
    allMatches.sort((a, b) => a.start - b.start);

    // Build result with non-overlapping matches
    const usedRanges: Array<{ start: number; end: number }> = [];

    allMatches.forEach((match) => {
      // Check if this match overlaps with any used range
      const overlaps = usedRanges.some(
        (range) =>
          (match.start >= range.start && match.start < range.end) ||
          (match.end > range.start && match.end <= range.end) ||
          (match.start <= range.start && match.end >= range.end),
      );

      if (!overlaps) {
        // Add text before this match
        if (match.start > currentIndex) {
          elements.push(text.substring(currentIndex, match.start));
        }

        // Add the formatted element
        elements.push(match.element);

        currentIndex = match.end;
        usedRanges.push({ start: match.start, end: match.end });
      }
    });

    // Add remaining text
    if (currentIndex < text.length) {
      elements.push(text.substring(currentIndex));
    }

    return elements.length > 0 ? elements : [text];
  };

  const renderedContent = useMemo(() => {
    if (!content) return null;

    // Split content by lines to process markdown
    const lines = content.split("\n");
    const elements: ReactElement[] = [];
    let currentParagraph: string[] = [];
    let listItems: string[] = [];
    let listType: "ul" | "ol" | null = null;
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const paragraphContent = currentParagraph.join(" ");
        if (paragraphContent.trim()) {
          elements.push(
            <p key={elements.length} className="mb-4 leading-relaxed">
              {parseInlineMarkdown(paragraphContent)}
            </p>,
          );
        }
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (listItems.length > 0) {
        const ListComponent = listType === "ol" ? "ol" : "ul";
        elements.push(
          <ListComponent
            key={elements.length}
            className={cn(
              "mb-4 space-y-1",
              listType === "ol"
                ? "list-decimal list-inside"
                : "list-disc list-inside",
            )}
          >
            {listItems.map((item, index) => (
              <li key={index} className="leading-relaxed">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ListComponent>,
        );
        listItems = [];
        listType = null;
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre
            key={elements.length}
            className="bg-muted p-4 rounded-lg overflow-x-auto mb-4"
          >
            <code>{codeBlockContent.join("\n")}</code>
          </pre>,
        );
        codeBlockContent = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Handle code blocks
      if (trimmedLine === "```") {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushParagraph();
          flushList();
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Handle images
      const imageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (imageMatch) {
        flushParagraph();
        flushList();

        const [, alt, src] = imageMatch;
        elements.push(
          <div key={elements.length} className="my-6 text-center">
            <EKDAssetImage
              src={src}
              alt={alt || "Uploaded image"}
              width={800}
              height={600}
              className={imageClassName}
              quality={80}
              crop="auto"
            />
            {alt && (
              <p className="text-sm text-muted-foreground mt-2 italic">{alt}</p>
            )}
          </div>,
        );
        continue;
      }

      // Handle headings
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();

        const [, hashes, text] = headingMatch;
        const level = hashes.length;
        const HeadingTag = `h${Math.min(
          level + 1,
          6,
        )}` as ElementType;

        elements.push(
          <HeadingTag
            key={elements.length}
            className={cn(
              "font-semibold mb-3 mt-6",
              level === 1 && "text-2xl",
              level === 2 && "text-xl",
              level === 3 && "text-lg",
              level >= 4 && "text-base",
            )}
          >
            {parseInlineMarkdown(text)}
          </HeadingTag>,
        );
        continue;
      }

      // Handle blockquotes
      if (trimmedLine.startsWith("> ")) {
        flushParagraph();
        flushList();

        elements.push(
          <blockquote
            key={elements.length}
            className="border-l-4 border-primary/30 pl-4 py-2 mb-4 italic text-muted-foreground bg-muted/30 rounded-r"
          >
            {parseInlineMarkdown(trimmedLine.substring(2))}
          </blockquote>,
        );
        continue;
      }

      // Handle lists
      const unorderedListMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
      const orderedListMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);

      if (unorderedListMatch) {
        flushParagraph();
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        listItems.push(unorderedListMatch[1]);
        continue;
      }

      if (orderedListMatch) {
        flushParagraph();
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push(orderedListMatch[1]);
        continue;
      }

      // Handle empty lines
      if (!trimmedLine) {
        flushParagraph();
        flushList();
        continue;
      }

      // Regular paragraph content
      flushList();
      currentParagraph.push(line);
    }

    // Flush remaining content
    flushParagraph();
    flushList();
    flushCodeBlock();

    return elements;
  }, [content, imageClassName]);

  if (!content) {
    return null;
  }

  return (
    <div className={cn("prose prose-slate max-w-none", className)}>
      {renderedContent}
    </div>
  );
}
