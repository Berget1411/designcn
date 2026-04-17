"use client";

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputAttachments,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useSession, useSubscription } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/client";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport } from "ai";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  HeartIcon,
  LockIcon,
  PaletteIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { decodePreset } from "shadcn/preset";
import { toast } from "sonner";
import { ChatMessage, type PaletteColors } from "./chat-message";

const MASTRA_URL = process.env.NEXT_PUBLIC_MASTRA_API_URL ?? "http://localhost:4111";

const FREE_MESSAGE_LIMIT = 5;

const TEXT_SUGGESTIONS = ["Flat Design", "Minimal Style", "Brutalist Vibe", "Developer Dashboard"];

function isAuthError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return msg.includes("401") || msg.includes("unauthorized") || msg.includes("not authenticated");
}

function isUsageLimitError(error: Error): boolean {
  const msg = error.message.toLowerCase();
  return msg.includes("message limit reached") || msg.includes("429");
}

function useAiUsage(isAuthed: boolean) {
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!isAuthed) return;
    try {
      const res = await fetch("/api/ai-usage", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUsed(data.used ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [isAuthed]);

  const increment = useCallback(() => {
    setUsed((prev) => prev + 1);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { used, loading, refetch, increment };
}

// ---------------------------------------------------------------------------
// Preset context helper — decode presetCode to readable config summary
// ---------------------------------------------------------------------------

function decodePresetContext(presetCode: string, name: string): string {
  try {
    const decoded = decodePreset(presetCode);
    if (!decoded) return `[Reference preset: "${name}"]`;
    const parts = [
      decoded.style && `style=${decoded.style}`,
      decoded.font && `font=${decoded.font}`,
      decoded.theme && `theme=${decoded.theme}`,
      decoded.baseColor && `baseColor=${decoded.baseColor}`,
      decoded.iconLibrary && `iconLibrary=${decoded.iconLibrary}`,
      decoded.radius && `radius=${decoded.radius}`,
    ].filter(Boolean);
    return `[Reference preset: "${name}" — ${parts.join(", ")}]`;
  } catch {
    return `[Reference preset: "${name}"]`;
  }
}

// ---------------------------------------------------------------------------
// Inner Chat (must be inside PromptInputProvider)
// ---------------------------------------------------------------------------

function AiChatInner() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const isAuthed = !!session?.user;
  const { plan, isPending: isPlanPending } = useSubscription();
  const isPro = plan === "pro";
  const {
    used,
    loading: isUsageLoading,
    refetch: refetchUsage,
    increment: incrementUsage,
  } = useAiUsage(isAuthed);
  const remaining = Math.max(0, FREE_MESSAGE_LIMIT - used);

  const isHydrating = isSessionLoading || (isAuthed && (isPlanPending || isUsageLoading));
  const isLimitReached = !isHydrating && !isPro && remaining <= 0 && isAuthed;

  // Fetch user's saved + liked presets
  const trpc = useTRPC();
  const { data: savedPresets = [] } = useQuery(
    trpc.presets.list.queryOptions(undefined, {
      enabled: isAuthed,
      staleTime: 30_000,
    }),
  );
  const { data: likedPresets = [] } = useQuery(
    trpc.community.likedPresets.queryOptions(undefined, {
      enabled: isAuthed,
      staleTime: 30_000,
    }),
  );

  // Selected preset for context
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  // Color palette context
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);

  // Resolve selected preset to { name, presetCode }
  const selectedPresetInfo = useMemo(() => {
    if (!selectedPresetKey) return null;
    const [kind, id] = selectedPresetKey.split(":") as [string, string];
    if (kind === "saved") {
      const p = savedPresets.find((s) => s.id === id);
      return p ? { name: p.name, presetCode: p.presetCode } : null;
    }
    if (kind === "liked") {
      const p = likedPresets.find((l) => l.id === id);
      return p ? { name: p.title, presetCode: p.presetCode } : null;
    }
    return null;
  }, [selectedPresetKey, savedPresets, likedPresets]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${MASTRA_URL}/chat`,
        credentials: "include",
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport,
    onFinish() {
      refetchUsage();
    },
    onError(error) {
      if (isAuthError(error)) {
        toast.error("Sign in required", {
          description: "Please sign in to use the AI assistant.",
          id: "ai-auth-error",
        });
      } else if (isUsageLimitError(error)) {
        refetchUsage();
        toast.error("Message limit reached", {
          description: "Upgrade to Pro for unlimited AI messages.",
          id: "ai-limit-error",
        });
      } else {
        toast.error("AI Error", {
          description: error.message,
          id: "ai-error",
        });
      }
    },
  });

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim() && message.files.length === 0) return;
      if (!isAuthed) {
        toast.error("Sign in required", {
          description: "Please sign in to use the AI assistant.",
          id: "ai-auth-error",
        });
        return;
      }
      if (isLimitReached) {
        toast.error("Message limit reached", {
          description: "Upgrade to Pro for unlimited AI messages.",
          id: "ai-limit-error",
        });
        return;
      }
      if (status === "error") clearError();

      // Build text with optional context
      let text = message.text;
      if (selectedPresetInfo) {
        const ctx = decodePresetContext(selectedPresetInfo.presetCode, selectedPresetInfo.name);
        text = `${ctx}\n\n${text}`;
      }
      if (colorPalette) {
        const paletteCtx = `[Color palette: primary=${colorPalette.primary}, secondary=${colorPalette.secondary}, accent=${colorPalette.accent}, muted=${colorPalette.muted}]`;
        text = `${paletteCtx}\n\n${text}`;
      }

      sendMessage({ text, files: message.files });
      if (!isPro) incrementUsage();
    },
    [
      sendMessage,
      isAuthed,
      isLimitReached,
      isPro,
      status,
      clearError,
      incrementUsage,
      selectedPresetInfo,
      colorPalette,
    ],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!isAuthed) {
        toast.error("Sign in required", {
          description: "Please sign in to use the AI assistant.",
          id: "ai-auth-error",
        });
        return;
      }
      if (isLimitReached) {
        toast.error("Message limit reached", {
          description: "Upgrade to Pro for unlimited AI messages.",
          id: "ai-limit-error",
        });
        return;
      }
      sendMessage({ text: suggestion });
      if (!isPro) incrementUsage();
    },
    [sendMessage, isAuthed, isLimitReached, isPro, incrementUsage],
  );

  const handleApplyPalette = useCallback((palette: PaletteColors) => {
    setColorPalette(palette);
  }, []);

  const isEmpty = messages.length === 0;
  const showAuthError = error && isAuthError(error);
  const showLimitError = error && isUsageLimitError(error);

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {isEmpty && !showAuthError && !showLimitError ? (
            <ConversationEmptyState
              title="What can I help you theme?"
              description={
                isHydrating
                  ? ""
                  : isAuthed
                    ? "Describe your ideal design system, upload a reference image, or pick a quick style"
                    : "Sign in to start creating themes"
              }
              icon={
                isHydrating ? (
                  <SparklesIcon className="size-8 animate-pulse opacity-50" />
                ) : isAuthed ? (
                  <SparklesIcon className="size-8" />
                ) : (
                  <LockIcon className="size-8" />
                )
              }
            />
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isStreaming={status === "streaming" && msg === messages.at(-1)}
                  onApplyPalette={handleApplyPalette}
                />
              ))}
              {showAuthError && (
                <div className="mx-auto flex max-w-md items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Sign in required</p>
                    <p className="text-muted-foreground">
                      Your session has expired or you are not signed in.{" "}
                      <Link
                        href="/sign-in"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                      >
                        Sign in
                      </Link>{" "}
                      to continue chatting.
                    </p>
                  </div>
                </div>
              )}
              {showLimitError && (
                <div className="mx-auto flex max-w-md items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <SparklesIcon className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-600 dark:text-amber-400">
                      Message limit reached
                    </p>
                    <p className="text-muted-foreground">
                      You've used all {FREE_MESSAGE_LIMIT} free messages this month.{" "}
                      <Link
                        href="/pricing"
                        className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                      >
                        Upgrade to Pro
                      </Link>{" "}
                      for unlimited AI messages.
                    </p>
                  </div>
                </div>
              )}
              {error && !showAuthError && !showLimitError && (
                <div className="mx-auto flex max-w-md items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                  <AlertCircleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
                  <div className="space-y-1">
                    <p className="font-medium text-destructive">Something went wrong</p>
                    <p className="text-muted-foreground">{error.message}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid shrink-0 gap-4 pt-4">
        {isEmpty && isAuthed && !isHydrating && !isLimitReached && (
          <Suggestions className="px-4">
            <FromImageSuggestion />
            {TEXT_SUGGESTIONS.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={handleSuggestionClick} />
            ))}
          </Suggestions>
        )}

        <div className="w-full px-4 pb-4">
          {isHydrating ? (
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea placeholder="Loading..." disabled />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit status={status} onStop={stop} disabled />
              </PromptInputFooter>
            </PromptInput>
          ) : !isAuthed ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <LockIcon className="size-4" />
              <span>
                <Link
                  href="/sign-in"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  Sign in
                </Link>{" "}
                to use the AI theme generator
              </span>
            </div>
          ) : isLimitReached ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/30 p-4 text-sm text-muted-foreground">
              <SparklesIcon className="size-4 text-amber-500" />
              <span>
                No messages remaining.{" "}
                <Link
                  href="/pricing"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  Upgrade to Pro
                </Link>{" "}
                for unlimited access
              </span>
            </div>
          ) : (
            <PromptInput
              onSubmit={handleSubmit}
              accept="image/*"
              maxFiles={3}
              maxFileSize={4 * 1024 * 1024}
              onError={(err) => toast.error(err.message)}
            >
              <PromptInputHeader>
                <InputAttachmentPreviews />
                {colorPalette && (
                  <ColorPalettePill palette={colorPalette} onRemove={() => setColorPalette(null)} />
                )}
              </PromptInputHeader>
              <PromptInputBody>
                <PromptInputTextarea placeholder="Describe your ideal theme..." />
              </PromptInputBody>
              <PromptInputFooter>
                <div className="flex items-center gap-2">
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments label="Upload image" />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>

                  <ColorPalettePicker value={colorPalette} onChange={setColorPalette} />

                  <PresetSelector
                    open={presetMenuOpen}
                    onOpenChange={setPresetMenuOpen}
                    value={selectedPresetKey}
                    onChange={setSelectedPresetKey}
                    savedPresets={savedPresets}
                    likedPresets={likedPresets}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {isPro ? (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <SparklesIcon className="size-3" />
                      Pro — unlimited
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${
                            remaining <= 1
                              ? "bg-destructive"
                              : remaining <= 2
                                ? "bg-amber-500"
                                : "bg-foreground/60"
                          }`}
                          style={{ width: `${(remaining / FREE_MESSAGE_LIMIT) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {remaining}/{FREE_MESSAGE_LIMIT} left
                      </span>
                    </div>
                  )}
                  <PromptInputSubmit status={status} onStop={stop} />
                </div>
              </PromptInputFooter>
            </PromptInput>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InputAttachmentPreviews() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;

  return (
    <Attachments variant="grid">
      {attachments.files.map((file) => (
        <Attachment key={file.id} data={file} onRemove={() => attachments.remove(file.id)}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

function FromImageSuggestion() {
  const attachments = usePromptInputAttachments();
  return <Suggestion suggestion="From an Image" onClick={() => attachments.openFileDialog()} />;
}

// ---------------------------------------------------------------------------
// Color Palette Picker
// ---------------------------------------------------------------------------

type ColorPalette = {
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
};

const DEFAULT_PALETTE: ColorPalette = {
  primary: "#6366f1",
  secondary: "#a5b4fc",
  accent: "#f59e0b",
  muted: "#f1f5f9",
};

const PALETTE_KEYS: { key: keyof ColorPalette; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "muted", label: "Muted" },
];

function ColorPalettePicker({
  value,
  onChange,
}: {
  value: ColorPalette | null;
  onChange: (palette: ColorPalette | null) => void;
}) {
  const [draft, setDraft] = useState<ColorPalette>(DEFAULT_PALETTE);
  const [open, setOpen] = useState(false);
  const controller = usePromptInputController();

  const handleApply = useCallback(() => {
    onChange(draft);
    setOpen(false);
  }, [draft, onChange]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next && value) setDraft(value);
        else if (next) setDraft(DEFAULT_PALETTE);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <PaletteIcon className="size-3" />
          <span>Colors</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-56 rounded-lg p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-xs font-medium">Color Palette</p>
          <p className="text-[10px] text-muted-foreground">Pick 4 colors as context for AI</p>
        </div>
        <div className="space-y-2 px-3 py-3">
          {PALETTE_KEYS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2.5">
              <label htmlFor={`palette-${key}`} className="w-16 text-[11px] text-muted-foreground">
                {label}
              </label>
              <div className="relative flex flex-1 items-center gap-2">
                <input
                  id={`palette-${key}`}
                  type="color"
                  value={draft[key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  className="size-7 cursor-pointer rounded-md border border-border bg-transparent p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch-wrapper]:p-0"
                />
                <input
                  type="text"
                  value={draft[key]}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                      setDraft((prev) => ({ ...prev, [key]: v }));
                    }
                  }}
                  className="h-7 w-full rounded-md border bg-transparent px-2 font-mono text-[11px] outline-none focus:border-ring"
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 border-t px-3 py-2.5">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              controller.textInput.setInput("Create a color palette for ");
            }}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            <SparklesIcon className="size-3" />
            AI generate palette
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Apply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Pill showing selected color palette above the input */
function ColorPalettePill({ palette, onRemove }: { palette: ColorPalette; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-2.5 py-1.5">
      <div className="flex gap-1">
        {PALETTE_KEYS.map(({ key }) => (
          <span
            key={key}
            className="size-4 rounded-sm border border-border"
            style={{ backgroundColor: palette[key] }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">Color palette</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preset Selector — user's saved + liked presets
// ---------------------------------------------------------------------------

type SavedPreset = { id: string; name: string; presetCode: string; base: string };
type LikedPreset = { id: string; title: string; presetCode: string; base: string };

function PresetSelector({
  open,
  onOpenChange,
  value,
  onChange,
  savedPresets,
  likedPresets,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string | null;
  onChange: (value: string | null) => void;
  savedPresets: SavedPreset[];
  likedPresets: LikedPreset[];
}) {
  const [search, setSearch] = useState("");

  // Reset search when popover closes
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setSearch("");
      onOpenChange(next);
    },
    [onOpenChange],
  );

  // Resolve display label
  const displayLabel = useMemo(() => {
    if (!value) return "Reference preset";
    const [kind, id] = value.split(":") as [string, string];
    if (kind === "saved") {
      return savedPresets.find((p) => p.id === id)?.name ?? "Preset";
    }
    if (kind === "liked") {
      return likedPresets.find((p) => p.id === id)?.title ?? "Preset";
    }
    return "Preset";
  }, [value, savedPresets, likedPresets]);

  const select = useCallback(
    (key: string | null) => {
      onChange(key);
      handleOpenChange(false);
    },
    [onChange, handleOpenChange],
  );

  // Filter presets by search query
  const query = search.toLowerCase().trim();
  const filteredSaved = query
    ? savedPresets.filter((p) => p.name.toLowerCase().includes(query))
    : savedPresets;
  const filteredLiked = query
    ? likedPresets.filter((p) => p.title.toLowerCase().includes(query))
    : likedPresets;
  const hasResults = filteredSaved.length > 0 || filteredLiked.length > 0;
  const hasPresets = savedPresets.length > 0 || likedPresets.length > 0;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {value ? (
            <SparklesIcon className="size-3" />
          ) : (
            <span className="flex gap-0.5">
              <span className="size-2 rounded-full bg-primary" />
              <span className="size-2 rounded-full bg-primary/60" />
              <span className="size-2 rounded-full bg-primary/30" />
              <span className="size-2 rounded-full bg-muted-foreground/30" />
            </span>
          )}
          <span className="max-w-28 truncate">{displayLabel}</span>
          {value ? (
            <span
              role="button"
              tabIndex={0}
              className="rounded-sm p-0.5 hover:bg-muted"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange(null);
                }
              }}
            >
              <XIcon className="size-3" />
            </span>
          ) : (
            <ChevronDownIcon className="size-3" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-60 rounded-lg p-0">
        {/* Search input */}
        {hasPresets && (
          <div className="flex items-center gap-2 border-b px-2.5 py-2">
            <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search presets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-5 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
              autoFocus
            />
          </div>
        )}

        <div className="max-h-52 overflow-y-auto p-1">
          {!hasPresets && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              Save or like presets in the editor to use them as references
            </div>
          )}

          {hasPresets && !hasResults && (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No presets matching &ldquo;{search}&rdquo;
            </div>
          )}

          {/* Saved presets */}
          {filteredSaved.length > 0 && (
            <>
              <div className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <SaveIcon className="mr-1 inline size-3" />
                My Presets
              </div>
              {filteredSaved.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => select(`saved:${preset.id}`)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${value === `saved:${preset.id}` ? "bg-accent" : ""}`}
                >
                  <span className="flex-1 truncate font-medium">{preset.name}</span>
                </button>
              ))}
            </>
          )}

          {/* Liked presets */}
          {filteredLiked.length > 0 && (
            <>
              {filteredSaved.length > 0 && <div className="mx-2 my-1 border-t" />}
              <div className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <HeartIcon className="mr-1 inline size-3" />
                Liked
              </div>
              {filteredLiked.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => select(`liked:${preset.id}`)}
                  className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent ${value === `liked:${preset.id}` ? "bg-accent" : ""}`}
                >
                  <span className="flex-1 truncate font-medium">{preset.title}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

export function AiChat() {
  return (
    <PromptInputProvider>
      <AiChatInner />
    </PromptInputProvider>
  );
}
