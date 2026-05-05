"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  downloadFlyerAsImage,
  downloadFlyerAsJPG,
} from "@/components/creative/flyers/flyer-download";
import { toast } from "sonner";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import { Textarea } from "@/components/creative/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import { Separator } from "@/components/creative/ui/separator";
import {
  Download,
  Eye,
  Settings,
  // Image as ImageIcon, // Reserved for future image functionality
  Type,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

export interface FlyerTemplateData {
  id: string;
  name: string;
  type: "event" | "promotion" | "announcement" | "service" | "product";
  visibility?: {
    logo?: boolean;
    companyName?: boolean;
    headline?: boolean;
    subheadline?: boolean;
    body?: boolean;
    callToAction?: boolean;
    contactInfo?: boolean;
    qrCode?: boolean;
    shapes?: boolean;
  };
  layout: {
    orientation: "portrait" | "landscape";
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
    overlayColor?: string;
    overlayOpacity?: number;
  };
  branding: {
    logo?: string;
    logoPosition:
      | "top-left"
      | "top-center"
      | "top-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
      | { x: number; y: number };
    logoSize: number;
    companyName?: string;
    companyNameSize: number;
    companyNameColor: string;
    companyNamePosition?: { x: number; y: number };
  };
  content: {
    headline: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
      align: "left" | "center" | "right";
    };
    subheadline?: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
      align: "left" | "center" | "right";
    };
    body: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
      align: "left" | "center" | "right";
    };
    callToAction?: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      backgroundColor: string;
      position: { x: number; y: number };
      width: number;
      height: number;
    };
    contactInfo?: {
      email?: string;
      phone?: string;
      website?: string;
      address?: string;
      fontSize: number;
      color: string;
      position: { x: number; y: number };
    };
    // Additional duplicated text blocks
    additionalTextBlocks?: Array<{
      id: string;
      type:
        | "headline"
        | "subheadline"
        | "body"
        | "callToAction"
        | "contactInfo";
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
      align?: "left" | "center" | "right";
      backgroundColor?: string;
      width?: number;
      height?: number;
      visible?: boolean;
      zIndex?: number;
    }>;
  };
  graphics?: {
    shapes?: Array<{
      type: "circle" | "rectangle" | "line";
      color: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
    }>;
    customImages?: Array<{
      url: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      visible?: boolean;
      zIndex?: number;
    }>;
    qrCode?: {
      url?: string;
      position: { x: number; y: number };
      size: { width: number; height: number };
      label?: string;
    };
  };
}

interface FlyerPreviewProps {
  template: FlyerTemplateData;
  className?: string;
}

type LogoPositionStyle = Pick<
  React.CSSProperties,
  "left" | "right" | "top" | "bottom" | "transform"
>;

