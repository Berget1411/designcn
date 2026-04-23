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
import { DEFAULT_CONFIG, type DesignSystemConfig } from "@/registry/config";
import { useTRPC } from "@/trpc/client";
import { useLocalForms } from "@/form-builder/hooks/use-local-forms";
import { useChat } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  EyeIcon,
  FileTextIcon,
  GlobeIcon,
  HeartIcon,
  ListOrderedIcon,
  LockIcon,
  PaletteIcon,
  SaveIcon,
  SearchIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { decodePreset } from "shadcn/preset";
import { toast } from "sonner";
import { ChatMessage, extractPresetFromText, type PaletteColors } from "./chat-message";
import {
  type AiMode,
  extractLatestFormToolResult,
  extractLatestSavedFormToolResult,
  FORM_SUGGESTIONS,
  getFormContextMessages,
  toFormBuilderElements,
} from "./form-mode";
import { FormPreviewPanel } from "./form-preview-panel";
import { PresetPreviewPanel } from "./preset-preview";
import { usePreviewHistory } from "./use-preview-history";

const MASTRA_URL = process.env.NEXT_PUBLIC_MASTRA_API_URL ?? "http://localhost:4111";

const FREE_MESSAGE_LIMIT = 5;

const TEXT_SUGGESTIONS = ["Flat Design", "Minimal Style", "Brutalist Vibe", "Developer Dashboard"];

const PLAN_SUGGESTIONS = [
  "Start from scratch",
  "I have a brand in mind",
  "Redesign my current theme",
];

