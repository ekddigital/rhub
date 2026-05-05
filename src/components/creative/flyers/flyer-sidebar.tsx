"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/creative/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/creative/ui/tabs";
import { Badge } from "@/components/creative/ui/badge";
import {
  Settings,
  Palette,
  Image as ImageIcon,
  Layers,
  Sparkles,
  LayoutTemplate,
} from "lucide-react";
import { FlyerElementPanel } from "./flyer-element-panel";
import { FlyerTemplateSelector } from "./flyer-template-selector";
import { FlyerStylesPanel } from "./flyer-styles-panel";
import { FlyerAssetsPanel } from "./flyer-assets-panel";
import { LayersPanel } from "./layers-panel";
import { FlyerTemplateData } from "./flyer-preview";
import { FlyerTemplateKey } from "./flyer-templates";

interface FlyerSidebarProps {
  selectedElementId: string | null;
  selectedTemplateKey: FlyerTemplateKey;
  template: FlyerTemplateData;
  onTemplateChange: (key: FlyerTemplateKey) => void;
  onUpdateElement: (
    elementId: string,
    updates: Record<string, unknown>
  ) => void;
  onDuplicateElement: (elementId: string) => void;
  onDeleteElement: (elementId: string) => void;
  onUpdateTemplate: (path: string, value: unknown) => void;
  onElementSelect: (id: string | null) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onReorderLayers: (fromIndex: number, toIndex: number) => void;
}

export function FlyerSidebar({
  selectedElementId,
  selectedTemplateKey,
  template,
  onTemplateChange,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
  onUpdateTemplate,
  onElementSelect,
  onToggleVisibility,
  onToggleLock,
  onReorderLayers,
}: FlyerSidebarProps) {
  const [activeTab, setActiveTab] = useState<string>("design");

  // Auto-switch to element tab when element is selected
  useEffect(() => {
    if (selectedElementId) {
      setActiveTab("element");
    }
  }, [selectedElementId]);

  return (
    <Card className="sticky top-24 shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Design Studio
          {selectedElementId && (
            <Badge variant="secondary" className="ml-auto text-xs">
              Element Selected
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Professional flyer design tools at your fingertips
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/50">
            <TabsTrigger
              value="design"
              className="flex-col gap-1 py-2 data-[state=active]:bg-background"
            >
              <LayoutTemplate className="w-4 h-4" />
              <span className="text-xs">Design</span>
            </TabsTrigger>
            <TabsTrigger
              value="assets"
              className="flex-col gap-1 py-2 data-[state=active]:bg-background"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs">Assets</span>
            </TabsTrigger>
            <TabsTrigger
              value="element"
              className="flex-col gap-1 py-2 data-[state=active]:bg-background"
              disabled={!selectedElementId}
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Element</span>
            </TabsTrigger>
            <TabsTrigger
              value="styles"
              className="flex-col gap-1 py-2 data-[state=active]:bg-background"
            >
              <Palette className="w-4 h-4" />
              <span className="text-xs">Styles</span>
            </TabsTrigger>
            <TabsTrigger
              value="layers"
              className="flex-col gap-1 py-2 data-[state=active]:bg-background"
            >
              <Layers className="w-4 h-4" />
              <span className="text-xs">Layers</span>
            </TabsTrigger>
          </TabsList>

          <div className="h-[calc(100vh-320px)] overflow-y-auto">
            {/* Design Tab - Templates & Quick Settings */}
            <TabsContent value="design" className="m-0 p-4 space-y-4">
              <FlyerTemplateSelector
                selectedTemplateKey={selectedTemplateKey}
                onTemplateChange={onTemplateChange}
                template={template}
                onUpdateTemplate={onUpdateTemplate}
              />
            </TabsContent>

            {/* Assets Tab - Image Library & Upload */}
            <TabsContent value="assets" className="m-0 p-4 space-y-4">
              <FlyerAssetsPanel
                template={template}
                onUpdateTemplate={onUpdateTemplate}
              />
            </TabsContent>

            {/* Element Tab - Element-specific controls */}
            <TabsContent value="element" className="m-0 p-4 space-y-4">
              {selectedElementId ? (
                <FlyerElementPanel
                  selectedElementId={selectedElementId}
                  template={template}
                  onUpdateElement={onUpdateElement}
                  onDuplicateElement={onDuplicateElement}
                  onDeleteElement={onDeleteElement}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Settings className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">
                    Select an element to edit its properties
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Styles Tab - Global styling options */}
            <TabsContent value="styles" className="m-0 p-4 space-y-4">
              <FlyerStylesPanel
                template={template}
                onUpdateTemplate={onUpdateTemplate}
              />
            </TabsContent>

            {/* Layers Tab - Layer management */}
            <TabsContent value="layers" className="m-0 p-4 space-y-4">
              <LayersPanel
                template={template}
                selectedElementId={selectedElementId}
                onElementSelect={(id) => onElementSelect(id)}
                onToggleVisibility={onToggleVisibility}
                onToggleLock={onToggleLock}
                onDelete={onDeleteElement}
                onReorder={onReorderLayers}
                inline={true}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
