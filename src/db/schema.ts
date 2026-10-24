import { sql } from "drizzle-orm";
import { check, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
