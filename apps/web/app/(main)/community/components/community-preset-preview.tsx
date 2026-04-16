"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ExternalLink, Link2 } from "lucide-react";
import { decodePreset } from "shadcn/preset";

import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import type { CommunityPresetItem } from "../lib/types";
import { LikeButton } from "./like-button";

interface CommunityPresetPreviewProps {
  preset: CommunityPresetItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

function getAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function formatDate(isoDate: string) {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CommunityPresetPreview({
  preset,
  open,
  onOpenChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: CommunityPresetPreviewProps) {
  const router = useRouter();
  const [hasCopied, setHasCopied] = React.useState(false);

  // Keyboard navigation
  React.useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasPrev, hasNext, onPrev, onNext]);

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  if (!preset) return null;

  const iframeUrl = `${getAppOrigin()}/preview/${preset.base}/preview-02?preset=${preset.presetCode}`;
  const applyUrl = `/create?preset=${preset.presetCode}&base=${preset.base}`;
  const shareUrl = `${getAppOrigin()}/community?preview=${preset.id}`;

  const handleApply = () => {
    router.push(applyUrl);
  };

  const handleShare = () => {
    void navigator.clipboard.writeText(shareUrl);
    setHasCopied(true);
  };

  // Decode for config info
  const decoded = React.useMemo(() => {
    try {
      const d = decodePreset(preset.presetCode);
      if (!d) return null;
      return {
        style: (d as Record<string, unknown>).style as string | undefined,
        font: (d as Record<string, unknown>).font as string | undefined,
        baseColor: (d as Record<string, unknown>).baseColor as string | undefined,
        radius: (d as Record<string, unknown>).radius as string | undefined,
      };
    } catch {
      return null;
    }
  }, [preset.presetCode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[85vh] w-[95vw] max-w-6xl p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">{preset.title}</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="size-7">
              <AvatarImage src={preset.author.image ?? undefined} alt={preset.author.name} />
              <AvatarFallback className="text-xs">
                {preset.author.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-semibold">{preset.title}</h2>
              <p className="text-xs text-muted-foreground">
                by {preset.author.name} · {formatDate(preset.publishedAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LikeButton
              communityPresetId={preset.id}
              likeCount={preset.likeCount}
              isLiked={preset.isLikedByMe}
            />
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Link2 className="size-3.5 mr-1.5" />
              {hasCopied ? "Copied!" : "Share"}
            </Button>
            <Button size="sm" onClick={handleApply}>
              <ExternalLink className="size-3.5 mr-1.5" />
              Apply
            </Button>
          </div>
        </div>

        {/* Tags + description */}
        {(preset.tags.length > 0 || preset.description) && (
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
            {preset.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {preset.description && (
              <span className="text-xs text-muted-foreground">{preset.description}</span>
            )}
          </div>
        )}

        {/* Config info */}
        {decoded && (
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
            {decoded.style && (
              <Badge variant="outline" className="text-xs capitalize">
                {String(decoded.style)}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs capitalize">
              {preset.base}
            </Badge>
            {decoded.font && (
              <Badge variant="outline" className="text-xs">
                Font: {String(decoded.font)}
              </Badge>
            )}
            {decoded.baseColor && (
              <Badge variant="outline" className="text-xs capitalize">
                {String(decoded.baseColor)}
              </Badge>
            )}
            {decoded.radius && decoded.radius !== "default" && (
              <Badge variant="outline" className="text-xs capitalize">
                Radius: {String(decoded.radius)}
              </Badge>
            )}
          </div>
        )}

        {/* Live iframe preview */}
        <div className="flex-1 relative">
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title={`Preview: ${preset.title}`}
          />
        </div>

        {/* Prev/Next navigation */}
        {hasPrev && onPrev && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/80 backdrop-blur-sm z-10"
            onClick={onPrev}
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        {hasNext && onNext && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-background/80 backdrop-blur-sm z-10"
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
