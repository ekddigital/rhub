"use client";

import * as React from "react";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/creative/ui/button";
import { Moon, Sun } from "lucide-react";

type ThemeToggleProps = {
  variant?: "default" | "minimal";
};

export function ThemeToggle({ variant = "default" }: ThemeToggleProps) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Only show the UI after mounting to prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  // During server rendering or before mounting, render a placeholder
  if (!mounted) {
    if (variant === "minimal") {
      return (
        <button
          className="text-foreground/70 transition-colors"
          aria-label="Loading theme toggle"
        >
          <div className="h-4 w-4" />
        </button>
      );
    }

    return (
      <Button
        variant="outline"
        size="icon"
        className="rounded-full bg-background/80 border border-border/50"
      >
        <div className="h-5 w-5" />
        <span className="sr-only">Loading theme toggle</span>
      </Button>
    );
  }

  // Get the actual theme, with fallback to system preference
  const currentTheme = theme === "system" ? resolvedTheme : theme;

  // After mounting, render the appropriate icon based on current theme
  if (variant === "minimal") {
    return (
      <button
        onClick={toggleTheme}
        className="text-foreground/70 hover:text-primary transition-colors"
        aria-label="Toggle theme"
      >
        {currentTheme === "light" ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full bg-card/80 hover:bg-card border border-border/50 hover:border-border/80 shadow-sm"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
