import { createTool } from "@mastra/core/tools";
import { z } from "zod";

/**
 * Tool the AI agent calls to apply a 4-color palette to the user's chat context.
 * When called, the frontend sets the color palette picker state with these colors,
 * so they get included as context in subsequent messages.
 */
export const applyColorPaletteTool = createTool({
  id: "apply-color-palette",
  description:
    "Apply a 4-color palette to the user's color picker context. Call this when you have " +
    "determined good colors for the user's brand/mood and want to set them before or instead " +
    "of generating a full preset. The colors appear in the user's input area and get included " +
    "as context in their next message. Use hex color format.",
  inputSchema: z.object({
    primary: z.string().describe("Primary brand color as hex (e.g. #6366f1)"),
    secondary: z.string().describe("Secondary/supporting color as hex"),
    accent: z.string().describe("Accent/highlight color as hex"),
    muted: z.string().describe("Muted/background tone as hex"),
    description: z.string().describe("Brief explanation of why these colors were chosen"),
  }),
  outputSchema: z.object({
    palette: z.object({
      primary: z.string(),
      secondary: z.string(),
      accent: z.string(),
      muted: z.string(),
    }),
    description: z.string(),
  }),
  execute: async ({ primary, secondary, accent, muted, description }) => {
    return {
      palette: { primary, secondary, accent, muted },
      description,
    };
  },
});
