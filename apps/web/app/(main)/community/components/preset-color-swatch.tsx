"use client";

import * as React from "react";
import { decodePreset } from "shadcn/preset";
import { buildRegistryTheme } from "@/registry/config";
import { cn } from "@workspace/ui/lib/utils";

function toColorValue(value: string) {
  // Values from registry themes already include oklch() wrapper
  // e.g. "oklch(0.145 0 0)" — use directly as CSS color
  if (value.startsWith("oklch(") || value.startsWith("rgb(") || value.startsWith("#")) {
    return value;
  }
  // Bare oklch values without wrapper (e.g. "0.145 0 0")
  return `oklch(${value})`;
}

interface PresetColorSwatchProps {
  presetCode: string;
  className?: string;
}

const SWATCH_COLOR_KEYS = ["primary", "secondary", "accent", "muted"] as const;

export interface PresetSwatchColors {
  background: string | undefined;
  foreground: string | undefined;
  swatches: { key: string; value: string | undefined }[];
}

export function usePresetColors(presetCode: string): PresetSwatchColors | null {
  return React.useMemo(() => {
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

      const darkVars = (theme.cssVars?.dark ?? {}) as Record<string, string>;
      const lightVars = (theme.cssVars?.light ?? {}) as Record<string, string>;

      return {
        background: darkVars["background"] ? toColorValue(darkVars["background"]) : undefined,
        foreground: darkVars["foreground"] ? toColorValue(darkVars["foreground"]) : undefined,
        swatches: SWATCH_COLOR_KEYS.map((key) => ({
          key,
          value: lightVars[key] ? toColorValue(lightVars[key]) : undefined,
        })).filter((c) => c.value),
      };
    } catch {
      return null;
    }
  }, [presetCode]);
}

export function PresetColorSwatch({ presetCode, className }: PresetColorSwatchProps) {
  const colors = usePresetColors(presetCode);

  if (!colors || colors.swatches.length === 0) {
    return (
      <div
        className={cn("flex h-full items-center justify-center bg-muted/50 rounded-xl", className)}
      >
        <span className="text-xs text-muted-foreground">No preview</span>
      </div>
    );
  }

  const PILL_HEIGHTS = [80, 64, 52, 44];

  return (
    <div
      className={cn("relative h-full rounded-xl", className)}
      style={{ backgroundColor: colors.background }}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-1.5">
        {colors.swatches.map((c, i) => (
          <div
            key={c.key}
            className="w-3 rounded-full"
            style={{
              backgroundColor: c.value,
              height: `${PILL_HEIGHTS[i] ?? 40}px`,
              opacity: i === 0 ? 1 : 0.65 - i * 0.1,
            }}
            title={c.key}
          />
        ))}
      </div>
    </div>
  );
}
