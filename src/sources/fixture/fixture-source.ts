import type { FetchedSignal, FetchedThread, Source } from "../source";
import { fixtureThreads } from "./threads";

/** A post or comment in the fixture file. */
export type FixtureSignal = {
  /** Unique across the whole fixture file. */
  id: string;
  author: string;
  /**
   * How long before the fetch this was published. Relative, so the fixture stays inside the
   * score window however long after writing it gets fetched.
   */
  hoursAgo: number;
  text: string;
  replies?: FixtureSignal[];
};

export type FixtureThread = {
  title: string;
  post: FixtureSignal;
};

/** Reads realistic fake threads from a file, so the pipeline runs before any real source exists. */
export const fixtureSource: Source = {
  id: "fixture",
  name: "Fixture threads",
  kind: "fixture",
  fetchIntervalHours: 24,
  async fetch(now) {
    return fixtureThreads.map((thread) => toFetchedThread(thread, now));
  },
};

function toFetchedThread(thread: FixtureThread, now: Date): FetchedThread {
  const toSignal = (s: FixtureSignal): FetchedSignal => ({
    externalId: s.id,
    author: s.author,
    url: `https://fixture.invalid/threads/${thread.post.id}#${s.id}`,
    publishedAt: new Date(now.getTime() - s.hoursAgo * 3_600_000),
    text: s.text,
    replies: (s.replies ?? []).map(toSignal),
  });
  return { title: thread.title, post: toSignal(thread.post) };
}
