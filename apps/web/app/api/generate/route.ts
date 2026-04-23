import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { AI_FORM_SYSTEM_PROMPT, aiFormSchema } from "@workspace/forms";

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
      model: openai("gpt-4o-mini"),
      schema: aiFormSchema,
      prompt: prompt,
      system: AI_FORM_SYSTEM_PROMPT,
      maxRetries: 2,
      providerOptions: { openai: { strictJsonSchema: false } },
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
