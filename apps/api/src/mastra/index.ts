import { Mastra } from "@mastra/core";
import { chatRoute } from "@mastra/ai-sdk";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";
import { presetAgent } from "./agents/preset-agent";
import { mastraAuth } from "./auth";
import { usageLimitMiddleware } from "./usage";

export const mastra = new Mastra({
  agents: { presetAgent },
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
        agent: "presetAgent",
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
      origin: [
        process.env.CORS_ORIGIN ?? "http://localhost:3000",
        process.env.CORS_STUDIO_ORIGIN ?? "http://localhost:3000",
      ].filter(Boolean),
      credentials: true,
      exposeHeaders: ["X-AI-Usage-Limit", "X-AI-Usage-Used", "X-AI-Usage-Plan"],
    },
    auth: mastraAuth,
  },
});
