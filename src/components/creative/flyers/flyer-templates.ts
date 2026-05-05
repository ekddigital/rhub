import type { FlyerTemplateData } from "./flyer-preview";
export type { FlyerTemplateData } from "./flyer-preview";

export type FlyerTextBlock = NonNullable<
  FlyerTemplateData["content"]["additionalTextBlocks"]
>[number];

export type CustomImage = NonNullable<
  NonNullable<FlyerTemplateData["graphics"]>["customImages"]
>[number];

// Modern Event Flyer Template
export const modernEventTemplate: FlyerTemplateData = {
  id: "modern-event",
  name: "Modern Event Flyer",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#0f172a",
    overlayColor: "rgba(15, 23, 42, 0.85)",
    overlayOpacity: 0.85,
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-center",
    logoSize: 70,
    companyName: "EKD Digital",
    companyNameSize: 18,
    companyNameColor: "#f59e0b",
  },
  content: {
    headline: {
      text: "TECH CONFERENCE 2025",
      fontSize: 52,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      position: { x: 50, y: 200 },
      align: "center",
    },
    subheadline: {
      text: "Innovation • Networking • Growth",
      fontSize: 20,
      fontFamily: "Arial, sans-serif",
      color: "#f59e0b",
      position: { x: 50, y: 270 },
      align: "center",
    },
    body: {
      text: "Join us for an unforgettable experience featuring industry leaders, cutting-edge technology, and networking opportunities.",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      color: "#cbd5e1",
      position: { x: 60, y: 350 },
      align: "center",
    },
    callToAction: {
      text: "REGISTER NOW",
      fontSize: 20,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      backgroundColor: "#f59e0b",
      position: { x: 175, y: 500 },
      width: 250,
      height: 60,
    },
    contactInfo: {
      email: "contact@ekddigital.com",
      phone: "+1 (555) 123-4567",
      website: "www.ekddigital.com",
      fontSize: 13,
      color: "#94a3b8",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "circle",
        color: "rgba(245, 158, 11, 0.1)",
        position: { x: -100, y: -100 },
        size: { width: 450, height: 450 },
      },
      {
        type: "circle",
        color: "rgba(245, 158, 11, 0.05)",
        position: { x: 400, y: 700 },
        size: { width: 350, height: 350 },
      },
    ],
  },
};

// Vibrant Promotion Template
export const vibrantPromotionTemplate: FlyerTemplateData = {
  id: "vibrant-promotion",
  name: "Vibrant Promotion Flyer",
  type: "promotion",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#fef3c7",
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-left",
    logoSize: 70,
    companyName: "EKD Digital",
    companyNameSize: 20,
    companyNameColor: "#92400e",
  },
  content: {
    headline: {
      text: "HUGE SALE!",
      fontSize: 72,
      fontFamily: "Arial, sans-serif",
      color: "#dc2626",
      position: { x: 50, y: 200 },
      align: "center",
    },
    subheadline: {
      text: "Up to 50% OFF",
      fontSize: 38,
      fontFamily: "Arial, sans-serif",
      color: "#ea580c",
      position: { x: 50, y: 300 },
      align: "center",
    },
    body: {
      text: "Don't miss our biggest sale of the year! Premium services at unbeatable prices.",
      fontSize: 19,
      fontFamily: "Arial, sans-serif",
      color: "#78350f",
      position: { x: 60, y: 420 },
      align: "center",
    },
    callToAction: {
      text: "SHOP NOW",
      fontSize: 24,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      backgroundColor: "#dc2626",
      position: { x: 175, y: 570 },
      width: 250,
      height: 70,
    },
    contactInfo: {
      website: "www.ekddigital.com",
      phone: "+1 (555) 123-4567",
      fontSize: 14,
      color: "#92400e",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "circle",
        color: "#fbbf24",
        position: { x: 450, y: 50 },
        size: { width: 150, height: 150 },
      },
      {
        type: "rectangle",
        color: "#f59e0b",
        position: { x: 0, y: 380 },
        size: { width: 30, height: 200 },
      },
      {
        type: "rectangle",
        color: "#f59e0b",
        position: { x: 570, y: 500 },
        size: { width: 30, height: 250 },
      },
    ],
  },
};

