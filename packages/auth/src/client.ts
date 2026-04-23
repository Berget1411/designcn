"use client";

import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export function createAuth(baseURL: string, options?: { enableSubscriptions?: boolean }) {
  const plugins = options?.enableSubscriptions !== false ? [polarClient()] : [];

  const authClient = createAuthClient({
    baseURL,
    plugins,
  });

  return authClient;
}

export type AuthClient = ReturnType<typeof createAuth>;
