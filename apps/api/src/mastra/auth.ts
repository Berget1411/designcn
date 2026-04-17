import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { MastraAuthBetterAuth } from "@mastra/auth-better-auth";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/auth-schema";

const cookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN;
const corsOrigin = process.env.CORS_ORIGIN;

// Minimal Better Auth instance for session verification only.
// Same DB + same secret as the web app, no plugins needed.
const options: BetterAuthOptions = {
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:4111",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: corsOrigin ? [corsOrigin] : undefined,
  advanced: cookieDomain
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: cookieDomain,
        },
        defaultCookieAttributes: {
          sameSite: "none",
          secure: true,
        },
      }
    : undefined,
};

const auth = betterAuth(options);

export const mastraAuth = new MastraAuthBetterAuth({
  auth,
  protected: ["/chat", "/chat/planner", "/api/*"],
});
