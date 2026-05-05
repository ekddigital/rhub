import { useState, useCallback, useEffect } from "react";
import { FlyerTemplateData } from "../flyer-preview";

interface HistoryState {
  past: FlyerTemplateData[];
  present: FlyerTemplateData;
  future: FlyerTemplateData[];
}

export function useFlyerHistory(initialTemplate: FlyerTemplateData) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialTemplate,
    future: [],
  });

  // Update present state and add to history
  const updateWithHistory = useCallback((newTemplate: FlyerTemplateData) => {
    setHistory((current) => ({
      past: [...current.past, current.present],
      present: newTemplate,
      future: [], // Clear future when making a new change
    }));
  }, []);

  // Undo action
  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  // Redo action
  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  // Reset history
  const resetHistory = useCallback((newTemplate: FlyerTemplateData) => {
    setHistory({
      past: [],
      present: newTemplate,
      future: [],
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        console.log("⏪ Undo triggered");
      } else if (modifier && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        console.log("⏩ Redo triggered");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    template: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    undo,
    redo,
    updateWithHistory,
    resetHistory,
  };
}
