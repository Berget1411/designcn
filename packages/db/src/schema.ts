import { relations } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

// ---------------------------------------------------------------------------
// Saved Presets (user-private)
// ---------------------------------------------------------------------------

export const savedPreset = pgTable(
  "saved_preset",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    presetCode: text("preset_code").notNull(),
    base: text("base").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("saved_preset_userId_idx").on(table.userId),
    unique("saved_preset_userid_name_unq").on(table.userId, table.name),
  ],
);

export const savedPresetRelations = relations(savedPreset, ({ one }) => ({
  user: one(user, {
    fields: [savedPreset.userId],
    references: [user.id],
  }),
  communityPreset: one(communityPreset, {
    fields: [savedPreset.id],
    references: [communityPreset.savedPresetId],
  }),
}));

// ---------------------------------------------------------------------------
// Community Presets (published, public)
// ---------------------------------------------------------------------------

export const communityPreset = pgTable(
  "community_preset",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    savedPresetId: text("saved_preset_id")
      .notNull()
      .unique()
      .references(() => savedPreset.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    presetCode: text("preset_code").notNull(),
    base: text("base").notNull(),
    likeCount: integer("like_count").notNull().default(0),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("community_preset_userId_idx").on(table.userId),
    index("community_preset_publishedAt_idx").on(table.publishedAt),
    index("community_preset_likeCount_idx").on(table.likeCount),
  ],
);

export const communityPresetRelations = relations(communityPreset, ({ one, many }) => ({
  savedPreset: one(savedPreset, {
    fields: [communityPreset.savedPresetId],
    references: [savedPreset.id],
  }),
  user: one(user, {
    fields: [communityPreset.userId],
    references: [user.id],
  }),
  tags: many(communityPresetTag),
  likes: many(presetLike),
}));

// ---------------------------------------------------------------------------
// Community Preset Tags
// ---------------------------------------------------------------------------

export const communityPresetTag = pgTable(
  "community_preset_tag",
  {
    communityPresetId: text("community_preset_id")
      .notNull()
      .references(() => communityPreset.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.communityPresetId, table.tag] }),
    index("community_preset_tag_tag_idx").on(table.tag),
  ],
);

export const communityPresetTagRelations = relations(communityPresetTag, ({ one }) => ({
  communityPreset: one(communityPreset, {
    fields: [communityPresetTag.communityPresetId],
    references: [communityPreset.id],
  }),
}));

// ---------------------------------------------------------------------------
// Preset Likes
// ---------------------------------------------------------------------------

export const presetLike = pgTable(
  "preset_like",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    communityPresetId: text("community_preset_id")
      .notNull()
      .references(() => communityPreset.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.communityPresetId] })],
);

export const presetLikeRelations = relations(presetLike, ({ one }) => ({
  user: one(user, {
    fields: [presetLike.userId],
    references: [user.id],
  }),
  communityPreset: one(communityPreset, {
    fields: [presetLike.communityPresetId],
    references: [communityPreset.id],
  }),
}));
