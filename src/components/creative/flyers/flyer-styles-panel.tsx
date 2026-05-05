"use client";

import React from "react";
import { Label } from "@/components/creative/ui/label";
import { Button } from "@/components/creative/ui/button";

import { Separator } from "@/components/creative/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/creative/ui/select";
import { Badge } from "@/components/creative/ui/badge";
import { toast } from "sonner";
import {
  Type,
  Palette,
  Layers,
  Sparkles,
  Check,
  Plus,
  Save,
} from "lucide-react";
import { FlyerTemplateData } from "./flyer-preview";

interface FlyerStylesPanelProps {
  template: FlyerTemplateData;
  onUpdateTemplate: (path: string, value: unknown) => void;
}

// Professional font families used in design tools
const FONT_FAMILIES = [
  { value: "Inter", label: "Inter (Modern)", category: "Sans-serif" },
  { value: "Roboto", label: "Roboto (Clean)", category: "Sans-serif" },
  { value: "Poppins", label: "Poppins (Friendly)", category: "Sans-serif" },
  { value: "Montserrat", label: "Montserrat (Bold)", category: "Sans-serif" },
  { value: "Open Sans", label: "Open Sans (Readable)", category: "Sans-serif" },
  { value: "Lato", label: "Lato (Professional)", category: "Sans-serif" },
  { value: "Raleway", label: "Raleway (Elegant)", category: "Sans-serif" },
  { value: "Playfair Display", label: "Playfair Display", category: "Serif" },
  { value: "Merriweather", label: "Merriweather", category: "Serif" },
  { value: "Lora", label: "Lora (Classic)", category: "Serif" },
  { value: "Georgia", label: "Georgia", category: "Serif" },
  { value: "Times New Roman", label: "Times New Roman", category: "Serif" },
  { value: "Pacifico", label: "Pacifico (Script)", category: "Display" },
  { value: "Dancing Script", label: "Dancing Script", category: "Display" },
  { value: "Bebas Neue", label: "Bebas Neue (Impact)", category: "Display" },
];

