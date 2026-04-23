"use client";

import { useEffect, useState } from "react";
import type { AuthClient } from "../client";

type Plan = "free" | "pro";

interface SubscriptionState {
  plan: Plan;
  isPending: boolean;
}

export function createUseSubscription(authClient: AuthClient, options?: { enabled?: boolean }) {
  return function useSubscription(): SubscriptionState {
    const { data: session, isPending: sessionPending } = authClient.useSession();
    const [plan, setPlan] = useState<Plan>("free");
    const [isPending, setIsPending] = useState(options?.enabled !== false);

    useEffect(() => {
      // When subscriptions are disabled, skip Polar API calls entirely
      if (options?.enabled === false) return;

      if (sessionPending) return;

      if (!session) {
        setPlan("free");
        setIsPending(false);
        return;
      }

      let cancelled = false;

      async function fetchState() {
        try {
          const response = await authClient.customer.state();
          if (cancelled) return;

          const state = response.data;
          const hasActiveSub = (state?.activeSubscriptions?.length ?? 0) > 0;

          setPlan(hasActiveSub ? "pro" : "free");
        } catch {
          setPlan("free");
        } finally {
          if (!cancelled) setIsPending(false);
        }
      }

      fetchState();
      return () => {
        cancelled = true;
      };
    }, [session, sessionPending]);

    return { plan, isPending };
  };
}
