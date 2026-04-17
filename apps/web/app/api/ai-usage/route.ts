import { auth } from "@/lib/auth";
import { db } from "@workspace/db";
import { aiMessageUsage } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const FREE_MESSAGE_LIMIT = 5;

function currentPeriodStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const period = currentPeriodStart();

  const rows = await db
    .select({ messageCount: aiMessageUsage.messageCount })
    .from(aiMessageUsage)
    .where(and(eq(aiMessageUsage.userId, session.user.id), eq(aiMessageUsage.periodStart, period)))
    .limit(1);

  const used = rows[0]?.messageCount ?? 0;

  return NextResponse.json({
    used,
    limit: FREE_MESSAGE_LIMIT,
    remaining: Math.max(0, FREE_MESSAGE_LIMIT - used),
  });
}
