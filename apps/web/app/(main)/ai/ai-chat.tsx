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
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { CloudSunIcon } from "lucide-react";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { ChatMessage } from "./chat-message";

const MASTRA_URL = process.env.NEXT_PUBLIC_MASTRA_API_URL ?? "http://localhost:4111";

const suggestions = [
  "What's the weather in Stockholm?",
  "Is it raining in Tokyo?",
  "How's the weather in New York?",
  "Tell me the weather in London",
];

export function AiChat() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${MASTRA_URL}/chat`,
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      if (!message.text.trim()) return;
      sendMessage({ text: message.text });
    },
    [sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion });
    },
    [sendMessage],
  );

  // Show error as toast
  if (error) {
    toast.error("AI Error", {
      description: error.message,
      id: "ai-error",
    });
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {isEmpty ? (
            <ConversationEmptyState
              title="Weather Assistant"
              description="Ask me about the weather in any city"
              icon={<CloudSunIcon className="size-8" />}
            />
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={status === "streaming" && msg === messages.at(-1)}
              />
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="grid shrink-0 gap-4 pt-4">
        {isEmpty && (
          <Suggestions className="px-4">
            {suggestions.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={handleSuggestionClick} />
            ))}
          </Suggestions>
        )}

        <div className="w-full px-4 pb-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea placeholder="Ask about the weather..." />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputSubmit status={status} onStop={stop} />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
