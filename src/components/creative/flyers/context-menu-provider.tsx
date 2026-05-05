"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";

interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuData {
  elementId: string;
  elementType: string;
}

interface ContextMenuContextType {
  showContextMenu: (
    position: ContextMenuPosition,
    data: ContextMenuData
  ) => void;
  hideContextMenu: () => void;
  contextMenuPosition: ContextMenuPosition | null;
  contextMenuData: ContextMenuData | null;
  registerAction: (
    key: string,
    action: (data: ContextMenuData) => void
  ) => void;
  actions: Record<string, (data: ContextMenuData) => void>;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(
  undefined
);

export function ContextMenuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contextMenuPosition, setContextMenuPosition] =
    useState<ContextMenuPosition | null>(null);
  const [contextMenuData, setContextMenuData] =
    useState<ContextMenuData | null>(null);
  const actionsRef = useRef<Record<string, (data: ContextMenuData) => void>>(
    {}
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const showContextMenu = (
    position: ContextMenuPosition,
    data: ContextMenuData
  ) => {
    setContextMenuPosition(position);
    setContextMenuData(data);
  };

  const hideContextMenu = () => {
    setContextMenuPosition(null);
    setContextMenuData(null);
  };

  const registerAction = React.useCallback(
    (key: string, action: (data: ContextMenuData) => void) => {
      actionsRef.current[key] = action;
    },
    []
  );

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideContextMenu();
      }
    };

    if (contextMenuPosition) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenuPosition]);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hideContextMenu();
      }
    };

    if (contextMenuPosition) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [contextMenuPosition]);

  return (
    <ContextMenuContext.Provider
      value={{
        showContextMenu,
        hideContextMenu,
        contextMenuPosition,
        contextMenuData,
        registerAction,
        actions: actionsRef.current,
      }}
    >
      {children}
      {contextMenuPosition && contextMenuData && (
        <div
          ref={menuRef}
          className="fixed z-[9999] bg-blue-950 dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]"
          style={{
            left: `${contextMenuPosition.x}px`,
            top: `${contextMenuPosition.y}px`,
          }}
        >
          <ContextMenuContent
            data={contextMenuData}
            actions={actionsRef.current}
            onClose={hideContextMenu}
          />
        </div>
      )}
    </ContextMenuContext.Provider>
  );
}

function ContextMenuContent({
  data,
  actions,
  onClose,
}: {
  data: ContextMenuData;
  actions: Record<string, (data: ContextMenuData) => void>;
  onClose: () => void;
}) {
  const handleAction = (actionKey: string) => {
    if (actions[actionKey]) {
      actions[actionKey](data);
      onClose();
    }
  };

  const isDuplicate = data.elementId.includes("-");

  return (
    <div className="text-sm">
      <button
        onClick={() => handleAction("duplicate")}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
      >
        <span className="text-base">📋</span>
        <div>
          <div className="font-medium">Duplicate</div>
          <div className="text-xs text-gray-500">Cmd/Ctrl+D</div>
        </div>
      </button>

      {isDuplicate && (
        <button
          onClick={() => handleAction("delete")}
          className="w-full px-4 py-2 text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-3"
        >
          <span className="text-base">🗑️</span>
          <div>
            <div className="font-medium">Delete</div>
            <div className="text-xs text-gray-500">Delete/Backspace</div>
          </div>
        </button>
      )}

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <button
        onClick={() => handleAction("bringToFront")}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
      >
        <span className="text-base">⬆️</span>
        <div>
          <div className="font-medium">Bring to Front</div>
          <div className="text-xs text-gray-500">Cmd/Ctrl+]</div>
        </div>
      </button>

      <button
        onClick={() => handleAction("sendToBack")}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
      >
        <span className="text-base">⬇️</span>
        <div>
          <div className="font-medium">Send to Back</div>
          <div className="text-xs text-gray-500">Cmd/Ctrl+[</div>
        </div>
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <button
        onClick={() => handleAction("copy")}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
      >
        <span className="text-base">📄</span>
        <div>
          <div className="font-medium">Copy</div>
          <div className="text-xs text-gray-500">Cmd/Ctrl+C</div>
        </div>
      </button>

      <button
        onClick={() => handleAction("toggleVisibility")}
        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
      >
        <span className="text-base">👁️</span>
        <div>
          <div className="font-medium">Toggle Visibility</div>
          <div className="text-xs text-gray-500">Cmd/Ctrl+H</div>
        </div>
      </button>

      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

      <div className="px-4 py-2 text-xs text-gray-500">
        {data.elementType} Element
        {isDuplicate && " (Duplicate)"}
      </div>
    </div>
  );
}

export function useContextMenu() {
  const context = useContext(ContextMenuContext);
  if (!context) {
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  }
  return context;
}
