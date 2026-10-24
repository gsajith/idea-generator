import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { modelSpend } from "@/db/schema";
import type { Model } from "@/model/model";

/** Thrown instead of making a model call once the day's spend has reached the cap. */
export class BudgetReachedError extends Error {
  constructor() {
    super("Daily model spend cap reached");
  }
}

/** Spend is tracked per UTC day. */
export const utcDay = (time: Date) => time.toISOString().slice(0, 10);

export async function spentOn(db: Db, day: string): Promise<number> {
  const [row] = await db.select({ usd: modelSpend.usd }).from(modelSpend).where(eq(modelSpend.day, day));
  return row?.usd ?? 0;
}

/**
 * Wraps a model so each call first checks the day's spend against the cap, then records its
 * cost. A call can take the day a little over the cap; the next call is the one refused.
 */
export function withBudget(model: Model, db: Db, { now, capUsd }: { now: Date; capUsd: number }): Model {
  const day = utcDay(now);
  return {
    async call(request) {
      if ((await spentOn(db, day)) >= capUsd) throw new BudgetReachedError();
      const result = await model.call(request);
      await db
        .insert(modelSpend)
        .values({ day, usd: result.usage.costUsd })
        .onConflictDoUpdate({ target: modelSpend.day, set: { usd: sql`${modelSpend.usd} + excluded.usd` } });
      return result;
    },
  };
}
