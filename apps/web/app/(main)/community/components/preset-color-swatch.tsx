"use client";

import * as React from "react";
import { decodePreset } from "shadcn/preset";
import { buildRegistryTheme } from "@/registry/config";
import { cn } from "@workspace/ui/lib/utils";

function oklchToStyle(value: string) {
  return `oklch(${value})`;
}

interface PresetColorSwatchProps {
  presetCode: string;
  className?: string;
}

const COLOR_KEYS = ["background", "primary", "secondary", "accent", "muted"] as const;

export function PresetColorSwatch({ presetCode, className }: PresetColorSwatchProps) {
  const colors = React.useMemo(() => {
    try {
      const decoded = decodePreset(presetCode);
      if (!decoded) return null;

      const theme = buildRegistryTheme({
        style: decoded.style ?? "nova",
        baseColor: decoded.baseColor ?? "neutral",
        theme: decoded.theme ?? "neutral",
        chartColor: decoded.chartColor ?? "neutral",
        iconLibrary: decoded.iconLibrary ?? "lucide",
        font: decoded.font ?? "inter",
        fontHeading: decoded.fontHeading ?? "inherit",
        radius: decoded.radius ?? "default",
        menuAccent: decoded.menuAccent ?? "subtle",
        menuColor: decoded.menuColor ?? "default",
        base: "radix",
        rtl: false,
      });

      const lightVars = (theme.cssVars?.light ?? {}) as Record<string, string>;

      return COLOR_KEYS.map((key) => ({
        key,
        value: lightVars[key] ? oklchToStyle(lightVars[key]) : undefined,
      })).filter((c) => c.value);
    } catch {
      return null;
    }
  }, [presetCode]);

  if (!colors || colors.length === 0) {
    return (
      <div
        className={cn("flex h-full items-center justify-center bg-muted/50 rounded-xl", className)}
      >
        <span className="text-xs text-muted-foreground">No preview</span>
      </div>
    );
  }

  return (
    <div className={cn("flex h-full gap-1 p-3 rounded-xl bg-muted/30", className)}>
      {colors.map((c) => (
        <div
          key={c.key}
          className="flex-1 rounded-lg transition-all"
          style={{ backgroundColor: c.value }}
          title={c.key}
        />
      ))}
    </div>
  );
}
