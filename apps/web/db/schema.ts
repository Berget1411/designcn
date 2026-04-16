import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

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
    unique("saved_preset_userId_name_unq").on(table.userId, table.name),
  ],
);

export const savedPresetRelations = relations(savedPreset, ({ one }) => ({
  user: one(user, {
    fields: [savedPreset.userId],
    references: [user.id],
  }),
}));
