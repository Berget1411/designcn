import { createAuth } from "@workspace/auth/server";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/auth-schema";

export const auth = createAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL!,
  secret: process.env.BETTER_AUTH_SECRET,
  database: { db, schema },
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
  polar: {
    accessToken: process.env.POLAR_ACCESS_TOKEN!,
    server: "sandbox",
    productId: process.env.POLAR_PRO_PRODUCT_ID!,
    successUrl: process.env.POLAR_SUCCESS_URL!,
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  },
  plugins: [
    nextCookies(), // must be last
  ],
});

export type Session = typeof auth.$Infer.Session;
