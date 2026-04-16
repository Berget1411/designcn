"use client"

import * as React from "react"

import { RADII, type RadiusValue } from "@/registry/config"
import {
  decodeCustomThemeVars,
  encodeCustomThemeVars,
} from "@/app/create/lib/custom-theme-vars"
import { Input } from "@workspace/ui/components/input"
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

function isValidCssLength(value: string) {
  return /^\d+(\.\d+)?\s*(px|rem|em)$/.test(value.trim())
}

export function RadiusPicker({
  isMobile,
  anchorRef,
}: {
  isMobile: boolean
  anchorRef: React.RefObject<HTMLDivElement | null>
}) {
  const [params, setParams] = useDesignSystemSearchParams()
  const isRadiusLocked = params.style === "lyra"
  const selectedRadiusName = isRadiusLocked ? "none" : params.radius
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [editing, setEditing] = React.useState(false)

  const customVars = React.useMemo(
    () => decodeCustomThemeVars(params.vars),
    [params.vars]
  )

  const customRadius = customVars?.light?.radius

  const currentRadius = RADII.find(
    (radius) => radius.name === selectedRadiusName
  )
  const defaultRadius = RADII.find((radius) => radius.name === "default")
  const otherRadii = RADII.filter((radius) => radius.name !== "default")

  const [customInput, setCustomInput] = React.useState(customRadius ?? "")

  React.useEffect(() => {
    setCustomInput(customRadius ?? "")
  }, [customRadius])

  React.useEffect(() => {
    if (editing) {
      // Focus after menu closes and state updates
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [editing])

  const applyCustomRadius = React.useCallback(
    (value: string) => {
      const trimmed = value.trim()

      if (!trimmed) {
        // Clear custom radius
        const nextLight = { ...(customVars.light ?? {}) }
        delete nextLight.radius
        const next = { ...customVars, light: nextLight }
        const encoded = encodeCustomThemeVars(next)
        setParams({ custom: Boolean(encoded), vars: encoded })
        setEditing(false)
        return
      }

      if (!isValidCssLength(trimmed)) {
        setCustomInput(customRadius ?? "")
        setEditing(false)
        return
      }

      const next = {
        ...customVars,
        light: {
          ...(customVars.light ?? {}),
          radius: trimmed,
        },
      }
      const encoded = encodeCustomThemeVars(next)
      setParams({ custom: Boolean(encoded), vars: encoded })
      setEditing(false)
    },
    [customVars, customRadius, setParams]
  )

  return (
    <div className="group/picker relative">
      {editing ? (
        <div className="relative w-36 shrink-0 rounded-xl p-3 ring-1 ring-foreground/10 md:w-full md:rounded-lg md:px-2.5 md:py-2">
          <div className="flex flex-col justify-start text-left">
            <div className="text-xs text-muted-foreground">Custom Radius</div>
            <Input
              ref={inputRef}
              value={customInput}
              placeholder="e.g. 0.5rem"
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={() => applyCustomRadius(customInput)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur()
                }
                if (e.key === "Escape") {
                  setCustomInput(customRadius ?? "")
                  setEditing(false)
                }
              }}
              className="mt-0.5 h-6 border-0 p-0 font-mono text-sm font-medium shadow-none focus-visible:ring-0"
              spellCheck={false}
            />
          </div>
        </div>
      ) : (
        <Picker>
          <PickerTrigger disabled={isRadiusLocked}>
            <div className="flex flex-col justify-start text-left">
              <div className="text-xs text-muted-foreground">Radius</div>
              <div className="text-sm font-medium text-foreground">
                {customRadius ? customRadius : currentRadius?.label}
              </div>
            </div>
            <div className="pointer-events-none absolute top-1/2 right-4 flex size-4 -translate-y-1/2 rotate-90 items-center justify-center text-base text-foreground select-none md:right-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="text-foreground"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 20v-5C4 8.925 8.925 4 15 4h5"
                />
              </svg>
            </div>
          </PickerTrigger>
          <PickerContent
            anchor={isMobile ? anchorRef : undefined}
            side={isMobile ? "top" : "right"}
            align={isMobile ? "center" : "start"}
          >
            <PickerRadioGroup
              value={customRadius ? undefined : currentRadius?.name}
              onValueChange={(value) => {
                if (isRadiusLocked) {
                  return
                }
                // Clear custom radius when selecting preset
                if (customRadius) {
                  const nextLight = { ...(customVars.light ?? {}) }
                  delete nextLight.radius
                  const next = { ...customVars, light: nextLight }
                  const encoded = encodeCustomThemeVars(next)
                  setParams({
                    radius: value as RadiusValue,
                    custom: Boolean(encoded),
                    vars: encoded,
                  })
                } else {
                  setParams({ radius: value as RadiusValue })
                }
              }}
            >
              <PickerGroup>
                {defaultRadius && (
                  <PickerRadioItem
                    key={defaultRadius.name}
                    value={defaultRadius.name}
                    closeOnClick={isMobile}
                  >
                    {defaultRadius.label}
                  </PickerRadioItem>
                )}
              </PickerGroup>
              <PickerSeparator />
              <PickerGroup>
                {otherRadii.map((radius) => (
                  <PickerRadioItem
                    key={radius.name}
                    value={radius.name}
                    closeOnClick={isMobile}
                  >
                    {radius.label}
                  </PickerRadioItem>
                ))}
              </PickerGroup>
            </PickerRadioGroup>
            <PickerSeparator />
            <PickerGroup>
              <PickerItem onClick={() => setEditing(true)}>
                Custom…
              </PickerItem>
            </PickerGroup>
          </PickerContent>
        </Picker>
      )}
      <LockButton
        param="radius"
        className="absolute top-1/2 right-8 -translate-y-1/2"
      />
    </div>
  )
}
