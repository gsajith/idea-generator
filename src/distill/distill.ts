import { desc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/db/client";
import { distillPasses } from "@/db/schema";
import type { Model } from "@/model/model";
import { BudgetReachedError, withSpendCap } from "@/model/spend";
import type { Settings } from "@/settings";
import { filterNextBatch } from "./filter";

export type DistillOptions = {
  db: Db;
  model: Model;
  settings: Settings;
  now: Date;
  /** Wall-clock time (epoch ms) to stop starting new model calls by. */
  deadline: number;
};

export type DistillResult =
  | { status: "not-due" }
  | { status: "finished" }
  | { status: "stopped"; reason: "deadline" | "budget" };

/**
 * Continues the unfinished distill pass, or starts one if a distill is due. Works until the
 * pass finishes, the deadline passes or the day's spend reaches the cap. A stopped pass keeps
 * its state in the database, so a later call picks it up.
 */
export async function distill({ db, model, settings, now, deadline }: DistillOptions): Promise<DistillResult> {
  const pass = (await unfinishedPass(db)) ?? (await startPassIfDue(db, settings, now));
  if (!pass) return { status: "not-due" };

  const capped = withSpendCap(model, db, { now, capUsd: settings.dailySpendCapUsd });
  try {
    for (;;) {
      if (Date.now() >= deadline) return { status: "stopped", reason: "deadline" };
      if (!(await filterNextBatch(db, capped, pass.startedAt))) break;
    }
  } catch (error) {
    if (error instanceof BudgetReachedError) return { status: "stopped", reason: "budget" };
    throw error;
  }

  await db.update(distillPasses).set({ finishedAt: now }).where(eq(distillPasses.id, pass.id));
  return { status: "finished" };
}

/** The pass in progress, if any. At most one pass is unfinished at a time. */
export async function unfinishedPass(db: Db) {
  const [pass] = await db.select().from(distillPasses).where(isNull(distillPasses.finishedAt));
  return pass;
}

// Due when no pass has started within the interval, measured from start to start.
async function startPassIfDue(db: Db, settings: Settings, now: Date) {
  const [last] = await db
    .select({ startedAt: distillPasses.startedAt })
    .from(distillPasses)
    .orderBy(desc(distillPasses.startedAt))
    .limit(1);
  const intervalMs = settings.distillIntervalHours * 3_600_000;
  if (last && last.startedAt.getTime() + intervalMs > now.getTime()) return undefined;

  const [pass] = await db.insert(distillPasses).values({ startedAt: now }).returning();
  return pass;
}
