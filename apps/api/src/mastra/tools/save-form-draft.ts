import { createTool } from "@mastra/core/tools";
import {
  aiFormSchema,
  aiGeneratedFormResultSchema,
  normalizeAiGeneratedFormDraft,
  summarizeAiGeneratedForm,
  type AiGeneratedForm,
} from "@workspace/forms";
import { z } from "zod";

const formRequestContextSchema = z.object({
  currentForm: aiFormSchema.shape.form.optional(),
  intent: z.enum(["generate", "save"]).optional(),
});

export const saveFormDraftTool = createTool({
  id: "saveFormDraft",
  description:
    "Request approval to save the current form draft. Use this only when the user explicitly wants to save the current form.",
  requireApproval: true,
  inputSchema: z.object({
    form: aiFormSchema.shape.form.optional(),
    title: z.string().optional(),
    summary: z.string().optional(),
  }),
  outputSchema: aiGeneratedFormResultSchema.extend({
    saved: z.literal(true),
  }),
  requestContextSchema: formRequestContextSchema,
  execute: async ({ form, title }, context) => {
    const requestContextForm = context.requestContext?.get("currentForm");
    const resolvedForm = aiFormSchema.shape.form.optional().parse(form ?? requestContextForm) as
      | AiGeneratedForm
      | undefined;

    if (!resolvedForm) {
      throw new Error("No form draft was available to save.");
    }

    const normalized = normalizeAiGeneratedFormDraft({
      form: {
        ...resolvedForm,
        title: title?.trim() || resolvedForm.title,
      },
    });

    return {
      ...normalized,
      ...summarizeAiGeneratedForm(normalized),
      saved: true as const,
    };
  },
});
