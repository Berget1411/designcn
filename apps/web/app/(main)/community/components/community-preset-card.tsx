"use client";

import * as React from "react";
import Link from "next/link";
import { decodePreset } from "shadcn/preset";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";

import type { CommunityPresetItem } from "../lib/types";
import { LikeButton } from "./like-button";
import { PresetColorSwatch } from "./preset-color-swatch";

interface CommunityPresetCardProps {
  preset: CommunityPresetItem;
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getStyleLabel(presetCode: string): string | null {
  try {
    const decoded = decodePreset(presetCode);
    if (!decoded?.style) return null;
    return decoded.style.charAt(0).toUpperCase() + decoded.style.slice(1);
  } catch {
    return null;
  }
}

export function CommunityPresetCard({ preset }: CommunityPresetCardProps) {
  const styleLabel = React.useMemo(() => getStyleLabel(preset.presetCode), [preset.presetCode]);
  const maxVisibleTags = 2;
  const visibleTags = preset.tags.slice(0, maxVisibleTags);
  const extraTagCount = preset.tags.length - maxVisibleTags;

  const href = `/create?preset=${preset.presetCode}&base=${preset.base}`;

  return (
    <Link href={href} className="group text-left w-full">
      {/* Preview */}
      <div className="relative h-44 overflow-hidden rounded-xl border border-border/50 transition-all group-hover:shadow-md group-hover:border-border">
        <PresetColorSwatch presetCode={preset.presetCode} className="h-full" />
        {/* Tags overlay */}
        {visibleTags.length > 0 && (
          <div className="absolute left-2 top-2 flex gap-1">
            {visibleTags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0"
              >
                {tag}
              </Badge>
            ))}
            {extraTagCount > 0 && (
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0"
              >
                +{extraTagCount}
              </Badge>
            )}
          </div>
        )}
        {/* Style + base badges */}
        <div className="absolute right-2 top-2 flex gap-1">
          {styleLabel && (
            <Badge
              variant="outline"
              className="bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0"
            >
              {styleLabel}
            </Badge>
          )}
          <Badge
            variant="outline"
            className="bg-background/80 backdrop-blur-sm text-[10px] px-1.5 py-0 capitalize"
          >
            {preset.base}
          </Badge>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar className="size-5">
            <AvatarImage src={preset.author.image ?? undefined} alt={preset.author.name} />
            <AvatarFallback className="text-[10px]">
              {preset.author.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex items-baseline gap-1.5">
            <span className="text-sm font-medium truncate max-w-[140px]">{preset.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatDate(preset.publishedAt)}
            </span>
          </div>
        </div>
        <LikeButton
          communityPresetId={preset.id}
          likeCount={preset.likeCount}
          isLiked={preset.isLikedByMe}
        />
      </div>
    </Link>
  );
}
