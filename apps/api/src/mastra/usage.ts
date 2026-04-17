import { usageRepository } from "@workspace/db/repositories";
import { Polar } from "@polar-sh/sdk";
import type { MiddlewareHandler } from "hono";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FREE_MESSAGE_LIMIT = 5;

/** In-memory cache: userId -> { plan, expiresAt } */
const planCache = new Map<string, { plan: "free" | "pro"; expiresAt: number }>();
const PLAN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Polar client (lazy singleton)
// ---------------------------------------------------------------------------

let _polar: Polar | undefined;
function getPolar(): Polar {
  if (!_polar) {
    const token = process.env.POLAR_ACCESS_TOKEN;
    if (!token) throw new Error("POLAR_ACCESS_TOKEN is not set");
    _polar = new Polar({
      accessToken: token,
      server: (process.env.POLAR_SERVER as "sandbox" | "production") ?? "sandbox",
    });
  }
  return _polar;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BetterAuthUser {
  user: { id: string; email: string };
  session: { id: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check Polar for active subscriptions (with in-memory cache). */
async function getUserPlan(userId: string, email: string): Promise<"free" | "pro"> {
  const cached = planCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.plan;
  }

  try {
    const polar = getPolar();
    const { result } = await polar.customers.list({ email });
    const customer = result?.items?.[0];

    if (customer) {
      const subs = await polar.subscriptions.list({
        customerId: customer.id,
        active: true,
      });
      const hasActive = (subs.result?.items?.length ?? 0) > 0;
      const plan = hasActive ? "pro" : "free";
      planCache.set(userId, { plan, expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
      return plan;
    }
  } catch (err) {
    console.error("[usage] Failed to check Polar subscription:", err);
  }

  planCache.set(userId, { plan: "free", expiresAt: Date.now() + PLAN_CACHE_TTL_MS });
  return "free";
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export const usageLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const authConfig = c.get("mastra")?.getServer?.()?.auth;
  let authedUser: BetterAuthUser | null = null;
  if (authConfig && typeof authConfig.authenticateToken === "function") {
    const token =
      c.req
        .header("Authorization")
        ?.replace(/^Bearer\s+/i, "")
        .trim() ?? "";
    authedUser = await authConfig.authenticateToken(token, c.req.raw);
  }

  if (!authedUser?.user?.id) {
    return next();
  }

  const { id: userId, email } = authedUser.user;
  const plan = await getUserPlan(userId, email);

  if (plan === "pro") {
    await usageRepository.incrementUsage(userId);
    return next();
  }

  // Free user: check limit
  const currentCount = await usageRepository.getUsageCount(userId);

  if (currentCount >= FREE_MESSAGE_LIMIT) {
    return c.json(
      {
        error: "Message limit reached",
        message: `Free plan allows ${FREE_MESSAGE_LIMIT} AI messages per month. Upgrade to Pro for unlimited access.`,
        limit: FREE_MESSAGE_LIMIT,
        used: currentCount,
        plan: "free",
      },
      429,
    );
  }

  // Under limit — increment and continue
  const newCount = await usageRepository.incrementUsage(userId);

  c.header("X-AI-Usage-Limit", String(FREE_MESSAGE_LIMIT));
  c.header("X-AI-Usage-Used", String(newCount));
  c.header("X-AI-Usage-Plan", plan);

  return next();
};
