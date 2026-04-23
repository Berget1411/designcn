import { auth } from "@/lib/auth";
import { ENABLE_AI } from "@/lib/features";
import { usageRepository } from "@workspace/db/repositories";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const FREE_MESSAGE_LIMIT = 5;

export async function GET() {
  if (!ENABLE_AI) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const used = await usageRepository.getUsageCount(session.user.id);

  return NextResponse.json({
    used,
    limit: FREE_MESSAGE_LIMIT,
    remaining: Math.max(0, FREE_MESSAGE_LIMIT - used),
  });
}