function getModeFromSearchParam(value: string | null): AiMode {
  if (value === "plan" || value === "form") {
    return value;
  }
  return "preset";
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending: isSessionLoading } = useSession();
  const isAuthed = !!session?.user;
  const { plan, isPending: isPlanPending } = useSubscription();
  const mode = getModeFromSearchParam(searchParams.get("mode"));
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
  const setLocalForm = useLocalForms((state) => state.setForm);
  const hasLocalFormsHydrated = useLocalForms((state) => state.hasHydrated);

  // Selected preset for context
  const [selectedPresetKey, setSelectedPresetKey] = useState<string | null>(null);
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  // Color palette context
  const [colorPalette, setColorPalette] = useState<ColorPalette | null>(null);
  const [pendingFormIntent, setPendingFormIntent] = useState<"generate" | "save" | null>(null);
  const [latestSavedDraftInfo, setLatestSavedDraftInfo] = useState<{
    draftId: string;
    sourceToolCallId: string;
  } | null>(null);
  const persistedSaveToolCallIdsRef = useRef(new Set<string>());

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

  const presetTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${MASTRA_URL}/chat`,
        credentials: "include",
      }),
    [],
  );

  const plannerTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${MASTRA_URL}/chat/planner`,
        credentials: "include",
      }),
    [],
  );

  const formTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${MASTRA_URL}/chat/form`,
        credentials: "include",
        body: {
          mode: "form",
        },
      }),
    [],
  );

  const chatErrorHandler = useCallback(
    (error: Error) => {
      setPendingFormIntent(null);
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
    [refetchUsage],
  );

  const presetChat = useChat({
    id: "preset-chat",
    transport: presetTransport,
    onFinish() {
      refetchUsage();
    },
    onError: chatErrorHandler,
  });

  const plannerChat = useChat({
    id: "planner-chat",
    transport: plannerTransport,
    onFinish() {
      refetchUsage();
    },
    onError: chatErrorHandler,
  });

  const formChat = useChat({
    id: "form-chat",
    transport: formTransport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
    onFinish() {
      setPendingFormIntent(null);
      refetchUsage();
    },
    onError: chatErrorHandler,
  });

  const activeChat = mode === "plan" ? plannerChat : mode === "form" ? formChat : presetChat;
  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    clearError,
    addToolApprovalResponse,
  } = activeChat;

  // Preview panel — always visible from start, with version history
  const [previewPanelVisible, setPreviewPanelVisible] = useState(true);

  const previewHistory = usePreviewHistory({
    config: DEFAULT_CONFIG,
    customVars: null,
    label: "Default",
  });

  // Derive latest preset from messages (last assistant message with a preset block)
  const latestPreset = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg?.role !== "assistant") continue;
      const text = msg.parts
        .filter(
          (p): p is Extract<(typeof msg.parts)[number], { type: "text" }> => p.type === "text",
        )
        .map((p) => p.text)
        .join("");
      const { config, customVars } = extractPresetFromText(text);
      if (config) return { config, customVars };
    }
    return null;
  }, [messages]);

  const latestFormToolResult = useMemo(
    () => extractLatestFormToolResult(formChat.messages),
    [formChat.messages],
  );
  const latestSavedFormToolResult = useMemo(
    () => extractLatestSavedFormToolResult(formChat.messages),
    [formChat.messages],
  );
  const currentFormDraft = latestFormToolResult?.result.form ?? null;
  const savedDraftId =
    latestSavedDraftInfo &&
    latestFormToolResult?.toolCallId === latestSavedDraftInfo.sourceToolCallId
      ? latestSavedDraftInfo.draftId
      : null;

  const setMode = useCallback(
    (nextMode: AiMode) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextMode === "preset") {
        params.delete("mode");
      } else {
        params.set("mode", nextMode);
      }
      const query = params.toString();
      router.replace(query ? `/ai?${query}` : "/ai");
    },
    [router, searchParams],
  );

  // Push reference preset into history when user selects one
  const prevSelectedPresetRef = useRef(selectedPresetInfo);
  useEffect(() => {
    if (!selectedPresetInfo || selectedPresetInfo === prevSelectedPresetRef.current) {
      prevSelectedPresetRef.current = selectedPresetInfo;
      return;
    }
    prevSelectedPresetRef.current = selectedPresetInfo;

    const decoded = decodePreset(selectedPresetInfo.presetCode);
    if (!decoded) return;

    // Resolve base from the saved/liked preset data
    let base: string = DEFAULT_CONFIG.base;
    if (selectedPresetKey) {
      const [kind, id] = selectedPresetKey.split(":") as [string, string];
      if (kind === "saved") {
        base = savedPresets.find((s) => s.id === id)?.base ?? DEFAULT_CONFIG.base;
      } else if (kind === "liked") {
        base = likedPresets.find((l) => l.id === id)?.base ?? DEFAULT_CONFIG.base;
      }
    }

    const config: DesignSystemConfig = {
      ...DEFAULT_CONFIG,
      ...decoded,
      base: base as DesignSystemConfig["base"],
    };
    previewHistory.push({
      config,
      customVars: null,
      label: selectedPresetInfo.name,
    });
    setPreviewPanelVisible(true);
  }, [selectedPresetInfo, selectedPresetKey, savedPresets, likedPresets, previewHistory]);

  // Push AI-generated preset into history when it appears
  const prevLatestPresetRef = useRef(latestPreset);
  useEffect(() => {
    if (latestPreset && latestPreset !== prevLatestPresetRef.current) {
      previewHistory.push({
        config: latestPreset.config,
        customVars: latestPreset.customVars,
        label: "AI Generated",
      });
      setPreviewPanelVisible(true);
    }
    prevLatestPresetRef.current = latestPreset;
  }, [latestPreset, previewHistory]);

  useEffect(() => {
    if (!hasLocalFormsHydrated || !latestSavedFormToolResult) {
      return;
    }

    if (persistedSaveToolCallIdsRef.current.has(latestSavedFormToolResult.toolCallId)) {
      return;
    }

    const draftId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { formElements, isMS } = toFormBuilderElements(latestSavedFormToolResult.result.form);

    setLocalForm({
      id: draftId,
      name: latestSavedFormToolResult.result.title,
      formElements,
      isMS,
      createdAt: now,
      updatedAt: now,
    });

    persistedSaveToolCallIdsRef.current.add(latestSavedFormToolResult.toolCallId);
    setLatestSavedDraftInfo({
      draftId,
      sourceToolCallId: latestSavedFormToolResult.toolCallId,
    });
    toast.success("Draft saved locally");
  }, [hasLocalFormsHydrated, latestSavedFormToolResult, setLocalForm]);

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

      if (mode === "form") {
        setPendingFormIntent("generate");
        sendMessage(
          { text: message.text },
          {
            body: {
              context: getFormContextMessages(currentFormDraft, "generate"),
            },
          },
        );
        if (!isPro) incrementUsage();
        return;
      }

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
      mode,
      sendMessage,
      isAuthed,
      isLimitReached,
      isPro,
      status,
      clearError,
      incrementUsage,
      selectedPresetInfo,
      colorPalette,
      currentFormDraft,
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
      if (mode === "form") {
        setPendingFormIntent("generate");
        sendMessage(
          { text: suggestion },
          {
            body: {
              context: getFormContextMessages(currentFormDraft, "generate"),
            },
          },
        );
      } else {
        sendMessage({ text: suggestion });
      }
      if (!isPro) incrementUsage();
    },
    [sendMessage, isAuthed, isLimitReached, isPro, incrementUsage, mode, currentFormDraft],
  );

  const handleApplyPalette = useCallback((palette: PaletteColors) => {
    setColorPalette(palette);
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!currentFormDraft) {
      return;
    }
    if (!isAuthed || isLimitReached) {
      return;
    }
    if (status === "error") {
      clearError();
    }
    setPendingFormIntent("save");
    sendMessage(
      { text: `Save the current draft "${currentFormDraft.title}"` },
      {
        body: {
          context: getFormContextMessages(currentFormDraft, "save"),
        },
      },
    );
    if (!isPro) {
      incrementUsage();
    }
  }, [
    clearError,
    currentFormDraft,
    incrementUsage,
    isAuthed,
    isLimitReached,
    isPro,
    sendMessage,
    status,
  ]);

  const handleNewForm = useCallback(() => {
    setPendingFormIntent(null);
    setLatestSavedDraftInfo(null);
    setMessages([]);
    setPreviewPanelVisible(true);
  }, [setMessages]);

  const isEmpty = messages.length === 0;
  const showAuthError = error && isAuthError(error);
  const showLimitError = error && isUsageLimitError(error);

  return (
    <div className="relative flex size-full overflow-hidden">
      {/* Chat column */}
      <div
        className={`flex flex-col divide-y overflow-hidden transition-all ${previewPanelVisible ? "w-1/2" : "w-full"}`}
      >
        <Conversation>
          <ConversationContent>
            {isEmpty && !showAuthError && !showLimitError ? (
              <ConversationEmptyState
                title={
                  mode === "plan"
                    ? "Let's build your design system"
                    : mode === "form"
                      ? "What form should I build?"
                      : "What can I help you theme?"
                }
                description={
                  isHydrating
                    ? ""
                    : isAuthed
                      ? mode === "plan"
                        ? "I'll learn about your brand, then guide you through each design decision"
                        : mode === "form"
                          ? "Describe the form you want, then keep refining it while the live preview and code update on the right."
                          : "Describe your ideal design system, upload a reference image, or pick a quick style"
                      : "Sign in to start creating themes"
                }
                icon={
                  isHydrating ? (
                    <SparklesIcon className="size-8 animate-pulse opacity-50" />
                  ) : isAuthed ? (
                    mode === "plan" ? (
                      <ListOrderedIcon className="size-8" />
                    ) : mode === "form" ? (
                      <FileTextIcon className="size-8" />
                    ) : (
                      <SparklesIcon className="size-8" />
                    )
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
                    onToolApprovalResponse={addToolApprovalResponse}
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
              {mode === "plan" ? (
                PLAN_SUGGESTIONS.map((s) => (
                  <Suggestion key={s} suggestion={s} onClick={handleSuggestionClick} />
                ))
              ) : mode === "form" ? (
                FORM_SUGGESTIONS.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={handleSuggestionClick}
                  />
                ))
              ) : (
                <>
                  <FromImageSuggestion />
                  {TEXT_SUGGESTIONS.map((s) => (
                    <Suggestion key={s} suggestion={s} onClick={handleSuggestionClick} />
                  ))}
                </>
              )}
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
                  to use the AI assistant
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
                accept={mode === "form" ? undefined : "image/*"}
                maxFiles={mode === "form" ? undefined : 3}
                maxFileSize={mode === "form" ? undefined : 4 * 1024 * 1024}
                onError={(err) => toast.error(err.message)}
              >
                <PromptInputHeader>
                  {mode !== "form" && <InputAttachmentPreviews />}
                  {mode !== "form" && colorPalette && (
                    <ColorPalettePill
                      palette={colorPalette}
                      onRemove={() => setColorPalette(null)}
                    />
                  )}
                </PromptInputHeader>
                <PromptInputBody>
                  <PromptInputTextarea
                    placeholder={
                      mode === "form"
                        ? "Describe the form you want to build..."
                        : "Describe your ideal theme..."
                    }
                  />
                </PromptInputBody>
                <PromptInputFooter>
                  <div className="flex items-center gap-2">
                    {mode !== "form" && (
                      <PromptInputActionMenu>
                        <PromptInputActionMenuTrigger />
                        <PromptInputActionMenuContent>
                          <PromptInputActionAddAttachments label="Upload image" />
                        </PromptInputActionMenuContent>
                      </PromptInputActionMenu>
                    )}

                    <PlanModeToggle
                      active={mode === "plan"}
                      onToggle={() => setMode(mode === "plan" ? "preset" : "plan")}
                    />

                    <FormModeToggle
                      active={mode === "form"}
                      onToggle={() => setMode(mode === "form" ? "preset" : "form")}
                    />

                    {mode === "preset" && (
                      <>
                        <ColorPalettePicker value={colorPalette} onChange={setColorPalette} />

                        <ExtractWebsiteButton />

                        <PresetSelector
                          open={presetMenuOpen}
                          onOpenChange={setPresetMenuOpen}
                          value={selectedPresetKey}
                          onChange={setSelectedPresetKey}
                          savedPresets={savedPresets}
                          likedPresets={likedPresets}
                        />
                      </>
                    )}
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

      {/* Preview panel */}
      {previewPanelVisible && (
        <div className="w-1/2">
          {mode === "form" ? (
            <FormPreviewPanel
              form={currentFormDraft}
              isGenerating={pendingFormIntent === "generate"}
              isSaving={pendingFormIntent === "save"}
              hasHydratedDrafts={hasLocalFormsHydrated}
              savedDraftId={savedDraftId}
              onClose={() => setPreviewPanelVisible(false)}
              onSaveDraft={handleSaveDraft}
              onNewForm={handleNewForm}
            />
          ) : (
            <PresetPreviewPanel
              config={previewHistory.current.config}
              customVars={previewHistory.current.customVars}
              onClose={() => setPreviewPanelVisible(false)}
              canGoBack={previewHistory.canGoBack}
              canGoForward={previewHistory.canGoForward}
              onGoBack={previewHistory.goBack}
              onGoForward={previewHistory.goForward}
              historyPosition={previewHistory.currentPosition}
              historyLength={previewHistory.historyLength}
            />
          )}
        </div>
      )}

      {/* Re-open preview button when panel is dismissed */}
      {!previewPanelVisible && (
        <button
          type="button"
          onClick={() => setPreviewPanelVisible(true)}
          className="absolute right-4 top-3 z-10 flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <EyeIcon className="size-3" />
          Preview
        </button>
      )}
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
// Extract Website Button
// ---------------------------------------------------------------------------

function ExtractWebsiteButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const controller = usePromptInputController();

  const handleExtract = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) return;
    // Normalize: add https:// if no protocol
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    setOpen(false);
    setUrl("");
    controller.textInput.setInput(`Extract design system from ${normalized}`);
  }, [url, controller]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) setUrl("");
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <GlobeIcon className="size-3" />
          <span>Extract</span>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-72 rounded-lg p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-xs font-medium">Extract from Website</p>
          <p className="text-[10px] text-muted-foreground">
            Extract a site's design system into a preset
          </p>
        </div>
        <div className="px-3 py-3">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleExtract();
                }
              }}
              placeholder="example.com"
              className="h-8 w-full rounded-md border bg-transparent px-2.5 text-xs outline-none placeholder:text-muted-foreground/60 focus:border-ring"
              autoFocus
            />
          </div>
        </div>
        <div className="flex items-center justify-end border-t px-3 py-2.5">
          <button
            type="button"
            onClick={handleExtract}
            disabled={!url.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
          >
            <GlobeIcon className="size-3" />
            Extract
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ---------------------------------------------------------------------------
// Plan Mode Toggle
// ---------------------------------------------------------------------------

function PlanModeToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <ListOrderedIcon className="size-3" />
      <span>Plan</span>
    </button>
  );
}

function FormModeToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <FileTextIcon className="size-3" />
      <span>Create form</span>
    </button>
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
