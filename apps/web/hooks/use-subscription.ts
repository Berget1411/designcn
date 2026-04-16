"use client";

import { useEffect, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";

type Plan = "free" | "pro";

interface SubscriptionState {
  plan: Plan;
  isPending: boolean;
}

export function useSubscription(): SubscriptionState {
  const { data: session, isPending: sessionPending } = useSession();
  const [plan, setPlan] = useState<Plan>("free");
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    // Wait for session to resolve before deciding
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
        // No Polar customer linked yet — treat as free
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
}