// Elegant Service Template
export const elegantServiceTemplate: FlyerTemplateData = {
  id: "elegant-service",
  name: "Elegant Service Flyer",
  type: "service",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#ffffff",
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-center",
    logoSize: 70,
    companyName: "EKD Digital",
    companyNameSize: 18,
    companyNameColor: "#92400e",
  },
  content: {
    headline: {
      text: "Transform Your Business",
      fontSize: 42,
      fontFamily: "Georgia, serif",
      color: "#1e293b",
      position: { x: 50, y: 210 },
      align: "center",
    },
    subheadline: {
      text: "Premium Digital Solutions",
      fontSize: 22,
      fontFamily: "Georgia, serif",
      color: "#92400e",
      position: { x: 50, y: 275 },
      align: "center",
    },
    body: {
      text: "We deliver cutting-edge technology solutions tailored to your needs. From web development to cloud infrastructure.",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      color: "#475569",
      position: { x: 60, y: 360 },
      align: "center",
    },
    callToAction: {
      text: "GET STARTED",
      fontSize: 19,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      backgroundColor: "#92400e",
      position: { x: 175, y: 500 },
      width: 250,
      height: 58,
    },
    contactInfo: {
      email: "contact@ekddigital.com",
      phone: "+1 (555) 123-4567",
      website: "www.ekddigital.com",
      address: "123 Tech Street, Innovation City",
      fontSize: 13,
      color: "#64748b",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#fef3c7",
        position: { x: 0, y: 0 },
        size: { width: 600, height: 180 },
      },
      {
        type: "rectangle",
        color: "#92400e",
        position: { x: 50, y: 335 },
        size: { width: 500, height: 3 },
      },
    ],
  },
};

// Bold Announcement Template
export const boldAnnouncementTemplate: FlyerTemplateData = {
  id: "bold-announcement",
  name: "Bold Announcement Flyer",
  type: "announcement",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#7c2d12",
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-left",
    logoSize: 65,
    companyName: "EKD Digital",
    companyNameSize: 18,
    companyNameColor: "#fef3c7",
  },
  content: {
    headline: {
      text: "BIG NEWS!",
      fontSize: 70,
      fontFamily: "Arial, sans-serif",
      color: "#fef3c7",
      position: { x: 50, y: 230 },
      align: "center",
    },
    subheadline: {
      text: "We're Launching Something Amazing",
      fontSize: 30,
      fontFamily: "Arial, sans-serif",
      color: "#fed7aa",
      position: { x: 50, y: 330 },
      align: "center",
    },
    body: {
      text: "Stay tuned for our biggest announcement yet. This will revolutionize the way you do business.",
      fontSize: 19,
      fontFamily: "Arial, sans-serif",
      color: "#fef3c7",
      position: { x: 60, y: 450 },
      align: "center",
    },
    callToAction: {
      text: "LEARN MORE",
      fontSize: 21,
      fontFamily: "Arial, sans-serif",
      color: "#7c2d12",
      backgroundColor: "#fef3c7",
      position: { x: 175, y: 600 },
      width: 250,
      height: 62,
    },
  },
  graphics: {
    shapes: [
      {
        type: "circle",
        color: "rgba(254, 243, 199, 0.1)",
        position: { x: 450, y: -150 },
        size: { width: 500, height: 500 },
      },
      {
        type: "circle",
        color: "rgba(254, 243, 199, 0.05)",
        position: { x: -200, y: 500 },
        size: { width: 450, height: 450 },
      },
    ],
  },
};

// Minimal Product Template
export const minimalProductTemplate: FlyerTemplateData = {
  id: "minimal-product",
  name: "Minimal Product Flyer",
  type: "product",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#f8fafc",
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-left",
    logoSize: 52,
    companyName: "EKD Digital",
    companyNameSize: 17,
    companyNameColor: "#1e293b",
  },
  content: {
    headline: {
      text: "Introducing Our Latest Solution",
      fontSize: 42,
      fontFamily: "Arial, sans-serif",
      color: "#0f172a",
      position: { x: 50, y: 220 },
      align: "left",
    },
    body: {
      text: "Designed with simplicity and power in mind. Our new product delivers exceptional results without complexity.",
      fontSize: 17,
      fontFamily: "Arial, sans-serif",
      color: "#475569",
      position: { x: 50, y: 370 },
      align: "left",
    },
    callToAction: {
      text: "EXPLORE NOW",
      fontSize: 19,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      backgroundColor: "#0f172a",
      position: { x: 50, y: 520 },
      width: 210,
      height: 58,
    },
    contactInfo: {
      website: "www.ekddigital.com",
      fontSize: 14,
      color: "#64748b",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#cbd5e1",
        position: { x: 50, y: 330 },
        size: { width: 4, height: 80 },
      },
    ],
  },
};

