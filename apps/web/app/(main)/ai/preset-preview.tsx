"use client";

import {
  type CustomThemeVars,
  encodeCustomThemeVars,
  hasCustomThemeVars,
} from "@/app/create/lib/custom-theme-vars";
import { getPresetCode } from "@/app/create/lib/preset-code";
import type { DesignSystemConfig } from "@/registry/config";
import { ExternalLinkIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Right-side preview panel shown when a preset finishes streaming.
// Full-height iframe reusing the existing `/preview/[base]/[name]` route.
// ---------------------------------------------------------------------------

interface PresetPreviewPanelProps {
  config: DesignSystemConfig;
  customVars: CustomThemeVars | null;
  onClose: () => void;
}

export function PresetPreviewPanel({ config, customVars, onClose }: PresetPreviewPanelProps) {
  const presetCode = useMemo(() => getPresetCode(config), [config]);

  const iframeSrc = useMemo(() => {
    let url = `/preview/${config.base}/preview-02?preset=${encodeURIComponent(presetCode)}`;
    if (customVars && hasCustomThemeVars(customVars)) {
      const encoded = encodeCustomThemeVars(customVars);
      if (encoded) {
        url += `&custom=true&vars=${encodeURIComponent(encoded)}`;
      }
    }
    return url;
  }, [config, customVars, presetCode]);

  const editorUrl = useMemo(() => {
    let url = `/create?preset=${encodeURIComponent(presetCode)}&base=${config.base}`;
    if (customVars && hasCustomThemeVars(customVars)) {
      const encoded = encodeCustomThemeVars(customVars);
      if (encoded) {
        url += `&custom=true&vars=${encodeURIComponent(encoded)}`;
      }
    }
    return url;
  }, [presetCode, config.base, customVars]);

  return (
    <div className="flex h-full flex-col border-l bg-background">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">Preview</span>
        <div className="flex items-center gap-1.5">
          <Link
            href={editorUrl}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLinkIcon className="size-3" />
            Open in Editor
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Full-height iframe */}
      <div className="relative flex-1">
        <iframe
          src={iframeSrc}
          className="absolute inset-0 size-full border-0"
          title="Preset preview"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
