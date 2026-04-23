import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { createTool } from "@mastra/core/tools";
import {
  AI_FORM_SYSTEM_PROMPT,
  aiFormSchema,
  aiGeneratedFormResultSchema,
  normalizeAiGeneratedFormDraft,
  summarizeAiGeneratedForm,
} from "@workspace/forms";
import { z } from "zod";

export const generateFormLayoutTool = createTool({
  id: "generateFormLayout",
  description:
    "Generate or refine a full form layout. Call this with a single prompt string. For refinements, include the current form JSON and the requested changes inside that prompt string. Return a complete replacement form, never a partial patch.",
  inputSchema: z.object({
    prompt: z
      .string()
      .min(1)
      .describe(
        "Natural-language form request. For refinements, include the current form JSON and the requested changes in this string.",
      ),
  }),
  outputSchema: aiGeneratedFormResultSchema,
  execute: async ({ prompt }) => {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: aiFormSchema,
      system: AI_FORM_SYSTEM_PROMPT,
      prompt,
      maxRetries: 2,
      providerOptions: { openai: { strictJsonSchema: false } },
    });

    const normalized = normalizeAiGeneratedFormDraft(object);
    return {
      ...normalized,
      ...summarizeAiGeneratedForm(normalized),
    };
  },
});
