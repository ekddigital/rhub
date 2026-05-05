"use client";

import { useState } from "react";
import { TemplateElement } from "@/lib/creative/certificates/template-builder/certificate";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Button } from "@/components/creative/ui/button";
import { CustomSlider } from "./custom-slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/creative/ui/tabs";
import { Trash2, CopyIcon, ArrowUp, ArrowDown } from "lucide-react";

interface ElementPropertiesPanelProps {
  element: TemplateElement;
  updateElement: (element: TemplateElement) => void;
  deleteElement: (elementId: string) => void;
  templateData?: { pageSettings: { width: number; height: number } }; // Add template data for canvas dimensions
}

export function ElementPropertiesPanel({
  element,
  updateElement,
  deleteElement,
  templateData,
}: ElementPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState("style");

  // Get canvas dimensions for responsive positioning
  const canvasWidth = templateData?.pageSettings.width || 800;
  const canvasHeight = templateData?.pageSettings.height || 600;

  const handlePositionChange = (
    property: "x" | "y" | "width" | "height",
    value: number
  ) => {
    console.log(`Updating ${property} to ${value}`); // Debug log
    updateElement({
      ...element,
      position: {
        ...element.position,
        [property]: value,
      },
    });
  };

  const handleMultiplePositionChanges = (
    changes: Partial<{ x: number; y: number; width: number; height: number }>
  ) => {
    console.log("Updating multiple positions:", changes); // Debug log
    updateElement({
      ...element,
      position: {
        ...element.position,
        ...changes,
      },
    });
  };

  const handleStyleChange = (
    property: keyof TemplateElement["style"],
    value: string | number | boolean
  ) => {
    updateElement({
      ...element,
      style: {
        ...element.style,
        [property]: value,
      },
    });
  };

  const handleContentChange = (content: string) => {
    updateElement({
      ...element,
      content,
    });
  };

  return (
    <div className="space-y-4">
      {/* Element Header */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {element.type.charAt(0).toUpperCase() + element.type.slice(1)}{" "}
            Element
          </h3>
          <p className="text-xs text-gray-500 mt-1">ID: {element.id}</p>
        </div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const clonedElement = {
                ...element,
                id: `element-${Date.now()}`,
                position: {
                  ...element.position,
                  x: element.position.x + 20,
                  y: element.position.y + 20,
                },
              };
              updateElement(clonedElement);
            }}
            title="Duplicate element"
          >
            <CopyIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => deleteElement(element.id)}
            title="Delete element"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-4">
          <TabsTrigger value="style" className="text-xs">
            Style
          </TabsTrigger>
          <TabsTrigger value="position" className="text-xs">
            Position
          </TabsTrigger>
          <TabsTrigger value="content" className="text-xs">
            Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-4">
          {element.type === "text" && (
            <>
              <div className="space-y-2">
                <Label
                  htmlFor="font-family"
                  className="text-xs font-medium text-gray-700"
                >
                  Font Family
                </Label>
                <Select
                  value={element.style.fontFamily || "serif"}
                  onValueChange={(value) =>
                    handleStyleChange("fontFamily", value)
                  }
                >
                  <SelectTrigger
                    id="font-family"
                    className="h-8 bg-white border-gray-300"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem
                      value="serif"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Serif</span>
                    </SelectItem>
                    <SelectItem
                      value="sans-serif"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Sans Serif</span>
                    </SelectItem>
                    <SelectItem
                      value="monospace"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Monospace</span>
                    </SelectItem>
                    <SelectItem
                      value="cursive"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Cursive</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <CustomSlider
                label={`Font Size: ${element.style.fontSize || 16}px`}
                value={[element.style.fontSize || 16]}
                min={8}
                max={72}
                step={1}
                onValueChange={([value]) =>
                  handleStyleChange("fontSize", value)
                }
              />

              <div className="space-y-2">
                <Label
                  htmlFor="font-weight"
                  className="text-xs font-medium text-gray-700"
                >
                  Font Weight
                </Label>
                <Select
                  value={element.style.fontWeight || "normal"}
                  onValueChange={(value) =>
                    handleStyleChange("fontWeight", value)
                  }
                >
                  <SelectTrigger
                    id="font-weight"
                    className="bg-white border-gray-300"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem
                      value="normal"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Normal</span>
                    </SelectItem>
                    <SelectItem
                      value="bold"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Bold</span>
                    </SelectItem>
                    <SelectItem
                      value="lighter"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Lighter</span>
                    </SelectItem>
                    <SelectItem
                      value="bolder"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Bolder</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-align">Text Align</Label>
                <Select
                  value={element.style.textAlign || "left"}
                  onValueChange={(value) =>
                    handleStyleChange(
                      "textAlign",
                      value as "left" | "center" | "right"
                    )
                  }
                >
                  <SelectTrigger
                    id="text-align"
                    className="bg-white border-gray-300"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem
                      value="left"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Left</span>
                    </SelectItem>
                    <SelectItem
                      value="center"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Center</span>
                    </SelectItem>
                    <SelectItem
                      value="right"
                      className="hover:bg-blue-50 focus:bg-blue-50 cursor-pointer"
                    >
                      <span className="text-gray-900">Right</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="color"
                type="color"
                value={element.style.color || "#000000"}
                className="w-10 h-10 p-1"
                onChange={(e) => handleStyleChange("color", e.target.value)}
              />
              <Input
                type="text"
                value={element.style.color || "#000000"}
                className="flex-1"
                onChange={(e) => handleStyleChange("color", e.target.value)}
              />
            </div>
          </div>

          {element.type === "shape" && (
            <CustomSlider
              label={`Border Radius: ${element.style.borderRadius || 0}px`}
              value={[parseInt(String(element.style.borderRadius || "0"))]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) =>
                handleStyleChange("borderRadius", `${value}px`)
              }
            />
          )}

          {element.type === "text" && (
            <>
              <CustomSlider
                label={`Rotation: ${element.style.rotation || 0}°`}
                value={[element.style.rotation || 0]}
                min={0}
                max={360}
                step={1}
                onValueChange={([value]) =>
                  handleStyleChange("rotation", value)
                }
              />

              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700">
                  Flip
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={
                      element.style.flipHorizontal ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      handleStyleChange(
                        "flipHorizontal",
                        !element.style.flipHorizontal
                      )
                    }
                    className="text-xs"
                  >
                    Flip Horizontal
                  </Button>
                  <Button
                    variant={element.style.flipVertical ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      handleStyleChange(
                        "flipVertical",
                        !element.style.flipVertical
                      )
                    }
                    className="text-xs"
                  >
                    Flip Vertical
                  </Button>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="position" className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="position-x">X Position</Label>
              <Input
                id="position-x"
                type="number"
                value={element.position.x}
                onChange={(e) =>
                  handlePositionChange("x", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="position-y">Y Position</Label>
              <Input
                id="position-y"
                type="number"
                value={element.position.y}
                onChange={(e) =>
                  handlePositionChange("y", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={element.position.width}
                onChange={(e) =>
                  handlePositionChange("width", parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={element.position.height}
                onChange={(e) =>
                  handlePositionChange("height", parseInt(e.target.value))
                }
              />
            </div>
          </div>

          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePositionChange("y", element.position.y - 10)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePositionChange("y", element.position.y + 10)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Position Presets - Text Alignment */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium">
              Text Alignment Presets
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePositionChange("x", 200);
                  handlePositionChange("y", 80);
                  handleStyleChange("textAlign", "center");
                }}
              >
                Title Position
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePositionChange("x", 200);
                  handlePositionChange("y", 300);
                  handleStyleChange("textAlign", "center");
                }}
              >
                Center Content
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePositionChange("x", 100);
                  handlePositionChange("y", 480);
                  handleStyleChange("textAlign", "left");
                }}
              >
                Bottom Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePositionChange("x", 500);
                  handlePositionChange("y", 480);
                  handleStyleChange("textAlign", "right");
                }}
              >
                Bottom Right
              </Button>
            </div>
          </div>

          {/* Canvas Position Presets - Move Entire Textbox */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium">
              Canvas Position Presets
            </Label>
            <p className="text-xs text-gray-500 mb-2">
              Move entire textbox to canvas area
            </p>
            <div className="grid grid-cols-3 gap-2">
              {/* Top Row */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const margin = 50;
                  handleMultiplePositionChanges({
                    x: margin,
                    y: margin,
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Top Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const centerX = (canvasWidth - element.position.width) / 2;
                  handleMultiplePositionChanges({
                    x: Math.max(50, centerX),
                    y: 50,
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Top Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const rightX = canvasWidth - element.position.width - 50;
                  handleMultiplePositionChanges({
                    x: Math.max(50, rightX),
                    y: 50,
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Top Right
              </Button>

              {/* Middle Row */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const centerY = (canvasHeight - element.position.height) / 2;
                  handleMultiplePositionChanges({
                    x: 50,
                    y: Math.max(50, centerY),
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Mid Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const centerX = (canvasWidth - element.position.width) / 2;
                  const centerY = (canvasHeight - element.position.height) / 2;
                  handleMultiplePositionChanges({
                    x: Math.max(50, centerX),
                    y: Math.max(50, centerY),
                    width: Math.max(element.position.width, 300),
                  });
                }}
                className="text-xs"
              >
                Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const rightX = canvasWidth - element.position.width - 50;
                  const centerY = (canvasHeight - element.position.height) / 2;
                  handleMultiplePositionChanges({
                    x: Math.max(50, rightX),
                    y: Math.max(50, centerY),
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Mid Right
              </Button>

              {/* Bottom Row */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const bottomY = canvasHeight - element.position.height - 50;
                  handleMultiplePositionChanges({
                    x: 50,
                    y: Math.max(50, bottomY),
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Bottom Left
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const centerX = (canvasWidth - element.position.width) / 2;
                  const bottomY = canvasHeight - element.position.height - 50;
                  handleMultiplePositionChanges({
                    x: Math.max(50, centerX),
                    y: Math.max(50, bottomY),
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Bottom Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const rightX = canvasWidth - element.position.width - 50;
                  const bottomY = canvasHeight - element.position.height - 50;
                  handleMultiplePositionChanges({
                    x: Math.max(50, rightX),
                    y: Math.max(50, bottomY),
                    width: Math.max(element.position.width, 200),
                  });
                }}
                className="text-xs"
              >
                Bottom Right
              </Button>
            </div>
          </div>

          {/* Full Width Presets */}
          <div className="space-y-3 pt-4 border-t border-gray-200">
            <Label className="text-sm font-medium">Full Width Presets</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const margin = 50;
                  const fullWidth = canvasWidth - margin * 2;
                  handleMultiplePositionChanges({
                    x: margin,
                    y: Math.max(50, canvasHeight * 0.15),
                    width: fullWidth,
                  });
                  handleStyleChange("textAlign", "center");
                }}
                className="text-xs"
              >
                Full Width Top
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const margin = 50;
                  const fullWidth = canvasWidth - margin * 2;
                  handleMultiplePositionChanges({
                    x: margin,
                    y: Math.max(100, canvasHeight * 0.45),
                    width: fullWidth,
                  });
                  handleStyleChange("textAlign", "center");
                }}
                className="text-xs"
              >
                Full Width Center
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const margin = 50;
                  const fullWidth = canvasWidth - margin * 2;
                  handleMultiplePositionChanges({
                    x: margin,
                    y: Math.max(200, canvasHeight * 0.75),
                    width: fullWidth,
                  });
                  handleStyleChange("textAlign", "center");
                }}
                className="text-xs"
              >
                Full Width Bottom
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const centerMargin = canvasWidth * 0.125; // 12.5% margin on each side = 75% width
                  const centerWidth = canvasWidth * 0.75;
                  handleMultiplePositionChanges({
                    x: centerMargin,
                    y: element.position.y, // Keep current Y position
                    width: centerWidth,
                  });
                  handleStyleChange("textAlign", "center");
                }}
                className="text-xs"
              >
                Centered Width
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-4 pt-2">
          {element.type === "text" && (
            <div className="space-y-2">
              <Label htmlFor="text-content">Text Content</Label>
              <textarea
                id="text-content"
                className="w-full min-h-[100px] p-2 border rounded"
                value={element.content}
                onChange={(e) => handleContentChange(e.target.value)}
              />
            </div>
          )}

          {element.type === "image" && (
            <div className="space-y-2">
              <Label htmlFor="image-src">Image URL</Label>
              <Input
                id="image-src"
                type="text"
                value={element.content}
                placeholder="Enter image URL"
                onChange={(e) => handleContentChange(e.target.value)}
              />
              <Button className="w-full mt-2" variant="outline" size="sm">
                Upload Image
              </Button>
            </div>
          )}

          {element.type === "qr" && (
            <div className="p-4 bg-gray-50 rounded text-center text-sm">
              <p>
                QR code will be generated automatically with the certificate
                verification URL.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
