import { and, asc, count, desc, eq, gt, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "../index";
import { communityPreset, communityPresetTag, presetLike } from "../schema";
import { user } from "../auth-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CommunityListParams {
  cursor?: string | null;
  limit: number;
  filter: "all" | "mine" | "liked";
  sort: "popular-weekly" | "popular-monthly" | "popular-all" | "newest" | "oldest";
  tags?: string[];
  base?: string;
  userId?: string | null;
}

// ---------------------------------------------------------------------------
// Community Presets Repository
// ---------------------------------------------------------------------------

export const communityRepository = {
  // -------------------------------------------------------------------------
  // Queries
  // -------------------------------------------------------------------------

  /** Paginated community preset list with filtering/sorting. */
  async list(params: CommunityListParams) {
    const { cursor, limit, filter, sort, tags, base, userId } = params;

    const conditions: SQL[] = [];

    if (base) {
      conditions.push(eq(communityPreset.base, base));
    }

    if (tags && tags.length > 0) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${communityPresetTag}
          WHERE ${communityPresetTag.communityPresetId} = ${communityPreset.id}
          AND ${communityPresetTag.tag} IN (${sql.join(
            tags.map((t) => sql`${t}`),
            sql`, `,
          )})
        )`,
      );
    }

    if (filter === "mine" && userId) {
      conditions.push(eq(communityPreset.userId, userId));
    } else if (filter === "liked" && userId) {
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${presetLike}
          WHERE ${presetLike.communityPresetId} = ${communityPreset.id}
          AND ${presetLike.userId} = ${userId}
        )`,
      );
    } else if (filter === "mine" || filter === "liked") {
      return { rows: [], offset: 0 };
    }

    if (sort === "popular-weekly") {
      conditions.push(gt(communityPreset.publishedAt, sql`now() - interval '7 days'`));
    } else if (sort === "popular-monthly") {
      conditions.push(gt(communityPreset.publishedAt, sql`now() - interval '30 days'`));
    }

    if (cursor) {
      if (sort.startsWith("popular")) {
        // offset-based for popular sorts
      } else if (sort === "oldest") {
        conditions.push(gt(communityPreset.publishedAt, new Date(cursor)));
      } else {
        conditions.push(sql`${communityPreset.publishedAt} < ${new Date(cursor)}`);
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderBy;
    if (sort.startsWith("popular")) {
      orderBy = [desc(communityPreset.likeCount), desc(communityPreset.publishedAt)];
    } else if (sort === "oldest") {
      orderBy = [asc(communityPreset.publishedAt)];
    } else {
      orderBy = [desc(communityPreset.publishedAt)];
    }

    const offset = sort.startsWith("popular") && cursor ? Number(cursor) : 0;

    const query = db
      .select({
        id: communityPreset.id,
        savedPresetId: communityPreset.savedPresetId,
        title: communityPreset.title,
        description: communityPreset.description,
        presetCode: communityPreset.presetCode,
        base: communityPreset.base,
        likeCount: communityPreset.likeCount,
        publishedAt: communityPreset.publishedAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(communityPreset)
      .innerJoin(user, eq(communityPreset.userId, user.id))
      .where(whereClause)
      .orderBy(...orderBy)
      .limit(limit);

    const rows = sort.startsWith("popular") ? await query.offset(offset) : await query;

    return { rows, offset };
  },

  /** Get a single community preset by id (with author info). */
  async findById(id: string) {
    const [row] = await db
      .select({
        id: communityPreset.id,
        savedPresetId: communityPreset.savedPresetId,
        title: communityPreset.title,
        description: communityPreset.description,
        presetCode: communityPreset.presetCode,
        base: communityPreset.base,
        likeCount: communityPreset.likeCount,
        publishedAt: communityPreset.publishedAt,
        authorId: user.id,
        authorName: user.name,
        authorImage: user.image,
      })
      .from(communityPreset)
      .innerJoin(user, eq(communityPreset.userId, user.id))
      .where(eq(communityPreset.id, id))
      .limit(1);

    return row ?? null;
  },

  /** Find community preset by savedPresetId. */
  async findBySavedPresetId(savedPresetId: string) {
    const [row] = await db
      .select({ id: communityPreset.id })
      .from(communityPreset)
      .where(eq(communityPreset.savedPresetId, savedPresetId))
      .limit(1);

    return row ?? null;
  },

  /** Find community preset owner (for self-like check). */
  async findOwner(communityPresetId: string) {
    const [row] = await db
      .select({ userId: communityPreset.userId })
      .from(communityPreset)
      .where(eq(communityPreset.id, communityPresetId))
      .limit(1);

    return row ?? null;
  },

  /** Verify ownership: find by id and userId. */
  async findByIdAndUser(id: string, userId: string) {
    const [row] = await db
      .select({
        id: communityPreset.id,
        savedPresetId: communityPreset.savedPresetId,
      })
      .from(communityPreset)
      .where(and(eq(communityPreset.id, id), eq(communityPreset.userId, userId)))
      .limit(1);

    return row ?? null;
  },

  // -------------------------------------------------------------------------
  // Tags
  // -------------------------------------------------------------------------

  /** Fetch tags for a list of community preset ids. */
  async getTagsByPresetIds(ids: string[]) {
    if (ids.length === 0) return [];

    return db
      .select({
        communityPresetId: communityPresetTag.communityPresetId,
        tag: communityPresetTag.tag,
      })
      .from(communityPresetTag)
      .where(inArray(communityPresetTag.communityPresetId, ids));
  },

  /** Fetch tags for a single preset. */
  async getTagsByPresetId(id: string) {
    return db
      .select({ tag: communityPresetTag.tag })
      .from(communityPresetTag)
      .where(eq(communityPresetTag.communityPresetId, id));
  },

  /** Get tag usage counts (for tag cloud). */
  async getTagCounts() {
    return db
      .select({
        tag: communityPresetTag.tag,
        count: count(),
      })
      .from(communityPresetTag)
      .groupBy(communityPresetTag.tag)
      .orderBy(desc(count()));
  },

  /** Replace all tags for a community preset. */
  async replaceTags(communityPresetId: string, tags: string[]) {
    await db
      .delete(communityPresetTag)
      .where(eq(communityPresetTag.communityPresetId, communityPresetId));

    if (tags.length > 0) {
      await db.insert(communityPresetTag).values(tags.map((tag) => ({ communityPresetId, tag })));
    }
  },

  /** Insert tags for a community preset. */
  async insertTags(communityPresetId: string, tags: string[]) {
    if (tags.length === 0) return;
    await db.insert(communityPresetTag).values(tags.map((tag) => ({ communityPresetId, tag })));
  },

  // -------------------------------------------------------------------------
  // Likes
  // -------------------------------------------------------------------------

  /** Check if a user has liked a single preset. */
  async isLikedByUser(userId: string, communityPresetId: string) {
    const [row] = await db
      .select({ userId: presetLike.userId })
      .from(presetLike)
      .where(
        and(eq(presetLike.userId, userId), eq(presetLike.communityPresetId, communityPresetId)),
      )
      .limit(1);

    return !!row;
  },

  /** Batch check liked status for multiple preset ids. */
  async getLikedPresetIds(userId: string, presetIds: string[]): Promise<Set<string>> {
    if (presetIds.length === 0) return new Set<string>();

    const rows = await db
      .select({ communityPresetId: presetLike.communityPresetId })
      .from(presetLike)
      .where(and(eq(presetLike.userId, userId), inArray(presetLike.communityPresetId, presetIds)));

    return new Set(rows.map((r) => r.communityPresetId));
  },

  /** Get user's liked community presets. */
  async getLikedPresets(userId: string) {
    return db
      .select({
        id: communityPreset.id,
        title: communityPreset.title,
        presetCode: communityPreset.presetCode,
        base: communityPreset.base,
      })
      .from(presetLike)
      .innerJoin(communityPreset, eq(presetLike.communityPresetId, communityPreset.id))
      .where(eq(presetLike.userId, userId))
      .orderBy(desc(presetLike.createdAt));
  },

  /** Add a like and increment counter. */
  async addLike(userId: string, communityPresetId: string) {
    await db.insert(presetLike).values({ userId, communityPresetId });
    await db
      .update(communityPreset)
      .set({ likeCount: sql`${communityPreset.likeCount} + 1` })
      .where(eq(communityPreset.id, communityPresetId));
  },

  /** Remove a like and decrement counter. */
  async removeLike(userId: string, communityPresetId: string) {
    await db
      .delete(presetLike)
      .where(
        and(eq(presetLike.userId, userId), eq(presetLike.communityPresetId, communityPresetId)),
      );
    await db
      .update(communityPreset)
      .set({ likeCount: sql`GREATEST(${communityPreset.likeCount} - 1, 0)` })
      .where(eq(communityPreset.id, communityPresetId));
  },

  // -------------------------------------------------------------------------
  // Mutations
  // -------------------------------------------------------------------------

  /** Publish a saved preset to community. Returns new id. */
  async create(data: {
    savedPresetId: string;
    userId: string;
    title: string;
    description: string | null;
    presetCode: string;
    base: string;
  }) {
    const [created] = await db
      .insert(communityPreset)
      .values(data)
      .returning({ id: communityPreset.id });

    return created ?? null;
  },

  /** Delete a community preset (ownership enforced). */
  async deleteByIdAndUser(id: string, userId: string) {
    await db
      .delete(communityPreset)
      .where(and(eq(communityPreset.id, id), eq(communityPreset.userId, userId)));
  },

  /** Update community preset fields. */
  async update(id: string, data: Record<string, unknown>) {
    if (Object.keys(data).length === 0) return;
    await db.update(communityPreset).set(data).where(eq(communityPreset.id, id));
  },
};
