"use client";

import * as React from "react";

import { useMounted } from "@/hooks/use-mounted";
import { BASE_COLORS, getThemesForBaseColor, type ChartColorName } from "@/registry/config";
import { cssColorToHex, generateChartPalette } from "@/app/create/lib/color-utils";
import { decodeCustomThemeVars, encodeCustomThemeVars } from "@/app/create/lib/custom-theme-vars";
import { LockButton } from "@/app/create/components/lock-button";
import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerItem,
  PickerRadioGroup,
  PickerRadioItem,
  PickerSeparator,
  PickerTrigger,
} from "@/app/create/components/picker";
import { useDesignSystemSearchParams } from "@/app/create/lib/search-params";

export function ChartColorPicker({
  isMobile,
  anchorRef,
}: {
  isMobile: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const mounted = useMounted();
  const [params, setParams] = useDesignSystemSearchParams();
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  const availableChartColors = React.useMemo(
    () => getThemesForBaseColor(params.baseColor),
    [params.baseColor],
  );

  const currentChartColor = React.useMemo(
    () => availableChartColors.find((theme) => theme.name === params.chartColor),
    [availableChartColors, params.chartColor],
  );

  const currentChartColorIsBaseColor = React.useMemo(
    () => BASE_COLORS.find((baseColor) => baseColor.name === params.chartColor),
    [params.chartColor],
  );

  const customVars = React.useMemo(() => decodeCustomThemeVars(params.vars), [params.vars]);

  const hasCustomChartColors = React.useMemo(
    () =>
      ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"].some(
        (key) => customVars?.dark?.[key],
      ),
    [customVars],
  );

  // Primary color: chart-2 when custom (picked color), otherwise theme representative
  const primaryColor = hasCustomChartColors
    ? (customVars?.dark?.["chart-2"] ?? "#000000")
    : currentChartColor?.cssVars?.dark?.[
        currentChartColorIsBaseColor ? "muted-foreground" : "primary"
      ];

  // Secondary color: chart-1 (lighter) when custom, otherwise theme chart-1
  const secondaryColor = hasCustomChartColors
    ? (customVars?.dark?.["chart-1"] ?? "#000000")
    : currentChartColor?.cssVars?.dark?.["chart-1"];

  const nativeColorValue = React.useMemo(() => {
    if (!mounted || !primaryColor) return "#000000";
    return cssColorToHex(primaryColor) ?? "#000000";
  }, [mounted, primaryColor]);

  const handleColorPick = React.useCallback(
    (hex: string) => {
      const palette = generateChartPalette(hex);
      const next = {
        ...customVars,
        light: {
          ...(customVars.light ?? {}),
          ...palette,
        },
        dark: {
          ...(customVars.dark ?? {}),
          ...palette,
        },
      };
      const encoded = encodeCustomThemeVars(next);
      setParams({ custom: Boolean(encoded), vars: encoded });
    },
    [customVars, setParams],
  );

  React.useEffect(() => {
    if (!currentChartColor && availableChartColors.length > 0) {
      setParams({ chartColor: availableChartColors[0].name });
    }
  }, [currentChartColor, availableChartColors, setParams]);

  return (
    <div className="group/picker relative">
      <Picker>
        <PickerTrigger>
          <div className="flex flex-col justify-start text-left">
            <div className="text-xs text-muted-foreground">Chart Color</div>
            <div className="text-sm font-medium text-foreground">
              {currentChartColor?.title}
              {hasCustomChartColors ? " (Custom)" : ""}
            </div>
          </div>
          {mounted && (
            <>
              <button
                type="button"
                style={
                  {
                    "--color-primary": primaryColor,
                    "--color-secondary": secondaryColor,
                  } as React.CSSProperties
                }
                className="absolute top-1/2 right-4 size-4 -translate-y-1/2 overflow-hidden rounded-full select-none md:right-2.5 cursor-pointer hover:ring-2 hover:ring-foreground/30 transition-shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  colorInputRef.current?.click();
                }}
                aria-label="Pick custom chart color"
              >
                <span className="absolute inset-0 bg-(--color-secondary)" />
                <span className="absolute inset-0 bg-(--color-primary) [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
              </button>
              <input
                ref={colorInputRef}
                type="color"
                className="sr-only"
                value={nativeColorValue}
                onChange={(e) => handleColorPick(e.target.value)}
                tabIndex={-1}
                aria-hidden
              />
            </>
          )}
        </PickerTrigger>
        <PickerContent
          anchor={isMobile ? anchorRef : undefined}
          side={isMobile ? "top" : "right"}
          align={isMobile ? "center" : "start"}
          className="max-h-92"
        >
          <PickerRadioGroup
            value={currentChartColor?.name}
            onValueChange={(value) => {
              setParams({ chartColor: value as ChartColorName });
            }}
          >
            <PickerGroup>
              {availableChartColors
                .filter((theme) => BASE_COLORS.find((baseColor) => baseColor.name === theme.name))
                .map((theme) => (
                  <PickerRadioItem key={theme.name} value={theme.name} closeOnClick={isMobile}>
                    {theme.title}
                  </PickerRadioItem>
                ))}
            </PickerGroup>
            <PickerSeparator />
            <PickerGroup>
              {availableChartColors
                .filter((theme) => !BASE_COLORS.find((baseColor) => baseColor.name === theme.name))
                .map((theme) => (
                  <PickerRadioItem key={theme.name} value={theme.name} closeOnClick={isMobile}>
                    {theme.title}
                  </PickerRadioItem>
                ))}
            </PickerGroup>
          </PickerRadioGroup>
          <PickerSeparator />
          <PickerGroup>
            <PickerItem onClick={() => colorInputRef.current?.click()}>Custom Color…</PickerItem>
          </PickerGroup>
        </PickerContent>
      </Picker>
      <LockButton param="chartColor" className="absolute top-1/2 right-8 -translate-y-1/2" />
    </div>
  );
}
