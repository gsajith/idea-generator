import { count } from "drizzle-orm";
import type { Db } from "@/db/client";
import { signals, sourceState } from "@/db/schema";
import type { Source } from "./source";

export type SourceStatus = {
  source: Source;
  lastFetchedAt: Date | null;
  signalCount: number;
};

/** Fetch health for each source, for the sources page. */
export async function getSourceStatuses(db: Db, sources: Source[]): Promise<SourceStatus[]> {
  const [state, counts] = await Promise.all([
    db.select().from(sourceState),
    db.select({ sourceId: signals.sourceId, count: count() }).from(signals).groupBy(signals.sourceId),
  ]);
  const lastFetched = new Map(state.map((s) => [s.sourceId, s.lastFetchedAt]));
  const signalCounts = new Map(counts.map((c) => [c.sourceId, c.count]));
  return sources.map((source) => ({
    source,
    lastFetchedAt: lastFetched.get(source.id) ?? null,
    signalCount: signalCounts.get(source.id) ?? 0,
  }));
}
