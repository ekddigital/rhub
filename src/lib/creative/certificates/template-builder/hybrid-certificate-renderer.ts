/**
 * Hybrid Certificate Renderer
 * Combines template data with actual website assets for pixel-perfect rendering
 */

import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import { getVerificationUrl } from "./url";
import { generateCertificateQRCode } from "@/lib/creative/certificates/html-export/qr-code-generator";
import { getCertificateConfig } from "@/lib/creative/certificates/template-builder/certificate-config";

export interface CertificateData {
  id: string;
  templateName: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  authorizingOfficial?: string; // Optional authorizing official field
  issueDate: Date;
  templateData: TemplateData;
  qrCodeData?: string; // QR code path or data URL
  verificationUrl?: string; // URL for certificate verification
  verificationId?: string; // Verification ID for the certificate
  [key: string]: unknown;
}

export interface TemplateData {
  elements: TemplateElement[];
  pageSettings: PageSettings;
  [key: string]: unknown;
}

export interface TemplateElement {
  id: string;
  type: "text" | "image" | "shape" | "qr";
  content: string;
  /** Optional group tag. Elements with group "signature" can be hidden for manual signing. */
  group?: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: string;
    fontFamily?: string;
    backgroundColor?: string;
    border?: string;
    borderRadius?: string;
    padding?: string;
    [key: string]: unknown;
  };
}

