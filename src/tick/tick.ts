import { randomUUID } from "node:crypto";
import { eq, lt } from "drizzle-orm";
import type { Db } from "@/db/client";
import { sourceState, tickLease } from "@/db/schema";
import { fetchSource } from "@/sources/fetch";
import type { Source } from "@/sources/source";

export type TickOptions = {
  db: Db;
  sources: Source[];
  /** Decides which sources are due and when the lease expires. */
  now: Date;
  /** Wall-clock time (epoch ms) to stop starting new work by. */
  deadline: number;
  /**
   * How long the lease lasts. Set it to the function time limit, so a lease left by a tick that
   * crashed or was killed frees itself.
   */
  leaseMs: number;
};

export type TickResult =
  // Another tick held the lease, so this one did nothing.
  | { skipped: true }
  | {
      skipped: false;
      /** Ids of the sources fetched by this tick. */
      fetched: string[];
      /** True when the deadline cut the tick short. The next tick picks up what's left. */
      stoppedEarly: boolean;
    };

/**
 * The single entry point for scheduled work: fetches every source that is due. Only one tick runs
 * at a time; a tick that finds the lease taken skips. It checks the deadline between fetches, so
 * one fetch in progress can run past it.
 */
export async function tick(options: TickOptions): Promise<TickResult> {
  const { db, now, leaseMs } = options;
  const holder = randomUUID();
  const lockedUntil = new Date(now.getTime() + leaseMs);
  // One statement claims the lease: it inserts the row, or takes it over once it has expired.
  const claimed = await db
    .insert(tickLease)
    .values({ holder, lockedUntil })
    .onConflictDoUpdate({
      target: tickLease.id,
      set: { holder, lockedUntil },
      setWhere: lt(tickLease.lockedUntil, now),
    })
    .returning({ holder: tickLease.holder });
  if (!claimed.length) return { skipped: true };

  try {
    return { skipped: false, ...(await fetchDueSources(options)) };
  } finally {
    // Scoped to this holder, so a tick that outlived its lease can't free a newer tick's.
    await db.delete(tickLease).where(eq(tickLease.holder, holder));
  }
}

async function fetchDueSources({ db, sources, now, deadline }: TickOptions) {
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
