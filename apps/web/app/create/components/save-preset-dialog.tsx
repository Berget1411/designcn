"use client";

import * as React from "react";

import { useSession } from "@/lib/auth-client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { Field, FieldContent, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSavePreset } from "@/app/create/hooks/use-save-preset";
import { usePresetCode } from "@/app/create/hooks/use-design-system";
import { useDesignSystemSearchParams } from "@/app/create/lib/search-params";
import { PublishPresetDialog } from "@/app/(main)/community/components/publish-preset-dialog";

const SAVE_TITLE = "Save Preset";
const SAVE_DESCRIPTION = "Give your current configuration a name to save it for later.";

export function SavePresetDialog() {
  const [name, setName] = React.useState("");
  const [params] = useDesignSystemSearchParams();
  const presetCode = usePresetCode();
  const isMobile = useIsMobile();
  const { open, setOpen } = useSavePreset();
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Publish flow state
  const [publishOpen, setPublishOpen] = React.useState(false);
  const [lastSavedId, setLastSavedId] = React.useState<string | null>(null);
  const [lastSavedName, setLastSavedName] = React.useState("");

  const saveMutation = useMutation(
    trpc.presets.save.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({ queryKey: trpc.presets.list.queryKey() });
        setLastSavedId(data?.id ?? null);
        setLastSavedName(name.trim());
        setOpen(false);
        setName("");
      },
    }),
  );

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setName("");
        saveMutation.reset();
      }
    },
    [setOpen, saveMutation],
  );

  const handleSubmit = React.useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = name.trim();
      if (!trimmed) return;

      saveMutation.mutate({
        name: trimmed,
        presetCode,
        base: params.base,
      });
    },
    [name, presetCode, params.base, saveMutation],
  );

  const isAuthenticated = !!session?.user;
  const canSubmit = name.trim().length > 0 && !saveMutation.isPending;

  const fields = isAuthenticated ? (
    <Field>
      <FieldLabel htmlFor="preset-name-input" className="sr-only">
        Preset name
      </FieldLabel>
      <FieldContent>
        <Input
          id="preset-name-input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Dark Corporate, Playful Brand..."
          maxLength={50}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="h-10 md:h-8"
        />
      </FieldContent>
    </Field>
  ) : (
    <p className="text-sm text-muted-foreground">
      <a href="/sign-in" className="underline underline-offset-3 hover:text-foreground">
        Sign in
      </a>{" "}
      to save and manage your presets.
    </p>
  );

  // Show publish prompt after successful save
  React.useEffect(() => {
    if (lastSavedId && !open && !publishOpen) {
      // Small delay so dialog close animation finishes
      const timer = setTimeout(() => {
        setPublishOpen(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [lastSavedId, open, publishOpen]);

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerContent className="dark rounded-t-2xl!">
            <DrawerHeader>
              <DrawerTitle className="text-xl">{SAVE_TITLE}</DrawerTitle>
              <DrawerDescription>{SAVE_DESCRIPTION}</DrawerDescription>
            </DrawerHeader>
            <form onSubmit={handleSubmit}>
              <div className="px-4 py-2">{fields}</div>
              <DrawerFooter>
                {isAuthenticated && (
                  <Button type="submit" className="h-10" disabled={!canSubmit}>
                    {saveMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button variant="outline" type="button" className="h-10">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </DrawerContent>
        </Drawer>
        {lastSavedId && (
          <PublishPresetDialog
            open={publishOpen}
            onOpenChange={(o) => {
              setPublishOpen(o);
              if (!o) setLastSavedId(null);
            }}
            savedPresetId={lastSavedId}
            defaultTitle={lastSavedName}
            onSuccess={() => setLastSavedId(null)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="dark">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{SAVE_TITLE}</DialogTitle>
              <DialogDescription>{SAVE_DESCRIPTION}</DialogDescription>
            </DialogHeader>
            <div className="py-4">{fields}</div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </DialogClose>
              {isAuthenticated && (
                <Button type="submit" disabled={!canSubmit}>
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {lastSavedId && (
        <PublishPresetDialog
          open={publishOpen}
          onOpenChange={(o) => {
            setPublishOpen(o);
            if (!o) setLastSavedId(null);
          }}
          savedPresetId={lastSavedId}
          defaultTitle={lastSavedName}
          onSuccess={() => setLastSavedId(null)}
        />
      )}
    </>
  );
}
