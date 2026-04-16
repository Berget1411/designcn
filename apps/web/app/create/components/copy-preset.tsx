"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Check, Link } from "lucide-react";

import { cn } from "@/lib/utils";
import { copyToClipboardWithMeta } from "@/components/copy-button";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";

function getAppOrigin() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function CopyPreset({ className }: React.ComponentProps<typeof Button>) {
  const searchParams = useSearchParams();
  const [hasCopied, setHasCopied] = React.useState(false);
  const label = hasCopied ? "Copied" : "Copy Link";
  const shareUrl = React.useMemo(() => {
    const origin = getAppOrigin();
    const query = searchParams.toString();

    return query ? `${origin}/create?${query}` : `${origin}/create`;
  }, [searchParams]);

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => setHasCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleCopy = React.useCallback(() => {
    copyToClipboardWithMeta(shareUrl, {
      name: "copy_create_config_url",
      properties: {
        url: shareUrl,
      },
    });
    setHasCopied(true);
  }, [shareUrl]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleCopy}
          aria-label={label}
          className={cn(
            "touch-manipulation bg-transparent! transition-none select-none hover:bg-muted! pointer-coarse:size-10!",
            className,
          )}
        >
          {hasCopied ? <Check className="size-4" /> : <Link className="size-4" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
}
