import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { communityRouter } from "./community";
import { presetsRouter } from "./presets";

export const appRouter = createTRPCRouter({
  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  presets: presetsRouter,
  community: communityRouter,
});

export type AppRouter = typeof appRouter;
