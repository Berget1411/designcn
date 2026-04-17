import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const apiKey = process.env.MASTRA_API_KEY;
if (!apiKey) {
  throw new Error("MASTRA_API_KEY is not set");
}

export const mastraGateway = createOpenAICompatible({
  name: "mastra-gateway",
  apiKey,
  baseURL: process.env.MASTRA_GATEWAY_URL ?? "https://gateway-api.mastra.ai/v1",
});
