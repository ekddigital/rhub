"use client";

import React, { useState } from "react";
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
import { Award, Eye, Palette, Settings } from "lucide-react";

export interface CertificateTemplateData {
  id: string;
  name: string;
  type: string;
  layout: {
    orientation: "portrait" | "landscape";
    width: number;
    height: number;
    backgroundColor: string;
    backgroundImage?: string;
  };
  content: {
    title: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
    };
    subtitle?: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
    };
    recipientName: {
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
    };
    body: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
    };
    signature?: {
      text: string;
      fontSize: number;
      fontFamily: string;
      color: string;
      position: { x: number; y: number };
    };
  };
}

export interface CertificatePreviewData {
  recipientName: string;
  issueDate: string;
  expiryDate?: string;
  organizationName: string;
  additionalData?: Record<string, unknown>;
}

interface CertificatePreviewProps {
  template: CertificateTemplateData;
  previewData: CertificatePreviewData;
  className?: string;
}

export function CertificatePreview({
  template,
  previewData,
  className = "",
}: CertificatePreviewProps) {
  const { layout, content } = template;

  return (
    <div
      className={`relative border border-gray-300 shadow-lg ${className}`}
      style={{
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        backgroundColor: layout.backgroundColor,
        backgroundImage: layout.backgroundImage
          ? `url(${layout.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Title */}
      <div
        className="absolute font-bold text-center"
        style={{
          left: `${content.title.position.x}px`,
          top: `${content.title.position.y}px`,
          fontSize: `${content.title.fontSize}px`,
          fontFamily: content.title.fontFamily,
          color: content.title.color,
          width: `${layout.width - content.title.position.x * 2}px`,
        }}
      >
        {content.title.text}
      </div>

      {/* Subtitle */}
      {content.subtitle && (
        <div
          className="absolute text-center"
          style={{
            left: `${content.subtitle.position.x}px`,
            top: `${content.subtitle.position.y}px`,
            fontSize: `${content.subtitle.fontSize}px`,
            fontFamily: content.subtitle.fontFamily,
            color: content.subtitle.color,
            width: `${layout.width - content.subtitle.position.x * 2}px`,
          }}
        >
          {content.subtitle.text}
        </div>
      )}

      {/* Recipient Name */}
      <div
        className="absolute font-bold text-center"
        style={{
          left: `${content.recipientName.position.x}px`,
          top: `${content.recipientName.position.y}px`,
          fontSize: `${content.recipientName.fontSize}px`,
          fontFamily: content.recipientName.fontFamily,
          color: content.recipientName.color,
          width: `${layout.width - content.recipientName.position.x * 2}px`,
        }}
      >
        {previewData.recipientName}
      </div>

      {/* Body Text */}
      <div
        className="absolute text-center"
        style={{
          left: `${content.body.position.x}px`,
          top: `${content.body.position.y}px`,
          fontSize: `${content.body.fontSize}px`,
          fontFamily: content.body.fontFamily,
          color: content.body.color,
          width: `${layout.width - content.body.position.x * 2}px`,
        }}
      >
        {content.body.text.replace(
          "{recipientName}",
          previewData.recipientName
        )}
      </div>

      {/* Organization Name */}
      <div
        className="absolute text-center"
        style={{
          left: "50px",
          bottom: "80px",
          fontSize: "16px",
          fontFamily: "serif",
          color: "#333",
          width: `${layout.width - 100}px`,
        }}
      >
        {previewData.organizationName}
      </div>

      {/* Issue Date */}
      <div
        className="absolute text-center"
        style={{
          left: "50px",
          bottom: "50px",
          fontSize: "14px",
          fontFamily: "serif",
          color: "#666",
          width: `${layout.width - 100}px`,
        }}
      >
        Issued on {new Date(previewData.issueDate).toLocaleDateString()}
      </div>

      {/* Signature */}
      {content.signature && (
        <div
          className="absolute text-center"
          style={{
            left: `${content.signature.position.x}px`,
            top: `${content.signature.position.y}px`,
            fontSize: `${content.signature.fontSize}px`,
            fontFamily: content.signature.fontFamily,
            color: content.signature.color,
            width: `${layout.width - content.signature.position.x * 2}px`,
          }}
        >
          {content.signature.text}
        </div>
      )}
    </div>
  );
}

interface CertificateBuilderProps {
  initialTemplate?: CertificateTemplateData;
  onSave: (template: CertificateTemplateData) => void;
  onPreview?: (template: CertificateTemplateData) => void;
}

export function CertificateBuilder({
  initialTemplate,
  onSave,
  onPreview,
}: CertificateBuilderProps) {
  const [template, setTemplate] = useState<CertificateTemplateData>(
    initialTemplate || {
      id: "",
      name: "",
      type: "COMPLETION",
      layout: {
        orientation: "landscape",
        width: 800,
        height: 600,
        backgroundColor: "#ffffff",
      },
      content: {
        title: {
          text: "Certificate of Completion",
          fontSize: 32,
          fontFamily: "serif",
          color: "#333333",
          position: { x: 50, y: 80 },
        },
        recipientName: {
          fontSize: 28,
          fontFamily: "serif",
          color: "#000000",
          position: { x: 50, y: 200 },
        },
        body: {
          text: "This is to certify that {recipientName} has successfully completed the requirements.",
          fontSize: 18,
          fontFamily: "serif",
          color: "#333333",
          position: { x: 50, y: 280 },
        },
      },
    }
  );

  const [previewData] = useState<CertificatePreviewData>({
    recipientName: "John Doe",
    issueDate: new Date().toISOString(),
    organizationName: "EKD Digital",
  });

  const updateTemplate = (path: string, value: unknown) => {
    setTemplate((prev) => {
      const updated = { ...prev };
      const keys = path.split(".");
      let current: Record<string, unknown> = updated as unknown as Record<
        string,
        unknown
      >;

      for (let i = 0; i < keys.length - 1; i++) {
        const next = current[keys[i]];

        if (next && typeof next === "object") {
          current = next as Record<string, unknown>;
        }
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = () => {
    onSave(template);
  };

  const handlePreview = () => {
    onPreview?.(template);
  };

  return (
    <div className="space-y-6">
      {/* Template Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Template Settings
          </CardTitle>
          <CardDescription>
            Configure the basic settings for your certificate template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={template.name}
                onChange={(e) => updateTemplate("name", e.target.value)}
                placeholder="e.g., Course Completion Certificate"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Certificate Type</Label>
              <Select
                value={template.type}
                onValueChange={(value) => updateTemplate("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMPLETION">Completion</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement</SelectItem>
                  <SelectItem value="PARTICIPATION">Participation</SelectItem>
                  <SelectItem value="EXCELLENCE">Excellence</SelectItem>
                  <SelectItem value="APPRECIATION">Appreciation</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="RECOGNITION">Recognition</SelectItem>
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
                  <SelectItem value="landscape">Landscape</SelectItem>
                  <SelectItem value="portrait">Portrait</SelectItem>
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
                    // Validate hex color format
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

      {/* Content Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Content Settings
          </CardTitle>
          <CardDescription>
            Customize the text content and styling
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-4">
            <h4 className="font-semibold">Title</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Text</Label>
                <Input
                  value={template.content.title.text}
                  onChange={(e) =>
                    updateTemplate("content.title.text", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Font Size</Label>
                <Input
                  type="number"
                  value={template.content.title.fontSize}
                  onChange={(e) =>
                    updateTemplate(
                      "content.title.fontSize",
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
                    value={template.content.title.color}
                    onChange={(e) =>
                      updateTemplate("content.title.color", e.target.value)
                    }
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={template.content.title.color}
                    onChange={(e) => {
                      const hex = e.target.value;
                      if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                        updateTemplate("content.title.color", hex);
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

          <Separator />

          {/* Body Text */}
          <div className="space-y-4">
            <h4 className="font-semibold">Body Text</h4>
            <div className="space-y-2">
              <Label>Text (use {"{recipientName}"} as placeholder)</Label>
              <Textarea
                value={template.content.body.text}
                onChange={(e) =>
                  updateTemplate("content.body.text", e.target.value)
                }
                rows={3}
              />
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

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview
          </CardTitle>
          <CardDescription>See how your certificate will look</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg overflow-auto">
            <CertificatePreview
              template={template}
              previewData={previewData}
              className="transform scale-75 origin-center"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button
          variant="outline"
          onClick={handlePreview}
          className="flex items-center gap-2 bg-black"
        >
          <Eye className="h-4 w-4" />
          Full Preview
        </Button>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Award className="h-4 w-4" />
          Save Template
        </Button>
      </div>
    </div>
  );
}
