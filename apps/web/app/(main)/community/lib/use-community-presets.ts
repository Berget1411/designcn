"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { CommunityFilterOption, CommunitySortOption } from "./types";

type CommunityBaseOption = "radix" | "base" | "craft";
type CommunityStyleOption = "vega" | "nova" | "maia" | "lyra" | "mira" | "luma";

export function useCommunityPresets({
  filter,
  sort,
  tags,
  base,
  style,
}: {
  filter: CommunityFilterOption;
  sort: CommunitySortOption;
  tags: string[];
  base: string | null;
  style: string | null;
}) {
  const trpc = useTRPC();

  const input = {
    filter,
    sort,
    tags: tags.length > 0 ? tags : undefined,
    base: (base as CommunityBaseOption) ?? undefined,
    style: (style as CommunityStyleOption) ?? undefined,
  };

  return useInfiniteQuery(
    trpc.community.list.infiniteQueryOptions(input, {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 5 * 60 * 1000,
    }),
  );
}

export function useCommunityTagCounts() {
  const trpc = useTRPC();

  return useQuery(
    trpc.community.tagCounts.queryOptions(undefined, {
      staleTime: 15 * 60 * 1000,
    }),
  );
}
