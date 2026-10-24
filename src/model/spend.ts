import { eq, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { modelSpend } from "@/db/schema";
import { type Model, ModelOutputError } from "./model";

/** Thrown instead of making a model call once the day's spend has reached the cap. */
export class BudgetReachedError extends Error {
  constructor() {
    super("Daily model spend cap reached");
  }
}

/** The spend record and the cap count days in UTC. */
export const utcDay = (time: Date) => time.toISOString().slice(0, 10);

export async function spentOn(db: Db, day: string): Promise<number> {
  const [row] = await db.select({ usd: modelSpend.usd }).from(modelSpend).where(eq(modelSpend.day, day));
  return row?.usd ?? 0;
}

/**
 * Wraps a model so each call adds its cost to the spend record for the UTC day of `now`,
 * including calls whose reply was billed but unusable.
 */
export function recordingSpend(model: Model, db: Db, now: Date): Model {
  const day = utcDay(now);
  const record = (usd: number) =>
    db
      .insert(modelSpend)
      .values({ day, usd })
      .onConflictDoUpdate({ target: modelSpend.day, set: { usd: sql`${modelSpend.usd} + excluded.usd` } });
  return {
    async call(request) {
      try {
        const result = await model.call(request);
        await record(result.usage.costUsd);
        return result;
      } catch (error) {
        if (error instanceof ModelOutputError) await record(error.usage.costUsd);
        throw error;
      }
    },
  };
}

/**
 * Wraps a model so each call records its cost, and refuses to call once the day's spend has
 * reached the cap. A call can take the day a little over the cap; the next call is the one refused.
 */
export function withSpendCap(model: Model, db: Db, { now, capUsd }: { now: Date; capUsd: number }): Model {
  const recorded = recordingSpend(model, db, now);
  const day = utcDay(now);
  return {
    async call(request) {
      if ((await spentOn(db, day)) >= capUsd) throw new BudgetReachedError();
      return recorded.call(request);
    },
  };
}
