"use client";

import { createAuth } from "@workspace/auth/client";
import { createUseSubscription } from "@workspace/auth/hooks/use-subscription";
import { ENABLE_SUBSCRIPTIONS } from "@/lib/features";

export const authClient = createAuth(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", {
  enableSubscriptions: ENABLE_SUBSCRIPTIONS,
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  forgetPassword,
  resetPassword,
  sendVerificationEmail,
} = authClient;

export const useSubscription = createUseSubscription(authClient, {
  enabled: ENABLE_SUBSCRIPTIONS,
});
