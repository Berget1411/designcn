"use client";

import * as React from "react";
import { Loader2, Flame } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";

import type { CommunityFilterOption, CommunityPresetItem, CommunitySortOption } from "../lib/types";
import { useCommunityPresets } from "../lib/use-community-presets";
import { CommunityPresetCard } from "./community-preset-card";

interface CommunityGridProps {
  filter: CommunityFilterOption;
  sort: CommunitySortOption;
  tags: string[];
  base: string | null;
}

export function CommunityGrid({ filter, sort, tags, base }: CommunityGridProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useCommunityPresets({
    filter,
    sort,
    tags,
    base,
  });

  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems: CommunityPresetItem[] = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 gap-y-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-44 w-full rounded-xl" />
            <div className="flex items-center gap-2 px-1">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (allItems.length === 0) {
    const message =
      filter === "mine"
        ? "You haven't published any presets yet"
        : filter === "liked"
          ? "You haven't liked any presets yet"
          : "No presets found";

    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
        <Flame className="size-8" />
        <p className="text-sm">{message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-5 gap-y-8">
        {allItems.map((preset) => (
          <CommunityPresetCard key={preset.id} preset={preset} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="flex justify-center py-8">
        {isFetchingNextPage && <Loader2 className="size-5 animate-spin text-muted-foreground" />}
      </div>
    </>
  );
}
