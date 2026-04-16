"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
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
import { Field, FieldContent, FieldLabel } from "@workspace/ui/components/field";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

import { COMMUNITY_PRESET_TAGS, MAX_TAGS_PER_PRESET, type CommunityPresetTag } from "../lib/tags";

interface PublishPresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedPresetId: string;
  defaultTitle?: string;
  onSuccess?: (communityPresetId: string) => void;
}

export function PublishPresetDialog({
  open,
  onOpenChange,
  savedPresetId,
  defaultTitle = "",
  onSuccess,
}: PublishPresetDialogProps) {
  const [title, setTitle] = React.useState(defaultTitle);
  const [description, setDescription] = React.useState("");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [tagSearch, setTagSearch] = React.useState("");

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const publishMutation = useMutation(
    trpc.community.publish.mutationOptions({
      onSuccess: (data) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.community.list.queryKey(),
        });
        void queryClient.invalidateQueries({
          queryKey: trpc.community.tagCounts.queryKey(),
        });
        onOpenChange(false);
        onSuccess?.(data.id);
      },
    }),
  );

  // Reset on open
  React.useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription("");
      setSelectedTags([]);
      setTagSearch("");
      publishMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTitle]);

  const filteredTags = React.useMemo(() => {
    const search = tagSearch.toLowerCase();
    return COMMUNITY_PRESET_TAGS.filter(
      (tag) => tag.includes(search) && !selectedTags.includes(tag),
    );
  }, [tagSearch, selectedTags]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : prev.length < MAX_TAGS_PER_PRESET
          ? [...prev, tag]
          : prev,
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || selectedTags.length === 0) return;

    publishMutation.mutate({
      savedPresetId,
      title: trimmedTitle,
      description: description.trim() || undefined,
      tags: selectedTags as CommunityPresetTag[],
    });
  };

  const canSubmit =
    title.trim().length > 0 && selectedTags.length > 0 && !publishMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Publish to Community</DialogTitle>
            <DialogDescription>
              Your preset will be publicly visible on the community page. You can unpublish it at
              any time.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Title */}
            <Field>
              <FieldLabel htmlFor="publish-title">Title</FieldLabel>
              <FieldContent>
                <Input
                  id="publish-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Dark Corporate, Playful Brand..."
                  maxLength={100}
                />
              </FieldContent>
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel htmlFor="publish-description">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </FieldLabel>
              <FieldContent>
                <Input
                  id="publish-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of your preset..."
                  maxLength={500}
                />
              </FieldContent>
            </Field>

            {/* Tags */}
            <Field>
              <FieldLabel>
                Tags{" "}
                <span className="text-muted-foreground font-normal">
                  ({selectedTags.length}/{MAX_TAGS_PER_PRESET})
                </span>
              </FieldLabel>
              <FieldContent>
                {/* Selected tags */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {selectedTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="gap-1 pr-1 cursor-pointer"
                        onClick={() => handleToggleTag(tag)}
                      >
                        {tag}
                        <X className="size-3" />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Tag search */}
                <Input
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  placeholder="Search tags..."
                  className="mb-2"
                />

                {/* Available tags */}
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {filteredTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedTags.length >= MAX_TAGS_PER_PRESET
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-foreground/10",
                      )}
                      onClick={() => handleToggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </FieldContent>
            </Field>

            {publishMutation.isError && (
              <p className="text-sm text-destructive">{publishMutation.error.message}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {publishMutation.isPending ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
