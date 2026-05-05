"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { Label } from "@/components/creative/ui/label";
import { Input } from "@/components/creative/ui/input";
import { Textarea } from "@/components/creative/ui/textarea";
import { Button } from "@/components/creative/ui/button";
import { Separator } from "@/components/creative/ui/separator";
import { Badge } from "@/components/creative/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import {
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import type { FlyerTemplateData } from "./flyer-preview";

type TextAlignment = FlyerTemplateData["content"]["headline"]["align"];

interface ElementData extends Record<string, unknown> {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  align?: TextAlignment;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
  visible?: boolean;
  logo?: string;
  logoSize?: number;
  companyName?: string;
  size?: { width: number; height: number };
  url?: string;
  type?: string;
}

type AdditionalTextBlock = NonNullable<
  FlyerTemplateData["content"]["additionalTextBlocks"]
>[number];

interface ElementPanelProps {
  selectedElementId: string | null;
  template: FlyerTemplateData;
  onUpdateElement: (elementId: string, updates: Partial<ElementData>) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
}

export function FlyerElementPanel({
  selectedElementId,
  template,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
}: ElementPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;

        // Update based on element type
        if (selectedElementId === "logo") {
          onUpdateElement(selectedElementId, { logo: imageUrl });
        } else if (selectedElementId === "qrCode") {
          onUpdateElement(selectedElementId, { url: imageUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!selectedElementId) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Click any element in the preview to edit its properties</p>
      </div>
    );
  }

  // Find the selected element
  let element: ElementData | null = null;
  let elementType: string = "";
  let isOriginal = false;

  // Check if it's an original element
  if (selectedElementId === "headline") {
    element = template.content.headline;
    elementType = "Headline";
    isOriginal = true;
  } else if (selectedElementId === "subheadline") {
    element = template.content.subheadline ?? null;
    elementType = "Subheadline";
    isOriginal = true;
  } else if (selectedElementId === "body") {
    element = template.content.body;
    elementType = "Body Text";
    isOriginal = true;
  } else if (selectedElementId === "callToAction") {
    element = template.content.callToAction ?? null;
    elementType = "Call to Action";
    isOriginal = true;
  } else if (selectedElementId === "contactInfo") {
    element = template.content.contactInfo ?? null;
    elementType = "Contact Info";
    isOriginal = true;
  } else if (selectedElementId === "logo") {
    element = template.branding;
    elementType = "Logo";
    isOriginal = true;
  } else if (selectedElementId === "companyName") {
    element = template.branding;
    elementType = "Company Name";
    isOriginal = true;
  } else if (selectedElementId === "qrCode") {
    element = template.graphics?.qrCode ?? null;
    elementType = "QR Code";
    isOriginal = true;
  } else {
    // Check in additional text blocks
    const duplicate: AdditionalTextBlock | undefined =
      template.content.additionalTextBlocks?.find(
        (block) => block.id === selectedElementId
      );
    if (duplicate) {
      element = duplicate;
      elementType = `${
        duplicate.type.charAt(0).toUpperCase() + duplicate.type.slice(1)
      } (Duplicate)`;
      isOriginal = false;
    }
  }

  if (!element) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>Element not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Element Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">{elementType}</h3>
          {!isOriginal && (
            <Badge variant="secondary" className="text-xs mt-1">
              Duplicate Element
            </Badge>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDuplicateElement(selectedElementId)}
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </Button>
          {!isOriginal && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDeleteElement(selectedElementId)}
              title="Delete"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Image Upload for Logo or QR Code */}
      {(selectedElementId === "logo" || selectedElementId === "qrCode") && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {selectedElementId === "logo" ? "Logo Image" : "QR Code Image"}
          </Label>

          {/* Current Image Preview */}
          {selectedElementId === "logo" && element.logo && (
            <div className="relative border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 h-24">
              <Image
                src={element.logo}
                alt="Current logo"
                fill
                unoptimized
                className="object-contain"
                sizes="160px"
              />
            </div>
          )}

          {selectedElementId === "qrCode" && element?.url && (
            <div className="relative border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 h-32">
              <Image
                src={element.url}
                alt="Current QR code"
                fill
                unoptimized
                className="object-contain"
                sizes="200px"
              />
            </div>
          )}

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            {(selectedElementId === "logo" && element.logo) ||
            (selectedElementId === "qrCode" && element?.url)
              ? "Replace Image"
              : "Upload Image"}
          </Button>

          {/* Image URL Input (alternative) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Or enter image URL:
            </Label>
            <Input
              type="url"
              placeholder="https://example.com/image.png"
              value={
                selectedElementId === "logo"
                  ? element.logo ?? ""
                  : element?.url ?? ""
              }
              onChange={(e) => {
                if (selectedElementId === "logo") {
                  onUpdateElement(selectedElementId, { logo: e.target.value });
                } else if (selectedElementId === "qrCode") {
                  onUpdateElement(selectedElementId, { url: e.target.value });
                }
              }}
            />
          </div>

          {/* Size Controls */}
          {selectedElementId === "logo" && (
            <div className="space-y-2">
              <Label>Logo Size: {element.logoSize ?? 80}px</Label>
              <Input
                type="range"
                min="30"
                max="300"
                value={element.logoSize ?? 80}
                onChange={(e) =>
                  onUpdateElement(selectedElementId, {
                    logoSize: parseInt(e.target.value, 10),
                  })
                }
              />
            </div>
          )}

          {selectedElementId === "qrCode" &&
            element.size &&
            (() => {
              const currentSize = element.size;
              if (!currentSize) {
                return null;
              }
              return (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Width: {currentSize.width}px</Label>
                    <Input
                      type="range"
                      min="50"
                      max="300"
                      value={currentSize.width}
                      onChange={(e) =>
                        onUpdateElement(selectedElementId, {
                          size: {
                            ...currentSize,
                            width: parseInt(e.target.value, 10),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height: {currentSize.height}px</Label>
                    <Input
                      type="range"
                      min="50"
                      max="300"
                      value={currentSize.height}
                      onChange={(e) =>
                        onUpdateElement(selectedElementId, {
                          size: {
                            ...currentSize,
                            height: parseInt(e.target.value, 10),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              );
            })()}
        </div>
      )}

      <Separator />

      {/* Text Content */}
      {(element.text !== undefined ||
        selectedElementId === "headline" ||
        selectedElementId === "body") && (
        <div className="space-y-2">
          <Label>Text Content</Label>
          <Textarea
            value={element.text || ""}
            onChange={(e) =>
              onUpdateElement(selectedElementId, { text: e.target.value })
            }
            rows={4}
            placeholder="Enter text..."
          />
        </div>
      )}

      {/* Font Size */}
      {element.fontSize !== undefined && (
        <div className="space-y-2">
          <Label>Font Size: {element.fontSize}px</Label>
          <Input
            type="range"
            min="8"
            max="120"
            value={element.fontSize}
            onChange={(e) =>
              onUpdateElement(selectedElementId, {
                fontSize: parseInt(e.target.value, 10),
              })
            }
          />
        </div>
      )}

      {/* Text Color */}
      {element.color !== undefined && (
        <div className="space-y-2">
          <Label>Text Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={element.color}
              onChange={(e) =>
                onUpdateElement(selectedElementId, { color: e.target.value })
              }
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={element.color}
              onChange={(e) => {
                const hex = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                  onUpdateElement(selectedElementId, { color: hex });
                }
              }}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Background Color (for CTA buttons) */}
      {element.backgroundColor !== undefined && (
        <div className="space-y-2">
          <Label>Background Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={element.backgroundColor}
              onChange={(e) =>
                onUpdateElement(selectedElementId, {
                  backgroundColor: e.target.value,
                })
              }
              className="w-20 h-10 cursor-pointer"
            />
            <Input
              type="text"
              value={element.backgroundColor}
              onChange={(e) => {
                const hex = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(hex) || hex === "#") {
                  onUpdateElement(selectedElementId, { backgroundColor: hex });
                }
              }}
              placeholder="#000000"
              className="flex-1"
            />
          </div>
        </div>
      )}

      {/* Text Alignment */}
      {element.align !== undefined && (
        <div className="space-y-2">
          <Label>Text Alignment</Label>
          <Select
            value={element.align}
            onValueChange={(value) =>
              onUpdateElement(selectedElementId, {
                align: value as TextAlignment,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Font Family */}
      {element.fontFamily !== undefined && (
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select
            value={element.fontFamily}
            onValueChange={(value) =>
              onUpdateElement(selectedElementId, { fontFamily: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
              <SelectItem value="'Times New Roman', serif">
                Times New Roman
              </SelectItem>
              <SelectItem value="'Courier New', monospace">
                Courier New
              </SelectItem>
              <SelectItem value="Georgia, serif">Georgia</SelectItem>
              <SelectItem value="'Trebuchet MS', sans-serif">
                Trebuchet MS
              </SelectItem>
              <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
              <SelectItem value="'Comic Sans MS', cursive">
                Comic Sans
              </SelectItem>
              <SelectItem value="Impact, sans-serif">Impact</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Button Size (for CTA) */}
      {element.width !== undefined && element.height !== undefined && (
        <>
          <div className="space-y-2">
            <Label>Button Width: {element.width}px</Label>
            <Input
              type="range"
              min="100"
              max="500"
              value={element.width}
              onChange={(e) =>
                onUpdateElement(selectedElementId, {
                  width: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Button Height: {element.height}px</Label>
            <Input
              type="range"
              min="30"
              max="100"
              value={element.height}
              onChange={(e) =>
                onUpdateElement(selectedElementId, {
                  height: parseInt(e.target.value, 10),
                })
              }
            />
          </div>
        </>
      )}

      {/* Position */}
      {element.position &&
        (() => {
          const position = element.position;
          if (!position) {
            return null;
          }
          return (
            <div className="space-y-2">
              <Label>Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">X: {position.x}px</Label>
                  <Input
                    type="number"
                    value={position.x}
                    onChange={(e) =>
                      onUpdateElement(selectedElementId, {
                        position: {
                          ...position,
                          x: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Y: {position.y}px</Label>
                  <Input
                    type="number"
                    value={position.y}
                    onChange={(e) =>
                      onUpdateElement(selectedElementId, {
                        position: {
                          ...position,
                          y: parseInt(e.target.value, 10) || 0,
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          );
        })()}

      {/* Visibility Toggle */}
      {!isOriginal && element.visible !== undefined && (
        <div className="space-y-2">
          <Button
            variant={element.visible !== false ? "default" : "outline"}
            className="w-full"
            onClick={() =>
              onUpdateElement(selectedElementId, {
                visible: !(element.visible !== false),
              })
            }
          >
            {element.visible !== false ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Visible
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Hidden
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
