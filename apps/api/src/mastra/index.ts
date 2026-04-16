import { Mastra } from "@mastra/core";
import { chatRoute } from "@mastra/ai-sdk";
import { weatherAgent } from "./agents/weather-agent";

export const mastra = new Mastra({
  agents: { weatherAgent },
  server: {
    apiRoutes: [
      chatRoute({
        path: "/chat",
        agent: "weatherAgent",
        version: "v6",
      }),
    ],
  },
});
