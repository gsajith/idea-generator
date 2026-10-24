import type { Db } from "@/db/client";
import { sourceState } from "@/db/schema";
import { fetchSource } from "@/sources/fetch";
import type { Source } from "@/sources/source";

export type TickOptions = {
  db: Db;
  sources: Source[];
  /** Decides which sources are due. */
  now: Date;
  /** Wall-clock time (epoch ms) to stop starting new work by. */
  deadline: number;
};

export type TickResult = {
  /** Ids of the sources fetched by this tick. */
  fetched: string[];
  /** True when the deadline cut the tick short. The next tick picks up what's left. */
  stoppedEarly: boolean;
};

/**
 * The single entry point for scheduled work: fetches every source that is due. It checks the
 * deadline between fetches, so one fetch in progress can run past it.
 */
export async function tick({ db, sources, now, deadline }: TickOptions): Promise<TickResult> {
  const state = await db.select().from(sourceState);
  const lastFetched = new Map(state.map((s) => [s.sourceId, s.lastFetchedAt.getTime()]));
  const due = sources.filter((source) => {
    const last = lastFetched.get(source.id);
    return last === undefined || last + source.fetchIntervalHours * 3_600_000 <= now.getTime();
  });

  const fetched: string[] = [];
  for (const source of due) {
    if (Date.now() >= deadline) return { fetched, stoppedEarly: true };
    await fetchSource(db, source, now);
    fetched.push(source.id);
  }
  return { fetched, stoppedEarly: false };
}
