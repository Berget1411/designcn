"use client";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ai-elements/reasoning";
import type { UIMessage } from "ai";
import { memo } from "react";

function getTextFromParts(parts: UIMessage["parts"]): string {
  return parts
    .filter((p): p is Extract<UIMessage["parts"][number], { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface ChatMessageProps {
  message: UIMessage;
  isStreaming: boolean;
}

export const ChatMessage = memo(
  ({ message, isStreaming }: ChatMessageProps) => {
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
              case "text":
                return (
                  <MessageResponse key={`text-${index}`} isAnimating={isStreaming}>
                    {part.text}
                  </MessageResponse>
                );

              case "reasoning":
                return (
                  <Reasoning key={`reasoning-${index}`} isStreaming={part.state === "streaming"}>
                    <ReasoningTrigger />
                    <ReasoningContent>{part.text}</ReasoningContent>
                  </Reasoning>
                );

              default: {
                // Tool invocations and other part types — render as JSON for now
                if (part.type.startsWith("tool-")) {
                  const toolPart = part as Record<string, unknown>;
                  return (
                    <div
                      key={`tool-${index}`}
                      className="rounded-md border bg-muted/50 p-3 text-xs"
                    >
                      <div className="mb-1 font-medium text-muted-foreground">
                        Tool: {part.type.replace("tool-", "")}
                      </div>
                      {toolPart.state === "output-available" && toolPart.output && (
                        <pre className="overflow-x-auto whitespace-pre-wrap">
                          {typeof toolPart.output === "string"
                            ? toolPart.output
                            : JSON.stringify(toolPart.output, null, 2)}
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
    prev.message.parts.length === next.message.parts.length &&
    prev.message.parts.at(-1) === next.message.parts.at(-1),
);

ChatMessage.displayName = "ChatMessage";
