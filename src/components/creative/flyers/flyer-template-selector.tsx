"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Label } from "@/components/creative/ui/label";
import { Button } from "@/components/creative/ui/button";
import { Input } from "@/components/creative/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Separator } from "@/components/creative/ui/separator";
import { FileImage, Upload, Image as ImageIcon } from "lucide-react";
import { FlyerTemplateKey } from "./flyer-templates";
import type { FlyerTemplateData } from "./flyer-preview";

interface FlyerTemplateSelectorProps {
  selectedTemplateKey: FlyerTemplateKey;
  onTemplateChange: (key: FlyerTemplateKey) => void;
  template?: FlyerTemplateData;
  onUpdateTemplate?: (path: string, value: unknown) => void;
}

export function FlyerTemplateSelector({
  selectedTemplateKey,
  onTemplateChange,
  template,
  onUpdateTemplate,
}: FlyerTemplateSelectorProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        if (onUpdateTemplate) {
          onUpdateTemplate("branding.logo", imageUrl);
          toast("Logo Updated!", { description: "Your logo has been uploaded successfully." });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle background image upload
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        if (onUpdateTemplate) {
          onUpdateTemplate("layout.backgroundImage", imageUrl);
          toast("Background Updated!", { description: "Background image has been uploaded successfully." });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <FileImage className="w-4 h-4" />
          Template
        </Label>
        <Select
          value={selectedTemplateKey}
          onValueChange={(value) => onTemplateChange(value as FlyerTemplateKey)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modernEvent">🎯 Modern Event</SelectItem>
            <SelectItem value="vibrantPromotion">
              🔥 Vibrant Promotion
            </SelectItem>
            <SelectItem value="elegantService">✨ Elegant Service</SelectItem>
            <SelectItem value="boldAnnouncement">
              📢 Bold Announcement
            </SelectItem>
            <SelectItem value="minimalProduct">🎨 Minimal Product</SelectItem>
            <SelectItem value="jicfEvent">⛪ JICF Church Event</SelectItem>
            <SelectItem value="jicfWorship">🙏 JICF Worship Night</SelectItem>
            <SelectItem value="jicfAnnouncement">
              📖 JICF Announcement
            </SelectItem>
            <SelectItem value="sportsEvent">⚽ Sports Event</SelectItem>
            <SelectItem value="corporateCurved">💼 Corporate Curved</SelectItem>
            <SelectItem value="qrCodeEvent">📱 QR Code Event</SelectItem>
            <SelectItem value="gradientEvent">🌈 Gradient Event</SelectItem>
            <SelectItem value="detailedEvent">🎟️ Detailed Event</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Quick Upload Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Quick Upload
        </Label>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label className="text-sm">Upload Logo</Label>
          {template?.branding?.logo && (
            <div className="relative border rounded-lg p-3 bg-gray-50 dark:bg-gray-900 mb-2 h-16">
              <Image
                src={template.branding.logo}
                alt="Current logo"
                fill
                unoptimized
                className="object-contain"
                sizes="120px"
              />
            </div>
          )}
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => logoInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {template?.branding?.logo ? "Replace Logo" : "Upload Logo"}
          </Button>
        </div>

        {/* Background Image Upload */}
        <div className="space-y-2">
          <Label className="text-sm">Upload Background</Label>
          {template?.layout?.backgroundImage && (
            <div className="relative border rounded-lg p-3 bg-gray-50 dark:bg-gray-900 mb-2 h-16">
              <Image
                src={template.layout.backgroundImage}
                alt="Current background"
                fill
                unoptimized
                className="object-cover rounded"
                sizes="160px"
              />
            </div>
          )}
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*"
            onChange={handleBgUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => bgInputRef.current?.click()}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {template?.layout?.backgroundImage
              ? "Replace Background"
              : "Upload Background"}
          </Button>
        </div>

        {/* Background Color */}
        {template?.layout?.backgroundColor && onUpdateTemplate && (
          <div className="space-y-2">
            <Label className="text-sm">Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={template.layout.backgroundColor}
                onChange={(e) =>
                  onUpdateTemplate("layout.backgroundColor", e.target.value)
                }
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={template.layout.backgroundColor}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                    onUpdateTemplate("layout.backgroundColor", hex);
                  }
                }}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Instructions */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">How It Works</Label>
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              📸 Image Uploads
            </p>
            <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-200">
              <li>
                • <strong>Logo:</strong> Upload using the button above
              </li>
              <li>
                • <strong>Background:</strong> Add a background image
              </li>
              <li>
                • <strong>QR Code:</strong> Click QR element in preview to
                upload
              </li>
            </ul>
          </div>
        </div>
      </div>

      <Separator />

      <div className="text-sm text-muted-foreground p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="font-medium mb-2">💡 Quick Tips:</p>
        <ul className="space-y-1 text-xs">
          <li>
            • <strong>Click elements</strong> to edit properties
          </li>
          <li>
            • <strong>Drag</strong> to reposition
          </li>
          <li>
            • <strong>Right-click</strong> for quick actions
          </li>
          <li>
            • <strong>Cmd/Ctrl+D</strong> to duplicate
          </li>
          <li>
            • <strong>Delete key</strong> to remove duplicates
          </li>
          <li>
            • <strong>Arrow keys</strong> to nudge position
          </li>
        </ul>
      </div>
    </div>
  );
}
