"use client";

import type { UIMessage } from "ai";
import type { AiGeneratedForm, AiGeneratedFormResult } from "@workspace/forms";
import type { FormElement, FormElementOrList, FormStep } from "@/form-builder/form-types";
import { flattenFormSteps } from "@/form-builder/lib/form-elements-helpers";
import { generateFormCode } from "@/form-builder/lib/generate-form-code";
import { genFormZodSchemaCode } from "@/form-builder/lib/generate-zod-schema";

export type AiMode = "preset" | "plan" | "form";

export const FORM_SUGGESTIONS = [
  "Create an RSVP form for an event with attendee details, guest count, and special requirements.",
  "Build a SaaS onboarding form with account info, billing, and plan selection.",
  "Make a customer feedback form with ratings, multiple choice questions, and written comments.",
];

export type FormToolResult = AiGeneratedFormResult & {
  saved?: true;
};

type ToolOutputState = {
  type: string;
  state?: string;
  output?: unknown;
  toolCallId?: string;
};

export function getFormContextMessages(
  currentForm: AiGeneratedForm | null,
  intent: "generate" | "save",
) {
  if (!currentForm) {
    return [
      {
        role: "system" as const,
        content: `Form mode is active. Intent: ${intent}. No current draft exists yet.`,
      },
    ];
  }

  return [
    {
      role: "system" as const,
      content: [
        "Form mode is active.",
        `Intent: ${intent}.`,
        "Current form draft JSON:",
        JSON.stringify(currentForm, null, 2),
      ].join("\n"),
    },
  ];
}

function isFormToolOutput(output: unknown): output is FormToolResult {
  if (!output || typeof output !== "object") {
    return false;
  }

  const candidate = output as Record<string, unknown>;
  return (
    typeof candidate.summary === "string" &&
    typeof candidate.fieldCount === "number" &&
    typeof candidate.stepCount === "number" &&
    typeof candidate.title === "string" &&
    !!candidate.form &&
    typeof candidate.form === "object"
  );
}

export function extractLatestFormToolResult(messages: UIMessage[]) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];
    if (!message || message.role !== "assistant") {
      continue;
    }

    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex] as ToolOutputState;
      if (
        (part.type === "tool-generateFormLayout" || part.type === "tool-saveFormDraft") &&
        part.state === "output-available" &&
        isFormToolOutput(part.output)
      ) {
        return {
          toolName:
            part.type === "tool-generateFormLayout" ? "generateFormLayout" : "saveFormDraft",
          toolCallId: part.toolCallId ?? `${message.id}-${partIndex}`,
          result: part.output,
        };
      }
    }
  }

  return null;
}

export function extractLatestSavedFormToolResult(messages: UIMessage[]) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const message = messages[messageIndex];
    if (!message || message.role !== "assistant") {
      continue;
    }

    for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
      const part = message.parts[partIndex] as ToolOutputState;
      if (
        part.type === "tool-saveFormDraft" &&
        part.state === "output-available" &&
        isFormToolOutput(part.output)
      ) {
        return {
          toolCallId: part.toolCallId ?? `${message.id}-${partIndex}`,
          result: part.output,
        };
      }
    }
  }

  return null;
}

export function toFormBuilderElements(form: AiGeneratedForm) {
  return {
    isMS: form.isMS,
    formElements: form.isMS
      ? (form.fields as unknown as FormStep[])
      : (form.fields as unknown as FormElementOrList[]),
  };
}

export function buildGeneratedFormFiles(form: AiGeneratedForm) {
  const { formElements, isMS } = toFormBuilderElements(form);
  const tsxCode = generateFormCode({
    formElements,
    isMS,
  })[0]?.code;

  const flatFields = isMS
    ? flattenFormSteps(formElements as FormStep[]).flat()
    : (formElements as FormElementOrList[]).flat();

  return [
    {
      file: "components/generated-form.tsx",
      code: tsxCode ?? "",
    },
    {
      file: "lib/form-schema.ts",
      code: genFormZodSchemaCode(flatFields as FormElement[]),
    },
  ];
}
