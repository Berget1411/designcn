"use client";

import Script from "next/script";
import { DiceFaces05Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { cn } from "@/lib/utils";
import { Button } from "@workspace/ui/components/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { useRandom } from "@/app/create/hooks/use-random";
import { RESET_FORWARD_TYPE } from "@/app/create/hooks/use-reset";

export const RANDOMIZE_FORWARD_TYPE = "randomize-forward";

export function RandomButton({
  variant = "outline",
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { randomize } = useRandom();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="icon-sm"
          onClick={randomize}
          aria-label="Shuffle"
          className={cn(
            "touch-manipulation bg-transparent! transition-none select-none hover:bg-muted! pointer-coarse:size-10!",
            className,
          )}
          {...props}
        >
          <HugeiconsIcon icon={DiceFaces05Icon} size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Shuffle</TooltipContent>
    </Tooltip>
  );
}

export function RandomizeScript() {
  return (
    <Script
      id="randomize-listener"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
            (function() {
              // Forward r key (shuffle) and Shift+R (reset).
              document.addEventListener('keydown', function(e) {
                if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
                  if (
                    (e.target instanceof HTMLElement && e.target.isContentEditable) ||
                    e.target instanceof HTMLInputElement ||
                    e.target instanceof HTMLTextAreaElement ||
                    e.target instanceof HTMLSelectElement
                  ) {
                    return;
                  }
                  e.preventDefault();
                  if (window.parent && window.parent !== window) {
                    var type = e.shiftKey
                      ? '${RESET_FORWARD_TYPE}'
                      : '${RANDOMIZE_FORWARD_TYPE}';
                    window.parent.postMessage({
                      type: type,
                      key: e.key
                    }, '*');
                  }
                }
              });

            })();
          `,
      }}
    />
  );
}