export function FlyerPreview({ template, className = "" }: FlyerPreviewProps) {
  const { layout, content, branding, graphics } = template;

  const getLogoPosition = useCallback((): LogoPositionStyle => {
    // If logoPosition is already coordinates, use them directly
    if (typeof branding.logoPosition === "object") {
      return {
        left: `${branding.logoPosition.x}px`,
        top: `${branding.logoPosition.y}px`,
      };
    }

    // Otherwise use named positions
    const positions = {
      "top-left": { left: "30px", top: "30px" },
      "top-center": { left: "50%", top: "30px", transform: "translateX(-50%)" },
      "top-right": { right: "30px", top: "30px" },
      "bottom-left": { left: "30px", bottom: "30px" },
      "bottom-center": {
        left: "50%",
        bottom: "30px",
        transform: "translateX(-50%)",
      },
      "bottom-right": { right: "30px", bottom: "30px" },
    };
    return positions[branding.logoPosition as keyof typeof positions];
  }, [branding.logoPosition]);

  const logoPositionStyle = useMemo(() => getLogoPosition(), [getLogoPosition]);

  const derivedLogoTop = useMemo(() => {
    if (typeof branding.logoPosition === "object") {
      return branding.logoPosition.y;
    }

    if (logoPositionStyle.top) {
      return parseInt(String(logoPositionStyle.top).replace(/px$/, ""), 10);
    }

    if (logoPositionStyle.bottom) {
      const bottomValue = parseInt(
        String(logoPositionStyle.bottom).replace(/px$/, ""),
        10
      );
      return layout.height - bottomValue - branding.logoSize;
    }

    return undefined;
  }, [
    branding.logoPosition,
    branding.logoSize,
    layout.height,
    logoPositionStyle,
  ]);

  return (
    <div
      className={`relative border border-gray-300 shadow-2xl overflow-hidden ${className}`}
      style={{
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        backgroundColor: layout.backgroundColor,
      }}
    >
      {/* Background Image with Overlay */}
      {layout.backgroundImage && (
        <>
          <Image
            src={layout.backgroundImage}
            alt="Background"
            fill
            className="object-cover"
            style={{ zIndex: 0 }}
          />
          {layout.overlayColor && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: layout.overlayColor,
                opacity: layout.overlayOpacity || 0.5,
                zIndex: 1,
              }}
            />
          )}
        </>
      )}

      {/* Custom Shapes */}
      {template.visibility?.shapes !== false &&
        graphics?.shapes?.map((shape, index) => (
          <div
            key={`shape-${index}`}
            className="absolute"
            style={{
              left: `${shape.position.x}px`,
              top: `${shape.position.y}px`,
              width: `${shape.size.width}px`,
              height: `${shape.size.height}px`,
              backgroundColor: shape.color,
              borderRadius: shape.type === "circle" ? "50%" : "0",
              zIndex: 2,
            }}
          />
        ))}

      {/* Custom Images */}
      {graphics?.customImages?.map((img, index) => (
        <div
          key={`img-${index}`}
          className="absolute"
          style={{
            left: `${img.position.x}px`,
            top: `${img.position.y}px`,
            width: `${img.size.width}px`,
            height: `${img.size.height}px`,
            zIndex: 2,
          }}
        >
          <Image
            src={img.url}
            alt={`Graphic ${index + 1}`}
            fill
            className="object-contain"
          />
        </div>
      ))}

      {/* Logo */}
      {template.visibility?.logo !== false && branding.logo && (
        <div
          className="absolute"
          style={{
            ...(typeof branding.logoPosition === "object" &&
            "x" in branding.logoPosition
              ? {
                  left: `${
                    (branding.logoPosition as { x: number; y: number }).x
                  }px`,
                  top: `${
                    (branding.logoPosition as { x: number; y: number }).y
                  }px`,
                }
              : logoPositionStyle),
            width: `${branding.logoSize}px`,
            height: `${branding.logoSize}px`,
            zIndex: 10,
          }}
        >
          <Image
            src={branding.logo}
            alt="Logo"
            width={branding.logoSize}
            height={branding.logoSize}
            className="w-full h-full object-contain"
            sizes={`${branding.logoSize}px`}
          />
        </div>
      )}

      {/* Company Name */}
      {template.visibility?.companyName !== false && branding.companyName && (
        <div
          className="absolute font-bold"
          style={{
            ...(branding.companyNamePosition
              ? {
                  left: `${branding.companyNamePosition.x}px`,
                  top: `${branding.companyNamePosition.y}px`,
                  transform: "translateX(-50%)",
                }
              : {
                  ...logoPositionStyle,
                  top:
                    branding.logo && derivedLogoTop !== undefined
                      ? `${derivedLogoTop + branding.logoSize + 10}px`
                      : logoPositionStyle.top,
                }),
            fontSize: `${branding.companyNameSize}px`,
            color: branding.companyNameColor,
            zIndex: 10,
          }}
        >
          {branding.companyName}
        </div>
      )}

      {/* Headline */}
      {template.visibility?.headline !== false && (
        <div
          className="absolute font-bold z-20"
          style={{
            left: `${content.headline.position.x}px`,
            top: `${content.headline.position.y}px`,
            fontSize: `${content.headline.fontSize}px`,
            fontFamily: content.headline.fontFamily,
            color: content.headline.color,
            textAlign: content.headline.align,
            width: `${layout.width - content.headline.position.x * 2}px`,
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          {content.headline.text}
        </div>
      )}

      {/* Subheadline */}
      {template.visibility?.subheadline !== false && content.subheadline && (
        <div
          className="absolute z-20"
          style={{
            left: `${content.subheadline.position.x}px`,
            top: `${content.subheadline.position.y}px`,
            fontSize: `${content.subheadline.fontSize}px`,
            fontFamily: content.subheadline.fontFamily,
            color: content.subheadline.color,
            textAlign: content.subheadline.align,
            width: `${layout.width - content.subheadline.position.x * 2}px`,
            whiteSpace: "pre-wrap",
          }}
        >
          {content.subheadline.text}
        </div>
      )}

      {/* Body Text */}
      {template.visibility?.body !== false && (
        <div
          className="absolute z-20"
          style={{
            left: `${content.body.position.x}px`,
            top: `${content.body.position.y}px`,
            fontSize: `${content.body.fontSize}px`,
            fontFamily: content.body.fontFamily,
            color: content.body.color,
            textAlign: content.body.align,
            width: `${layout.width - content.body.position.x * 2}px`,
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
          }}
        >
          {content.body.text}
        </div>
      )}

      {/* Call to Action Button */}
      {template.visibility?.callToAction !== false && content.callToAction && (
        <div
          className="absolute flex items-center justify-center font-bold rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity z-20"
          style={{
            left: `${content.callToAction.position.x}px`,
            top: `${content.callToAction.position.y}px`,
            width: `${content.callToAction.width}px`,
            height: `${content.callToAction.height}px`,
            backgroundColor: content.callToAction.backgroundColor,
            color: content.callToAction.color,
            fontSize: `${content.callToAction.fontSize}px`,
            fontFamily: content.callToAction.fontFamily,
          }}
        >
          {content.callToAction.text}
        </div>
      )}

      {/* Contact Information */}
      {template.visibility?.contactInfo !== false && content.contactInfo && (
        <div
          className="absolute z-20"
          style={{
            left: `${content.contactInfo.position.x}px`,
            top: `${content.contactInfo.position.y}px`,
            fontSize: `${content.contactInfo.fontSize}px`,
            color: content.contactInfo.color,
            width: `${layout.width - content.contactInfo.position.x * 2}px`,
            whiteSpace: "pre-wrap",
            lineHeight: "1.6",
          }}
        >
          {content.contactInfo.email && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              📧 {content.contactInfo.email}
            </div>
          )}
          {content.contactInfo.phone && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              📱 {content.contactInfo.phone}
            </div>
          )}
          {content.contactInfo.website && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              🌐 {content.contactInfo.website}
            </div>
          )}
          {content.contactInfo.address && (
            <div style={{ whiteSpace: "pre-wrap" }}>
              📍 {content.contactInfo.address}
            </div>
          )}
        </div>
      )}

      {/* QR Code */}
      {template.visibility?.qrCode !== false && graphics?.qrCode && (
        <div
          className="absolute bg-white border-4 border-gray-300 flex items-center justify-center z-20"
          style={{
            left: `${graphics.qrCode.position.x}px`,
            top: `${graphics.qrCode.position.y}px`,
            width: `${graphics.qrCode.size.width}px`,
            height: `${graphics.qrCode.size.height}px`,
          }}
        >
          {graphics.qrCode.url ? (
            <Image
              src={graphics.qrCode.url}
              alt="QR Code"
              width={graphics.qrCode.size.width}
              height={graphics.qrCode.size.height}
              className="w-full h-full object-contain p-2"
              sizes={`${graphics.qrCode.size.width}px`}
              unoptimized={graphics.qrCode.url.startsWith("data:")}
            />
          ) : (
            <div className="text-center p-4">
              <div className="text-6xl mb-2">📱</div>
              <div className="text-xs text-gray-500 font-bold">
                {graphics.qrCode.label || "SCAN HERE"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Additional Text Blocks (Duplicated Elements) */}
      {content.additionalTextBlocks?.map((block) => {
        if (block.visible === false) return null;

        if (block.type === "callToAction") {
          return (
            <div
              key={block.id}
              className="absolute flex items-center justify-center font-bold rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity z-20"
              style={{
                left: `${block.position.x}px`,
                top: `${block.position.y}px`,
                width: `${block.width}px`,
                height: `${block.height}px`,
                backgroundColor: block.backgroundColor,
                color: block.color,
                fontSize: `${block.fontSize}px`,
                fontFamily: block.fontFamily,
              }}
            >
              {block.text}
            </div>
          );
        }

        return (
          <div
            key={block.id}
            className={`absolute z-20 ${
              block.type === "headline" ? "font-bold" : ""
            }`}
            style={{
              left: `${block.position.x}px`,
              top: `${block.position.y}px`,
              fontSize: `${block.fontSize}px`,
              fontFamily: block.fontFamily,
              color: block.color,
              textAlign: block.align || "left",
              width: `${layout.width - block.position.x * 2}px`,
              whiteSpace: "pre-wrap",
              lineHeight: block.type === "body" ? "1.6" : "1.2",
              textShadow:
                block.type === "headline"
                  ? "2px 2px 4px rgba(0,0,0,0.1)"
                  : undefined,
            }}
          >
            {block.text}
          </div>
        );
      })}
    </div>
  );
}

interface FlyerBuilderProps {
  initialTemplate?: FlyerTemplateData;
  onSave: (template: FlyerTemplateData) => void;
  onPreview?: (template: FlyerTemplateData) => void;
}

const defaultTemplate: FlyerTemplateData = {
  id: "custom",
  name: "Custom Flyer",
  type: "promotion",
  layout: {
    orientation: "portrait",
    backgroundColor: "#ffffff",
    width: 800,
    height: 1200,
  },
  branding: {
    logoPosition: "top-left",
    logoSize: 80,
    companyNameSize: 20,
    companyNameColor: "#1a1a1a",
  },
  content: {
    headline: {
      text: "Your Stunning Headline Here",
      fontSize: 48,
      fontFamily: "Arial, sans-serif",
      color: "#1a1a1a",
      position: { x: 50, y: 150 },
      align: "center",
    },
    body: {
      text: "Add your compelling body text here. Describe your event, promotion, or service in an engaging way.",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      color: "#333333",
      position: { x: 50, y: 350 },
      align: "center",
    },
  },
};

export function FlyerBuilder({
  initialTemplate,
  onSave,
  onPreview,
}: FlyerBuilderProps) {
  const [template, setTemplate] = useState<FlyerTemplateData>(
    initialTemplate || defaultTemplate
  );

  const updateTemplate = (path: string, value: unknown) => {
    setTemplate((prev) => {
      const updated = JSON.parse(JSON.stringify(prev)) as FlyerTemplateData;
      const keys = path.split(".");
      let current: Record<string, unknown> = updated as unknown as Record<
        string,
        unknown
      >;

      for (let i = 0; i < keys.length - 1; i++) {
        if (
          current[keys[i]] === undefined ||
          typeof current[keys[i]] !== "object" ||
          current[keys[i]] === null
        ) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = () => {
    onSave(template);
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(template);
    }
  };

  const handleDownload = async (format: "png" | "jpg" = "png") => {
    try {
      if (format === "jpg") {
        await downloadFlyerAsJPG(
          "flyer-builder-preview",
          template.name || "flyer"
        );
      } else {
        await downloadFlyerAsImage(
          "flyer-builder-preview",
          template.name || "flyer"
        );
      }
      toast("Download Complete!", { description: `Your flyer has been downloaded as ${format.toUpperCase()}.` });
    } catch {
      toast.error("There was an error downloading your flyer. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Flyer Settings
          </CardTitle>
          <CardDescription>
            Configure the basic settings for your flyer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="flyer-name">Flyer Name</Label>
              <Input
                id="flyer-name"
                value={template.name}
                onChange={(e) => updateTemplate("name", e.target.value)}
                placeholder="e.g., Summer Event Flyer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="flyer-type">Flyer Type</Label>
              <Select
                value={template.type}
                onValueChange={(value) => updateTemplate("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="orientation">Orientation</Label>
              <Select
                value={template.layout.orientation}
                onValueChange={(value) =>
                  updateTemplate("layout.orientation", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="background-color">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="background-color"
                  type="color"
                  value={template.layout.backgroundColor}
                  onChange={(e) =>
                    updateTemplate("layout.backgroundColor", e.target.value)
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={template.layout.backgroundColor}
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                      updateTemplate("layout.backgroundColor", hex);
                    }
                  }}
                  placeholder="#ffffff"
                  className="flex-1 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branding Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Branding
          </CardTitle>
          <CardDescription>
            Add your logo and company information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Logo Preview */}
          {template.branding.logo && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="relative w-20 h-20 bg-white rounded border flex items-center justify-center">
                <Image
                  src={template.branding.logo}
                  alt="Logo preview"
                  width={60}
                  height={60}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Current Logo</p>
                <p className="text-xs text-muted-foreground">
                  {template.branding.logo.startsWith("data:")
                    ? "Uploaded image"
                    : template.branding.logo}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateTemplate("branding.logo", "")}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">📤 Upload Logo Image</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      updateTemplate("branding.logo", reader.result as string);
                      toast("Logo uploaded!", { description: "Your logo has been added to the flyer." });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Click to browse or drag & drop an image file
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-url">🔗 Or Use Logo URL/Path</Label>
              <Input
                id="logo-url"
                type="text"
                value={
                  template.branding.logo?.startsWith("data:")
                    ? ""
                    : template.branding.logo || ""
                }
                onChange={(e) =>
                  updateTemplate("branding.logo", e.target.value)
                }
                placeholder="/logo.png or https://example.com/logo.png"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="logo-position">Logo Position</Label>
              <Select
                value={
                  typeof template.branding.logoPosition === "string"
                    ? template.branding.logoPosition
                    : "top-center"
                }
                onValueChange={(value) =>
                  updateTemplate("branding.logoPosition", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="top-left">Top Left</SelectItem>
                  <SelectItem value="top-center">Top Center</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="bottom-center">Bottom Center</SelectItem>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-size">Logo Size (px)</Label>
              <Input
                id="logo-size"
                type="number"
                value={template.branding.logoSize}
                onChange={(e) =>
                  updateTemplate("branding.logoSize", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={template.branding.companyName || ""}
                onChange={(e) =>
                  updateTemplate("branding.companyName", e.target.value)
                }
                placeholder="EKD Digital"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Content
          </CardTitle>
          <CardDescription>
            Customize the text content and styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Headline */}
          <div className="space-y-4">
            <h4 className="font-semibold">Headline</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Text</Label>
                <Textarea
                  value={template.content.headline.text}
                  onChange={(e) =>
                    updateTemplate("content.headline.text", e.target.value)
                  }
                  rows={2}
                  placeholder="Press Enter for new line"
                />
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Press Enter to create multi-line headlines
                </p>
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={template.content.headline.fontSize}
                  onChange={(e) =>
                    updateTemplate(
                      "content.headline.fontSize",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.content.headline.color}
                    onChange={(e) =>
                      updateTemplate("content.headline.color", e.target.value)
                    }
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={template.content.headline.color}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                        updateTemplate("content.headline.color", hex);
                      }
                    }}
                    placeholder="#1a1a1a"
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Body Text */}
          <div className="space-y-4">
            <h4 className="font-semibold">Body Text</h4>
            <div className="space-y-2">
              <Label>Text</Label>
              <Textarea
                value={template.content.body.text}
                onChange={(e) =>
                  updateTemplate("content.body.text", e.target.value)
                }
                rows={4}
                placeholder="Press Enter for new lines..."
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: Use Enter to create multiple lines (e.g., &ldquo;DATE:
                Oct 6, 2025 | TIME: 1:00 PM&rdquo; on separate lines)
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={template.content.body.fontSize}
                  onChange={(e) =>
                    updateTemplate(
                      "content.body.fontSize",
                      parseInt(e.target.value)
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.content.body.color}
                    onChange={(e) =>
                      updateTemplate("content.body.color", e.target.value)
                    }
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={template.content.body.color}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                        updateTemplate("content.body.color", hex);
                      }
                    }}
                    placeholder="#333333"
                    className="flex-1 font-mono"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Contact Information & Footer
          </CardTitle>
          <CardDescription>
            Edit contact details (supports multi-line with Enter key)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact-email">Email</Label>
              <Textarea
                id="contact-email"
                value={template.content.contactInfo?.email || ""}
                onChange={(e) =>
                  updateTemplate("content.contactInfo.email", e.target.value)
                }
                placeholder="admin@example.com"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-phone">Phone</Label>
              <Textarea
                id="contact-phone"
                value={template.content.contactInfo?.phone || ""}
                onChange={(e) =>
                  updateTemplate("content.contactInfo.phone", e.target.value)
                }
                placeholder="+1 (555) 123-4567"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-website">Website</Label>
              <Textarea
                id="contact-website"
                value={template.content.contactInfo?.website || ""}
                onChange={(e) =>
                  updateTemplate("content.contactInfo.website", e.target.value)
                }
                placeholder="www.example.com"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-address">Address (Optional)</Label>
              <Textarea
                id="contact-address"
                value={template.content.contactInfo?.address || ""}
                onChange={(e) =>
                  updateTemplate("content.contactInfo.address", e.target.value)
                }
                placeholder="123 Main St, City, Country"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-font-size">Font Size</Label>
              <Input
                id="contact-font-size"
                type="number"
                value={template.content.contactInfo?.fontSize || 13}
                onChange={(e) =>
                  updateTemplate(
                    "content.contactInfo.fontSize",
                    parseInt(e.target.value)
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-color">Color</Label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={template.content.contactInfo?.color || "#666666"}
                  onChange={(e) =>
                    updateTemplate("content.contactInfo.color", e.target.value)
                  }
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={template.content.contactInfo?.color || "#666666"}
                  onChange={(e) => {
                    const hex = e.target.value;
                    if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                      updateTemplate("content.contactInfo.color", hex);
                    }
                  }}
                  placeholder="#666666"
                  className="flex-1 font-mono"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Press Enter in any field to create multi-line contact info
          </p>
        </CardContent>
      </Card>

      {/* QR Code Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            QR Code
          </CardTitle>
          <CardDescription>
            Upload a QR code for registration/links (if template supports it)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code Preview */}
          {template.graphics?.qrCode?.url && (
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border">
              <div className="relative w-24 h-24 bg-white rounded border flex items-center justify-center">
                <Image
                  src={template.graphics.qrCode.url}
                  alt="QR Code preview"
                  width={80}
                  height={80}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Current QR Code</p>
                <p className="text-xs text-muted-foreground">
                  {template.graphics.qrCode.url.startsWith("data:")
                    ? "Uploaded QR code image"
                    : template.graphics.qrCode.url}
                </p>
                {template.graphics.qrCode.label && (
                  <p className="text-xs text-blue-600 mt-1">
                    Label: {template.graphics.qrCode.label}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateTemplate("graphics.qrCode.url", "")}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="qr-upload">📤 Upload QR Code Image</Label>
            <Input
              id="qr-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    updateTemplate(
                      "graphics.qrCode.url",
                      reader.result as string
                    );
                    toast("QR Code uploaded!", { description: "Your QR code has been added to the flyer." });
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              Generate a QR code (use qr-code-generator.com) and upload it here
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-url">🔗 Or Use QR Code URL/Path</Label>
            <Input
              id="qr-url"
              type="text"
              value={
                template.graphics?.qrCode?.url?.startsWith("data:")
                  ? ""
                  : template.graphics?.qrCode?.url || ""
              }
              onChange={(e) =>
                updateTemplate("graphics.qrCode.url", e.target.value)
              }
              placeholder="/qr-code.png or https://example.com/qr.png"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qr-label">QR Code Label</Label>
            <Input
              id="qr-label"
              type="text"
              value={template.graphics?.qrCode?.label || ""}
              onChange={(e) =>
                updateTemplate("graphics.qrCode.label", e.target.value)
              }
              placeholder="SCAN TO REGISTER"
            />
          </div>

          {!template.graphics?.qrCode && (
            <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
              ⚠️ This template doesn&apos;t have a QR code placeholder. Select a
              template with QR code support (e.g., QR Code Event, Detailed
              Event).
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </CardTitle>
          <CardDescription>See how your flyer will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900 rounded-lg overflow-auto">
            <div id="flyer-builder-preview">
              <FlyerPreview
                template={template}
                className="transform scale-75 origin-center"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end flex-wrap">
        <Button
          variant="outline"
          onClick={handlePreview}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Full Preview
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDownload("png")}
          className="flex items-center gap-2 border-primary-dark text-primary-dark hover:bg-primary-dark hover:text-white"
        >
          <Download className="h-4 w-4" />
          Download PNG
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDownload("jpg")}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download JPG
        </Button>
        <Button
          onClick={handleSave}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-dark to-secondary hover:from-primary-dark/90 hover:to-secondary/90 text-white"
        >
          <Download className="h-4 w-4" />
          Save Flyer
        </Button>
      </div>
    </div>
  );
}
