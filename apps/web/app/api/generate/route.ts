import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { aiFormSchema } from "@/form-builder/lib/ai-form-schema";

const responseHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "text/plain; charset=utf-8",
};

export async function POST(request: Request) {
  try {
    let prompt = "";

    // Try to get prompt from body first (useObject sends data via submit())
    try {
      const body = await request.json();
      prompt = body.prompt || "";
    } catch (bodyError) {
      console.warn("Could not parse request body:", bodyError);
    }

    // Fallback to query params if body didn't have prompt
    if (!prompt) {
      const url = new URL(request.url);
      prompt = url.searchParams.get("prompt") || "";
    }

    if (!prompt.trim()) {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: {
          ...responseHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set");
      return new Response(JSON.stringify({ error: "OpenAI API key is not configured" }), {
        status: 500,
        headers: {
          ...responseHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    const res = streamObject({
      // @ts-expect-error - type mismatch between AI SDK versions
      model: openai("gpt-4o-mini"),
      schema: aiFormSchema,
      prompt: prompt,
      system:
        "You are an expert form generator. Your task is to convert natural language form descriptions into structured JSON that matches the provided Zod schema.\n\n" +
        "Key instructions:\n" +
        "- Generate form elements (fields) based on the user's natural language description\n" +
        "- The schema supports both interactive input fields (Input, Select, Checkbox, etc.) and static text elements (H1, H2, H3, Paragraph)\n" +
        "- Use text elements (H1, H2, H3, Paragraph) to add titles, descriptions, and section headers as needed\n" +
        "- Ignore submit buttons, action buttons, or any form submission controls in the output\n" +
        "- Ensure all generated JSON strictly adheres to the provided Zod schema structure\n" +
        "- Include all required fields (id, name, label, fieldType, etc.) for each element\n" +
        "- Generate unique IDs for each form element\n" +
        "- Interpret the user's requirements comprehensively and include all necessary form fields",
      maxRetries: 2,
      onError: (event) => {
        console.error("Stream error:", event.error);
      },
      output: "object",
    });

    return res.toTextStreamResponse();
  } catch (error) {
    console.error("API error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: {
          ...responseHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
}
