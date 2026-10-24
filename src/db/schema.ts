import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

// The builder profile is a single row, so the check pins its id to 1.
export const builderProfile = pgTable(
  "builder_profile",
  {
    id: integer("id").primaryKey().default(1),
    text: text("text").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("builder_profile_single_row", sql`${t.id} = 1`)],
);

// Sources live in code (src/sources). This table only remembers when each one was last fetched.
export const sourceState = pgTable("source_state", {
  sourceId: text("source_id").primaryKey(),
  lastFetchedAt: timestamp("last_fetched_at", { withTimezone: true }).notNull(),
});

// A thread is its root post: the post points at itself, and every comment points at the post.
export const signals = pgTable(
  "signals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: text("source_id").notNull(),
    externalId: text("external_id").notNull(),
    threadRootId: uuid("thread_root_id")
      .notNull()
      .references((): AnyPgColumn => signals.id),
    parentId: uuid("parent_id").references((): AnyPgColumn => signals.id),
    author: text("author").notNull(),
    url: text("url").notNull(),
    threadTitle: text("thread_title").notNull(),
    text: text("text").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull(),
  },
  (t) => [unique("signals_source_external_id").on(t.sourceId, t.externalId)],
);
