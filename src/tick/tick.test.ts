import { asc } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { signals } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import type { FetchedSignal, FetchedThread, Source } from "@/sources/source";
import { TICK_LEASE_MS, tick } from "./tick";

const now = new Date("2026-10-01T12:00:00Z");
const hoursLater = (h: number) => new Date(now.getTime() + h * 3_600_000);
const noDeadline = Number.POSITIVE_INFINITY;

function signal(externalId: string, author: string, replies: FetchedSignal[] = []): FetchedSignal {
  return {
    externalId,
    author,
    url: `https://example.test/${externalId}`,
    publishedAt: new Date("2026-09-30T00:00:00Z"),
    text: `text of ${externalId}`,
    replies,
  };
}

const thread: FetchedThread = {
  title: "Why is splitting rent so painful?",
  post: signal("p1", "alice", [signal("c1", "bob", [signal("c2", "carol")]), signal("c3", "dan")]),
};

function testSource(id: string, threads: FetchedThread[], fetchIntervalHours = 24) {
  let fetches = 0;
  const source: Source = {
    id,
    name: id,
    kind: "fixture",
    fetchIntervalHours,
    fetch: async () => {
      fetches++;
      return threads;
    },
  };
  return { source, fetchCount: () => fetches };
}

describe("tick", () => {
  it("stores a post and each comment as separate signals in the post's thread", async () => {
    const db = await createTestDb();
    const { source } = testSource("rent", [thread]);

    await tick({ db, sources: [source], now, deadline: noDeadline });

    const rows = await db.select().from(signals).orderBy(asc(signals.externalId));
    const byExternalId = Object.fromEntries(rows.map((r) => [r.externalId, r]));
    const post = byExternalId.p1;

    expect(rows.map((r) => r.externalId)).toEqual(["c1", "c2", "c3", "p1"]);
    expect(rows.every((r) => r.threadRootId === post.id)).toBe(true);
    expect(rows.every((r) => r.threadTitle === thread.title && r.sourceId === "rent")).toBe(true);
    expect(post.parentId).toBeNull();
    expect(byExternalId.c1.parentId).toBe(post.id);
    expect(byExternalId.c2.parentId).toBe(byExternalId.c1.id);
    expect(byExternalId.c3.parentId).toBe(post.id);
    expect(byExternalId.c2).toMatchObject({
      author: "carol",
      url: "https://example.test/c2",
      text: "text of c2",
      publishedAt: new Date("2026-09-30T00:00:00Z"),
      fetchedAt: now,
    });
  });

  it("skips signals already stored when a source is fetched again", async () => {
    const db = await createTestDb();
    const threads = [thread];
    const { source, fetchCount } = testSource("rent", threads);

    await tick({ db, sources: [source], now, deadline: noDeadline });
    // The next fetch sees the same thread plus one new reply under an old comment.
    threads[0] = {
      ...thread,
      post: { ...thread.post, replies: [...thread.post.replies, signal("c4", "erin")] },
    };
    await tick({ db, sources: [source], now: hoursLater(24), deadline: noDeadline });

    expect(fetchCount()).toBe(2);
    const rows = await db.select().from(signals);
    expect(rows.map((r) => r.externalId).sort()).toEqual(["c1", "c2", "c3", "c4", "p1"]);
    const post = rows.find((r) => r.externalId === "p1")!;
    const c4 = rows.find((r) => r.externalId === "c4")!;
    expect(c4).toMatchObject({ threadRootId: post.id, parentId: post.id, fetchedAt: hoursLater(24) });
    expect(post.fetchedAt).toEqual(now);
  });

  it("fetches only sources whose last fetch plus interval has passed", async () => {
    const db = await createTestDb();
    const hourly = testSource("hourly", [], 1);
    const daily = testSource("daily", [], 24);
    const sources = [hourly.source, daily.source];

    await tick({ db, sources, now, deadline: noDeadline });
    await tick({ db, sources, now: hoursLater(0.5), deadline: noDeadline });
    await tick({ db, sources, now: hoursLater(1), deadline: noDeadline });

    expect(hourly.fetchCount()).toBe(2);
    expect(daily.fetchCount()).toBe(1);

    await tick({ db, sources, now: hoursLater(24), deadline: noDeadline });

    expect(hourly.fetchCount()).toBe(3);
    expect(daily.fetchCount()).toBe(2);
  });

  it("stops before the deadline and leaves due sources for the next tick", async () => {
    const db = await createTestDb();
    const a = testSource("a", [thread]);
    const b = testSource("b", []);
    // Fetching "a" runs past the deadline.
    a.source.fetch = async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return [thread];
    };
    const sources = [a.source, b.source];

    const first = await tick({ db, sources, now, deadline: Date.now() + 10 });
    expect(first).toEqual({ skipped: false, fetched: ["a"], stoppedEarly: true });
    expect(b.fetchCount()).toBe(0);

    const second = await tick({ db, sources, now, deadline: noDeadline });
    expect(second).toEqual({ skipped: false, fetched: ["b"], stoppedEarly: false });
  });
});

