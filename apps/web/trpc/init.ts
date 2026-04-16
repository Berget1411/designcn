import { initTRPC } from "@trpc/server";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  // const user = await auth(opts.headers);
  return { userId: "user_123" };
};

const t = initTRPC.context<Awaited<ReturnType<typeof createTRPCContext>>>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
