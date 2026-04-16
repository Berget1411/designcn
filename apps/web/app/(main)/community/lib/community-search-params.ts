import { useQueryStates } from "nuqs";
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, type Options } from "nuqs/server";

import type { CommunityFilterOption, CommunitySortOption } from "./types";

export const communitySearchParams = {
  filter: parseAsStringLiteral<CommunityFilterOption>(["all", "mine", "liked"]).withDefault("all"),
  sort: parseAsStringLiteral<CommunitySortOption>([
    "popular-weekly",
    "popular-monthly",
    "popular-all",
    "newest",
    "oldest",
  ]).withDefault("newest"),
  tags: parseAsArrayOf(parseAsString).withDefault([]),
  base: parseAsStringLiteral(["radix", "base", "craft"] as const),
};

export function useCommunitySearchParams(options: Options = {}) {
  return useQueryStates(communitySearchParams, {
    shallow: true,
    history: "push",
    ...options,
  });
}
