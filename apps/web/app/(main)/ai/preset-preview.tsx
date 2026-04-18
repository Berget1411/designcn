"use client";

import {
  type CustomThemeVars,
  encodeCustomThemeVars,
  hasCustomThemeVars,
} from "@/app/create/lib/custom-theme-vars";
import { buildManualComponentsJson, buildManualGlobalsCss } from "@/app/create/lib/manual-install";
import { getPresetCode } from "@/app/create/lib/preset-code";
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockFilename,
  CodeBlockTitle,
} from "@/components/ai-elements/code-block";
import { FileTree, FileTreeFile, FileTreeFolder } from "@/components/ai-elements/file-tree";
import type { DesignSystemConfig } from "@/registry/config";
import { EyeIcon, ExternalLinkIcon, CodeIcon, Redo2Icon, Undo2Icon, XIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Right-side preview panel with live preview / code toggle and version history.
// ---------------------------------------------------------------------------

type PanelView = "preview" | "code";

interface PresetPreviewPanelProps {
  config: DesignSystemConfig;
  customVars: CustomThemeVars | null;
  onClose: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  historyPosition?: number;
  historyLength?: number;
}

// ---------------------------------------------------------------------------
// File definitions for the code view
// ---------------------------------------------------------------------------

const FILE_PATHS = {
  componentsJson: "components.json",
  globalsCss: "app/globals.css",
} as const;

type FilePath = (typeof FILE_PATHS)[keyof typeof FILE_PATHS];

const FILE_LANGUAGES: Record<FilePath, "json" | "css"> = {
  [FILE_PATHS.componentsJson]: "json",
  [FILE_PATHS.globalsCss]: "css",
};

// ---------------------------------------------------------------------------
// Code view sub-component
// ---------------------------------------------------------------------------

function PresetCodeView({
  config,
  customVars,
}: {
  config: DesignSystemConfig;
  customVars: CustomThemeVars | null;
}) {
  const [selectedPath, setSelectedPath] = useState<string>(FILE_PATHS.globalsCss);

  const files = useMemo(() => {
    const normalizedVars = customVars && hasCustomThemeVars(customVars) ? customVars : undefined;
    return {
      [FILE_PATHS.componentsJson]: buildManualComponentsJson(config),
      [FILE_PATHS.globalsCss]: buildManualGlobalsCss(config, normalizedVars),
    };
  }, [config, customVars]);

  const activeCode = files[selectedPath as FilePath] ?? "";
  const activeLanguage = FILE_LANGUAGES[selectedPath as FilePath] ?? "css";

  const handleSelect = useCallback(
    (path: string) => {
      if (path in files) {
        setSelectedPath(path);
      }
    },
    [files],
  );

  return (
    <div className="flex h-full flex-col">
      {/* File tree */}
      <div className="shrink-0 border-b">
        <FileTree
          defaultExpanded={new Set(["app"])}
          onSelect={handleSelect}
          selectedPath={selectedPath}
          className="rounded-none border-0"
        >
          <FileTreeFile name="components.json" path={FILE_PATHS.componentsJson} />
          <FileTreeFolder name="app" path="app">
            <FileTreeFile name="globals.css" path={FILE_PATHS.globalsCss} />
          </FileTreeFolder>
        </FileTree>
      </div>

      {/* Code block */}
      <div className="relative min-h-0 flex-1 overflow-auto">
        <CodeBlock
          code={activeCode}
          language={activeLanguage}
          showLineNumbers
          className="h-full rounded-none border-0"
        >
          <CodeBlockHeader>
            <CodeBlockTitle>
              <CodeBlockFilename>{selectedPath}</CodeBlockFilename>
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton />
            </CodeBlockActions>
          </CodeBlockHeader>
        </CodeBlock>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export function PresetPreviewPanel({
  config,
  customVars,
  onClose,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  historyPosition,
  historyLength,
}: PresetPreviewPanelProps) {
  const [view, setView] = useState<PanelView>("preview");

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
        {/* View toggle */}
        <div className="flex items-center gap-0.5 rounded-md border p-0.5">
          <button
            type="button"
            onClick={() => setView("preview")}
            className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors ${
              view === "preview"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <EyeIcon className="size-3" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => setView("code")}
            className={`flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs transition-colors ${
              view === "code"
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <CodeIcon className="size-3" />
            Code
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* History navigation */}
          {(onGoBack || onGoForward) && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={onGoBack}
                disabled={!canGoBack}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30"
                title="Undo (Cmd+Z)"
              >
                <Undo2Icon className="size-3.5" />
              </button>
              {historyLength != null && historyLength > 1 && (
                <span className="min-w-[2rem] text-center text-[10px] tabular-nums text-muted-foreground">
                  {historyPosition}/{historyLength}
                </span>
              )}
              <button
                type="button"
                onClick={onGoForward}
                disabled={!canGoForward}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-30"
                title="Redo (Cmd+Shift+Z)"
              >
                <Redo2Icon className="size-3.5" />
              </button>
            </div>
          )}

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

      {/* Panel body */}
      {view === "preview" ? (
        <div className="relative flex-1">
          <iframe
            src={iframeSrc}
            className="absolute inset-0 size-full border-0"
            title="Preset preview"
            tabIndex={-1}
          />
        </div>
      ) : (
        <PresetCodeView config={config} customVars={customVars} />
      )}
    </div>
  );
}