describe("tick lease", () => {
  // A source whose fetch waits until the test opens the gate, so a tick can be held mid-run.
  function gatedSource(id: string) {
    let open!: () => void;
    const gate = new Promise<void>((resolve) => (open = resolve));
    let fetches = 0;
    const source: Source = {
      id,
      name: id,
      kind: "fixture",
      fetchIntervalHours: 1,
      fetch: async () => {
        fetches++;
        await gate;
        return [thread];
      },
    };
    return { source, open, fetchCount: () => fetches };
  }

  it("skips a tick while another holds the lease, and runs one after release", async () => {
    const db = await createTestDb();
    const gated = gatedSource("slow");
    const other = testSource("other", []);
    const sources = [gated.source, other.source];

    const first = tick({ db, sources, now, deadline: noDeadline });
    await vi.waitFor(() => expect(gated.fetchCount()).toBe(1));

    const second = await tick({ db, sources, now, deadline: noDeadline });
    expect(second).toEqual({ skipped: true });
    expect(other.fetchCount()).toBe(0);

    gated.open();
    expect(await first).toEqual({
      skipped: false,
      fetched: ["slow", "other"],
      stoppedEarly: false,
    });

    // Same time as the first tick, so only the release lets this one run, not expiry.
    const third = await tick({ db, sources, now, deadline: noDeadline });
    expect(third).toEqual({ skipped: false, fetched: [], stoppedEarly: false });
  });

  it("releases the lease when a tick throws", async () => {
    const db = await createTestDb();
    const failing = testSource("failing", []);
    failing.source.fetch = async () => {
      throw new Error("source down");
    };

    const failed = tick({ db, sources: [failing.source], now, deadline: noDeadline });
    await expect(failed).rejects.toThrow("source down");

    const other = testSource("other", []);
    const next = await tick({ db, sources: [other.source], now, deadline: noDeadline });
    expect(next).toEqual({ skipped: false, fetched: ["other"], stoppedEarly: false });
  });

  it("lets a tick take over a lease left by a hung tick once the lease expires", async () => {
    const db = await createTestDb();
    const hung = gatedSource("hung"); // The gate never opens.
    void tick({ db, sources: [hung.source], now, deadline: noDeadline });
    await vi.waitFor(() => expect(hung.fetchCount()).toBe(1));

    const other = testSource("other", []);
    const sources = [other.source];
    const at = (ms: number) => new Date(now.getTime() + ms);

    const atExpiry = await tick({ db, sources, now: at(TICK_LEASE_MS), deadline: noDeadline });
    expect(atExpiry).toEqual({ skipped: true });

    const afterExpiry = await tick({
      db,
      sources,
      now: at(TICK_LEASE_MS + 1),
      deadline: noDeadline,
    });
    expect(afterExpiry).toEqual({ skipped: false, fetched: ["other"], stoppedEarly: false });
  });
});
