import { getTableColumns, getTableName, is, sql } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "./schema";
import { createTestDb } from "./test-db";

describe("test database", () => {
  // Catches schema edits that were never turned into a migration with `npm run db:generate`.
  it("has every table and column in the schema after migrations run", async () => {
    const db = await createTestDb();

    const rows = await db.execute<{ table_name: string; column_name: string }>(
      sql`select table_name, column_name from information_schema.columns where table_schema = 'public'`,
    );
    const actual = new Set(rows.rows.map((r) => `${r.table_name}.${r.column_name}`));

    const tables = Object.values(schema).filter((v) => is(v, PgTable));
    expect(tables.length).toBeGreaterThan(0);
    for (const table of tables) {
      for (const column of Object.values(getTableColumns(table))) {
        expect(actual).toContain(`${getTableName(table)}.${column.name}`);
      }
    }
  });
});
