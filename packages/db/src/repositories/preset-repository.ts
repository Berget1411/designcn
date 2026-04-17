import { and, desc, eq } from "drizzle-orm";
import { db } from "../index";
import { savedPreset } from "../schema";
import { communityPreset } from "../schema";

// ---------------------------------------------------------------------------
// Saved Presets Repository
// ---------------------------------------------------------------------------

export const presetRepository = {
  /** List all saved presets for a user, with community publication status. */
  async listByUser(userId: string) {
    return db
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
      .where(eq(savedPreset.userId, userId))
      .orderBy(desc(savedPreset.createdAt));
  },

  /** Create or update a saved preset (upsert by userId + name). */
  async upsert(data: { userId: string; name: string; presetCode: string; base: string }) {
    const [result] = await db
      .insert(savedPreset)
      .values(data)
      .onConflictDoUpdate({
        target: [savedPreset.userId, savedPreset.name],
        set: {
          presetCode: data.presetCode,
          base: data.base,
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
  },

  /** Delete a saved preset owned by userId. */
  async deleteByIdAndUser(id: string, userId: string) {
    await db.delete(savedPreset).where(and(eq(savedPreset.id, id), eq(savedPreset.userId, userId)));
  },

  /** Find a saved preset by id and userId (ownership check). */
  async findByIdAndUser(id: string, userId: string) {
    const [row] = await db
      .select({
        id: savedPreset.id,
        presetCode: savedPreset.presetCode,
        base: savedPreset.base,
      })
      .from(savedPreset)
      .where(and(eq(savedPreset.id, id), eq(savedPreset.userId, userId)))
      .limit(1);

    return row ?? null;
  },

  /** Find a saved preset by id (no ownership check). */
  async findById(id: string) {
    const [row] = await db
      .select({
        presetCode: savedPreset.presetCode,
        base: savedPreset.base,
      })
      .from(savedPreset)
      .where(eq(savedPreset.id, id))
      .limit(1);

    return row ?? null;
  },
};