export interface PageSettings {
  width: number;
  height: number;
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  background?: {
    color?: string;
    border?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

// Certificate size presets
export const CERTIFICATE_PRESETS = {
  "landscape-a4": { width: 1122, height: 794 },
  "portrait-a4": { width: 794, height: 1122 },
  "standard-4-3": { width: 800, height: 600 },
  "wide-5-3": { width: 1000, height: 600 },
  square: { width: 600, height: 600 },
  banner: { width: 1200, height: 400 },
  "letter-landscape": { width: 1056, height: 816 },
  "letter-portrait": { width: 816, height: 1056 },
};

export class HybridCertificateRenderer {
  private certificate: CertificateData;
  private templateData: TemplateData;
  private elements: TemplateElement[];
  private pageSettings: PageSettings;
  private baseUrl: string;
  private outputFormat?: "pdf" | "png" | "preview";

  constructor(certificate: CertificateData, baseUrl?: string) {
    console.log("🏗️ HybridCertificateRenderer constructor:", {
      certificateId: certificate.id,
      hasQrCodeData: !!certificate.qrCodeData,
      qrCodeData: certificate.qrCodeData,
      hasVerificationUrl: !!certificate.verificationUrl,
      verificationUrl: certificate.verificationUrl,
      elementsCount: certificate.templateData?.elements?.length || 0,
    });

    this.certificate = certificate;
    this.templateData = certificate.templateData;
    this.elements = this.templateData?.elements || [];
    this.pageSettings =
      this.templateData?.pageSettings || CERTIFICATE_PRESETS["standard-4-3"];
    this.baseUrl =
      baseUrl || process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Ensure page settings have defaults
    this.pageSettings = {
      width: this.pageSettings.width || 800,
      height: this.pageSettings.height || 600,
      margin: this.pageSettings.margin || {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
      },
      background: this.pageSettings.background || {
        color: "#ffffff",
        border: "2px solid #2563eb",
      },
    };
  }

  /**
   * Generate QR code as base64 data URL with enhanced scannability using smart detection
   */
  private async generateQRCodeDataURL(url: string): Promise<string> {
    try {
      console.log(`Generating QR code for URL: ${url}`);
      return await generateCertificateQRCode(url); // Data URL for certificate verification links
    } catch (error) {
      console.warn(`Failed to generate QR code for URL: ${url}`, error);
      // Return a simple placeholder base64 image if QR generation fails
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    }
  }

  /**
   * Generate QR code as base64 data URL with smart localhost/production optimization
   * Automatically detects data type and uses maximum scale for localhost JSON data
   * @param data - The data to encode
   * @param format - Output format for optimization ('pdf', 'png', or 'preview')
   */
  private async generateQRCodeBase64(
    data: string,
    format: "pdf" | "png" | "preview" = "preview",
  ): Promise<string> {
    try {
      console.log("🔍 QR Code generation started:", {
        dataLength: data.length,
        dataPreview: data.substring(0, 100) + (data.length > 100 ? "..." : ""),
        format,
      });

      // Use smart QR code generation that automatically optimizes for localhost vs production
      const qrDataURL = await generateCertificateQRCode(data);

      console.log("✅ QR Code generated successfully:", {
        outputLength: qrDataURL.length,
        isDataURL: qrDataURL.startsWith("data:image/"),
        sizeKB: Math.round(qrDataURL.length / 1024),
        optimizedFor: format,
        smartDetection: "enabled",
      });

      return qrDataURL;
    } catch (error) {
      console.error("❌ QR Code generation failed:", error);
      throw error;
    }
  }

  /**
   * Convert images to base64 for embedding
   */
  private async imageToBase64(imagePath: string): Promise<string> {
    try {
      // Handle different types of image paths
      if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        // External URL - fetch and convert
        const response = await fetch(imagePath);
        if (!response.ok)
          throw new Error(`Failed to fetch image: ${imagePath}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get("content-type") || "image/png";
        return `data:${contentType};base64,${buffer.toString("base64")}`;
      } else if (imagePath.startsWith("/")) {
        // Absolute path from public directory
        const publicPath = path.join(
          process.cwd(),
          "public",
          imagePath.substring(1),
        );
        try {
          const buffer = await fs.readFile(publicPath);
          const ext = path.extname(imagePath).toLowerCase();
          const mimeType =
            ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : ext === ".png"
                ? "image/png"
                : ext === ".gif"
                  ? "image/gif"
                  : ext === ".svg"
                    ? "image/svg+xml"
                    : "image/png";
          return `data:${mimeType};base64,${buffer.toString("base64")}`;
        } catch {
          // If file doesn't exist locally, try to fetch from the website
          const fullUrl = `${this.baseUrl}${imagePath}`;
          const response = await fetch(fullUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType =
              response.headers.get("content-type") || "image/png";
            return `data:${contentType};base64,${buffer.toString("base64")}`;
          }
        }
      }

      // Return original path if conversion fails
      return imagePath;
    } catch (error) {
      console.warn(`Failed to convert image to base64: ${imagePath}`, error);
      return imagePath;
    }
  }

  /**
   * Process template elements and replace placeholders with actual data
   * Uses consistent ultra-scannable QR codes for all formats (DRY principle)
   */
  private async processElements(): Promise<TemplateElement[]> {
    const recipientName =
      `${this.certificate.recipientFirstName} ${this.certificate.recipientLastName}`.trim();
    const issueDate = new Date(this.certificate.issueDate).toLocaleDateString();
    const issuerName = this.certificate.authorizingOfficial || "Hetawk"; // Use provided authorizing official or default

    const processedElements: TemplateElement[] = [];

    for (const element of this.elements) {
      if (element.type === "text" && element.content) {
        let content = element.content;

        // Enhanced placeholder replacement with clean styling (no underlines)
        content = content
          // Double brace format (templates) - clean styling without underlines
          .replace(
            /\{\{recipientName\}\}/g,
            `<span style="font-weight: 600; color: inherit;">${recipientName}</span>`,
          )
          .replace(
            /\{\{certificateId\}\}/g,
            `<span style="font-weight: 600; color: inherit;">${this.certificate.id}</span>`,
          )
          .replace(
            /\{\{issueDate\}\}/g,
            `<span style="font-weight: 600; color: inherit;">${issueDate}</span>`,
          )
          .replace(
            /\{\{issuerName\}\}/g,
            `<span style="font-weight: 600; color: inherit;">${issuerName}</span>`,
          )

          // Single brace format - clean styling without underlines
          .replace(
            /\{recipientName\}/g,
            `<span style="font-weight: 600; color: inherit;">${recipientName}</span>`,
          )
          .replace(
            /\{certificateId\}/g,
            `<span style="font-weight: 600; color: inherit;">${this.certificate.id}</span>`,
          )
          .replace(
            /\{issueDate\}/g,
            `<span style="font-weight: 600; color: inherit;">${issueDate}</span>`,
          )
          .replace(
            /\{([^}]+)\}/g,
            `<span style="font-weight: 600; color: inherit;">$1</span>`,
          )

          // Handle specific name patterns
          .replace(
            /\{Enoch Kwateh Dongbo\}/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${recipientName}</span>`,
          )

          // Plain text replacements with styling
          .replace(
            /Sample Recipient/g,
            `<span style="border-bottom: 2px solid #1e40af; padding-bottom: 2px; font-weight: 600; color: #1e40af;">${recipientName}</span>`,
          )
          .replace(
            /System Administrator/g,
            `<span style="font-weight: 600; color: inherit;">${issuerName}</span>`,
          )

          // Date patterns - clean styling without underlines (for combined format)
          .replace(
            /Date: 6\/13\/2025/g,
            `Date: <span style="font-weight: 600; color: inherit;">${issueDate}</span>`,
          )
          .replace(
            /6\/13\/2025/g,
            `<span style="font-weight: 600; color: inherit;">${issueDate}</span>`,
          )

          // Certificate ID patterns - clean styling without underlines
          .replace(
            /FOM-\d{4}-[A-Z]{3}-\d{4}-[A-Z0-9]{2}/g,
            `<span style="font-weight: 600; color: inherit;">${this.certificate.id}</span>`,
          );

        // Handle security features placeholders separately
        if (content.includes("{{qrCode}}")) {
          console.log(
            `Found {{qrCode}} placeholder in text element: ${element.id}`,
          );

          // Use stored QR code data if available (for enhanced QR codes), otherwise generate from verification URL
          let qrCodeDataURL: string;

          if (this.certificate.qrCodeData) {
            console.log(
              `Using stored QR code data for text element, length: ${this.certificate.qrCodeData.length}`,
            );
            qrCodeDataURL = await this.generateQRCodeBase64(
              this.certificate.qrCodeData,
              this.outputFormat || "preview",
            );
          } else {
            // Fallback to verification URL
            const verificationUrl =
              this.certificate.verificationUrl ||
              getVerificationUrl(
                this.certificate.verificationId || this.certificate.id,
              );
            console.log(`Text QR verification URL: ${verificationUrl}`);
            qrCodeDataURL = await this.generateQRCodeBase64(
              verificationUrl,
              this.outputFormat || "preview",
            );
          }

          console.log(
            `Text QR code generated with data URL length: ${qrCodeDataURL.length}`,
          );
          content = content.replace(/\{\{qrCode\}\}/g, qrCodeDataURL);
        }

        content = content.replace(
          /\{\{verificationUrl\}\}/g,
          this.certificate.verificationUrl ||
            getVerificationUrl(
              this.certificate.verificationId || this.certificate.id,
            ),
        );

        content = content

          // Issuer patterns - clean styling to match date formatting (for combined format)
          .replace(
            /Authorized by: System Administrator/g,
            `Authorized by: <span style="font-weight: 600; color: inherit;">${issuerName}</span>`,
          )
          .replace(
            /Issued by: System Administrator/g,
            `Issued by: <span style="font-weight: 600; color: inherit;">${issuerName}</span>`,
          )
          .replace(
            /Baptized by: System Administrator/g,
            `Baptized by: <span style="font-weight: 600; color: inherit;">${issuerName}</span>`,
          )

          // Clean up any remaining empty braces
          .replace(/\{\s*\}/g, "")
          .replace(/\{\{[^}]*\}\}/g, "");

        processedElements.push({
          ...element,
          content,
        });
      } else if (element.type === "image") {
        // Handle QR code placeholders in image elements
        if (element.content === "{{qrCode}}") {
          console.log(
            `Found {{qrCode}} placeholder in image element: ${element.id}`,
          );

          // Use stored QR code data if available (for enhanced QR codes), otherwise generate from verification URL
          let qrCodeDataURL: string;

          if (this.certificate.qrCodeData) {
            console.log(
              `Using stored QR code data, length: ${this.certificate.qrCodeData.length}`,
            );
            console.log(
              `QR code data preview: ${this.certificate.qrCodeData.substring(
                0,
                100,
              )}...`,
            );
            qrCodeDataURL = await this.generateQRCodeBase64(
              this.certificate.qrCodeData,
              this.outputFormat || "preview",
            );
          } else {
            // Fallback to verification URL
            const verificationUrl =
              this.certificate.verificationUrl ||
              getVerificationUrl(
                this.certificate.verificationId || this.certificate.id,
              );
            console.log(`Image QR verification URL: ${verificationUrl}`);
            qrCodeDataURL = await this.generateQRCodeBase64(
              verificationUrl,
              this.outputFormat || "preview",
            );
          }

          console.log(
            `Image QR code generated with data URL length: ${qrCodeDataURL.length}`,
          );
          processedElements.push({
            ...element,
            content: qrCodeDataURL,
          });
        } else {
          // Convert regular image to base64 for embedding
          const base64Content = await this.imageToBase64(element.content);
          processedElements.push({
            ...element,
            content: base64Content,
          });
        }
      } else if (element.type === "qr") {
        // Handle QR code elements - use stored QR data or generate dynamically
        console.log(`Processing QR code element: ${element.id}`);

        let qrCodeDataURL: string;

        if (this.certificate.qrCodeData) {
          console.log(
            `Using stored QR code data for QR element, length: ${this.certificate.qrCodeData.length}`,
          );
          qrCodeDataURL = await this.generateQRCodeBase64(
            this.certificate.qrCodeData,
            this.outputFormat || "preview",
          );
        } else {
          // Fallback to verification URL
          const verificationUrl =
            this.certificate.verificationUrl ||
            getVerificationUrl(
              this.certificate.verificationId || this.certificate.id,
            );
          console.log(`QR verification URL: ${verificationUrl}`);
          qrCodeDataURL = await this.generateQRCodeBase64(
            verificationUrl,
            this.outputFormat || "preview",
          );
        }

        console.log(
          `QR code element converted to image with data URL length: ${qrCodeDataURL.length}`,
        );
        processedElements.push({
          ...element,
          type: "image", // Convert to image type for rendering
          content: qrCodeDataURL,
        });
      } else {
        processedElements.push(element);
      }
    }

    return processedElements;
  }

