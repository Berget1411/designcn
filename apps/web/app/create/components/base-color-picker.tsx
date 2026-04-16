"use client";

import * as React from "react";

import { useMounted } from "@/hooks/use-mounted";
import { BASE_COLORS, type BaseColorName } from "@/registry/config";
import { cssColorToHex } from "@/app/create/lib/color-utils";
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

export function BaseColorPicker({
  isMobile,
  anchorRef,
}: {
  isMobile: boolean;
  anchorRef: React.RefObject<HTMLDivElement | null>;
}) {
  const mounted = useMounted();
  const [params, setParams] = useDesignSystemSearchParams();
  const colorInputRef = React.useRef<HTMLInputElement>(null);

  const currentBaseColor = React.useMemo(
    () => BASE_COLORS.find((baseColor) => baseColor.name === params.baseColor),
    [params.baseColor],
  );

  const customVars = React.useMemo(() => decodeCustomThemeVars(params.vars), [params.vars]);

  const displayColor =
    customVars?.dark?.["muted-foreground"] ?? currentBaseColor?.cssVars?.dark?.["muted-foreground"];

  const nativeColorValue = React.useMemo(() => {
    if (!mounted || !displayColor) return "#000000";
    return cssColorToHex(displayColor) ?? "#000000";
  }, [mounted, displayColor]);

  const handleColorPick = React.useCallback(
    (hex: string) => {
      const next = {
        ...customVars,
        light: {
          ...(customVars.light ?? {}),
          "muted-foreground": hex,
        },
        dark: {
          ...(customVars.dark ?? {}),
          "muted-foreground": hex,
        },
      };
      const encoded = encodeCustomThemeVars(next);
      setParams({ custom: Boolean(encoded), vars: encoded });
    },
    [customVars, setParams],
  );

  return (
    <div className="group/picker relative">
      <Picker>
        <PickerTrigger>
          <div className="flex flex-col justify-start text-left">
            <div className="text-xs text-muted-foreground">Base Color</div>
            <div className="text-sm font-medium text-foreground">
              {currentBaseColor?.title}
              {customVars?.dark?.["muted-foreground"] ? " (Custom)" : ""}
            </div>
          </div>
          {mounted && (
            <>
              <button
                type="button"
                style={
                  {
                    "--color": displayColor,
                  } as React.CSSProperties
                }
                className="absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5 cursor-pointer hover:ring-2 hover:ring-foreground/30 transition-shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  colorInputRef.current?.click();
                }}
                aria-label="Pick custom base color"
              />
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
        >
          <PickerRadioGroup
            value={currentBaseColor?.name}
            onValueChange={(value) => {
              setParams({ baseColor: value as BaseColorName });
            }}
          >
            <PickerGroup>
              {BASE_COLORS.map((baseColor) => (
                <PickerRadioItem
                  key={baseColor.name}
                  value={baseColor.name}
                  closeOnClick={isMobile}
                >
                  {baseColor.title}
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
      <LockButton param="baseColor" className="absolute top-1/2 right-8 -translate-y-1/2" />
    </div>
  );
}
