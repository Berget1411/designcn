"use client";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  Queue,
  QueueItem,
  QueueItemContent,
  QueueItemDescription,
  QueueItemIndicator,
  QueueList,
  QueueSection,
  QueueSectionContent,
  QueueSectionLabel,
  QueueSectionTrigger,
} from "@/components/ai-elements/queue";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
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
import type { FormToolResult } from "./form-mode";
import type { UIMessage } from "ai";
import {
  CheckIcon,
  ClipboardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  Loader2Icon,
  PaletteIcon,
  SaveIcon,
} from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { memo, useCallback, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Preset Extraction
// ---------------------------------------------------------------------------

const PRESET_REGEX = /```designcn-preset\s*\n([\s\S]*?)\n```/;

export function extractPresetFromText(text: string): {
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
// Step Progress Extraction
// ---------------------------------------------------------------------------

const STEP_REGEX = /```designcn-step\s*\n([\s\S]*?)\n```/;

type StepTodo = {
  id: string;
  title: string;
  status: "pending" | "completed";
  description?: string;
};

type StepData = {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  decisions: Record<string, string>;
  todos: StepTodo[];
};

function extractStepFromText(text: string): {
  step: StepData | null;
  rest: string;
} {
  const match = text.match(STEP_REGEX);
  if (!match) return { step: null, rest: text };

  const rest =
    text.slice(0, match.index).trimStart() + text.slice((match.index ?? 0) + match[0].length);

  try {
    const parsed = JSON.parse(match[1] as string);
    if (typeof parsed.currentStep === "number" && Array.isArray(parsed.todos)) {
      return { step: parsed as StepData, rest };
    }
  } catch {
    // JSON parse failed
  }

  return { step: null, rest: text };
}

function hasIncompleteStepBlock(text: string): boolean {
  return text.includes("```designcn-step") && !STEP_REGEX.test(text);
}

// ---------------------------------------------------------------------------
// Brand Summary Extraction
// ---------------------------------------------------------------------------

const BRAND_SUMMARY_REGEX = /```designcn-brand-summary\s*\n([\s\S]*?)\n```/;

type BrandDecision = {
  value: string;
  rationale: string;
};

type BrandSummaryData = {
  personality: string;
  audience?: string;
  direction?: string;
  decisions: Record<string, BrandDecision>;
};

function extractBrandSummaryFromText(text: string): {
  summary: BrandSummaryData | null;
  before: string;
  after: string;
} {
  const match = text.match(BRAND_SUMMARY_REGEX);
  if (!match) return { summary: null, before: text, after: "" };

  const before = text.slice(0, match.index);
  const after = text.slice((match.index ?? 0) + match[0].length);

  try {
    const parsed = JSON.parse(match[1] as string);
    if (typeof parsed.personality === "string" && parsed.decisions) {
      return { summary: parsed as BrandSummaryData, before, after };
    }
  } catch {
    // JSON parse failed
  }

  return { summary: null, before: text, after: "" };
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
// Step Progress Card (planner mode)
// ---------------------------------------------------------------------------

function StepProgressCard({ step }: { step: StepData }) {
  const completed = step.todos.filter((t) => t.status === "completed").length;
  return (
    <div className="my-3">
      <Queue>
        <QueueSection>
          <QueueSectionTrigger>
            <QueueSectionLabel
              count={step.todos.length}
              label={`Design Steps \u2014 ${completed}/${step.todos.length} complete`}
            />
          </QueueSectionTrigger>
          <QueueSectionContent>
            <QueueList>
              {step.todos.map((todo) => (
                <QueueItem key={todo.id}>
                  <div className="flex items-center gap-2">
                    <QueueItemIndicator completed={todo.status === "completed"} />
                    <QueueItemContent completed={todo.status === "completed"}>
                      {todo.title}
                    </QueueItemContent>
                  </div>
                  {todo.description && (
                    <QueueItemDescription completed={todo.status === "completed"}>
                      {todo.description}
                    </QueueItemDescription>
                  )}
                </QueueItem>
              ))}
            </QueueList>
          </QueueSectionContent>
        </QueueSection>
      </Queue>
    </div>
  );
}

/** Placeholder shown while step JSON block is still streaming */
function StepProgressStreaming() {
  return (
    <div className="my-3 flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      Loading progress…
    </div>
  );
}

// ---------------------------------------------------------------------------
// Brand Summary Card (planner mode final output)
// ---------------------------------------------------------------------------

function BrandSummaryCard({ summary }: { summary: BrandSummaryData }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const lines = [
      `Brand Personality: ${summary.personality}`,
      summary.audience ? `Audience: ${summary.audience}` : null,
      summary.direction ? `Direction: ${summary.direction}` : null,
      "",
      "Design Decisions:",
      ...Object.entries(summary.decisions).map(
        ([key, dec]) => `  ${key}: ${dec.value} — ${dec.rationale}`,
      ),
    ].filter(Boolean);
    await navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [summary]);

  return (
    <div className="my-3 overflow-hidden rounded-lg border bg-card text-card-foreground">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <p className="text-sm font-medium">Brand Guideline Summary</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{summary.personality}</p>
        {summary.audience && (
          <p className="text-xs text-muted-foreground">Audience: {summary.audience}</p>
        )}
        {summary.direction && (
          <p className="text-xs text-muted-foreground">Direction: {summary.direction}</p>
        )}
      </div>

      {/* Decisions grid */}
      <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-2">
        {Object.entries(summary.decisions).map(([key, dec]) => (
          <div key={key}>
            <span className="text-xs text-muted-foreground capitalize">{key}</span>
            <p className="text-sm font-medium capitalize">{dec.value}</p>
            <p className="text-xs text-muted-foreground">{dec.rationale}</p>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t px-4 py-3">
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
              Copy Summary
            </>
          )}
        </button>
      </div>
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

type ToolApprovalRequest = ComponentProps<typeof Confirmation>["approval"];

type FormToolPart = {
  state:
    | "approval-requested"
    | "approval-responded"
    | "input-available"
    | "input-streaming"
    | "output-available"
    | "output-denied"
    | "output-error";
  output?: unknown;
  input?: Record<string, unknown>;
  approval?: ToolApprovalRequest;
  toolCallId?: string;
  errorText?: string;
};

function isFormToolResult(output: unknown): output is FormToolResult {
  if (!output || typeof output !== "object") {
    return false;
  }

  const candidate = output as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    typeof candidate.fieldCount === "number" &&
    typeof candidate.stepCount === "number" &&
    typeof candidate.title === "string" &&
    !!candidate.form
  );
}

function FormDraftStreaming({ label }: { label: string }) {
  return (
    <div className="my-3 flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      {label}
    </div>
  );
}

function FormDraftCard({ result, saved = false }: { result: FormToolResult; saved?: boolean }) {
  return (
    <div className="my-3 overflow-hidden rounded-lg border bg-card text-card-foreground">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <FileTextIcon className="size-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">{result.title}</p>
          <p className="text-xs text-muted-foreground">{result.summary}</p>
        </div>
        {saved && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            Saved
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 px-4 py-3 text-xs">
        <div>
          <span className="text-muted-foreground">Type</span>
          <p className="font-medium">{result.isMS ? "Multi-step" : "Single-step"}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Fields</span>
          <p className="font-medium">{result.fieldCount}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Steps</span>
          <p className="font-medium">{result.stepCount}</p>
        </div>
      </div>
    </div>
  );
}

function SaveDraftConfirmationCard({
  part,
  onToolApprovalResponse,
}: {
  part: FormToolPart;
  onToolApprovalResponse?: (options: { id: string; approved: boolean; reason?: string }) => void;
}) {
  const approvalId = part.approval?.id;
  const title = typeof part.input?.title === "string" ? part.input.title : "current draft";

  return (
    <Confirmation approval={part.approval} state={part.state} className="my-3">
      <ConfirmationTitle>Save form draft "{title}"?</ConfirmationTitle>
      <ConfirmationRequest>
        <p className="text-sm text-muted-foreground">
          Approve this to save the current AI-generated draft into your local drafts list.
        </p>
        <ConfirmationActions>
          <ConfirmationAction
            variant="outline"
            onClick={() => {
              if (!approvalId || !onToolApprovalResponse) return;
              onToolApprovalResponse({ id: approvalId, approved: false });
            }}
          >
            Deny
          </ConfirmationAction>
          <ConfirmationAction
            onClick={() => {
              if (!approvalId || !onToolApprovalResponse) return;
              onToolApprovalResponse({ id: approvalId, approved: true });
            }}
          >
            <SaveIcon className="size-3" />
            Approve Save
          </ConfirmationAction>
        </ConfirmationActions>
      </ConfirmationRequest>
      <ConfirmationAccepted>
        <p className="text-sm text-muted-foreground">Save approved. Finalizing the draft…</p>
      </ConfirmationAccepted>
      <ConfirmationRejected>
        <p className="text-sm text-muted-foreground">
          Save was denied. The draft is still available in the preview panel.
        </p>
      </ConfirmationRejected>
    </Confirmation>
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
  onToolApprovalResponse?: (options: { id: string; approved: boolean; reason?: string }) => void;
}

export const ChatMessage = memo(
  ({ message, isStreaming, onApplyPalette, onToolApprovalResponse }: ChatMessageProps) => {
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
                // Extract structured blocks: step progress, brand summary, preset
                const { step, rest: afterStep } = extractStepFromText(part.text);
                const {
                  summary,
                  before: beforeSummary,
                  after: afterSummary,
                } = extractBrandSummaryFromText(afterStep);
                const textForPreset = summary ? beforeSummary + afterSummary : afterStep;
                const { config, customVars, before, after } = extractPresetFromText(textForPreset);

                const showStepStreaming = isStreaming && !step && hasIncompleteStepBlock(part.text);
                const showPresetStreaming =
                  isStreaming && !config && hasIncompletePresetBlock(part.text);

                return (
                  <div key={`text-${index}`}>
                    {step && <StepProgressCard step={step} />}
                    {showStepStreaming && <StepProgressStreaming />}
                    {before.trim() && (
                      <MessageResponse isAnimating={isStreaming && !config && !summary}>
                        {before}
                      </MessageResponse>
                    )}
                    {summary && <BrandSummaryCard summary={summary} />}
                    {config && (
                      <PresetCard
                        config={config}
                        customVars={customVars}
                        isStreaming={isStreaming}
                      />
                    )}
                    {showPresetStreaming && <PresetCardStreaming />}
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

                  if (toolName === "generateFormLayout") {
                    const formPart = part as unknown as FormToolPart;
                    if (
                      (formPart.state === "input-available" ||
                        formPart.state === "input-streaming") &&
                      !formPart.output
                    ) {
                      return (
                        <FormDraftStreaming key={`tool-${index}`} label="Generating form draft…" />
                      );
                    }

                    if (
                      formPart.state === "output-available" &&
                      isFormToolResult(formPart.output)
                    ) {
                      return <FormDraftCard key={`tool-${index}`} result={formPart.output} />;
                    }
                  }

                  if (toolName === "saveFormDraft") {
                    const formPart = part as unknown as FormToolPart;

                    if (
                      formPart.state === "approval-requested" ||
                      formPart.state === "approval-responded" ||
                      formPart.state === "output-denied"
                    ) {
                      return (
                        <SaveDraftConfirmationCard
                          key={`tool-${index}`}
                          part={formPart}
                          onToolApprovalResponse={onToolApprovalResponse}
                        />
                      );
                    }

                    if (
                      (formPart.state === "input-available" ||
                        formPart.state === "input-streaming") &&
                      !formPart.output
                    ) {
                      return (
                        <FormDraftStreaming key={`tool-${index}`} label="Preparing save request…" />
                      );
                    }

                    if (
                      formPart.state === "output-available" &&
                      isFormToolResult(formPart.output)
                    ) {
                      return <FormDraftCard key={`tool-${index}`} result={formPart.output} saved />;
                    }
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
    prev.onToolApprovalResponse === next.onToolApprovalResponse &&
    prev.message.parts.length === next.message.parts.length &&
    prev.message.parts.at(-1) === next.message.parts.at(-1),
);

ChatMessage.displayName = "ChatMessage";
