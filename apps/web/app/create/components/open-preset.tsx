"use client"

import * as React from "react"
import Script from "next/script"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer"
import { Field, FieldContent, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import {
  OPEN_PRESET_FORWARD_TYPE,
  useOpenPreset,
} from "@/app/create/hooks/use-open-preset"
import { parseOpenConfigInput } from "@/app/create/lib/parse-open-config-input"
import { useDesignSystemSearchParams } from "@/app/create/lib/search-params"

const PRESET_EXAMPLE = "b2D0wqNxT"
const PRESET_TITLE = "Open Config"
const PRESET_DESCRIPTION =
  "Paste a create link, query string, or preset code to load a saved configuration."

export function OpenPreset({
  className,
  label = "Open Config",
}: React.ComponentProps<typeof Button> & {
  label?: string
}) {
  const [input, setInput] = React.useState("")
  const [, setParams] = useDesignSystemSearchParams()
  const router = useRouter()
  const isMobile = useIsMobile()
  const { open, setOpen } = useOpenPreset()

  const nextInput = React.useMemo(() => parseOpenConfigInput(input), [input])
  const isInvalid = input.trim().length > 0 && nextInput === null

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen)

      if (!nextOpen) {
        setInput("")
      }
    },
    [setOpen]
  )

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!nextInput) {
        return
      }

      if (nextInput?.type === "preset") {
        setParams({ preset: nextInput.preset })
      } else if (nextInput?.type === "query") {
        router.push(`/create?${nextInput.query}`)
      } else {
        return
      }

      handleOpenChange(false)
    },
    [handleOpenChange, nextInput, router, setParams]
  )

  const triggerClassName = cn(
    "touch-manipulation bg-transparent! px-2! py-0! text-sm! transition-none select-none hover:bg-muted! pointer-coarse:h-10!",
    className
  )

  const desktopTrigger = (
    <Button variant="outline" className={triggerClassName} />
  )

  const fields = (
    <Field data-invalid={isInvalid || undefined}>
      <FieldLabel htmlFor="config-input" className="sr-only">
        Config input
      </FieldLabel>
      <FieldContent>
        <Input
          id="config-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={`${PRESET_EXAMPLE}, --preset ${PRESET_EXAMPLE}, or https://.../create?...`}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={isInvalid}
          className="h-10 md:h-8"
        />
      </FieldContent>
    </Field>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          <Button variant="outline" className={triggerClassName}>
            {label}
          </Button>
        </DrawerTrigger>
        <DrawerContent className="dark rounded-t-2xl!">
          <DrawerHeader>
            <DrawerTitle className="text-xl">{PRESET_TITLE}</DrawerTitle>
            <DrawerDescription>{PRESET_DESCRIPTION}</DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-2">{fields}</div>
            <DrawerFooter>
              <Button type="submit" className="h-10" disabled={!nextInput}>
                Open
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" type="button" className="h-10">
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={desktopTrigger}>{label}</DialogTrigger>
      <DialogContent className="dark">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{PRESET_TITLE}</DialogTitle>
            <DialogDescription>{PRESET_DESCRIPTION}</DialogDescription>
          </DialogHeader>
          <div className="py-4">{fields}</div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!nextInput}>
              Open
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function OpenPresetScript() {
  return (
    <Script
      id="open-preset-listener"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
            (function() {
              // Forward O key.
              document.addEventListener('keydown', function(e) {
                if (e.key === 'o' && !e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
                  if (
                    (e.target instanceof HTMLElement && e.target.isContentEditable) ||
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement ||
                    e.target instanceof HTMLSelectElement
                  ) {
                    return;
                  }
                  e.preventDefault();
                  if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                      type: '${OPEN_PRESET_FORWARD_TYPE}',
                      key: e.key
                    }, '*');
                  }
                }
              });

            })();
          `,
      }}
    />
  )
}
