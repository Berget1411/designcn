"use client";

import * as React from "react";

import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useSession } from "@/lib/auth-client";
import { STYLES } from "@/registry/styles";

import type { CommunityFilterOption } from "../lib/types";
import { useCommunityTagCounts } from "../lib/use-community-presets";

const FILTER_ITEMS: { value: CommunityFilterOption; label: string; requiresAuth: boolean }[] = [
  { value: "all", label: "All Presets", requiresAuth: false },
  { value: "mine", label: "My Published", requiresAuth: true },
  { value: "liked", label: "Liked", requiresAuth: true },
];

interface CommunitySidebarContentProps {
  filter: CommunityFilterOption;
  onFilterChange: (filter: CommunityFilterOption) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  selectedStyle: string | null;
  onStyleChange: (style: string | null) => void;
}

export function CommunitySidebarContent({
  filter,
  onFilterChange,
  selectedTags,
  onTagToggle,
  selectedStyle,
  onStyleChange,
}: CommunitySidebarContentProps) {
  const { data: session } = useSession();
  const { data: tagCounts, isLoading: tagsLoading } = useCommunityTagCounts();

  return (
    <div className="flex flex-col gap-6">
      {/* Filter tabs */}
      <div className="flex flex-col gap-1">
        {FILTER_ITEMS.map((item) => {
          const disabled = item.requiresAuth && !session?.user;

          return (
            <Button
              key={item.value}
              variant="ghost"
              size="sm"
              disabled={disabled}
              className={cn(
                "justify-start h-8",
                filter === item.value
                  ? "bg-foreground/10 text-foreground font-medium"
                  : "text-muted-foreground",
              )}
              onClick={() => onFilterChange(item.value)}
            >
              {item.label}
              {disabled && (
                <span className="ml-auto text-[10px] text-muted-foreground/60">Sign in</span>
              )}
            </Button>
          );
        })}
      </div>

      {/* Styles */}
      <div className="flex flex-col gap-2">
        <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Style
        </span>
        <div className="flex flex-col gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "justify-start h-7 text-xs gap-2",
              !selectedStyle
                ? "bg-foreground/10 text-foreground font-medium"
                : "text-muted-foreground hover:bg-foreground/5",
            )}
            onClick={() => onStyleChange(null)}
          >
            All Styles
          </Button>
          {STYLES.map((style) => (
            <Button
              key={style.name}
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start h-7 text-xs gap-2",
                selectedStyle === style.name
                  ? "bg-foreground/10 text-foreground font-medium"
                  : "text-muted-foreground hover:bg-foreground/5",
              )}
              onClick={() => onStyleChange(selectedStyle === style.name ? null : style.name)}
            >
              <span className="size-3.5 shrink-0 [&>svg]:size-full">{style.icon}</span>
              {style.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Tags
        </span>
        <div className="flex flex-col gap-0.5">
          {tagsLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-full rounded-md" />
            ))
          ) : tagCounts && tagCounts.length > 0 ? (
            tagCounts.map(({ tag, count }) => (
              <Button
                key={tag}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-between h-7 text-xs",
                  selectedTags.includes(tag)
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-foreground/5",
                )}
                onClick={() => onTagToggle(tag)}
              >
                <span>{tag}</span>
                <span className="text-muted-foreground/60">{count}</span>
              </Button>
            ))
          ) : (
            <p className="px-3 text-xs text-muted-foreground">No tags yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