  /**
   * Smart font size adjustment that considers container dimensions
   */
  private smartFontSize(
    fontSize: string | number | undefined,
    containerWidth: number,
    containerHeight: number,
    textContent: string,
  ): string {
    if (!fontSize) return "16px";

    let baseFontSize: number;

    if (typeof fontSize === "number") {
      baseFontSize = fontSize;
    } else {
      const sizeStr = fontSize.toString();

      // Parse different font size units to get pixel value
      if (sizeStr.includes("px")) {
        baseFontSize = parseFloat(sizeStr);
      } else if (sizeStr.includes("em")) {
        baseFontSize = parseFloat(sizeStr) * 16;
      } else if (sizeStr.includes("rem")) {
        baseFontSize = parseFloat(sizeStr) * 16;
      } else if (sizeStr.includes("%")) {
        baseFontSize = (parseFloat(sizeStr) / 100) * 16;
      } else {
        // Named sizes
        const namedSizes: Record<string, number> = {
          "xx-small": 10,
          "x-small": 12,
          small: 14,
          medium: 16,
          large: 20,
          "x-large": 26,
          "xx-large": 32,
          larger: 20,
          smaller: 14,
        };
        baseFontSize = namedSizes[sizeStr.toLowerCase()] || 16;
      }
    }

    // Remove HTML tags to get clean text for measurement
    const cleanText = textContent.replace(/<[^>]*>/g, "");

    // For longer content text (like descriptions), be more conservative with scaling
    const isLongContent = cleanText.length > 100; // Consider text over 100 chars as long content

    // Estimate text width (rough approximation)
    const avgCharWidth = baseFontSize * 0.6; // Approximate character width
    const estimatedTextWidth = cleanText.length * avgCharWidth;

    // Calculate estimated lines needed at current font size
    const estimatedLines = Math.ceil(
      estimatedTextWidth / (containerWidth * 0.9),
    );
    const lineHeight = baseFontSize * 1.2; // Assuming 1.2 line height
    const estimatedTextHeight = estimatedLines * lineHeight;

    // For long content, prioritize readability over fitting
    if (isLongContent) {
      // Only reduce font size if it's drastically oversized
      if (estimatedTextHeight > containerHeight * 1.5) {
        const scaleFactor = (containerHeight * 1.3) / estimatedTextHeight; // More generous scaling
        baseFontSize = baseFontSize * Math.max(scaleFactor, 0.8); // Don't scale below 80% of original
      }
      // Don't enforce horizontal constraints for long content - let it wrap naturally
    } else {
      // For shorter content (titles, names, etc), use the original logic
      if (estimatedTextWidth > containerWidth * 0.9) {
        const scaleFactor = (containerWidth * 0.9) / estimatedTextWidth;
        baseFontSize = baseFontSize * scaleFactor;
      }

      // Ensure font size isn't too large for container height
      const maxFontSizeForHeight = containerHeight * 0.8;
      if (baseFontSize > maxFontSizeForHeight) {
        baseFontSize = maxFontSizeForHeight;
      }
    }

    // Ensure minimum readable size - higher minimum for long content
    const minSize = isLongContent ? 12 : 10;
    baseFontSize = Math.max(baseFontSize, minSize);

    // Apply very modest quality enhancement, less for long content
    const enhancement = isLongContent ? 1.01 : 1.02; // 1% for long content, 2% for short
    baseFontSize = baseFontSize * enhancement;

    return `${Math.round(baseFontSize)}px`;
  }

