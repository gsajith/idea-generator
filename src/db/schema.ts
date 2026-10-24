import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  date,
  doublePrecision,
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
    // Set by a distill's filter step. Only pending signals are sent to the filter.
    distillStatus: text("distill_status").$type<"pending" | "kept" | "dropped">().notNull().default("pending"),
    dropReason: text("drop_reason"),
  },
  (t) => [unique("signals_source_external_id").on(t.sourceId, t.externalId)],
);

// At most one tick runs at a time. A tick claims this single row by setting locked_until, and only
// when the current lease has expired. holder lets a tick release its own lease and nobody else's.
export const tickLease = pgTable(
  "tick_lease",
  {
    id: integer("id").primaryKey().default(1),
    holder: uuid("holder").notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }).notNull(),
  },
  (t) => [check("tick_lease_single_row", sql`${t.id} = 1`)],
);

// A pass covers every signal fetched at or before it started. Its state lives here so a pass
// cut short by the tick deadline or the budget cap resumes on a later tick.
export const distillPasses = pgTable("distill_passes", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  step: text("step").$type<"filter">().notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

// Model spend per UTC day, checked against the daily cap before every distill model call.
export const modelSpend = pgTable("model_spend", {
  day: date("day", { mode: "string" }).primaryKey(),
  usd: doublePrecision("usd").notNull(),
});
