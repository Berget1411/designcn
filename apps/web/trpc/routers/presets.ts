import { z } from "zod";

import { presetRepository } from "@workspace/db/repositories";
import { authedProcedure, createTRPCRouter } from "../init";

export const presetsRouter = createTRPCRouter({
  list: authedProcedure.query(async ({ ctx }) => {
    const rows = await presetRepository.listByUser(ctx.userId);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      presetCode: row.presetCode,
      base: row.base,
      createdAt: row.createdAt,
      isPublished: !!row.communityPresetId,
      communityPresetId: row.communityPresetId,
    }));
  }),

  save: authedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        presetCode: z.string().min(1),
        base: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return presetRepository.upsert({
        userId: ctx.userId,
        name: input.name,
        presetCode: input.presetCode,
        base: input.base,
      });
    }),

  delete: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await presetRepository.deleteByIdAndUser(input.id, ctx.userId);
      return { success: true };
    }),
});
