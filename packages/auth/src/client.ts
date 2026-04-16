"use client";

import { createAuthClient } from "better-auth/react";
import { polarClient } from "@polar-sh/better-auth";

export function createAuth(baseURL: string) {
  const authClient = createAuthClient({
    baseURL,
    plugins: [polarClient()],
  });

  return authClient;
}

export type AuthClient = ReturnType<typeof createAuth>;
