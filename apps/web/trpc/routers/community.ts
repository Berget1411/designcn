import { and, count, desc, eq, gt, inArray, sql, asc } from "drizzle-orm";
import { z } from "zod";
import { decodePreset } from "shadcn/preset";

import { db } from "@workspace/db";
import { user } from "@workspace/db/auth-schema";
import { communityPreset, communityPresetTag, presetLike, savedPreset } from "@workspace/db/schema";
import { authedProcedure, baseProcedure, createTRPCRouter } from "../init";
import {
  COMMUNITY_PAGE_SIZE,
  COMMUNITY_PRESET_TAGS,
  MAX_TAGS_PER_PRESET,
} from "@/app/(main)/community/lib/tags";

const tagSchema = z.array(z.enum(COMMUNITY_PRESET_TAGS)).max(MAX_TAGS_PER_PRESET);

export const communityRouter = createTRPCRouter({
  // -----------------------------------------------------------------------
  // list — paginated community presets
  // -----------------------------------------------------------------------
  list: baseProcedure
    .input(
      z.object({
        cursor: z.string().nullish(),
        limit: z.number().min(1).max(50).default(COMMUNITY_PAGE_SIZE),
        filter: z.enum(["all", "mine", "liked"]).default("all"),
        sort: z
          .enum(["popular-weekly", "popular-monthly", "popular-all", "newest", "oldest"])
          .default("newest"),
        tags: z.array(z.string()).max(10).optional(),
        base: z.enum(["radix", "base", "craft"]).optional(),
        style: z.enum(["vega", "nova", "maia", "lyra", "mira", "luma"]).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor, limit, filter, sort, tags, base, style } = input;

      // Build WHERE conditions
      const conditions = [];

      if (base) {
        conditions.push(eq(communityPreset.base, base));
      }

      // Tag filtering: preset must have at least one of the selected tags
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

      // Filter by ownership or liked (requires auth context)
      if (filter === "mine" && ctx.userId) {
        conditions.push(eq(communityPreset.userId, ctx.userId));
      } else if (filter === "liked" && ctx.userId) {
        conditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${presetLike}
            WHERE ${presetLike.communityPresetId} = ${communityPreset.id}
            AND ${presetLike.userId} = ${ctx.userId}
          )`,
        );
      } else if (filter === "mine" || filter === "liked") {
        // Not authenticated — return empty
        return { items: [], nextCursor: null };
      }

      // Time range for popular sorts
      if (sort === "popular-weekly") {
        conditions.push(gt(communityPreset.publishedAt, sql`now() - interval '7 days'`));
      } else if (sort === "popular-monthly") {
        conditions.push(gt(communityPreset.publishedAt, sql`now() - interval '30 days'`));
      }

      // Cursor-based pagination
      if (cursor) {
        if (sort.startsWith("popular")) {
          // For popular sort, use offset-style via cursor as a number
          // cursor is the offset number stringified
        } else if (sort === "oldest") {
          conditions.push(gt(communityPreset.publishedAt, new Date(cursor)));
        } else {
          // newest: cursor is ISO timestamp, get items older than cursor
          conditions.push(sql`${communityPreset.publishedAt} < ${new Date(cursor)}`);
        }
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Order
      let orderBy;
      if (sort.startsWith("popular")) {
        orderBy = [desc(communityPreset.likeCount), desc(communityPreset.publishedAt)];
      } else if (sort === "oldest") {
        orderBy = [asc(communityPreset.publishedAt)];
      } else {
        orderBy = [desc(communityPreset.publishedAt)];
      }

      // For popular sort with cursor, use offset
      const offset = sort.startsWith("popular") && cursor ? Number(cursor) : 0;

      // When filtering by style, over-fetch since we filter after decode
      const fetchLimit = style ? (limit + 1) * 4 : limit + 1;

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
        .limit(fetchLimit);

      let rows = sort.startsWith("popular") ? await query.offset(offset) : await query;

      // Filter by style (decoded from presetCode)
      if (style) {
        rows = rows.filter((row) => {
          try {
            const decoded = decodePreset(row.presetCode);
            return decoded?.style === style;
          } catch {
            return false;
          }
        });
      }

      const hasMore = rows.length > limit;
      const items = hasMore ? rows.slice(0, limit) : rows;

      // Fetch tags for all items
      const itemIds = items.map((r) => r.id);
      const tagRows =
        itemIds.length > 0
          ? await db
              .select({
                communityPresetId: communityPresetTag.communityPresetId,
                tag: communityPresetTag.tag,
              })
              .from(communityPresetTag)
              .where(inArray(communityPresetTag.communityPresetId, itemIds))
          : [];

      const tagsByPreset = new Map<string, string[]>();
      for (const row of tagRows) {
        const existing = tagsByPreset.get(row.communityPresetId) ?? [];
        existing.push(row.tag);
        tagsByPreset.set(row.communityPresetId, existing);
      }

      // Fetch liked status if authenticated
      let likedSet = new Set<string>();
      if (ctx.userId && itemIds.length > 0) {
        const likedRows = await db
          .select({ communityPresetId: presetLike.communityPresetId })
          .from(presetLike)
          .where(
            and(eq(presetLike.userId, ctx.userId), inArray(presetLike.communityPresetId, itemIds)),
          );
        likedSet = new Set(likedRows.map((r) => r.communityPresetId));
      }

      // Build next cursor
      let nextCursor: string | null = null;
      if (hasMore) {
        if (sort.startsWith("popular")) {
          nextCursor = String((offset ?? 0) + limit);
        } else {
          const lastItem = items[items.length - 1];
          if (lastItem) {
            nextCursor = lastItem.publishedAt.toISOString();
          }
        }
      }

      return {
        items: items.map((row) => ({
          id: row.id,
          savedPresetId: row.savedPresetId,
          title: row.title,
          description: row.description,
          presetCode: row.presetCode,
          base: row.base,
          likeCount: row.likeCount,
          isLikedByMe: likedSet.has(row.id),
          publishedAt: row.publishedAt.toISOString(),
          tags: tagsByPreset.get(row.id) ?? [],
          author: {
            id: row.authorId,
            name: row.authorName,
            image: row.authorImage,
          },
        })),
        nextCursor,
      };
    }),

  // -----------------------------------------------------------------------
  // getById — single community preset
  // -----------------------------------------------------------------------
  getById: baseProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
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
        .where(eq(communityPreset.id, input.id))
        .limit(1);

      if (!row) return null;

      const tagRows = await db
        .select({ tag: communityPresetTag.tag })
        .from(communityPresetTag)
        .where(eq(communityPresetTag.communityPresetId, row.id));

      let isLikedByMe = false;
      if (ctx.userId) {
        const [liked] = await db
          .select({ userId: presetLike.userId })
          .from(presetLike)
          .where(and(eq(presetLike.userId, ctx.userId), eq(presetLike.communityPresetId, row.id)))
          .limit(1);
        isLikedByMe = !!liked;
      }

      return {
        id: row.id,
        savedPresetId: row.savedPresetId,
        title: row.title,
        description: row.description,
        presetCode: row.presetCode,
        base: row.base,
        likeCount: row.likeCount,
        isLikedByMe,
        publishedAt: row.publishedAt.toISOString(),
        tags: tagRows.map((r) => r.tag),
        author: {
          id: row.authorId,
          name: row.authorName,
          image: row.authorImage,
        },
      };
    }),

  // -----------------------------------------------------------------------
  // publish — publish a saved preset to community
  // -----------------------------------------------------------------------
  publish: authedProcedure
    .input(
      z.object({
        savedPresetId: z.string().min(1),
        title: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        tags: tagSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership and fetch preset data
      const [preset] = await db
        .select({
          id: savedPreset.id,
          presetCode: savedPreset.presetCode,
          base: savedPreset.base,
        })
        .from(savedPreset)
        .where(and(eq(savedPreset.id, input.savedPresetId), eq(savedPreset.userId, ctx.userId)))
        .limit(1);

      if (!preset) {
        throw new Error("Preset not found or not owned by you");
      }

      // Check not already published
      const [existing] = await db
        .select({ id: communityPreset.id })
        .from(communityPreset)
        .where(eq(communityPreset.savedPresetId, input.savedPresetId))
        .limit(1);

      if (existing) {
        throw new Error("Preset is already published");
      }

      // Create community preset
      const [created] = await db
        .insert(communityPreset)
        .values({
          savedPresetId: input.savedPresetId,
          userId: ctx.userId,
          title: input.title,
          description: input.description ?? null,
          presetCode: preset.presetCode,
          base: preset.base,
        })
        .returning({ id: communityPreset.id });

      if (!created) {
        throw new Error("Failed to publish preset");
      }

      // Insert tags
      if (input.tags.length > 0) {
        await db.insert(communityPresetTag).values(
          input.tags.map((tag) => ({
            communityPresetId: created.id,
            tag,
          })),
        );
      }

      return { id: created.id };
    }),

  // -----------------------------------------------------------------------
  // unpublish — remove from community
  // -----------------------------------------------------------------------
  unpublish: authedProcedure
    .input(z.object({ communityPresetId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(communityPreset)
        .where(
          and(
            eq(communityPreset.id, input.communityPresetId),
            eq(communityPreset.userId, ctx.userId),
          ),
        );
      return { success: true };
    }),

  // -----------------------------------------------------------------------
  // update — update title/description/tags, optionally sync preset code
  // -----------------------------------------------------------------------
  update: authedProcedure
    .input(
      z.object({
        communityPresetId: z.string().min(1),
        title: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        tags: tagSchema.optional(),
        syncPresetCode: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const [existing] = await db
        .select({
          id: communityPreset.id,
          savedPresetId: communityPreset.savedPresetId,
        })
        .from(communityPreset)
        .where(
          and(
            eq(communityPreset.id, input.communityPresetId),
            eq(communityPreset.userId, ctx.userId),
          ),
        )
        .limit(1);

      if (!existing) {
        throw new Error("Community preset not found or not owned by you");
      }

      const updateData: Record<string, unknown> = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;

      // Optionally sync preset code from saved preset
      if (input.syncPresetCode) {
        const [source] = await db
          .select({ presetCode: savedPreset.presetCode, base: savedPreset.base })
          .from(savedPreset)
          .where(eq(savedPreset.id, existing.savedPresetId))
          .limit(1);

        if (source) {
          updateData.presetCode = source.presetCode;
          updateData.base = source.base;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await db
          .update(communityPreset)
          .set(updateData)
          .where(eq(communityPreset.id, input.communityPresetId));
      }

      // Update tags if provided
      if (input.tags) {
        await db
          .delete(communityPresetTag)
          .where(eq(communityPresetTag.communityPresetId, input.communityPresetId));

        if (input.tags.length > 0) {
          await db.insert(communityPresetTag).values(
            input.tags.map((tag) => ({
              communityPresetId: input.communityPresetId,
              tag,
            })),
          );
        }
      }

      return { success: true };
    }),

  // -----------------------------------------------------------------------
  // like — toggle like
  // -----------------------------------------------------------------------
  like: authedProcedure
    .input(z.object({ communityPresetId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Block self-like
      const [preset] = await db
        .select({ userId: communityPreset.userId })
        .from(communityPreset)
        .where(eq(communityPreset.id, input.communityPresetId))
        .limit(1);

      if (preset?.userId === ctx.userId) {
        throw new Error("Cannot like your own preset");
      }

      // Check if already liked
      const [existing] = await db
        .select({ userId: presetLike.userId })
        .from(presetLike)
        .where(
          and(
            eq(presetLike.userId, ctx.userId),
            eq(presetLike.communityPresetId, input.communityPresetId),
          ),
        )
        .limit(1);

      if (existing) {
        // Unlike
        await db
          .delete(presetLike)
          .where(
            and(
              eq(presetLike.userId, ctx.userId),
              eq(presetLike.communityPresetId, input.communityPresetId),
            ),
          );
        await db
          .update(communityPreset)
          .set({
            likeCount: sql`GREATEST(${communityPreset.likeCount} - 1, 0)`,
          })
          .where(eq(communityPreset.id, input.communityPresetId));

        return { liked: false };
      } else {
        // Like
        await db.insert(presetLike).values({
          userId: ctx.userId,
          communityPresetId: input.communityPresetId,
        });
        await db
          .update(communityPreset)
          .set({
            likeCount: sql`${communityPreset.likeCount} + 1`,
          })
          .where(eq(communityPreset.id, input.communityPresetId));

        return { liked: true };
      }
    }),

  // -----------------------------------------------------------------------
  // isLikedBatch — check liked status for multiple presets
  // -----------------------------------------------------------------------
  isLikedBatch: authedProcedure
    .input(z.object({ presetIds: z.array(z.string()).max(50) }))
    .query(async ({ ctx, input }) => {
      if (input.presetIds.length === 0) return {};

      const rows = await db
        .select({ communityPresetId: presetLike.communityPresetId })
        .from(presetLike)
        .where(
          and(
            eq(presetLike.userId, ctx.userId),
            inArray(presetLike.communityPresetId, input.presetIds),
          ),
        );

      const result: Record<string, boolean> = {};
      for (const id of input.presetIds) {
        result[id] = rows.some((r) => r.communityPresetId === id);
      }
      return result;
    }),

  // -----------------------------------------------------------------------
  // likedPresets — user's liked community presets (for action menu)
  // -----------------------------------------------------------------------
  likedPresets: authedProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        id: communityPreset.id,
        title: communityPreset.title,
        presetCode: communityPreset.presetCode,
        base: communityPreset.base,
      })
      .from(presetLike)
      .innerJoin(communityPreset, eq(presetLike.communityPresetId, communityPreset.id))
      .where(eq(presetLike.userId, ctx.userId))
      .orderBy(desc(presetLike.createdAt));

    return rows;
  }),

  // -----------------------------------------------------------------------
  // tagCounts — tag usage counts
  // -----------------------------------------------------------------------
  tagCounts: baseProcedure.query(async () => {
    const rows = await db
      .select({
        tag: communityPresetTag.tag,
        count: count(),
      })
      .from(communityPresetTag)
      .groupBy(communityPresetTag.tag)
      .orderBy(desc(count()));

    return rows.map((r) => ({ tag: r.tag, count: r.count }));
  }),
});
