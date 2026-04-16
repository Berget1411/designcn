"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { useSession } from "@/lib/auth-client";
import { useLike } from "../lib/use-like";

interface LikeButtonProps {
  communityPresetId: string;
  likeCount: number;
  isLiked: boolean;
  className?: string;
}

export function LikeButton({ communityPresetId, likeCount, isLiked, className }: LikeButtonProps) {
  const { data: session } = useSession();
  const likeMutation = useLike();

  const handleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      if (!session?.user) {
        window.location.href = "/sign-in";
        return;
      }

      likeMutation.mutate({ communityPresetId });
    },
    [session, communityPresetId, likeMutation],
  );

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-7 gap-1 px-2 text-xs", className)}
      onClick={handleClick}
    >
      <Heart className={cn("size-3.5 transition-colors", isLiked && "fill-red-500 text-red-500")} />
      <span>{likeCount}</span>
    </Button>
  );
}
