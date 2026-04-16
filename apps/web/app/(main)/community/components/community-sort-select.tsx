"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Button } from "@workspace/ui/components/button";
import { ChevronDown } from "lucide-react";
import type { CommunitySortOption } from "../lib/types";

const SORT_OPTIONS: { value: CommunitySortOption; label: string; group: "popular" | "time" }[] = [
  { value: "popular-weekly", label: "Popular — This Week", group: "popular" },
  { value: "popular-monthly", label: "Popular — This Month", group: "popular" },
  { value: "popular-all", label: "Popular — All Time", group: "popular" },
  { value: "newest", label: "Newest", group: "time" },
  { value: "oldest", label: "Oldest", group: "time" },
];

interface CommunitySortSelectProps {
  value: CommunitySortOption;
  onChange: (value: CommunitySortOption) => void;
}

export function CommunitySortSelect({ value, onChange }: CommunitySortSelectProps) {
  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Sort";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {currentLabel}
          <ChevronDown className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SORT_OPTIONS.filter((o) => o.group === "popular").map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
            data-active={value === option.value || undefined}
            className="data-[active]:font-medium"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {SORT_OPTIONS.filter((o) => o.group === "time").map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={() => onChange(option.value)}
            data-active={value === option.value || undefined}
            className="data-[active]:font-medium"
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
