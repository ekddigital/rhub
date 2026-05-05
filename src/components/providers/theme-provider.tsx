"use client";

import * as React from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-storage";

export type ThemeContextValue = {
  theme?: string;
  resolvedTheme?: string;
  setTheme: (theme: string) => void;
  themes: string[];
  systemTheme?: "dark" | "light";
};

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: undefined,
  resolvedTheme: undefined,
  setTheme: () => {},
  themes: ["light", "dark"],
  systemTheme: undefined,
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    const initial =
      stored === "light" || stored === "dark" ? stored : "dark";
    applyThemeClass(initial);
    setThemeState(initial);
  }, []);

  const setTheme = React.useCallback((next: string) => {
    const resolved = next === "light" || next === "dark" ? next : "dark";
    localStorage.setItem(THEME_STORAGE_KEY, resolved);
    applyThemeClass(resolved);
    setThemeState(resolved);
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      themes: ["light", "dark"],
      systemTheme: undefined,
    }),
    [theme, setTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return React.useContext(ThemeContext);
}

function applyThemeClass(mode: string) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(mode === "light" ? "light" : "dark");
}
