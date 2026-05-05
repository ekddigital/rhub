"use client";

import { TemplateData } from "@/lib/creative/certificates/template-builder/certificate";
import { Input } from "@/components/creative/ui/input";
import { Label } from "@/components/creative/ui/label";
import { Button } from "@/components/creative/ui/button";
import { Separator } from "@/components/creative/ui/separator";

interface TemplatePropertiesPanelProps {
  templateData: TemplateData;
  updateTemplateData: (data: TemplateData) => void;
}

export function TemplatePropertiesPanel({
  templateData,
  updateTemplateData,
}: TemplatePropertiesPanelProps) {
  const handlePageSettingChange = (
    property: keyof typeof templateData.pageSettings,
    value: number | string | Record<string, unknown>
  ) => {
    updateTemplateData({
      ...templateData,
      pageSettings: {
        ...templateData.pageSettings,
        [property]: value,
      },
    });
  };

  const handleMarginChange = (
    edge: "top" | "right" | "bottom" | "left",
    value: number
  ) => {
    updateTemplateData({
      ...templateData,
      pageSettings: {
        ...templateData.pageSettings,
        margin: {
          ...templateData.pageSettings.margin,
          [edge]: value,
        },
      },
    });
  };

  const handleBackgroundColorChange = (color: string) => {
    updateTemplateData({
      ...templateData,
      pageSettings: {
        ...templateData.pageSettings,
        background: {
          ...templateData.pageSettings.background,
          color,
        },
      },
    });
  };

  const handleBackgroundImageChange = (image: string) => {
    updateTemplateData({
      ...templateData,
      pageSettings: {
        ...templateData.pageSettings,
        background: {
          ...templateData.pageSettings.background,
          image,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Page Settings
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="page-width"
                className="text-xs font-medium text-gray-700"
              >
                Width (px)
              </Label>
              <Input
                id="page-width"
                type="number"
                value={templateData.pageSettings.width}
                onChange={(e) =>
                  handlePageSettingChange("width", parseInt(e.target.value))
                }
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="page-height"
                className="text-xs font-medium text-gray-700"
              >
                Height (px)
              </Label>
              <Input
                id="page-height"
                type="number"
                value={templateData.pageSettings.height}
                onChange={(e) =>
                  handlePageSettingChange("height", parseInt(e.target.value))
                }
                className="h-8"
              />
            </div>
          </div>

          {/* Quick Size Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">
              Quick Presets
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateTemplateData({
                    ...templateData,
                    pageSettings: {
                      ...templateData.pageSettings,
                      width: 800,
                      height: 600,
                    },
                  });
                }}
                className="text-xs"
              >
                Standard (4:3)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateTemplateData({
                    ...templateData,
                    pageSettings: {
                      ...templateData.pageSettings,
                      width: 1000,
                      height: 600,
                    },
                  });
                }}
                className="text-xs"
              >
                Wide (5:3)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateTemplateData({
                    ...templateData,
                    pageSettings: {
                      ...templateData.pageSettings,
                      width: 1200,
                      height: 850,
                    },
                  });
                }}
                className="text-xs"
              >
                Landscape A4
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  updateTemplateData({
                    ...templateData,
                    pageSettings: {
                      ...templateData.pageSettings,
                      width: 600,
                      height: 800,
                    },
                  });
                }}
                className="text-xs"
              >
                Portrait
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Margins</h4>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label
                htmlFor="margin-top"
                className="text-xs font-medium text-gray-700"
              >
                Top (px)
              </Label>
              <Input
                id="margin-top"
                type="number"
                value={templateData.pageSettings.margin.top}
                onChange={(e) =>
                  handleMarginChange("top", parseInt(e.target.value))
                }
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="margin-right"
                className="text-xs font-medium text-gray-700"
              >
                Right (px)
              </Label>
              <Input
                id="margin-right"
                type="number"
                value={templateData.pageSettings.margin.right}
                onChange={(e) =>
                  handleMarginChange("right", parseInt(e.target.value))
                }
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="margin-bottom"
                className="text-xs font-medium text-gray-700"
              >
                Bottom (px)
              </Label>
              <Input
                id="margin-bottom"
                type="number"
                value={templateData.pageSettings.margin.bottom}
                onChange={(e) =>
                  handleMarginChange("bottom", parseInt(e.target.value))
                }
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="margin-left"
                className="text-xs font-medium text-gray-700"
              >
                Left (px)
              </Label>
              <Input
                id="margin-left"
                type="number"
                value={templateData.pageSettings.margin.left}
                onChange={(e) =>
                  handleMarginChange("left", parseInt(e.target.value))
                }
                className="h-8"
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Background</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="background-color">Background Color</Label>
            <div className="flex items-center gap-2">
              <Input
                id="background-color-picker"
                type="color"
                className="w-10 h-10 p-1"
                value={templateData.pageSettings.background?.color || "#ffffff"}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
              />
              <Input
                id="background-color"
                value={templateData.pageSettings.background?.color || "#ffffff"}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="background-image">Background Image URL</Label>
            <Input
              id="background-image"
              value={templateData.pageSettings.background?.image || ""}
              placeholder="Enter image URL"
              onChange={(e) => handleBackgroundImageChange(e.target.value)}
            />
          </div>

          {templateData.pageSettings.background?.image && (
            <div className="text-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBackgroundImageChange("")}
              >
                Remove Background Image
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-3">Presets</h3>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              updateTemplateData({
                ...templateData,
                pageSettings: {
                  ...templateData.pageSettings,
                  width: 800,
                  height: 600,
                },
              });
            }}
          >
            Standard 4:3 (800×600)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              updateTemplateData({
                ...templateData,
                pageSettings: {
                  ...templateData.pageSettings,
                  width: 1000,
                  height: 600,
                },
              });
            }}
          >
            Wide 5:3 (1000×600)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              updateTemplateData({
                ...templateData,
                pageSettings: {
                  ...templateData.pageSettings,
                  width: 1200,
                  height: 850,
                },
              });
            }}
          >
            Landscape A4 (1200×850)
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              updateTemplateData({
                ...templateData,
                pageSettings: {
                  ...templateData.pageSettings,
                  width: 600,
                  height: 800,
                },
              });
            }}
          >
            Portrait (600×800)
          </Button>
        </div>
      </div>
    </div>
  );
}
