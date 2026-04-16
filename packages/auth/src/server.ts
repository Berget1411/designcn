import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";
import { createPolarClient } from "./lib/payments";

export type { Session } from "better-auth/types";

interface AuthConfig {
  baseURL: string;
  secret?: string;
  database: {
    db: Parameters<typeof drizzleAdapter>[0];
    schema: Parameters<typeof drizzleAdapter>[1]["schema"];
  };
  emailAndPassword?: BetterAuthOptions["emailAndPassword"];
  emailVerification?: BetterAuthOptions["emailVerification"];
  socialProviders?: BetterAuthOptions["socialProviders"];
  polar: {
    accessToken: string;
    server?: "sandbox" | "production";
    productId: string;
    successUrl: string;
    webhookSecret: string;
  };
  plugins?: BetterAuthOptions["plugins"];
}

export function createAuth(config: AuthConfig) {
  const polarClient = createPolarClient({
    accessToken: config.polar.accessToken,
    server: config.polar.server,
  });

  const plugins: BetterAuthOptions["plugins"] = [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      enableCustomerPortal: true,
      use: [
        checkout({
          products: [
            {
              productId: config.polar.productId,
              slug: "pro",
            },
          ],
          successUrl: config.polar.successUrl,
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: config.polar.webhookSecret,
        }),
      ],
    }),
    // Append any extra plugins from consumer (e.g. nextCookies)
    ...(config.plugins ?? []),
  ];

  const auth = betterAuth({
    baseURL: config.baseURL,
    secret: config.secret,
    database: drizzleAdapter(config.database.db, {
      provider: "pg",
      schema: config.database.schema,
    }),
    emailAndPassword: config.emailAndPassword,
    emailVerification: config.emailVerification,
    socialProviders: config.socialProviders,
    plugins,
  });

  return auth;
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = ReturnType<typeof createAuth>["$Infer"]["Session"];
