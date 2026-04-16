"use client";

import * as React from "react";
import { Menu09Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { useSession } from "@/lib/auth-client";
import { type Button } from "@workspace/ui/components/button";
import {
  Picker,
  PickerContent,
  PickerGroup,
  PickerItem,
  PickerLabel,
  PickerSeparator,
  PickerShortcut,
  PickerSub,
  PickerSubContent,
  PickerSubTrigger,
  PickerTrigger,
} from "@/app/create/components/picker";
import { useActionMenuTrigger } from "@/app/create/hooks/use-action-menu";
import { useHistory } from "@/app/create/hooks/use-history";
import { useOpenPresetTrigger } from "@/app/create/hooks/use-open-preset";
import { useRandom } from "@/app/create/hooks/use-random";
import { useReset } from "@/app/create/hooks/use-reset";
import { useSavePresetTrigger } from "@/app/create/hooks/use-save-preset";
import { useThemeToggle } from "@/app/create/hooks/use-theme-toggle";
import { useDesignSystemSearchParams } from "@/app/create/lib/search-params";
import { useTRPC } from "@/trpc/client";

const APPLE_PLATFORM_REGEX = /Mac|iPhone|iPad|iPod/;

export function MainMenu({ className }: React.ComponentProps<typeof Button>) {
  const [isMac, setIsMac] = React.useState(false);
  const [presetSearch, setPresetSearch] = React.useState("");
  const { canGoBack, canGoForward, goBack, goForward } = useHistory();
  const { openActionMenu } = useActionMenuTrigger();
  const { openPreset } = useOpenPresetTrigger();
  const { openSavePreset } = useSavePresetTrigger();
  const { randomize } = useRandom();
  const { toggleTheme } = useThemeToggle();
  const { setShowResetDialog } = useReset();
  const [, setParams] = useDesignSystemSearchParams();
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const isAuthenticated = !!session?.user;

  const { data: savedPresets = [] } = useQuery(
    trpc.presets.list.queryOptions(undefined, {
      enabled: isAuthenticated,
      staleTime: 30_000,
    }),
  );

  const deleteMutation = useMutation(
    trpc.presets.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.presets.list.queryKey() });
      },
    }),
  );

  React.useEffect(() => {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;
    setIsMac(APPLE_PLATFORM_REGEX.test(platform || userAgent));
  }, []);

  return (
    <React.Fragment>
      <Picker>
        <PickerTrigger
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg px-1.75 ring-1 ring-foreground/10 focus-visible:ring-1",
            className,
          )}
        >
          <span className="font-medium">Menu</span>
          <HugeiconsIcon icon={Menu09Icon} strokeWidth={2} className="size-5" />
        </PickerTrigger>
        <PickerContent side="right" align="start" alignOffset={-8}>
          <PickerGroup>
            <PickerItem onClick={openActionMenu}>
              Navigate...
              <PickerShortcut>{isMac ? "⌘P" : "Ctrl+P"}</PickerShortcut>
            </PickerItem>
            <PickerItem onClick={openPreset}>
              Open Preset... <PickerShortcut>O</PickerShortcut>
            </PickerItem>
            <PickerItem onClick={openSavePreset}>
              Save Preset... <PickerShortcut>S</PickerShortcut>
            </PickerItem>
            <PickerSub
              onOpenChange={(open) => {
                if (!open) setPresetSearch("");
              }}
            >
              <PickerSubTrigger>My Presets</PickerSubTrigger>
              <PickerSubContent side="right" align="start" sideOffset={0}>
                {isAuthenticated && savedPresets.length > 0 && (
                  <div className="px-1.5 pb-1.5">
                    <input
                      type="text"
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      placeholder="Search..."
                      className="w-full rounded-md bg-neutral-800/80 px-2 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none ring-1 ring-neutral-700/50 focus:ring-neutral-500"
                      autoComplete="off"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <PickerGroup>
                  {!isAuthenticated && <PickerLabel>Sign in to save presets</PickerLabel>}
                  {isAuthenticated && savedPresets.length === 0 && (
                    <PickerLabel>No saved presets</PickerLabel>
                  )}
                  {isAuthenticated &&
                    savedPresets
                      .filter((p) => p.name.toLowerCase().includes(presetSearch.toLowerCase()))
                      .map((preset) => (
                        <PickerItem
                          key={preset.id}
                          onClick={() => {
                            setParams({
                              preset: preset.presetCode,
                              base: preset.base as "radix" | "base",
                            });
                          }}
                        >
                          <span className="flex-1 truncate">{preset.name}</span>
                          <button
                            type="button"
                            className="ml-auto shrink-0 rounded p-0.5 opacity-50 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              deleteMutation.mutate({ id: preset.id });
                            }}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              strokeWidth={2}
                              className="size-3.5"
                            />
                          </button>
                        </PickerItem>
                      ))}
                  {isAuthenticated &&
                    savedPresets.length > 0 &&
                    presetSearch &&
                    savedPresets.filter((p) =>
                      p.name.toLowerCase().includes(presetSearch.toLowerCase()),
                    ).length === 0 && <PickerLabel>No matches</PickerLabel>}
                </PickerGroup>
              </PickerSubContent>
            </PickerSub>
            <PickerSeparator />
            <PickerItem onClick={randomize}>
              Shuffle <PickerShortcut>R</PickerShortcut>
            </PickerItem>
            <PickerItem onClick={toggleTheme}>
              Light/Dark <PickerShortcut>D</PickerShortcut>
            </PickerItem>
          </PickerGroup>
          <PickerSeparator />
          <PickerGroup>
            <PickerItem onClick={goBack} disabled={!canGoBack}>
              Undo <PickerShortcut>{isMac ? "⌘Z" : "Ctrl+Z"}</PickerShortcut>
            </PickerItem>
            <PickerItem onClick={goForward} disabled={!canGoForward}>
              Redo <PickerShortcut>{isMac ? "⇧⌘Z" : "Ctrl+Shift+Z"}</PickerShortcut>
            </PickerItem>
            <PickerSeparator />
            <PickerItem onClick={() => setShowResetDialog(true)}>
              Reset <PickerShortcut>⇧R</PickerShortcut>
            </PickerItem>
          </PickerGroup>
        </PickerContent>
      </Picker>
    </React.Fragment>
  );
}
