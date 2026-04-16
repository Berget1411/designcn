import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
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
});

export type AppRouter = typeof appRouter;