  /**
   * Convert style object to CSS string with smart font handling
   */
  private styleToCSS(
    style: Record<string, unknown> = {},
    containerWidth?: number,
    containerHeight?: number,
    textContent?: string,
  ): string {
    const cssRules: string[] = [];

    Object.entries(style).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      // Special handling for font-size with smart sizing
      if (
        key === "fontSize" &&
        containerWidth &&
        containerHeight &&
        textContent
      ) {
        const smartSize = this.smartFontSize(
          value as string,
          containerWidth,
          containerHeight,
          textContent,
        );
        cssRules.push(`font-size: ${smartSize}`);
        return;
      }

      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      cssRules.push(`${cssKey}: ${value}`);
    });

    return cssRules.join("; ");
  }

  /**
   * Generate enhanced HTML that matches the website styling exactly
   * Uses ultra-scannable QR codes for all formats (DRY principle)
   */
  private async generateHTML(): Promise<string> {
    const processedElements = await this.processElements();

    // Generate elements HTML with enhanced positioning and styling
    let elementsHtml = "";
    processedElements.forEach((element) => {
      const elementStyle = {
        position: "absolute",
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.position.width}px`,
        height: `${element.position.height}px`,
        // Copy all style properties from the element
        ...element.style,
        // Ensure proper display and overflow handling
        boxSizing: "border-box",
        overflow: "visible", // Changed from "hidden" to allow natural text wrapping
        wordWrap: "break-word",
      };

      if (element.type === "text") {
        // Check if this is long content text
        const cleanText = element.content.replace(/<[^>]*>/g, "");
        const isLongContent = cleanText.length > 100;

        // Enhanced text styling to match website exactly
        const textStyle = {
          ...elementStyle,
          display: "flex",
          alignItems: isLongContent ? "flex-start" : "center", // Top align for long content
          justifyContent:
            element.style?.textAlign === "center"
              ? "center"
              : element.style?.textAlign === "right"
                ? "flex-end"
                : "flex-start",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
          // Preserve all text-specific styles (font size handled separately)
          fontFamily: element.style?.fontFamily,
          fontWeight: element.style?.fontWeight,
          color: element.style?.color,
          textAlign: element.style?.textAlign,
          lineHeight: isLongContent
            ? element.style?.lineHeight || "1.4"
            : element.style?.lineHeight || "1.2", // Better line height for long content
          letterSpacing: element.style?.letterSpacing,
          textShadow: element.style?.textShadow,
          fontStyle: element.style?.fontStyle,
          // Preserve background and border styles
          backgroundColor: element.style?.backgroundColor,
          border: element.style?.border,
          borderRadius: element.style?.borderRadius,
          padding: element.style?.padding,
          margin: element.style?.margin,
          // Additional text rendering improvements
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        };

        // Use smart font sizing that considers container dimensions and content
        const smartFontSize = this.smartFontSize(
          element.style?.fontSize,
          element.position.width,
          element.position.height,
          element.content,
        );

        textStyle.fontSize = smartFontSize;

        const textCss = this.styleToCSS(
          textStyle,
          element.position.width,
          element.position.height,
          element.content,
        );
        elementsHtml += `<div style="${textCss}">${element.content}</div>`;
      } else if (element.type === "image") {
        // Enhanced image styling with special QR code enhancements
        const isQRCode = element.id?.includes("qr-code");

        const imageStyle = {
          ...elementStyle,
          objectFit: "contain",
          objectPosition: "center",
          // Preserve any borders or backgrounds
          backgroundColor: element.style?.backgroundColor,
          border: element.style?.border,
          borderRadius: element.style?.borderRadius,
          padding: element.style?.padding,
          margin: element.style?.margin,
          // Special QR code enhancements for better scanning
          ...(isQRCode && {
            filter: "contrast(1.2) brightness(0.95)", // Enhance contrast for better scanning
            imageRendering: "crisp-edges", // Ensure sharp edges for QR codes
            border: "2px solid #f8f9fa", // Light border for better separation
            borderRadius: "4px", // Slight rounding for modern look
            backgroundColor: "#ffffff", // White background for QR codes
            padding: "8px", // Padding around QR code for better scanning
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)", // Subtle shadow for depth
          }),
        };

        const imageCss = this.styleToCSS(imageStyle);
        elementsHtml += `<img src="${
          element.content
        }" style="${imageCss}" alt="${
          isQRCode ? "Certificate QR Code" : "Certificate element"
        }" crossorigin="anonymous" />`;
      } else if (element.type === "shape") {
        // Enhanced shape styling to match website exactly
        const shapeStyle = {
          ...elementStyle,
          // Ensure shape background and borders are preserved
          backgroundColor:
            element.style?.color || element.style?.backgroundColor,
          borderRadius: element.style?.borderRadius,
          border:
            element.style?.borderWidth && element.style?.borderStyle
              ? `${element.style.borderWidth} ${element.style.borderStyle} ${
                  element.style.borderColor || element.style.color || "#000"
                }`
              : element.style?.border,
          opacity: element.style?.opacity || 1,
          // Additional shape properties
          boxShadow: element.style?.boxShadow,
          transform: element.style?.transform,
        };

        const shapeCss = this.styleToCSS(shapeStyle);
        elementsHtml += `<div style="${shapeCss}"></div>`;
      } else if (element.type === "qr") {
        // QR code fallback (QR elements should be converted to images in processElements)
        console.warn(
          "QR element not converted to image - this shouldn't happen",
        );
        const qrStyle = {
          ...elementStyle,
          backgroundColor: "#f0f0f0",
          border: "1px solid #ccc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          color: "#666",
        };

        const qrCss = this.styleToCSS(qrStyle);
        elementsHtml += `<div style="${qrCss}">QR Code Unavailable</div>`;
      }
    });

    // Enhanced HTML with better CSS and exact website styling
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Certificate - ${this.certificate.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman:wght@400;600;700&family=Arial:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Roboto:wght@400;500;600;700&family=Open+Sans:wght@400;500;600;700&display=swap');
          
          * { 
            box-sizing: border-box; 
            margin: 0; 
            padding: 0; 
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Times New Roman', serif; 
            background: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            font-display: swap;
            text-rendering: optimizeLegibility;
          }
          
          /* Enhanced text rendering for better content display */
          .certificate-container div {
            hyphens: auto;
            -webkit-hyphens: auto;
            -ms-hyphens: auto;
          }
          
          /* Better handling for long text content */
          .certificate-container div:not(img) {
            overflow-wrap: break-word;
            word-break: break-word;
            text-overflow: clip;
          }
          
          .certificate-container { 
            position: relative; 
            width: ${this.pageSettings.width}px; 
            height: ${this.pageSettings.height}px; 
            background: ${this.pageSettings.background?.color || "#ffffff"};
            ${
              this.pageSettings.background?.border
                ? `border: ${this.pageSettings.background.border};`
                : ""
            }
            ${
              this.pageSettings.background?.borderColor
                ? `border-color: ${this.pageSettings.background.borderColor};`
                : ""
            }
            ${
              this.pageSettings.background?.borderWidth
                ? `border-width: ${this.pageSettings.background.borderWidth}px;`
                : ""
            }
            margin: 0;
            overflow: hidden;
            box-shadow: none;
            transform: scale(1);
            transform-origin: center;
            font-display: swap;
            text-rendering: optimizeLegibility;
          }
          
          .certificate-container * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          
          /* Enhanced text rendering for all text elements */
          .certificate-container div {
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            font-display: swap;
            /* Ensure text stays within bounds */
            box-sizing: border-box;
            overflow: hidden;
            text-overflow: ellipsis;
            word-wrap: break-word;
            hyphens: auto;
          }
          
          /* Prevent text from wrapping when it shouldn't */
          .certificate-container div[style*="white-space: nowrap"] {
            white-space: nowrap !important;
          }
          
          /* Handle long text gracefully */
          .certificate-container div[style*="font-size"] {
            line-height: 1.1;
            letter-spacing: -0.02em;
          }
          
          img {
            max-width: 100%;
            height: auto;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          /* Ensure all fonts are loaded */
          .certificate-container div,
          .certificate-container span {
            font-display: swap;
          }
          
          /* Enhanced QR Code styling for maximum scannability */
          img[alt*="QR"] {
            image-rendering: -webkit-optimize-contrast;
            image-rendering: crisp-edges;
            image-rendering: pixelated;
            filter: contrast(1.3) brightness(0.9);
            background: #ffffff !important;
            border: 3px solid #f8f9fa !important;
            border-radius: 6px !important;
            padding: 6px !important;
            box-shadow: 0 2px 12px rgba(0,0,0,0.15) !important;
            transition: none;
          }
          
          /* QR Code hover effect for better visibility */
          img[alt*="QR"]:hover {
            filter: contrast(1.4) brightness(0.85);
            box-shadow: 0 4px 16px rgba(0,0,0,0.2) !important;
          }
          
          @media print {
            body { 
              padding: 0; 
              background: white;
              display: block;
              min-height: auto;
            }
            .certificate-container {
              box-shadow: none;
              margin: 0;
              page-break-inside: avoid;
              transform: none;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          
          @page {
            size: ${this.pageSettings.width}px ${this.pageSettings.height}px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          ${elementsHtml}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate PDF using ultra-robust approach for maximum reliability
   */
  async generatePDF(): Promise<Buffer> {
    // Force regeneration of elements with PDF-optimized QR codes
    this.elements = this.templateData?.elements || [];

    const html = await this.generateHTMLWithFormat("pdf"); // Use PDF-optimized QR codes

    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      console.log(
        "🚀 Starting PDF generation with ultra-robust error handling...",
      );

      // Launch browser with optimized settings for stability
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--allow-running-insecure-content",
          "--force-color-profile=srgb",
          "--enable-font-antialiasing",
          "--disable-lcd-text",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-default-apps",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-background-networking",
          "--memory-pressure-off",
          "--max_old_space_size=4096",
        ],
        timeout: 45000,
        ignoreDefaultArgs: ["--disable-extensions"],
        handleSIGINT: false,
        handleSIGTERM: false,
        handleSIGHUP: false,
      });

      console.log("🌐 Browser launched");

      // Create page with enhanced stability settings
      page = await browser.newPage();
      console.log("📄 New page created");

      // Set longer timeout for all page operations
      page.setDefaultTimeout(60000);

      // Set user agent and configure page for stability
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );

      // Set high-resolution viewport for better quality
      await page.setViewport({
        width: this.pageSettings.width + 100,
        height: this.pageSettings.height + 100,
        deviceScaleFactor: 2, // High DPI
      });

      console.log("🖥️ Viewport configured");

      // Enhanced error handling and page lifecycle management
      await page.evaluateOnNewDocument(() => {
        // Prevent errors from breaking the page
        window.addEventListener("error", (e) => {
          console.warn("Page error caught:", e.error);
          e.preventDefault();
          return true;
        });
        window.addEventListener("unhandledrejection", (e) => {
          console.warn("Unhandled rejection caught:", e.reason);
          e.preventDefault();
          return true;
        });
      });

      // Set content with robust timeout and wait conditions
      await page.setContent(html, {
        waitUntil: ["load", "domcontentloaded", "networkidle0"],
        timeout: 30000,
      });

      console.log("📝 HTML content set");

      // Enhanced page readiness checks
      await page.waitForFunction(() => document.readyState === "complete", {
        timeout: 15000,
      });

      // Wait for fonts to be fully loaded
      try {
        await page.evaluate(() => {
          if ("fonts" in document) {
            return (
              document as unknown as { fonts: { ready: Promise<unknown> } }
            ).fonts.ready;
          }
          return Promise.resolve();
        });
        console.log("🔤 Fonts loaded");
      } catch (fontError) {
        console.warn("⚠️ Font loading check failed, continuing:", fontError);
      }

      // Add stability delay to ensure everything is ready
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Final page readiness verification
      let pageReady = false;
      try {
        const pageInfo = await page.evaluate(() => ({
          title: document.title,
          readyState: document.readyState,
          hasBody: !!document.body,
          bodyChildren: document.body?.children?.length || 0,
        }));
        pageReady = pageInfo.readyState === "complete" && pageInfo.hasBody;
        console.log(`📄 Page ready for PDF generation:`, pageInfo);
      } catch (readinessError) {
        console.warn("⚠️ Could not verify page readiness:", readinessError);
        // Continue anyway, but with extra caution
      }

      if (!pageReady) {
        console.warn("⚠️ Page readiness uncertain, proceeding with caution");
      }

      // Generate PDF with ultra-robust error handling
      console.log("🔄 Starting PDF generation...");
      let pdfBuffer: Buffer | null = null;

      // Attempt 1: Standard PDF generation
      try {
        // Double-check page context is still valid before PDF generation
        const contextCheck = await page.evaluate(() => ({
          title: document.title,
          readyState: document.readyState,
          location: document.location.href,
          bodyExists: !!document.body,
        }));
        console.log("📋 Context check before PDF:", contextCheck);

        // Generate PDF with optimized settings
        const pdf = await page.pdf({
          width: `${this.pageSettings.width}px`,
          height: `${this.pageSettings.height}px`,
          printBackground: true,
          margin: { top: 0, right: 0, bottom: 0, left: 0 },
          preferCSSPageSize: true,
          format: undefined, // Use custom width/height
          omitBackground: false,
          timeout: 45000, // Extended timeout
          displayHeaderFooter: false,
          landscape: false,
        });

        pdfBuffer = Buffer.from(pdf);
        console.log("✅ First PDF attempt successful");
      } catch (pdfError) {
        console.error("❌ First PDF attempt failed:", pdfError);

        // Attempt 2: Retry with minimal settings after page validation
        try {
          // Verify page is still accessible and wait a moment
          const pageInfo = await page.evaluate(() => ({
            title: document.title,
            readyState: document.readyState,
            hasBody: !!document.body,
            isConnected: document.isConnected,
          }));
          console.log("📄 Page context validation for retry:", pageInfo);

          if (!pageInfo.hasBody || !pageInfo.isConnected) {
            throw new Error("Page context is invalid for retry");
          }

          // Wait a moment for any pending operations
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Retry with minimal PDF settings
          console.log("🔄 Retrying PDF generation with minimal settings...");
          const retryPdf = await page.pdf({
            width: `${this.pageSettings.width}px`,
            height: `${this.pageSettings.height}px`,
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
            timeout: 60000, // Very extended timeout for retry
          });

          pdfBuffer = Buffer.from(retryPdf);
          console.log("✅ Retry PDF attempt successful");
        } catch (retryError) {
          console.error("❌ Retry PDF attempt also failed:", retryError);

          // Attempt 3: Last resort - fallback to PNG conversion
          console.log("🔄 Falling back to PNG generation as last resort...");
          try {
            // Check if page is still usable for PNG
            await page.evaluate(() => document.readyState);

            const pngBuffer = await this.generatePNGFallback(page);
            console.log(
              "✅ PNG fallback successful, returning PNG as PDF alternative",
            );
            return pngBuffer;
          } catch (pngError) {
            console.error("❌ PNG fallback also failed:", pngError);
            const combinedError = `PDF generation completely failed. Original error: ${
              pdfError instanceof Error ? pdfError.message : "Unknown error"
            }. Retry error: ${
              retryError instanceof Error ? retryError.message : "Unknown error"
            }. PNG fallback error: ${
              pngError instanceof Error ? pngError.message : "Unknown error"
            }`;
            throw new Error(combinedError);
          }
        }
      }

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error("PDF generation returned empty buffer");
      }

      console.log(
        `✅ PDF generated successfully, size: ${pdfBuffer.length} bytes`,
      );

      // Validate PDF signature
      const signature = pdfBuffer.subarray(0, 4).toString();
      if (signature !== "%PDF") {
        console.warn(
          `⚠️ Generated file signature is '${signature}', expected '%PDF', but returning buffer anyway`,
        );
      }

      return pdfBuffer;
    } catch (error) {
      console.error("❌ PDF generation error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      throw new Error(`PDF generation failed: ${errorMessage}`);
    } finally {
      // Ultra-robust cleanup with proper error handling
      if (page && !page.isClosed()) {
        try {
          await page.close();
          console.log("📄 Page closed successfully");
        } catch (pageCloseError) {
          console.warn("⚠️ Page close warning:", pageCloseError);
        }
      }

      if (browser && browser.isConnected()) {
        try {
          // Close all remaining pages first
          const pages = await browser.pages();
          await Promise.all(
            pages.map(async (p: Page) => {
              if (!p.isClosed()) {
                try {
                  await p.close();
                } catch (e) {
                  console.warn("⚠️ Error closing page:", e);
                }
              }
            }),
          );

          // Then close the browser
          await browser.close();
          console.log("🔒 Browser closed successfully");
        } catch (browserCloseError) {
          console.warn("⚠️ Browser close warning:", browserCloseError);

          // Force disconnect as last resort
          try {
            await browser.disconnect();
            console.log("🔌 Browser disconnected forcefully");
          } catch (disconnectError) {
            console.warn("⚠️ Force disconnect warning:", disconnectError);
          }
        }
      }
    }
  }

  /**
   * PNG fallback method for when PDF generation fails
   */
  private async generatePNGFallback(page: Page): Promise<Buffer> {
    console.log("📸 Generating PNG as PDF fallback...");

    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: this.pageSettings.width,
        height: this.pageSettings.height,
      },
      omitBackground: false,
    });

    return Buffer.from(screenshot);
  }

  /**
   * Generate PNG using hybrid approach with format-optimized QR codes
   * Enhanced for production environments
   */
  async generatePNG(): Promise<Buffer> {
    // Force regeneration of elements with PNG-optimized QR codes
    this.elements = this.templateData?.elements || [];

    const html = await this.generateHTMLWithFormat("png"); // Use PNG-optimized QR codes

    // Production-ready Puppeteer configuration
    const config = getCertificateConfig();

    // Check if certificate generation is disabled
    if (config.disabled) {
      throw new Error(
        "Certificate generation is disabled in this environment. Please use the HTML fallback.",
      );
    }

    let launchOptions: Record<string, unknown> = {
      headless: true,
      args: config.puppeteerArgs,
      timeout: config.timeout,
      ignoreDefaultArgs: ["--disable-extensions"],
    };

    // Add executable path if available, otherwise use Puppeteer's bundled Chromium
    if (config.chromeExecutable) {
      launchOptions.executablePath = config.chromeExecutable;
      console.log(`🚀 Using Chrome executable: ${config.chromeExecutable}`);
    } else {
      console.log("🚀 Using Puppeteer's bundled Chromium");
      // Use more conservative settings for bundled Chromium
      launchOptions.args = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ];
    }

    let browser;
    try {
      console.log("🔄 Launching browser for PNG generation...");
      browser = await puppeteer.launch(launchOptions);
      console.log("✅ Browser launched successfully");
    } catch (launchError) {
      console.error("❌ Browser launch failed:", launchError);

      // Try fallback with minimal args
      console.log("🔄 Trying fallback browser launch...");
      try {
        launchOptions = {
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          timeout: 30000,
        };
        browser = await puppeteer.launch(launchOptions);
        console.log("✅ Fallback browser launched successfully");
      } catch (fallbackError) {
        console.error("❌ Fallback browser launch failed:", fallbackError);
        throw new Error(
          `Browser launch failed: ${
            launchError instanceof Error
              ? launchError.message
              : String(launchError)
          }. Fallback also failed: ${
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError)
          }`,
        );
      }
    }

    try {
      const page = await browser.newPage();
      console.log("📄 New page created");

      // Set very high-resolution viewport for crisp PNG rendering
      await page.setViewport({
        width: this.pageSettings.width + 100,
        height: this.pageSettings.height + 100,
        deviceScaleFactor: Math.min(config.viewport.deviceScaleFactor * 1.5, 3), // Cap at 3 to prevent memory issues
      });
      console.log("🖥️ Viewport set");

      // Set content and wait for all resources to load with increased timeout
      await page.setContent(html, {
        waitUntil: ["networkidle0", "domcontentloaded"],
        timeout: config.timeout,
      });
      console.log("📝 Content set");

      // Ensure fonts are fully loaded
      await page.evaluateOnNewDocument(() => {
        if ("fonts" in document) {
          (
            document as unknown as { fonts: { ready: Promise<unknown> } }
          ).fonts.ready.then(() => {
            console.log("All fonts loaded");
          });
        }
      });

      // Wait for images to load
      console.log("⏳ Waiting for images to load...");
      await page.evaluate(() => {
        return Promise.all(
          Array.from(document.images, (img) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve); // Continue even if image fails
              setTimeout(resolve, 2000); // Timeout after 2 seconds
            });
          }),
        );
      });
      console.log("🖼️ Images loaded");

      // Wait for fonts to load and render
      await page.evaluate(() => {
        if ("fonts" in document) {
          return (document as unknown as { fonts: { ready: Promise<unknown> } })
            .fonts.ready;
        }
        return Promise.resolve();
      });

      // Add extra delay to ensure fonts and styles are fully loaded
      console.log("⏳ Final render delay...");
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000)), // Reduced from 4000ms to 2000ms
      );

      // Take high-quality screenshot of the certificate container
      console.log("📸 Taking screenshot...");
      const element = await page.$(".certificate-container");
      if (!element) {
        throw new Error("Certificate container not found");
      }

      const screenshot = await element.screenshot({
        type: "png",
        omitBackground: false,
        captureBeyondViewport: false,
        optimizeForSpeed: false,
        clip: undefined, // Use element's natural bounds
      });

      console.log(
        `✅ PNG generated successfully, size: ${screenshot.length} bytes`,
      );
      return screenshot as Buffer;
    } catch (pageError) {
      console.error("❌ Page operation failed:", pageError);
      throw pageError;
    } finally {
      if (browser) {
        await browser.close();
        console.log("🔒 Browser closed");
      }
    }
  }

  /**
   * Generate HTML content with format-specific QR code optimization
   * @param format - Output format for QR code optimization
   */
  async generateHTMLWithFormat(
    format: "pdf" | "png" | "preview" = "preview",
  ): Promise<string> {
    // Temporarily store the format for use in QR code generation
    this.outputFormat = format;
    const html = await this.generateHTML();
    // Reset the format
    this.outputFormat = undefined;
    return html;
  }

  /**
   * Generate HTML content for preview (same as used for PDF/PNG generation)
   */
  async generateHTMLPreview(): Promise<string> {
    return await this.generateHTMLWithFormat("preview"); // Use preview-optimized QR codes
  }
}
