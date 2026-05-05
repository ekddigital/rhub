/**
 * Canvas-based Certificate Renderer
 * Fallback for when Puppeteer fails in production environments
 * Note: This implementation requires the 'canvas' package to be installed
 */

export interface CanvasCertificateData {
  id: string;
  templateName: string;
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
  authorizingOfficial?: string;
  issueDate: Date;
  verificationUrl: string;
  qrCodeData?: string;
}

export class CanvasCertificateRenderer {
  private width: number = 800;
  private height: number = 600;

  constructor(private certificateData: CanvasCertificateData) {
    // Note: This renderer requires the 'canvas' package
    console.warn(
      "CanvasCertificateRenderer requires the canvas package to be installed"
    );
  }

  private registerFonts() {
    // Disabled font registration since canvas package is not installed
    console.warn("Font registration skipped - canvas package not available");
  }

  async generatePNG(): Promise<Buffer> {
    throw new Error(
      "Canvas-based certificate generation is not available. The canvas package is not installed. Please use the HTML fallback instead."
    );
  }

  async generatePDF(): Promise<Buffer> {
    throw new Error(
      "Canvas-based PDF generation is not implemented. Please use the HTML fallback instead."
    );
  }
}
