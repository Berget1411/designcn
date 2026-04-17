"use client";

import * as React from "react";
import { Filter } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet";

import type { CommunityFilterOption } from "../lib/types";
import { CommunitySidebarContent } from "./community-sidebar";

interface CommunityMobileFiltersProps {
  filter: CommunityFilterOption;
  onFilterChange: (filter: CommunityFilterOption) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  selectedStyle: string | null;
  onStyleChange: (style: string | null) => void;
}

export function CommunityMobileFilters({
  filter,
  onFilterChange,
  selectedTags,
  onTagToggle,
  selectedStyle,
  onStyleChange,
}: CommunityMobileFiltersProps) {
  const [open, setOpen] = React.useState(false);
  const activeCount = (filter !== "all" ? 1 : 0) + selectedTags.length + (selectedStyle ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
          <Filter className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="size-5 p-0 justify-center text-[10px]">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <CommunitySidebarContent
            filter={filter}
            onFilterChange={(f) => {
              onFilterChange(f);
              setOpen(false);
            }}
            selectedTags={selectedTags}
            onTagToggle={onTagToggle}
            selectedStyle={selectedStyle}
            onStyleChange={onStyleChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