// JICF Church Event Flyer Template
export const jicfEventTemplate: FlyerTemplateData = {
  id: "jicf-event",
  name: "JICF Church Event",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#190570",
  },
  branding: {
    logo: "/jicf/jicf_logo.png",
    logoPosition: "top-center",
    logoSize: 90,
    companyName: "Jinan International Christian Fellowship",
    companyNameSize: 15,
    companyNameColor: "#efe31e",
  },
  content: {
    headline: {
      text: "SUNDAY SERVICE",
      fontSize: 50,
      fontFamily: "Georgia, serif",
      color: "#ffffff",
      position: { x: 50, y: 220 },
      align: "center",
    },
    subheadline: {
      text: "Join Us in Worship & Fellowship",
      fontSize: 24,
      fontFamily: "Georgia, serif",
      color: "#efe31e",
      position: { x: 50, y: 290 },
      align: "center",
    },
    body: {
      text: "Experience the power of God's presence as we gather to worship, pray, and study His Word. All are welcome!",
      fontSize: 17,
      fontFamily: "Georgia, serif",
      color: "#ffffff",
      position: { x: 60, y: 380 },
      align: "center",
    },
    callToAction: {
      text: "JOIN US",
      fontSize: 22,
      fontFamily: "Georgia, serif",
      color: "#190570",
      backgroundColor: "#efe31e",
      position: { x: 175, y: 530 },
      width: 250,
      height: 65,
    },
    contactInfo: {
      website: "www.jicf.org",
      phone: "+1 (555) 123-JICF",
      email: "info@jicf.org",
      fontSize: 13,
      color: "#efe31e",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#ed1c24",
        position: { x: 0, y: 200 },
        size: { width: 600, height: 4 },
      },
      {
        type: "rectangle",
        color: "#ed1c24",
        position: { x: 0, y: 335 },
        size: { width: 600, height: 4 },
      },
      {
        type: "circle",
        color: "rgba(239, 227, 30, 0.1)",
        position: { x: -150, y: -100 },
        size: { width: 450, height: 450 },
      },
      {
        type: "circle",
        color: "rgba(237, 28, 36, 0.1)",
        position: { x: 450, y: 700 },
        size: { width: 350, height: 350 },
      },
    ],
  },
};

// JICF Worship Night Flyer
export const jicfWorshipTemplate: FlyerTemplateData = {
  id: "jicf-worship",
  name: "JICF Worship Night",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#0f0340",
  },
  branding: {
    logo: "/jicf/jicf_logo.png",
    logoPosition: "top-center",
    logoSize: 90,
    companyName: "Jinan International Christian Fellowship",
    companyNameSize: 14,
    companyNameColor: "#d4af37",
  },
  content: {
    headline: {
      text: "NIGHT OF WORSHIP",
      fontSize: 48,
      fontFamily: "Georgia, serif",
      color: "#efe31e",
      position: { x: 50, y: 220 },
      align: "center",
    },
    subheadline: {
      text: "Proclaiming the Gospel of Jesus Christ",
      fontSize: 21,
      fontFamily: "Georgia, serif",
      color: "#d4af37",
      position: { x: 50, y: 285 },
      align: "center",
    },
    body: {
      text: "An evening of powerful worship, heartfelt prayer, and divine encounters. Experience God's presence in a fresh way.",
      fontSize: 17,
      fontFamily: "Georgia, serif",
      color: "#ffffff",
      position: { x: 60, y: 380 },
      align: "center",
    },
    callToAction: {
      text: "REGISTER FREE",
      fontSize: 21,
      fontFamily: "Georgia, serif",
      color: "#0f0340",
      backgroundColor: "#efe31e",
      position: { x: 150, y: 530 },
      width: 300,
      height: 62,
    },
    contactInfo: {
      website: "www.jicf.org",
      phone: "+1 (555) 123-JICF",
      fontSize: 13,
      color: "#d4af37",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "circle",
        color: "rgba(237, 28, 36, 0.15)",
        position: { x: -100, y: 450 },
        size: { width: 400, height: 400 },
      },
      {
        type: "circle",
        color: "rgba(239, 227, 30, 0.1)",
        position: { x: 450, y: -50 },
        size: { width: 350, height: 350 },
      },
    ],
  },
};

