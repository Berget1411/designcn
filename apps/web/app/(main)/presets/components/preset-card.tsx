"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Globe, GlobeLock, MoreHorizontal, Trash2 } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { PresetColorSwatch } from "@/app/(main)/community/components/preset-color-swatch";
import { PublishPresetDialog } from "@/app/(main)/community/components/publish-preset-dialog";

interface SavedPreset {
  id: string;
  name: string;
  presetCode: string;
  base: string;
  createdAt: string | Date;
  isPublished?: boolean;
  communityPresetId?: string | null;
}

interface PresetCardProps {
  preset: SavedPreset;
}

export function PresetCard({ preset }: PresetCardProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [publishOpen, setPublishOpen] = React.useState(false);

  const deleteMutation = useMutation(
    trpc.presets.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.presets.list.queryKey() });
      },
    }),
  );

  const unpublishMutation = useMutation(
    trpc.community.unpublish.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.presets.list.queryKey() });
        void queryClient.invalidateQueries({ queryKey: trpc.community.list.queryKey() });
      },
    }),
  );

  const handleApply = () => {
    router.push(`/create?preset=${preset.presetCode}&base=${preset.base}`);
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: preset.id });
  };

  const handleUnpublish = () => {
    if (preset.communityPresetId) {
      unpublishMutation.mutate({ communityPresetId: preset.communityPresetId });
    }
  };

  return (
    <>
      <div className="group relative">
        {/* Preview */}
        <div className="relative h-40 overflow-hidden rounded-xl border border-border/50 transition-all group-hover:shadow-md group-hover:border-border">
          <PresetColorSwatch presetCode={preset.presetCode} className="h-full" />
          {preset.isPublished && (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0 gap-1"
            >
              <Globe className="size-2.5" />
              Published
            </Badge>
          )}
        </div>

        {/* Info + actions */}
        <div className="flex items-center justify-between px-1 pt-2">
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block">{preset.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{preset.base}</span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="size-7">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={handleApply}>
                <ExternalLink className="size-3.5 mr-2" />
                Apply
              </DropdownMenuItem>
              {!preset.isPublished ? (
                <DropdownMenuItem onSelect={() => setPublishOpen(true)}>
                  <Globe className="size-3.5 mr-2" />
                  Publish to Community
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={handleUnpublish}>
                  <GlobeLock className="size-3.5 mr-2" />
                  Unpublish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="size-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PublishPresetDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        savedPresetId={preset.id}
        defaultTitle={preset.name}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: trpc.presets.list.queryKey() });
        }}
      />
    </>
  );
}
