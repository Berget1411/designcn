import { MCPClient } from "@mastra/mcp";

export const designMcp = new MCPClient({
  id: "design-mcp",
  servers: {
    dembrandt: {
      command: "npx",
      args: ["-y", "-p", "dembrandt", "dembrandt-mcp"],
      timeout: 120000,
    },
  },
});