// JICF Announcement Flyer
export const jicfAnnouncementTemplate: FlyerTemplateData = {
  id: "jicf-announcement",
  name: "JICF Announcement",
  type: "announcement",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#ffffff",
  },
  branding: {
    logo: "/jicf/jicf_logo.png",
    logoPosition: "top-left",
    logoSize: 75,
    companyName: "JICF",
    companyNameSize: 17,
    companyNameColor: "#190570",
  },
  content: {
    headline: {
      text: "PREPARING THE WORLD",
      fontSize: 46,
      fontFamily: "Georgia, serif",
      color: "#190570",
      position: { x: 50, y: 200 },
      align: "center",
    },
    subheadline: {
      text: "For the Second Coming of Jesus Christ",
      fontSize: 26,
      fontFamily: "Georgia, serif",
      color: "#ed1c24",
      position: { x: 50, y: 265 },
      align: "center",
    },
    body: {
      text: "Join us in our mission to spread the Gospel and prepare hearts for Christ's return.",
      fontSize: 17,
      fontFamily: "Georgia, serif",
      color: "#333333",
      position: { x: 60, y: 360 },
      align: "center",
    },
    callToAction: {
      text: "LEARN MORE",
      fontSize: 21,
      fontFamily: "Georgia, serif",
      color: "#ffffff",
      backgroundColor: "#190570",
      position: { x: 175, y: 530 },
      width: 250,
      height: 62,
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#efe31e",
        position: { x: 0, y: 0 },
        size: { width: 600, height: 10 },
      },
      {
        type: "rectangle",
        color: "#ed1c24",
        position: { x: 0, y: 10 },
        size: { width: 600, height: 7 },
      },
      {
        type: "rectangle",
        color: "#efe31e",
        position: { x: 0, y: 883 },
        size: { width: 600, height: 10 },
      },
      {
        type: "rectangle",
        color: "#ed1c24",
        position: { x: 0, y: 890 },
        size: { width: 600, height: 10 },
      },
    ],
  },
};

// Stunning Sports Event Flyer
export const sportsEventTemplate: FlyerTemplateData = {
  id: "sports-event",
  name: "Sports Event Flyer",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#1a1a2e",
  },
  branding: {
    logo: "/jicf/jicf_logo.png",
    logoPosition: "top-left",
    logoSize: 70,
    companyName: "JICF",
    companyNameSize: 16,
    companyNameColor: "#efe31e",
  },
  content: {
    headline: {
      text: "JICF SPORTS DAY 2025",
      fontSize: 52,
      fontFamily: "Arial, sans-serif",
      color: "#efe31e",
      position: { x: 50, y: 180 },
      align: "center",
    },
    subheadline: {
      text: "Fun • Games • Food • Fellowship",
      fontSize: 22,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      position: { x: 50, y: 255 },
      align: "center",
    },
    body: {
      text: "Join us for an unforgettable afternoon of sports, games, and fellowship! Whether you're here to play, cheer, or enjoy the vibe — there's something for everyone.",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      color: "#cbd5e1",
      position: { x: 60, y: 340 },
      align: "center",
    },
    callToAction: {
      text: "REGISTER NOW",
      fontSize: 22,
      fontFamily: "Arial, sans-serif",
      color: "#1a1a2e",
      backgroundColor: "#efe31e",
      position: { x: 175, y: 710 },
      width: 250,
      height: 65,
    },
    contactInfo: {
      email: "admin@jinanicf.com",
      website: "www.jinanicf.com",
      fontSize: 13,
      color: "#94a3b8",
      position: { x: 50, y: 830 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#ed1c24",
        position: { x: 0, y: 150 },
        size: { width: 600, height: 5 },
      },
      {
        type: "circle",
        color: "rgba(239, 227, 30, 0.15)",
        position: { x: -80, y: 450 },
        size: { width: 300, height: 300 },
      },
      {
        type: "circle",
        color: "rgba(237, 28, 36, 0.12)",
        position: { x: 400, y: 550 },
        size: { width: 250, height: 250 },
      },
    ],
  },
};

