import { initTRPC, TRPCError } from "@trpc/server";

import { auth } from "@/lib/auth";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });
  return { userId: session?.user?.id ?? null };
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const authedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue" });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
