/**
 * Certificate Debug Utility
 * Helps debug certificate rendering issues with images, fonts, and styling
 */

import {
  HybridCertificateRenderer,
  CertificateData,
  TemplateData,
  TemplateElement,
} from "./hybrid-certificate-renderer";
import fs from "fs/promises";
import path from "path";

export interface DebugInfo {
  templateData: TemplateData;
  processedElements: TemplateElement[];
  generatedHTML: string;
  imageInfo: Array<{
    originalPath: string;
    convertedPath: string;
    isBase64: boolean;
    error?: string;
  }>;
}

export class CertificateDebugger {
  private renderer: HybridCertificateRenderer;

  constructor(certificateData: CertificateData, baseUrl?: string) {
    this.renderer = new HybridCertificateRenderer(certificateData, baseUrl);
  }

  /**
   * Get detailed debug information about the certificate rendering
   */
  async getDebugInfo(): Promise<DebugInfo> {
    const debugInfo: DebugInfo = {
      templateData: {} as TemplateData,
      processedElements: [],
      generatedHTML: "",
      imageInfo: [],
    };

    try {
      // Get the template data using type assertion
      debugInfo.templateData = (
        this.renderer as unknown as { templateData: TemplateData }
      ).templateData;

      // Process elements manually to debug image conversion
      const elements =
        (this.renderer as unknown as { elements: TemplateElement[] })
          .elements || [];

      for (const element of elements) {
        if (element.type === "image") {
          const imageDebug = {
            originalPath: element.content,
            convertedPath: element.content,
            isBase64: false,
            error: undefined as string | undefined,
          };

          try {
            // Test image conversion
            const base64Content = await this.convertImageToBase64(
              element.content
            );
            imageDebug.convertedPath = base64Content;
            imageDebug.isBase64 = base64Content.startsWith("data:");
          } catch (error) {
            imageDebug.error =
              error instanceof Error ? error.message : "Unknown error";
          }

          debugInfo.imageInfo.push(imageDebug);
        }

        debugInfo.processedElements.push({
          ...element,
          type: element.type,
          content:
            element.type === "image" ? "IMAGE_CONTENT_HIDDEN" : element.content,
        });
      }

      // Generate HTML
      debugInfo.generatedHTML = await this.renderer.generateHTMLPreview();
    } catch (error) {
      console.error("Debug info generation failed:", error);
    }

    return debugInfo;
  }

  /**
   * Test image conversion (copy of the private method from HybridCertificateRenderer)
   */
  private async convertImageToBase64(imagePath: string): Promise<string> {
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
          imagePath.substring(1)
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
          const baseUrl =
            (this.renderer as unknown as { baseUrl: string }).baseUrl ||
            "http://localhost:3000";
          const fullUrl = `${baseUrl}${imagePath}`;
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
   * Save debug HTML to a file for inspection
   */
  async saveDebugHTML(
    filename: string = "certificate-debug.html"
  ): Promise<string> {
    try {
      const html = await this.renderer.generateHTMLPreview();
      const filePath = path.join(process.cwd(), filename);
      await fs.writeFile(filePath, html, "utf-8");
      return filePath;
    } catch (error) {
      throw new Error(
        `Failed to save debug HTML: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Test PDF generation
   */
  async testPDFGeneration(): Promise<{
    success: boolean;
    size: number;
    error?: string;
  }> {
    try {
      const pdfBuffer = await this.renderer.generatePDF();
      return {
        success: true,
        size: pdfBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test PNG generation
   */
  async testPNGGeneration(): Promise<{
    success: boolean;
    size: number;
    error?: string;
  }> {
    try {
      const pngBuffer = await this.renderer.generatePNG();
      return {
        success: true,
        size: pngBuffer.length,
      };
    } catch (error) {
      return {
        success: false,
        size: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