// Corporate Curved Design Flyer
export const corporateCurvedTemplate: FlyerTemplateData = {
  id: "corporate-curved",
  name: "Corporate Curved Design",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#003d5c",
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-right",
    logoSize: 65,
    companyNameSize: 0,
    companyNameColor: "#ffffff",
  },
  content: {
    headline: {
      text: "HEADLINE",
      fontSize: 62,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      position: { x: 70, y: 380 },
      align: "left",
    },
    subheadline: {
      text: "BUSINESS TEMPLATE",
      fontSize: 26,
      fontFamily: "Arial, sans-serif",
      color: "#4db8e8",
      position: { x: 70, y: 460 },
      align: "left",
    },
    body: {
      text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.",
      fontSize: 15,
      fontFamily: "Arial, sans-serif",
      color: "#cbd5e1",
      position: { x: 70, y: 550 },
      align: "left",
    },
    contactInfo: {
      email: "contact@ekddigital.com",
      phone: "+1 (555) 123-4567",
      website: "www.ekddigital.com",
      fontSize: 12,
      color: "#94a3b8",
      position: { x: 70, y: 830 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "circle",
        color: "#ffffff",
        position: { x: 50, y: 120 },
        size: { width: 280, height: 280 },
      },
      {
        type: "circle",
        color: "rgba(77, 184, 232, 0.3)",
        position: { x: 320, y: -100 },
        size: { width: 450, height: 450 },
      },
    ],
  },
};

// QR Code Event Flyer
export const qrCodeEventTemplate: FlyerTemplateData = {
  id: "qr-code-event",
  name: "QR Code Event Flyer",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#ffffff",
  },
  branding: {
    logo: "/jicf/jicf_logo.png",
    logoPosition: "top-center",
    logoSize: 80,
    companyName: "Jinan International Christian Fellowship",
    companyNameSize: 16,
    companyNameColor: "#190570",
  },
  content: {
    headline: {
      text: "SPECIAL EVENT 2025",
      fontSize: 46,
      fontFamily: "Georgia, serif",
      color: "#190570",
      position: { x: 50, y: 200 },
      align: "center",
    },
    subheadline: {
      text: "You're Invited!",
      fontSize: 24,
      fontFamily: "Georgia, serif",
      color: "#ed1c24",
      position: { x: 50, y: 265 },
      align: "center",
    },
    body: {
      text: "Join us for an incredible experience filled with worship, fellowship, and community. Scan the QR code below to register or get more details!",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      color: "#333333",
      position: { x: 60, y: 350 },
      align: "center",
    },
    contactInfo: {
      email: "info@jinanicf.com",
      phone: "+86 123 4567 8901",
      website: "www.jinanicf.com",
      fontSize: 13,
      color: "#64748b",
      position: { x: 50, y: 830 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#efe31e",
        position: { x: 0, y: 0 },
        size: { width: 600, height: 8 },
      },
      {
        type: "rectangle",
        color: "#ed1c24",
        position: { x: 0, y: 8 },
        size: { width: 600, height: 5 },
      },
      {
        type: "rectangle",
        color: "#190570",
        position: { x: 0, y: 892 },
        size: { width: 600, height: 8 },
      },
    ],
    qrCode: {
      url: "/placeholder-qr.svg",
      position: { x: 200, y: 520 },
      size: { width: 200, height: 200 },
      label: "SCAN TO REGISTER",
    },
  },
};

// Modern Gradient Event Flyer
export const gradientEventTemplate: FlyerTemplateData = {
  id: "gradient-event",
  name: "Modern Gradient Event",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#8b5cf6",
  },
  branding: {
    logo: "/logo.png",
    logoPosition: "top-left",
    logoSize: 60,
    companyName: "EKD Digital",
    companyNameSize: 16,
    companyNameColor: "#ffffff",
  },
  content: {
    headline: {
      text: "INNOVATION SUMMIT",
      fontSize: 54,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      position: { x: 50, y: 250 },
      align: "center",
    },
    subheadline: {
      text: "Shaping the Future Together",
      fontSize: 24,
      fontFamily: "Arial, sans-serif",
      color: "#e0e7ff",
      position: { x: 50, y: 325 },
      align: "center",
    },
    body: {
      text: "Connect with industry leaders, explore cutting-edge technologies, and discover opportunities that will transform your business.",
      fontSize: 17,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      position: { x: 60, y: 420 },
      align: "center",
    },
    callToAction: {
      text: "RESERVE YOUR SPOT",
      fontSize: 20,
      fontFamily: "Arial, sans-serif",
      color: "#8b5cf6",
      backgroundColor: "#ffffff",
      position: { x: 150, y: 600 },
      width: 300,
      height: 65,
    },
    contactInfo: {
      email: "events@ekddigital.com",
      phone: "+1 (555) 123-4567",
      website: "www.ekddigital.com",
      fontSize: 13,
      color: "#e0e7ff",
      position: { x: 50, y: 830 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "circle",
        color: "rgba(255, 255, 255, 0.1)",
        position: { x: -150, y: -50 },
        size: { width: 400, height: 400 },
      },
      {
        type: "circle",
        color: "rgba(255, 255, 255, 0.08)",
        position: { x: 400, y: 600 },
        size: { width: 350, height: 350 },
      },
    ],
  },
};

