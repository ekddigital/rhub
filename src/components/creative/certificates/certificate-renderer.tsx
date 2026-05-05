"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/creative/ui/button";
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Copy } from "lucide-react";
import { generateCertificateQRCode } from "@/lib/creative/certificates/html-export/qr-code-generator";
import { getVerificationUrl } from "@/lib/creative/certificates/source-url";
import { cn } from "@/lib/utils";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface CertificateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr-code" | "rectangle" | "qr";
  content: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: React.CSSProperties;
}

interface TemplateData {
  elements: CertificateElement[] | Record<string, CertificateElement>;
  pageSettings: {
    width: number;
    height: number;
    orientation?: string;
    backgroundColor?: string;
    background?: {
      color?: string;
      image?: string;
    };
  };
}

interface Certificate {
  id: string;
  certificateId: string;
  verificationId: string;
  recipientName: string;
  recipientEmail: string;
  issueDate: string;
  expiryDate?: string;
  status: string;
  qrCodeUrl?: string;
  metadata?: Record<string, unknown>;
  template: {
    name: string;
    type: string;
    templateData: TemplateData;
  };
  organization: {
    name: string;
  };
}

interface CertificateRendererProps {
  certificate: Certificate;
  template: TemplateData;
  showControls?: boolean;
  enableZoom?: boolean;
  className?: string;
  onDownload?: (format: "png" | "pdf") => void;
}

