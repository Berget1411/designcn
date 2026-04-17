"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { useSession } from "@/lib/auth-client";
import { useSubscription } from "@/lib/auth-client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AlertCircleIcon, CloudSunIcon, LockIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChatMessage } from "./chat-message";

const MASTRA_URL = process.env.NEXT_PUBLIC_MASTRA_API_URL ?? "http://localhost:4111";

const FREE_MESSAGE_LIMIT = 5;

const suggestions = [
  "What's the weather in Stockholm?",
  "Is it raining in Tokyo?",
  "How's the weather in New York?",
  "Tell me the weather in London",
];

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

  /** Optimistic +1 for immediate UI feedback */
  const increment = useCallback(() => {
    setUsed((prev) => prev + 1);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { used, loading, refetch, increment };
}

export function AiChat() {
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

  // Gate all conditional UI on loading states to prevent flash
  const isHydrating = isSessionLoading || (isAuthed && (isPlanPending || isUsageLoading));
  const isLimitReached = !isHydrating && !isPro && remaining <= 0 && isAuthed;

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
      // Sync usage from server after response completes
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
      if (!message.text.trim()) return;
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
      sendMessage({ text: message.text });
      if (!isPro) incrementUsage();
    },
    [sendMessage, isAuthed, isLimitReached, isPro, status, clearError, incrementUsage],
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

  const isEmpty = messages.length === 0;
  const showAuthError = error && isAuthError(error);
  const showLimitError = error && isUsageLimitError(error);

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {isEmpty && !showAuthError && !showLimitError ? (
            <ConversationEmptyState
              title="Weather Assistant"
              description={
                isHydrating
                  ? ""
                  : isAuthed
                    ? "Ask me about the weather in any city"
                    : "Sign in to start chatting"
              }
              icon={
                isHydrating ? (
                  <CloudSunIcon className="size-8 animate-pulse opacity-50" />
                ) : isAuthed ? (
                  <CloudSunIcon className="size-8" />
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
            {suggestions.map((s) => (
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
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea placeholder="Ask about the weather..." />
              </PromptInputBody>
              <PromptInputFooter>
                {isPro ? (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <SparklesIcon className="size-3" />
                    Pro — unlimited messages
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
              </PromptInputFooter>
            </PromptInput>
          )}
        </div>
      </div>
    </div>
  );
}
