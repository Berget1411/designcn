import { Mastra } from "@mastra/core";
import { chatRoute } from "@mastra/ai-sdk";
import { weatherAgent } from "./agents/weather-agent";
import { mastraAuth } from "./auth";
import { usageLimitMiddleware } from "./usage";

export const mastra = new Mastra({
  agents: { weatherAgent },
  bundler: {
    transpilePackages: ["@workspace/db"],
  },
  server: {
    apiRoutes: [
      chatRoute({
        path: "/chat",
        agent: "weatherAgent",
        version: "v6",
      }),
    ],
    middleware: [
      {
        path: "/chat",
        handler: usageLimitMiddleware,
      },
    ],
    cors: {
      origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
      credentials: true,
      exposeHeaders: ["X-AI-Usage-Limit", "X-AI-Usage-Used", "X-AI-Usage-Plan"],
    },
    auth: mastraAuth,
  },
});