// Popular color palettes inspired by professional design tools
const COLOR_PALETTES = [
  {
    name: "Professional Blue",
    colors: ["#1e40af", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"],
  },
  {
    name: "Vibrant Orange",
    colors: ["#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa"],
  },
  {
    name: "Modern Purple",
    colors: ["#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"],
  },
  {
    name: "Fresh Green",
    colors: ["#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0"],
  },
  {
    name: "Elegant Pink",
    colors: ["#db2777", "#ec4899", "#f472b6", "#f9a8d4", "#fbcfe8"],
  },
  {
    name: "Bold Red",
    colors: ["#dc2626", "#ef4444", "#f87171", "#fca5a5", "#fecaca"],
  },
  {
    name: "Sophisticated Gray",
    colors: ["#1f2937", "#374151", "#6b7280", "#9ca3af", "#d1d5db"],
  },
  {
    name: "Sunset Gradient",
    colors: ["#f59e0b", "#f97316", "#dc2626", "#db2777", "#a855f7"],
  },
];

export function FlyerStylesPanel({
  template,
  onUpdateTemplate,
}: FlyerStylesPanelProps) {
  // Get current font family from template
  const getCurrentFont = () => {
    return template.content?.headline?.fontFamily || "Inter";
  };

  const handleApplyFontToAll = (fontFamily: string) => {
    // Update all text properties with new font
    onUpdateTemplate("content.headline.fontFamily", fontFamily);
    if (template.content?.subheadline) {
      onUpdateTemplate("content.subheadline.fontFamily", fontFamily);
    }
    if (template.content?.body) {
      onUpdateTemplate("content.body.fontFamily", fontFamily);
    }
    if (template.content?.callToAction) {
      onUpdateTemplate("content.callToAction.fontFamily", fontFamily);
    }
    if (template.branding?.companyName) {
      onUpdateTemplate("branding.companyNameFontFamily", fontFamily);
    }

    toast("Font Applied!", { description: `${fontFamily} has been applied to all text elements.` });
  };

  const handleApplyColorPalette = (palette: string[], paletteName: string) => {
    // Apply color palette to template
    // This is a smart function that distributes colors across elements
    if (palette.length >= 3) {
      // Background - use lightest color
      onUpdateTemplate(
        "layout.backgroundColor",
        palette[4] || palette[3] || "#ffffff"
      );

      // Headline - use darkest/boldest color
      onUpdateTemplate("content.headline.color", palette[0]);

      // Subheadline - use secondary color
      if (template.content?.subheadline) {
        onUpdateTemplate("content.subheadline.color", palette[1]);
      }

      // Body text - use readable color
      if (template.content?.body) {
        onUpdateTemplate("content.body.color", palette[2]);
      }

      // CTA Button - use primary color with white text
      if (template.content?.callToAction) {
        onUpdateTemplate("content.callToAction.backgroundColor", palette[0]);
        onUpdateTemplate("content.callToAction.color", "#ffffff");
      }

      toast("Color Palette Applied!", { description: `${paletteName} palette has been applied to your design.` });
    }
  };

  // Count unique fonts used
  const getUniqueFonts = () => {
    const fonts = new Set<string>();
    if (template.content?.headline?.fontFamily)
      fonts.add(template.content.headline.fontFamily);
    if (template.content?.subheadline?.fontFamily)
      fonts.add(template.content.subheadline.fontFamily);
    if (template.content?.body?.fontFamily)
      fonts.add(template.content.body.fontFamily);
    return fonts.size;
  };

  // Count unique colors used
  const getUniqueColors = () => {
    const colors = new Set<string>();
    if (template.content?.headline?.color)
      colors.add(template.content.headline.color);
    if (template.content?.subheadline?.color)
      colors.add(template.content.subheadline.color);
    if (template.content?.body?.color) colors.add(template.content.body.color);
    if (template.layout?.backgroundColor)
      colors.add(template.layout.backgroundColor);
    return colors.size;
  };

  return (
    <div className="space-y-6">
      {/* Typography Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Type className="w-4 h-4" />
          Typography
        </Label>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm">Font Family</Label>
            <Select
              value={getCurrentFont()}
              onValueChange={handleApplyFontToAll}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <div className="p-2 text-xs font-semibold text-muted-foreground">
                  Sans-serif Fonts
                </div>
                {FONT_FAMILIES.filter((f) => f.category === "Sans-serif").map(
                  (font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  )
                )}
                <Separator className="my-2" />
                <div className="p-2 text-xs font-semibold text-muted-foreground">
                  Serif Fonts
                </div>
                {FONT_FAMILIES.filter((f) => f.category === "Serif").map(
                  (font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  )
                )}
                <Separator className="my-2" />
                <div className="p-2 text-xs font-semibold text-muted-foreground">
                  Display Fonts
                </div>
                {FONT_FAMILIES.filter((f) => f.category === "Display").map(
                  (font) => (
                    <SelectItem key={font.value} value={font.value}>
                      <span style={{ fontFamily: font.value }}>
                        {font.label}
                      </span>
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changes apply to all text elements
            </p>
          </div>

          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              💡 <strong>Pro Tip:</strong> Use sans-serif fonts (Inter, Roboto)
              for modern looks, serif fonts (Playfair, Merriweather) for
              elegance, and display fonts sparingly for impact.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Color Palettes Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Color Palettes
        </Label>

        <div className="space-y-3">
          {COLOR_PALETTES.map((palette) => (
            <div
              key={palette.name}
              className="border rounded-lg p-3 hover:border-primary transition-colors group"
            >
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium group-hover:text-primary transition-colors">
                  {palette.name}
                </Label>
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs"
                  onClick={() =>
                    handleApplyColorPalette(palette.colors, palette.name)
                  }
                >
                  <Check className="w-3 h-3 mr-1" />
                  Apply
                </Button>
              </div>
              <div className="flex gap-1">
                {palette.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex-1 h-8 rounded border border-gray-200 dark:border-gray-700 shadow-sm hover:scale-105 transition-transform cursor-pointer"
                    style={{ backgroundColor: color }}
                    title={color}
                    onClick={() => {
                      navigator.clipboard.writeText(color);
                      toast("Color Copied!", { description: `${color} copied to clipboard.` });
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-900 dark:text-amber-100">
            ✨ <strong>Smart Colors:</strong> Clicking a palette automatically
            applies colors to your background, heading, and text elements for
            instant harmony.
          </p>
        </div>
      </div>

      <Separator />

      {/* Quick Actions */}
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Quick Actions
        </Label>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <Save className="w-3 h-3 mr-2" />
            Save Style
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Plus className="w-3 h-3 mr-2" />
            New Preset
          </Button>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-2 font-medium">
            🎨 Design System
          </p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Fonts used:</span>
              <Badge variant="secondary" className="text-xs h-5">
                {getUniqueFonts()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Colors used:</span>
              <Badge variant="secondary" className="text-xs h-5">
                {getUniqueColors()}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tips */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
        <p className="font-semibold text-sm mb-2 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Design Best Practices
        </p>
        <ul className="space-y-1 text-xs text-muted-foreground">
          <li>• Limit to 2-3 fonts maximum for cohesive design</li>
          <li>• Use color palettes for visual harmony</li>
          <li>• Ensure sufficient contrast for readability</li>
          <li>• Keep brand colors consistent across elements</li>
          <li>• Test designs at different sizes</li>
        </ul>
      </div>
    </div>
  );
}
