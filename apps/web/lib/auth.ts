import { createAuth } from "@workspace/auth/server";
import { nextCookies } from "better-auth/next-js";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/auth-schema";
import { ENABLE_SUBSCRIPTIONS } from "@/lib/features";

const cookieDomain = process.env.BETTER_AUTH_COOKIE_DOMAIN;
const mastraApiUrl = process.env.NEXT_PUBLIC_MASTRA_API_URL;

export const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL!,
  secret: process.env.BETTER_AUTH_SECRET,
  database: { db, schema },
  trustedOrigins: mastraApiUrl ? [mastraApiUrl] : undefined,
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
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // TODO: replace with your email provider (e.g. Resend)
      console.log(`[auth] password reset link for ${user.email}: ${url}`);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // TODO: replace with your email provider (e.g. Resend)
      console.log(`[auth] verification link for ${user.email}: ${url}`);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  polar: ENABLE_SUBSCRIPTIONS
    ? {
        accessToken: process.env.POLAR_ACCESS_TOKEN!,
        server: "sandbox",
        productId: process.env.POLAR_PRO_PRODUCT_ID!,
        successUrl: process.env.POLAR_SUCCESS_URL!,
        webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
      }
    : undefined,
  plugins: [
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