export function CertificateRenderer({
  certificate,
  template,
  showControls = true,
  enableZoom = true,
  className,
  onDownload,
}: CertificateRendererProps) {
  const [zoom, setZoom] = React.useState(1);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>("");
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const certificateRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Generate verification URL and QR code
  const verificationUrl = React.useMemo(() => {
    return getVerificationUrl(certificate.verificationId);
  }, [certificate.verificationId]);

  // Generate QR Code
  React.useEffect(() => {
    const generateQRCode = async () => {
      try {
        if (certificate.qrCodeUrl) {
          setQrCodeDataUrl(certificate.qrCodeUrl);
        } else {
          const qrDataUrl = await generateCertificateQRCode(verificationUrl);
          setQrCodeDataUrl(qrDataUrl);
        }
      } catch (error) {
        console.error("Error generating QR code:", error);
        // Fallback QR code
        const fallbackQr =
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y0ZjRmNCIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0iY2VudHJhbCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPlFSIENvZGU8L3RleHQ+PC9zdmc+";
        setQrCodeDataUrl(fallbackQr);
      }
    };

    generateQRCode();
  }, [verificationUrl, certificate.qrCodeUrl]);

  // Calculate best fit zoom on mount
  React.useEffect(() => {
    if (containerRef.current && template.pageSettings) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth - 32; // Account for padding
      const containerHeight = container.clientHeight - 100; // Account for controls

      const scaleX = containerWidth / template.pageSettings.width;
      const scaleY = containerHeight / template.pageSettings.height;
      const bestFitZoom = Math.min(scaleX, scaleY, 1.5); // Max zoom of 1.5 initially

      setZoom(Math.max(0.3, bestFitZoom));
    }
  }, [template.pageSettings]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Download functions
  const downloadAsPNG = async () => {
    if (!certificateRef.current || !onDownload) return;

    setIsDownloading(true);
    try {
      certificateRef.current.classList.add("html2canvas-safe");

      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: template.pageSettings.background?.color || "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      certificateRef.current.classList.remove("html2canvas-safe");

      const link = document.createElement("a");
      link.download = `${certificate.certificateId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      onDownload("png");
    } catch (error) {
      console.error("Error downloading PNG:", error);
      certificateRef.current?.classList.remove("html2canvas-safe");
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!certificateRef.current || !onDownload) return;

    setIsDownloading(true);
    try {
      certificateRef.current.classList.add("html2canvas-safe");

      const canvas = await html2canvas(certificateRef.current, {
        backgroundColor: template.pageSettings.background?.color || "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      certificateRef.current.classList.remove("html2canvas-safe");

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation:
          template.pageSettings.width > template.pageSettings.height
            ? "landscape"
            : "portrait",
        unit: "px",
        format: [template.pageSettings.width, template.pageSettings.height],
      });

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        template.pageSettings.width,
        template.pageSettings.height
      );
      pdf.save(`${certificate.certificateId}.pdf`);

      onDownload("pdf");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      certificateRef.current?.classList.remove("html2canvas-safe");
    } finally {
      setIsDownloading(false);
    }
  };

  // Replace template variables with actual certificate data
  const replaceVariables = (content: string): string => {
    const metadata = certificate.metadata || {};

    return (
      content
        // Basic certificate data
        .replace(
          /\{\{?recipientName\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${certificate.recipientName}</span>`
        )
        .replace(
          /\{\{?issueDate\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${new Date(
            certificate.issueDate
          ).toLocaleDateString()}</span>`
        )
        .replace(
          /\{\{?certificateId\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${certificate.certificateId}</span>`
        )
        .replace(
          /\{\{?verificationUrl\}?\}/g,
          `<span style="color: #0066cc; text-decoration: underline;">${verificationUrl}</span>`
        )
        .replace(
          /\{\{?organizationName\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${certificate.organization.name}</span>`
        )

        // Metadata fields
        .replace(
          /\{\{?issuerName\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.issuerName || "Certificate Authority"
          }</span>`
        )
        .replace(
          /\{\{?position\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.position || "Position"
          }</span>`
        )
        .replace(
          /\{\{?gender\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.gender === "Male"
              ? "his"
              : metadata.gender === "Female"
              ? "her"
              : "his/her"
          }</span>`
        )
        .replace(
          /\{\{?pastorName\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.pastorName || "Pastor"
          }</span>`
        )
        .replace(
          /\{\{?serviceYears\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.serviceYears || "1"
          }</span>`
        )
        .replace(
          /\{\{?volunteerHours\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.volunteerHours || "0"
          }</span>`
        )
        .replace(
          /\{\{?missionLocation\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.missionLocation || "Location"
          }</span>`
        )
        .replace(
          /\{\{?achievementArea\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.achievementArea || "Achievement"
          }</span>`
        )
        .replace(
          /\{\{?baptismDate\}?\}/g,
          `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${
            metadata.baptismDate ||
            new Date(certificate.issueDate).toLocaleDateString()
          }</span>`
        )

        // Clean up any remaining empty braces
        .replace(/\{\s*\}/g, "")
        .replace(/\{[^}]*\}/g, (match) => {
          const content = match.slice(1, -1).trim();
          return content
            ? `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 1px;">${content}</span>`
            : "";
        })
    );
  };

  // Replace image variables
  const replaceImageVariables = (content: string) => {
    // If content contains variable placeholders, replace them
    const result = content
      .replace(/\{\{?qrCode\}?\}/g, qrCodeDataUrl || "")
      .replace(/\{\{?qrCodeData\}?\}/g, qrCodeDataUrl || "")
      .replace(/\{\{?pastorSignature\}?\}/g, "/pastor_Joe_signaturepng.png");

    // If the result is empty or still contains unreplaced variables, provide fallback
    if (
      !result ||
      result.includes("{{") ||
      result.includes("qrCode") ||
      !isValidImageUrl(result)
    ) {
      // For QR code elements, use our generated QR code
      if (content.includes("qr") || content.includes("QR")) {
        return qrCodeDataUrl || "/placeholder-qr.svg";
      }
      // For other images, use a placeholder
      return "/placeholder-image.svg";
    }

    return result;
  };

  // Helper function to validate image URLs
  const isValidImageUrl = (url: string): boolean => {
    if (!url) return false;
    // Check if it's a data URL or a valid path
    return (
      url.startsWith("data:") || url.startsWith("/") || url.startsWith("http")
    );
  };

  // Normalize elements array
  const elements = React.useMemo(() => {
    if (!template.elements) return [];
    if (Array.isArray(template.elements)) return template.elements;
    return Object.values(template.elements);
  }, [template.elements]);

  const certificateStyle: React.CSSProperties = {
    width: `${template.pageSettings.width * zoom}px`,
    height: `${template.pageSettings.height * zoom}px`,
    backgroundColor:
      template.pageSettings.background?.color ||
      template.pageSettings.backgroundColor ||
      "#ffffff",
    backgroundImage: template.pageSettings.background?.image
      ? `url(${template.pageSettings.background.image})`
      : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden",
        isFullscreen && "fixed inset-0 z-50 bg-gray-900",
        className
      )}
    >
      {/* Controls */}
      {showControls && (
        <div
          className={cn(
            "flex items-center justify-between p-4 bg-white/95 backdrop-blur-sm border-b border-gray-200",
            isFullscreen && "bg-gray-800/95 border-gray-700"
          )}
        >
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "font-semibold",
                isFullscreen ? "text-white" : "text-gray-900"
              )}
            >
              {certificate.template.name}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                navigator.clipboard.writeText(certificate.certificateId)
              }
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {enableZoom && (
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.max(0.3, zoom - 0.1))}
                  className="h-6 w-6 p-0"
                  disabled={zoom <= 0.3}
                >
                  <ZoomOut className="h-3 w-3" />
                </Button>
                <span className="text-xs font-medium px-2 min-w-[50px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="h-6 w-6 p-0"
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="h-3 w-3" />
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setZoom(1)}
              className="text-xs h-6"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-6 w-6 p-0"
            >
              <Maximize2 className="h-3 w-3" />
            </Button>

            {onDownload && (
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAsPNG}
                  disabled={isDownloading}
                  className="text-xs h-6"
                >
                  PNG
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAsPDF}
                  disabled={isDownloading}
                  className="text-xs h-6"
                >
                  PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificate Display Area */}
      <div
        className={cn(
          "overflow-auto",
          isFullscreen ? "h-[calc(100vh-60px)]" : "h-96"
        )}
      >
        <div className="min-h-full flex items-center justify-center p-8">
          <div className="relative">
            {/* Certificate Shadow */}
            <div
              className="absolute top-2 left-2 bg-black/20 rounded-lg blur-sm"
              style={certificateStyle}
            />

            {/* Certificate Container */}
            <div
              ref={certificateRef}
              data-html2canvas-safe="true"
              className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-gray-300"
              style={certificateStyle}
            >
              {/* Certificate Elements */}
              {elements.map((element, index) => {
                const normalizedFontSize =
                  typeof element.style.fontSize === "number"
                    ? element.style.fontSize * zoom
                    : undefined;

                const elementStyle: React.CSSProperties = {
                  position: "absolute",
                  left: `${element.position.x * zoom}px`,
                  top: `${element.position.y * zoom}px`,
                  width: `${element.position.width * zoom}px`,
                  height: `${element.position.height * zoom}px`,
                  fontSize:
                    normalizedFontSize !== undefined
                      ? `${normalizedFontSize}px`
                      : undefined,
                  fontFamily: element.style.fontFamily || "serif",
                  fontWeight: element.style.fontWeight || "normal",
                  fontStyle: element.style.fontStyle || "normal",
                  color: element.style.color || "#000000",
                  textAlign: element.style.textAlign || "left",
                  letterSpacing: element.style.letterSpacing || "normal",
                  lineHeight: element.style.lineHeight || "1.2",
                  backgroundColor:
                    element.type === "shape"
                      ? element.style.color
                      : element.style.backgroundColor,
                  borderRadius: element.style.borderRadius || undefined,
                  border: element.style.border || undefined,
                  opacity: element.style.opacity || 1,
                  textDecoration: element.style.textDecoration || "none",
                  textShadow: element.style.textShadow || undefined,
                  padding: element.style.padding || undefined,
                  filter: element.style.filter || undefined,
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    element.style.textAlign === "center"
                      ? "center"
                      : element.style.textAlign === "right"
                      ? "flex-end"
                      : "flex-start",
                  overflow: "hidden",
                };

                if (element.type === "text") {
                  return (
                    <div
                      key={element.id || index}
                      style={elementStyle}
                      dangerouslySetInnerHTML={{
                        __html: replaceVariables(element.content),
                      }}
                    />
                  );
                }

                if (
                  element.type === "image" ||
                  element.type === "qr-code" ||
                  element.type === "qr"
                ) {
                  const imageSrc = replaceImageVariables(element.content);

                  // Only render if we have a valid image source
                  if (!isValidImageUrl(imageSrc)) {
                    console.warn(
                      `Invalid image source: ${imageSrc} from content: ${element.content}`
                    );
                    return null;
                  }

                  return (
                    <div key={element.id || index} style={elementStyle}>
                      <Image
                        src={imageSrc}
                        alt="Certificate Image"
                        width={element.position.width * zoom}
                        height={element.position.height * zoom}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: element.style.objectFit || "contain",
                          borderRadius: element.style.borderRadius || "0px",
                        }}
                        onError={(e) => {
                          console.error(`Failed to load image: ${imageSrc}`);
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                        }}
                      />
                    </div>
                  );
                }

                if (element.type === "shape" || element.type === "rectangle") {
                  return <div key={element.id || index} style={elementStyle} />;
                }

                return null;
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      {showControls && (
        <div
          className={cn(
            "border-t border-gray-200 p-2",
            isFullscreen ? "bg-gray-800/95 border-gray-700" : "bg-white/95"
          )}
        >
          <div className="flex items-center justify-center gap-6 text-xs">
            <span className={isFullscreen ? "text-gray-300" : "text-gray-600"}>
              <strong>ID:</strong> {certificate.certificateId}
            </span>
            <span className={isFullscreen ? "text-gray-300" : "text-gray-600"}>
              <strong>Size:</strong> {template.pageSettings.width}×
              {template.pageSettings.height}px
            </span>
            <span className={isFullscreen ? "text-gray-300" : "text-gray-600"}>
              <strong>Elements:</strong> {elements.length}
            </span>
            <span className={isFullscreen ? "text-gray-300" : "text-gray-600"}>
              <strong>Status:</strong> {certificate.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
