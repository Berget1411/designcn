"use client";

import { useTheme } from "next-themes";
import { Button } from "@workspace/ui/components/button";

export function useThemeMode() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleMode = () => setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return {
    mode: (resolvedTheme ?? "dark") as "dark" | "light",
    toggleMode,
  };
}

export function ModeToggle() {
  const { toggleMode } = useThemeMode();
  return (
    <Button onClick={toggleMode} size="icon" variant="ghost" type="button">
      <svg viewBox="0 0 32 32" width="24" height="24" fill="currentcolor" className="block">
        <circle cx="16" cy="16" r="14" fill="none" stroke="currentcolor" strokeWidth="4"></circle>
        <path
          d="
        M 16 0
        A 16 16 0 0 0 16 32
        z"
        ></path>
      </svg>
    </Button>
  );
}
