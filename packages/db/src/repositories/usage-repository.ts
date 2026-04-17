import { and, eq, sql } from "drizzle-orm";
import { db } from "../index";
import { aiMessageUsage } from "../schema";

// ---------------------------------------------------------------------------
// AI Usage Repository
// ---------------------------------------------------------------------------

/** First day of current month at 00:00 UTC. */
function currentPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export const usageRepository = {
  /** Get message count for current billing period. */
  async getUsageCount(userId: string): Promise<number> {
    const period = currentPeriodStart();

    const rows = await db
      .select({ messageCount: aiMessageUsage.messageCount })
      .from(aiMessageUsage)
      .where(and(eq(aiMessageUsage.userId, userId), eq(aiMessageUsage.periodStart, period)))
      .limit(1);

    return rows[0]?.messageCount ?? 0;
  },

  /** Increment usage counter (upsert). Returns new count. */
  async incrementUsage(userId: string): Promise<number> {
    const period = currentPeriodStart();

    const result = await db
      .insert(aiMessageUsage)
      .values({
        userId,
        periodStart: period,
        messageCount: 1,
      })
      .onConflictDoUpdate({
        target: [aiMessageUsage.userId, aiMessageUsage.periodStart],
        set: {
          messageCount: sql`${aiMessageUsage.messageCount} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ messageCount: aiMessageUsage.messageCount });

    return result[0]?.messageCount ?? 1;
  },
};
