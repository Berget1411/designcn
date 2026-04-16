import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { communityPreset, savedPreset } from "@/db/schema";
import { authedProcedure, createTRPCRouter } from "../init";

export const presetsRouter = createTRPCRouter({
  list: authedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: savedPreset.id,
        name: savedPreset.name,
        presetCode: savedPreset.presetCode,
        base: savedPreset.base,
        createdAt: savedPreset.createdAt,
        communityPresetId: communityPreset.id,
      })
      .from(savedPreset)
      .leftJoin(communityPreset, eq(savedPreset.id, communityPreset.savedPresetId))
      .where(eq(savedPreset.userId, ctx.userId))
      .orderBy(desc(savedPreset.createdAt));

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
      const [result] = await db
        .insert(savedPreset)
        .values({
          userId: ctx.userId,
          name: input.name,
          presetCode: input.presetCode,
          base: input.base,
        })
        .onConflictDoUpdate({
          target: [savedPreset.userId, savedPreset.name],
          set: {
            presetCode: input.presetCode,
            base: input.base,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: savedPreset.id,
          name: savedPreset.name,
          presetCode: savedPreset.presetCode,
          base: savedPreset.base,
        });

      return result;
    }),

  delete: authedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(savedPreset)
        .where(and(eq(savedPreset.id, input.id), eq(savedPreset.userId, ctx.userId)));

      return { success: true };
    }),
});
