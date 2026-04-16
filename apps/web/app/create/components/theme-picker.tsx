"use client"

import * as React from "react"

import { useMounted } from "@/hooks/use-mounted"
import { BASE_COLORS, type Theme, type ThemeName } from "@/registry/config"
import { LockButton } from "@/app/create/components/lock-button"
import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerItem,
  PickerRadioGroup,
  PickerRadioItem,
  PickerSeparator,
  PickerTrigger,
} from "@/app/create/components/picker"
import { useDesignSystemSearchParams } from "@/app/create/lib/search-params"

export function ThemePicker({
  themes,
  isMobile,
  anchorRef,
  onAdvanced,
}: {
  themes: readonly Theme[]
  isMobile: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
  onAdvanced?: () => void
}) {
  const mounted = useMounted()
  const [params, setParams] = useDesignSystemSearchParams()

  const currentTheme = React.useMemo(
    () => themes.find((theme) => theme.name === params.theme),
    [themes, params.theme]
  )

  const currentThemeIsBaseColor = React.useMemo(
    () => BASE_COLORS.find((baseColor) => baseColor.name === params.theme),
    [params.theme]
  )

  React.useEffect(() => {
    if (!currentTheme && themes.length > 0) {
      setParams({ theme: themes[0].name })
    }
  }, [currentTheme, themes, setParams])

  return (
    <div className="group/picker relative">
      <Picker>
        <PickerTrigger>
          <div className="flex flex-col justify-start text-left">
            <div className="text-xs text-muted-foreground">Theme</div>
            <div className="text-sm font-medium text-foreground">
              {currentTheme?.title}
            </div>
          </div>
          {mounted && (
            <button
              type="button"
              style={
                {
                  "--color":
                    currentTheme?.cssVars?.dark?.[
                      currentThemeIsBaseColor ? "muted-foreground" : "primary"
                    ],
                } as React.CSSProperties
              }
              className="absolute top-1/2 right-4 size-4 -translate-y-1/2 rounded-full bg-(--color) select-none md:right-2.5 cursor-pointer hover:ring-2 hover:ring-foreground/30 transition-shadow"
              onClick={(e) => {
                e.stopPropagation()
                onAdvanced?.()
              }}
              aria-label="Open advanced color editor"
            />
          )}
        </PickerTrigger>
        <PickerContent
          anchor={isMobile ? anchorRef : undefined}
          side={isMobile ? "top" : "right"}
          align={isMobile ? "center" : "start"}
          className="max-h-92"
        >
          <PickerRadioGroup
            value={currentTheme?.name}
            onValueChange={(value) => {
              setParams({ theme: value as ThemeName })
            }}
          >
            <PickerGroup>
              {themes
                .filter((theme) =>
                  BASE_COLORS.find((baseColor) => baseColor.name === theme.name)
                )
                .map((theme) => {
                  return (
                    <PickerRadioItem
                      key={theme.name}
                      value={theme.name}
                      closeOnClick={isMobile}
                    >
                      {theme.title}
                    </PickerRadioItem>
                  )
                })}
            </PickerGroup>
            <PickerSeparator />
            <PickerGroup>
              {themes
                .filter(
                  (theme) =>
                    !BASE_COLORS.find(
                      (baseColor) => baseColor.name === theme.name
                    )
                )
                .map((theme) => {
                  return (
                    <PickerRadioItem
                      key={theme.name}
                      value={theme.name}
                      closeOnClick={isMobile}
                    >
                      {theme.title}
                    </PickerRadioItem>
                  )
                })}
            </PickerGroup>
          </PickerRadioGroup>
          <PickerSeparator />
          <PickerGroup>
            <PickerItem onClick={() => onAdvanced?.()}>
              Customize Colors…
            </PickerItem>
          </PickerGroup>
        </PickerContent>
      </Picker>
      <LockButton
        param="theme"
        className="absolute top-1/2 right-8 -translate-y-1/2"
      />
    </div>
  )
}
