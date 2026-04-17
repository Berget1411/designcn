"use client";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import {
  type CustomThemeVars,
  encodeCustomThemeVars,
  hasCustomThemeVars,
} from "@/app/create/lib/custom-theme-vars";
import { getPresetCode } from "@/app/create/lib/preset-code";
import {
  designSystemConfigSchema,
  STYLES,
  THEMES,
  type DesignSystemConfig,
} from "@/registry/config";
import type { UIMessage } from "ai";
import { CheckIcon, ClipboardIcon, ExternalLinkIcon, Loader2Icon, PaletteIcon } from "lucide-react";
import Link from "next/link";
import { memo, useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Preset Extraction
// ---------------------------------------------------------------------------

const PRESET_REGEX = /```designcn-preset\s*\n([\s\S]*?)\n```/;

function extractPresetFromText(text: string): {
  config: DesignSystemConfig | null;
  customVars: CustomThemeVars | null;
  before: string;
  after: string;
} {
  const match = text.match(PRESET_REGEX);
  if (!match) return { config: null, customVars: null, before: text, after: "" };

  const before = text.slice(0, match.index);
  const after = text.slice((match.index ?? 0) + match[0].length);

  try {
    const parsed = JSON.parse(match[1] as string);
    const result = designSystemConfigSchema.safeParse(parsed);
    if (result.success) {
      // Extract customVars separately (not part of designSystemConfigSchema)
      const customVars: CustomThemeVars | null =
        parsed.customVars &&
        typeof parsed.customVars === "object" &&
        (parsed.customVars.light || parsed.customVars.dark)
          ? (parsed.customVars as CustomThemeVars)
          : null;
      return { config: result.data, customVars, before, after };
    }
  } catch {
    // JSON parse failed
  }

  return { config: null, customVars: null, before: text, after: "" };
}

function hasIncompletePresetBlock(text: string): boolean {
  return text.includes("```designcn-preset") && !PRESET_REGEX.test(text);
}

// ---------------------------------------------------------------------------
// Preset Card
// ---------------------------------------------------------------------------

function PresetCard({
  config,
  customVars,
  isStreaming,
}: {
  config: DesignSystemConfig;
  customVars: CustomThemeVars | null;
  isStreaming: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const presetCode = useMemo(() => getPresetCode(config), [config]);

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

  const styleInfo = STYLES.find((s) => s.name === config.style);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(presetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [presetCode]);

  return (
    <div className="my-3 overflow-hidden rounded-lg border bg-card text-card-foreground">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <PaletteIcon className="size-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">{styleInfo?.title ?? config.style} Preset</p>
          <p className="text-xs text-muted-foreground">
            {config.font} · {config.iconLibrary} · {config.radius} radius
          </p>
        </div>
      </div>

      {/* Config summary */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 py-3 text-xs">
        <div>
          <span className="text-muted-foreground">Style</span>
          <p className="font-medium">{styleInfo?.title ?? config.style}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Base Color</span>
          <p className="font-medium capitalize">{config.baseColor}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Theme</span>
          <p className="flex items-center gap-1.5 font-medium capitalize">
            <ThemeDot name={config.theme} />
            {config.theme}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Chart Color</span>
          <p className="flex items-center gap-1.5 font-medium capitalize">
            <ThemeDot name={config.chartColor} />
            {config.chartColor}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Font</span>
          <p className="font-medium">{config.font}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Heading Font</span>
          <p className="font-medium">
            {config.fontHeading === "inherit" ? "Same as body" : config.fontHeading}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Icons</span>
          <p className="font-medium capitalize">{config.iconLibrary}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Radius</span>
          <p className="font-medium capitalize">{config.radius}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Menu</span>
          <p className="font-medium capitalize">
            {config.menuAccent} · {config.menuColor}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Component Base</span>
          <p className="font-medium capitalize">{config.base}</p>
        </div>
      </div>

      {/* Custom color overrides */}
      {customVars && hasCustomThemeVars(customVars) && (
        <div className="border-t px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Custom Color Overrides</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(customVars.light ?? customVars.dark ?? {}).map(([token, value]) => (
              <span
                key={token}
                className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-[11px]"
              >
                <span
                  className="inline-block size-2.5 rounded-full border border-border"
                  style={{ backgroundColor: value }}
                />
                {token}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
        <Link
          href={editorUrl}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <ExternalLinkIcon className="size-3" />
          Apply to Editor
        </Link>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3" />
              Copied
            </>
          ) : (
            <>
              <ClipboardIcon className="size-3" />
              Copy Code
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/** Small color dot for theme/chart color display */
function ThemeDot({ name }: { name: string }) {
  const colorMap: Record<string, string> = {
    red: "bg-red-500",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    yellow: "bg-yellow-500",
    lime: "bg-lime-500",
    green: "bg-green-500",
    emerald: "bg-emerald-500",
    teal: "bg-teal-500",
    cyan: "bg-cyan-500",
    sky: "bg-sky-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    purple: "bg-purple-500",
    fuchsia: "bg-fuchsia-500",
    pink: "bg-pink-500",
    rose: "bg-rose-500",
  };

  return (
    <span
      className={`inline-block size-2.5 rounded-full ${colorMap[name] ?? "bg-muted-foreground/40"}`}
    />
  );
}

/** Placeholder shown while preset JSON block is still streaming */
function PresetCardStreaming() {
  return (
    <div className="my-3 flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      Generating preset…
    </div>
  );
}

// ---------------------------------------------------------------------------
// Palette Card (tool output)
// ---------------------------------------------------------------------------

function PaletteCard({
  output,
  onApply,
}: {
  output: Record<string, unknown>;
  onApply?: (palette: PaletteColors) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);

  const palette = (output.palette ?? output) as Record<string, string>;
  const description = typeof output.description === "string" ? output.description : null;
  const colors = [
    { label: "Primary", value: palette.primary },
    { label: "Secondary", value: palette.secondary },
    { label: "Accent", value: palette.accent },
    { label: "Muted", value: palette.muted },
  ].filter((c) => c.value);

  const handleCopy = useCallback(async () => {
    const text = colors.map((c) => `${c.label}: ${c.value}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [colors]);

  const handleApply = useCallback(() => {
    if (!onApply) return;
    onApply({
      primary: palette.primary ?? "#6366f1",
      secondary: palette.secondary ?? "#a5b4fc",
      accent: palette.accent ?? "#f59e0b",
      muted: palette.muted ?? "#f1f5f9",
    });
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }, [onApply, palette]);

  if (colors.length === 0) return null;

  return (
    <div className="my-3 overflow-hidden rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <PaletteIcon className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">Color Palette</p>
      </div>

      {/* Color swatches */}
      <div className="grid grid-cols-4 gap-0">
        {colors.map((c) => (
          <div key={c.label} className="flex flex-col items-center gap-1.5 px-3 py-3">
            <div
              className="size-10 rounded-lg border border-border shadow-sm"
              style={{ backgroundColor: c.value }}
            />
            <span className="text-[10px] font-medium text-muted-foreground">{c.label}</span>
            <span className="font-mono text-[10px] text-muted-foreground/70">{c.value}</span>
          </div>
        ))}
      </div>

      {description && (
        <div className="border-t px-4 py-2.5">
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      )}

      <div className="flex items-center gap-2 border-t px-4 py-3">
        {onApply && (
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {applied ? (
              <>
                <CheckIcon className="size-3" />
                Applied
              </>
            ) : (
              <>
                <PaletteIcon className="size-3" />
                Apply to Picker
              </>
            )}
          </button>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {copied ? (
            <>
              <CheckIcon className="size-3" />
              Copied
            </>
          ) : (
            <>
              <ClipboardIcon className="size-3" />
              Copy Colors
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Chat Message
// ---------------------------------------------------------------------------

function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is Extract<UIMessage["parts"][number], { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export type PaletteColors = {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

interface ChatMessageProps {
  message: UIMessage;
  isStreaming: boolean;
  onApplyPalette?: (palette: PaletteColors) => void;
}

export const ChatMessage = memo(
  ({ message, isStreaming, onApplyPalette }: ChatMessageProps) => {
    if (message.role === "user") {
      return (
        <Message from="user">
          <MessageContent>{getTextFromParts(message.parts)}</MessageContent>
        </Message>
      );
    }

    return (
      <Message from="assistant">
        <MessageContent>
          {message.parts.map((part, index) => {
            switch (part.type) {
              case "text": {
                const { config, customVars, before, after } = extractPresetFromText(part.text);
                const showStreamingPlaceholder =
                  isStreaming && !config && hasIncompletePresetBlock(part.text);

                return (
                  <div key={`text-${index}`}>
                    {before.trim() && (
                      <MessageResponse isAnimating={isStreaming && !config}>
                        {before}
                      </MessageResponse>
                    )}
                    {config && (
                      <PresetCard
                        config={config}
                        customVars={customVars}
                        isStreaming={isStreaming}
                      />
                    )}
                    {showStreamingPlaceholder && <PresetCardStreaming />}
                    {after.trim() && (
                      <MessageResponse isAnimating={isStreaming}>{after}</MessageResponse>
                    )}
                  </div>
                );
              }

              case "reasoning":
                return (
                  <Reasoning key={`reasoning-${index}`} isStreaming={part.state === "streaming"}>
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text}</ReasoningContent>
                  </Reasoning>
                );

              default: {
                if (part.type.startsWith("tool-")) {
                  const toolPart = part as Record<string, unknown>;
                  const toolName = part.type.replace("tool-", "");

                  // Palette tool — render interactive card
                  if (
                    toolName === "applyColorPalette" &&
                    toolPart.state === "output-available" &&
                    !!toolPart.output
                  ) {
                    return (
                      <PaletteCard
                        key={`tool-${index}`}
                        output={toolPart.output as Record<string, unknown>}
                        onApply={onApplyPalette}
                      />
                    );
                  }

                  // Palette tool running
                  if (toolName === "applyColorPalette" && toolPart.state === "input-available") {
                    return (
                      <div
                        key={`tool-${index}`}
                        className="my-3 flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground"
                      >
                        <Loader2Icon className="size-4 animate-spin" />
                        Generating palette…
                      </div>
                    );
                  }

                  // Generic tool fallback
                  return (
                    <div
                      key={`tool-${index}`}
                      className="rounded-md border bg-muted/50 p-3 text-xs"
                    >
                      <div className="mb-1 font-medium text-muted-foreground">Tool: {toolName}</div>
                      {toolPart.state === "output-available" && !!toolPart.output && (
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {String(
                            typeof toolPart.output === "string"
                              ? toolPart.output
                              : JSON.stringify(toolPart.output, null, 2),
                          )}
                        </pre>
                      )}
                      {toolPart.state === "input-available" && (
                        <span className="text-muted-foreground">Running...</span>
                      )}
                    </div>
                  );
                }
                return null;
              }
            }
          })}
        </MessageContent>
      </Message>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.isStreaming === next.isStreaming &&
    prev.onApplyPalette === next.onApplyPalette &&
    prev.message.parts.length === next.message.parts.length &&
    prev.message.parts.at(-1) === next.message.parts.at(-1),
);

ChatMessage.displayName = "ChatMessage";
