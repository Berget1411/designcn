import { z } from "zod";
import { decodePreset } from "shadcn/preset";

import { communityRepository } from "@workspace/db/repositories";
import { presetRepository } from "@workspace/db/repositories";
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

      // When filtering by style, over-fetch since we filter after decode
      const fetchLimit = style ? (limit + 1) * 4 : limit + 1;

      const result = await communityRepository.list({
        cursor,
        limit: fetchLimit,
        filter,
        sort,
        tags,
        base,
        userId: ctx.userId,
      });

      let rows = result.rows;

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
      const tagRows = await communityRepository.getTagsByPresetIds(itemIds);

      const tagsByPreset = new Map<string, string[]>();
      for (const row of tagRows) {
        const existing = tagsByPreset.get(row.communityPresetId) ?? [];
        existing.push(row.tag);
        tagsByPreset.set(row.communityPresetId, existing);
      }

      // Fetch liked status if authenticated
      const likedSet = ctx.userId
        ? await communityRepository.getLikedPresetIds(ctx.userId, itemIds)
        : new Set<string>();

      // Build next cursor
      let nextCursor: string | null = null;
      if (hasMore) {
        if (sort.startsWith("popular")) {
          nextCursor = String((result.offset ?? 0) + limit);
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
      const row = await communityRepository.findById(input.id);
      if (!row) return null;

      const tagRows = await communityRepository.getTagsByPresetId(row.id);

      const isLikedByMe = ctx.userId
        ? await communityRepository.isLikedByUser(ctx.userId, row.id)
        : false;

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
      const preset = await presetRepository.findByIdAndUser(input.savedPresetId, ctx.userId);
      if (!preset) {
        throw new Error("Preset not found or not owned by you");
      }

      // Check not already published
      const existing = await communityRepository.findBySavedPresetId(input.savedPresetId);
      if (existing) {
        throw new Error("Preset is already published");
      }

      // Create community preset
      const created = await communityRepository.create({
        savedPresetId: input.savedPresetId,
        userId: ctx.userId,
        title: input.title,
        description: input.description ?? null,
        presetCode: preset.presetCode,
        base: preset.base,
      });

      if (!created) {
        throw new Error("Failed to publish preset");
      }

      // Insert tags
      await communityRepository.insertTags(created.id, input.tags);

      return { id: created.id };
    }),

  // -----------------------------------------------------------------------
  // unpublish — remove from community
  // -----------------------------------------------------------------------
  unpublish: authedProcedure
    .input(z.object({ communityPresetId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await communityRepository.deleteByIdAndUser(input.communityPresetId, ctx.userId);
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
      const existing = await communityRepository.findByIdAndUser(
        input.communityPresetId,
        ctx.userId,
      );
      if (!existing) {
        throw new Error("Community preset not found or not owned by you");
      }

      const updateData: Record<string, unknown> = {};
      if (input.title) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;

      // Optionally sync preset code from saved preset
      if (input.syncPresetCode) {
        const source = await presetRepository.findById(existing.savedPresetId);
        if (source) {
          updateData.presetCode = source.presetCode;
          updateData.base = source.base;
        }
      }

      await communityRepository.update(input.communityPresetId, updateData);

      // Update tags if provided
      if (input.tags) {
        await communityRepository.replaceTags(input.communityPresetId, input.tags);
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
      const preset = await communityRepository.findOwner(input.communityPresetId);
      if (preset?.userId === ctx.userId) {
        throw new Error("Cannot like your own preset");
      }

      // Check if already liked
      const alreadyLiked = await communityRepository.isLikedByUser(
        ctx.userId,
        input.communityPresetId,
      );

      if (alreadyLiked) {
        await communityRepository.removeLike(ctx.userId, input.communityPresetId);
        return { liked: false };
      } else {
        await communityRepository.addLike(ctx.userId, input.communityPresetId);
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

      const likedSet = await communityRepository.getLikedPresetIds(ctx.userId, input.presetIds);

      const result: Record<string, boolean> = {};
      for (const id of input.presetIds) {
        result[id] = likedSet.has(id);
      }
      return result;
    }),

  // -----------------------------------------------------------------------
  // likedPresets — user's liked community presets (for action menu)
  // -----------------------------------------------------------------------
  likedPresets: authedProcedure.query(async ({ ctx }) => {
    return communityRepository.getLikedPresets(ctx.userId);
  }),

  // -----------------------------------------------------------------------
  // tagCounts — tag usage counts
  // -----------------------------------------------------------------------
  tagCounts: baseProcedure.query(async () => {
    const rows = await communityRepository.getTagCounts();
    return rows.map((r) => ({ tag: r.tag, count: r.count }));
  }),
});
