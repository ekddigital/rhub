import { useState } from "react";
import { FlyerTemplateData } from "../flyer-preview";
import { flyerTemplates, FlyerTemplateKey } from "../flyer-templates";

export function useFlyerTemplate(
  initialTemplate: FlyerTemplateKey = "modernEvent"
) {
  const [selectedTemplateKey, setSelectedTemplateKey] =
    useState<FlyerTemplateKey>(initialTemplate);
  const [template, setTemplate] = useState<FlyerTemplateData>(
    JSON.parse(JSON.stringify(flyerTemplates[initialTemplate]))
  );

  const handleTemplateChange = (key: FlyerTemplateKey) => {
    setSelectedTemplateKey(key);
    setTemplate(JSON.parse(JSON.stringify(flyerTemplates[key])));
  };

  const updateTemplate = (path: string, value: unknown) => {
    setTemplate((prev) => {
      const updated = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let current: Record<string, unknown> = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const resetTemplate = () => {
    setTemplate(
      JSON.parse(JSON.stringify(flyerTemplates[selectedTemplateKey]))
    );
  };

  return {
    selectedTemplateKey,
    template,
    handleTemplateChange,
    updateTemplate,
    resetTemplate,
  };
}
