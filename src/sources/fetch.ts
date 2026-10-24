import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "@/db/client";
import { signals, sourceState } from "@/db/schema";
import type { FetchedSignal, Source } from "./source";

/**
 * Fetches one source and stores every post and comment it returns as a signal, skipping
 * signals already stored. Records the fetch time. Never interprets signals.
 */
export async function fetchSource(db: Db, source: Source, now: Date): Promise<void> {
  const threads = await source.fetch(now);

  const externalIds = threads.flatMap((t) => flatten(t.post).map((s) => s.externalId));
  const existing = externalIds.length
    ? await db
        .select({ id: signals.id, externalId: signals.externalId })
        .from(signals)
        .where(and(eq(signals.sourceId, source.id), inArray(signals.externalId, externalIds)))
    : [];
  const stored = new Map(existing.map((s) => [s.externalId, s.id]));
  // A signal stored by an earlier fetch keeps its id, so new comments can point at it.
  const idFor = (signal: FetchedSignal) => stored.get(signal.externalId) ?? randomUUID();

  const rows: (typeof signals.$inferInsert)[] = [];
  for (const thread of threads) {
    const threadRootId = idFor(thread.post);
    const visit = (signal: FetchedSignal, id: string, parentId: string | null) => {
      if (!stored.has(signal.externalId)) {
        rows.push({
          id,
          sourceId: source.id,
          externalId: signal.externalId,
          threadRootId,
          parentId,
          author: signal.author,
          url: signal.url,
          threadTitle: thread.title,
          text: signal.text,
          publishedAt: signal.publishedAt,
          fetchedAt: now,
        });
      }
      for (const reply of signal.replies) visit(reply, idFor(reply), id);
    };
    visit(thread.post, threadRootId, null);
  }

  await db.transaction(async (tx) => {
    if (rows.length) await tx.insert(signals).values(rows);
    await tx
      .insert(sourceState)
      .values({ sourceId: source.id, lastFetchedAt: now })
      .onConflictDoUpdate({ target: sourceState.sourceId, set: { lastFetchedAt: now } });
  });
}

function flatten(signal: FetchedSignal): FetchedSignal[] {
  return [signal, ...signal.replies.flatMap(flatten)];
}
