import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { MastraAuthBetterAuth } from "@mastra/auth-better-auth";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/auth-schema";

// Minimal Better Auth instance for session verification only.
// Same DB + same secret as the web app, no plugins needed.
const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4111",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
});

export const mastraAuth = new MastraAuthBetterAuth({
  auth,
  protected: ["/chat", "/api/*"],
});
