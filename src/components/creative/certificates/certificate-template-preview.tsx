"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Card } from "@/components/creative/ui/card";

interface TemplateElement {
  type: string;
  style: React.CSSProperties;
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface TemplateData {
  elements: Record<string, TemplateElement>;
  pageSettings: {
    width: number;
    height: number;
    orientation: string;
    backgroundColor: string;
  };
}

interface CertificateTemplatePreviewProps {
  templateData: TemplateData;
  className?: string;
  scale?: number;
}

export function CertificateTemplatePreview({
  templateData,
  className = "",
  scale = 0.5,
}: CertificateTemplatePreviewProps) {
  const { elements, pageSettings } = templateData;

  // Process template variables
  const processContent = (content: string): string => {
    return content
      .replace(/\{\{recipientName\}\}/g, "John Doe")
      .replace(/\{\{issueDate\}\}/g, new Date().toLocaleDateString())
      .replace(/\{\{certificateId\}\}/g, "PREVIEW-001")
      .replace(
        /\{\{qrCode\}\}/g,
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiLz4="
      ) // Empty QR placeholder
      .replace(/\{([^}]+)\}/g, "Sample Data");
  };

  // Sort elements by z-index or order (backgrounds first, text last)
  const sortedElements = useMemo(() => {
    return Object.entries(elements).sort(([, a], [, b]) => {
      // Put shapes and backgrounds first, then images, then text
      const getTypeOrder = (type: string) => {
        switch (type) {
          case "shape":
            return 1;
          case "image":
            return 2;
          case "text":
            return 3;
          default:
            return 2;
        }
      };
      return getTypeOrder(a.type) - getTypeOrder(b.type);
    });
  }, [elements]);

  const scaledWidth = pageSettings.width * scale;
  const scaledHeight = pageSettings.height * scale;

  const renderElement = (id: string, element: TemplateElement) => {
    const { type, style, content, position } = element;
    const scaledPos = {
      x: position.x * scale,
      y: position.y * scale,
      width: position.width * scale,
      height: position.height * scale,
    };

    const fontSizeValue =
      typeof style.fontSize === "number"
        ? `${style.fontSize * scale}px`
        : undefined;

    const baseStyles: React.CSSProperties = {
      position: "absolute",
      left: scaledPos.x,
      top: scaledPos.y,
      width: scaledPos.width,
      height: scaledPos.height,
      fontSize: fontSizeValue,
      fontFamily: style.fontFamily || "serif",
      fontWeight: style.fontWeight || "normal",
      fontStyle: style.fontStyle || "normal",
      color: style.color || "#000000",
      textAlign: style.textAlign || "left",
      lineHeight: style.lineHeight || "normal",
      display: "flex",
      alignItems: "center",
      justifyContent:
        style.textAlign === "center"
          ? "center"
          : style.textAlign === "right"
          ? "flex-end"
          : "flex-start",
    };

    switch (type) {
      case "text":
        return (
          <div key={id} style={baseStyles}>
            <div style={{ width: "100%", wordWrap: "break-word" }}>
              {processContent(content)}
            </div>
          </div>
        );

      case "shape":
        return (
          <div
            key={id}
            style={{
              ...baseStyles,
              backgroundColor:
                style.color || style.backgroundColor || "#000000",
              borderRadius: style.borderRadius || "0px",
              border: style.border || "none",
            }}
          />
        );

      case "image":
        const processedSrc = processContent(content);

        // Handle QR code placeholder
        if (content === "{{qrCode}}" || content.includes("qrCode")) {
          return (
            <div
              key={id}
              style={{
                ...baseStyles,
                backgroundColor: "#f0f0f0",
                border: "2px dashed #ccc",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8 * scale + "px",
                color: "#666",
              }}
            >
              QR
            </div>
          );
        }

        // Handle missing images gracefully
        return (
          <div
            key={id}
            style={{
              ...baseStyles,
              backgroundColor: "#f8f9fa",
              border: "1px solid #e9ecef",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10 * scale + "px",
              color: "#6c757d",
            }}
          >
            <Image
              src={processedSrc}
              alt={`Element ${id}`}
              width={scaledPos.width}
              height={scaledPos.height}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              onError={(event) => {
                const target = event.currentTarget;
                target.style.display = "none";
                if (target.parentElement) {
                  target.parentElement.innerHTML = "IMG";
                }
              }}
            />
          </div>
        );

      default:
        return (
          <div
            key={id}
            style={{
              ...baseStyles,
              backgroundColor: "#f0f0f0",
              border: "1px dashed #ccc",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8 * scale + "px",
              color: "#666",
            }}
          >
            {type.toUpperCase()}
          </div>
        );
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div
        style={{
          position: "relative",
          width: scaledWidth,
          height: scaledHeight,
          backgroundColor: pageSettings.backgroundColor || "#ffffff",
          margin: "0 auto",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      >
        {sortedElements.map(([id, element]) => renderElement(id, element))}

        {/* Preview watermark */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-45deg)",
            fontSize: 24 * scale + "px",
            color: "rgba(0,0,0,0.05)",
            fontWeight: "bold",
            pointerEvents: "none",
            zIndex: 1000,
          }}
        >
          PREVIEW
        </div>
      </div>
    </Card>
  );
}
