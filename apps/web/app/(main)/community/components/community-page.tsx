"use client";

import * as React from "react";

import type { CommunityFilterOption, CommunitySortOption } from "../lib/types";
import { useCommunitySearchParams } from "../lib/community-search-params";
import { CommunityGrid } from "./community-grid";
import { CommunityMobileFilters } from "./community-mobile-filters";
import { CommunitySidebarContent } from "./community-sidebar";
import { CommunitySortSelect } from "./community-sort-select";

export function CommunityPage() {
  const [params, setParams] = useCommunitySearchParams();

  const filter = params.filter as CommunityFilterOption;
  const sort = params.sort as CommunitySortOption;
  const tags = params.tags ?? [];
  const base = params.base;
  const style = params.style;

  const handleFilterChange = React.useCallback(
    (f: CommunityFilterOption) => {
      void setParams({ filter: f });
    },
    [setParams],
  );

  const handleSortChange = React.useCallback(
    (s: CommunitySortOption) => {
      void setParams({ sort: s });
    },
    [setParams],
  );

  const handleTagToggle = React.useCallback(
    (tag: string) => {
      const current = tags;
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      void setParams({ tags: next });
    },
    [tags, setParams],
  );

  const handleStyleChange = React.useCallback(
    (s: string | null) => {
      void setParams({ style: s as typeof style });
    },
    [setParams],
  );

  return (
    <div className="flex min-h-svh pt-14">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r p-4 sticky top-14 h-[calc(100svh-3.5rem)] overflow-y-auto">
        <CommunitySidebarContent
          filter={filter}
          onFilterChange={handleFilterChange}
          selectedTags={tags}
          onTagToggle={handleTagToggle}
          selectedStyle={style}
          onStyleChange={handleStyleChange}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">Community</h1>
            <CommunityMobileFilters
              filter={filter}
              onFilterChange={handleFilterChange}
              selectedTags={tags}
              onTagToggle={handleTagToggle}
              selectedStyle={style}
              onStyleChange={handleStyleChange}
            />
          </div>
          <CommunitySortSelect value={sort} onChange={handleSortChange} />
        </div>

        {/* Grid — cards link directly to /create */}
        <CommunityGrid filter={filter} sort={sort} tags={tags} base={base} style={style} />
      </main>
    </div>
  );
}
