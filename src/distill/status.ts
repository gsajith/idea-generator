import { desc, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "@/db/client";
import { distillPasses } from "@/db/schema";
import type { Settings } from "@/settings";
import { spentOn, utcDay } from "./budget";

export type DistillStatus = {
  lastFinishedAt: Date | null;
  /** Start time of the pass in progress, or null when none is. */
  inProgressSince: Date | null;
  spentTodayUsd: number;
  capUsd: number;
};

/** Whether the pipeline is alive, for the dashboard's status area. */
export async function getDistillStatus(db: Db, settings: Settings, now: Date): Promise<DistillStatus> {
  const [[finished], [inProgress], spentTodayUsd] = await Promise.all([
    db
      .select({ at: distillPasses.finishedAt })
      .from(distillPasses)
      .where(isNotNull(distillPasses.finishedAt))
      .orderBy(desc(distillPasses.finishedAt))
      .limit(1),
    db.select({ at: distillPasses.startedAt }).from(distillPasses).where(isNull(distillPasses.finishedAt)),
    spentOn(db, utcDay(now)),
  ]);
  return {
    lastFinishedAt: finished?.at ?? null,
    inProgressSince: inProgress?.at ?? null,
    spentTodayUsd,
    capUsd: settings.dailySpendCapUsd,
  };
}
