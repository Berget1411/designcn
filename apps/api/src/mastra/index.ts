import { Mastra } from "@mastra/core";
import { chatRoute } from "@mastra/ai-sdk";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";
import { weatherAgent } from "./agents/weather-agent";
import { mastraAuth } from "./auth";
import { usageLimitMiddleware } from "./usage";

export const mastra = new Mastra({
  agents: { weatherAgent },
  deployer: new CloudflareDeployer({
    name: "designcn-api",
    compatibility_date: "2025-04-01",
    vars: {
      NODE_ENV: "production",
    },
  }),
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