// Premium Event Details Flyer
export const detailedEventTemplate: FlyerTemplateData = {
  id: "detailed-event",
  name: "Premium Event Details",
  type: "event",
  layout: {
    orientation: "portrait",
    width: 600,
    height: 900,
    backgroundColor: "#0f172a",
  },
  branding: {
    logo: "/jicf/jicf_logo.png",
    logoPosition: "top-center",
    logoSize: 75,
    companyName: "JICF Community",
    companyNameSize: 16,
    companyNameColor: "#f59e0b",
  },
  content: {
    headline: {
      text: "COMMUNITY GATHERING",
      fontSize: 48,
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      position: { x: 50, y: 200 },
      align: "center",
    },
    subheadline: {
      text: "A Day of Fellowship & Fun",
      fontSize: 22,
      fontFamily: "Arial, sans-serif",
      color: "#f59e0b",
      position: { x: 50, y: 265 },
      align: "center",
    },
    body: {
      text: "DATE: October 6, 2025 | TIME: 1:00 PM - 5:00 PM\n\nLOCATION: University Sports Ground\n济南大学(主校区)-西2门\n\nActivities: Sports • Games • Food • Music",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      color: "#cbd5e1",
      position: { x: 60, y: 380 },
      align: "center",
    },
    callToAction: {
      text: "SIGN UP TODAY",
      fontSize: 21,
      fontFamily: "Arial, sans-serif",
      color: "#0f172a",
      backgroundColor: "#f59e0b",
      position: { x: 175, y: 650 },
      width: 250,
      height: 62,
    },
    contactInfo: {
      email: "admin@jinanicf.com",
      website: "jinanicf.formaloo.co/register",
      fontSize: 13,
      color: "#94a3b8",
      position: { x: 50, y: 820 },
    },
  },
  graphics: {
    shapes: [
      {
        type: "rectangle",
        color: "#1e293b",
        position: { x: 50, y: 350 },
        size: { width: 500, height: 260 },
      },
      {
        type: "rectangle",
        color: "#f59e0b",
        position: { x: 50, y: 350 },
        size: { width: 8, height: 260 },
      },
      {
        type: "circle",
        color: "rgba(245, 158, 11, 0.1)",
        position: { x: -100, y: -80 },
        size: { width: 350, height: 350 },
      },
      {
        type: "circle",
        color: "rgba(245, 158, 11, 0.08)",
        position: { x: 450, y: 700 },
        size: { width: 280, height: 280 },
      },
    ],
    qrCode: {
      url: "/placeholder-qr.svg",
      position: { x: 400, y: 730 },
      size: { width: 140, height: 140 },
      label: "SCAN",
    },
  },
};

export const flyerTemplates = {
  modernEvent: modernEventTemplate,
  vibrantPromotion: vibrantPromotionTemplate,
  elegantService: elegantServiceTemplate,
  boldAnnouncement: boldAnnouncementTemplate,
  minimalProduct: minimalProductTemplate,
  jicfEvent: jicfEventTemplate,
  jicfWorship: jicfWorshipTemplate,
  jicfAnnouncement: jicfAnnouncementTemplate,
  sportsEvent: sportsEventTemplate,
  corporateCurved: corporateCurvedTemplate,
  qrCodeEvent: qrCodeEventTemplate,
  gradientEvent: gradientEventTemplate,
  detailedEvent: detailedEventTemplate,
};

export type FlyerTemplateKey = keyof typeof flyerTemplates;
