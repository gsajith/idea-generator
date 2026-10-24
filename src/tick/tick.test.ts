import { asc, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { signals } from "@/db/schema";
import { createTestDb } from "@/db/test-db";
import { getDistillStatus } from "@/distill/status";
import { createFakeModel } from "@/model/fake";
import type { Model } from "@/model/model";
import type { Settings } from "@/settings";
import type { FetchedSignal, FetchedThread, Source } from "@/sources/source";
import { tick, type TickOptions } from "./tick";

const now = new Date("2026-10-01T12:00:00Z");
const hoursLater = (h: number) => new Date(now.getTime() + h * 3_600_000);
const noDeadline = Number.POSITIVE_INFINITY;
const leaseMs = 300_000;
const settings: Settings = { distillIntervalHours: 24, dailySpendCapUsd: 1 };

// A filter that gives no verdicts, so every signal is kept. For tests that aren't about filtering.
const keepEverything = () => createFakeModel([{ role: "filter", reply: { verdicts: [] } }]);

type RunOptions = Omit<TickOptions, "model" | "settings" | "leaseMs"> & Partial<TickOptions>;
const run = (options: RunOptions) => tick({ model: keepEverything(), settings, leaseMs, ...options });

async function pendingCount(db: Awaited<ReturnType<typeof createTestDb>>) {
  return (await db.select().from(signals).where(eq(signals.distillStatus, "pending"))).length;
}

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

    await run({ db, sources: [source], now, deadline: noDeadline });

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

    await run({ db, sources: [source], now, deadline: noDeadline });
    // The next fetch sees the same thread plus one new reply under an old comment.
    threads[0] = {
      ...thread,
      post: { ...thread.post, replies: [...thread.post.replies, signal("c4", "erin")] },
    };
    await run({ db, sources: [source], now: hoursLater(24), deadline: noDeadline });

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

    await run({ db, sources, now, deadline: noDeadline });
    await run({ db, sources, now: hoursLater(0.5), deadline: noDeadline });
    await run({ db, sources, now: hoursLater(1), deadline: noDeadline });

    expect(hourly.fetchCount()).toBe(2);
    expect(daily.fetchCount()).toBe(1);

    await run({ db, sources, now: hoursLater(24), deadline: noDeadline });

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

    const first = await run({ db, sources, now, deadline: Date.now() + 10 });
    expect(first).toMatchObject({ fetched: ["a"], stoppedEarly: true });
    expect(b.fetchCount()).toBe(0);

    const second = await run({ db, sources, now, deadline: noDeadline });
    expect(second).toMatchObject({ fetched: ["b"], stoppedEarly: false });
  });
});

describe("tick lease", () => {
  // An hourly source whose fetch waits for the test to open the gate, holding a tick mid-run.
  function gatedSource(id: string) {
    let open!: () => void;
    const gate = new Promise<void>((resolve) => (open = resolve));
    const gated = testSource(id, [thread], 1);
    const fetch = gated.source.fetch;
    gated.source.fetch = async (now) => {
      const threads = await fetch(now);
      await gate;
      return threads;
    };
    return { ...gated, open };
  }

  it("skips a tick while another holds the lease, and runs one after release", async () => {
    const db = await createTestDb();
    const gated = gatedSource("slow");
    const other = testSource("other", []);
    const sources = [gated.source, other.source];

    const first = run({ db, sources, now, deadline: noDeadline });
    await vi.waitFor(() => expect(gated.fetchCount()).toBe(1));

    const second = await run({ db, sources, now, deadline: noDeadline });
    expect(second).toEqual({ skipped: true });
    expect(other.fetchCount()).toBe(0);

    gated.open();
    expect(await first).toMatchObject({
      skipped: false,
      fetched: ["slow", "other"],
      stoppedEarly: false,
    });

    // Same time as the first tick, so only the release lets this one run, not expiry.
    const third = await run({ db, sources, now, deadline: noDeadline });
    expect(third).toMatchObject({ skipped: false, fetched: [], stoppedEarly: false });
  });

  it("releases the lease when a tick throws", async () => {
    const db = await createTestDb();
    const failing = testSource("failing", []);
    failing.source.fetch = async () => {
      throw new Error("source down");
    };

    const failed = run({ db, sources: [failing.source], now, deadline: noDeadline });
    await expect(failed).rejects.toThrow("source down");

    const other = testSource("other", []);
    const next = await run({ db, sources: [other.source], now, deadline: noDeadline });
    expect(next).toMatchObject({ skipped: false, fetched: ["other"], stoppedEarly: false });
  });

  it("lets a tick take over a lease left by a hung tick once the lease expires", async () => {
    const db = await createTestDb();
    const hung = gatedSource("hung"); // The gate stays shut until the end of the test.
    const hungTick = run({ db, sources: [hung.source], now, deadline: noDeadline });
    await vi.waitFor(() => expect(hung.fetchCount()).toBe(1));

    const other = testSource("other", []);
    const sources = [other.source];
    const at = (ms: number) => new Date(now.getTime() + ms);

    const atExpiry = await run({ db, sources, now: at(leaseMs), deadline: noDeadline });
    expect(atExpiry).toEqual({ skipped: true });

    const afterExpiry = await run({ db, sources, now: at(leaseMs + 1), deadline: noDeadline });
    expect(afterExpiry).toMatchObject({ skipped: false, fetched: ["other"], stoppedEarly: false });

    hung.open();
    await hungTick;
  });
});

describe("tick distill", () => {
  it("marks each fetched signal kept or dropped with the filter's reason", async () => {
    const db = await createTestDb();
    const { source } = testSource("rent", [thread]);
    const model = createFakeModel([
      {
        role: "filter",
        reply: {
          verdicts: [
            { id: "p1", keep: true, reason: "Wants an easier way to split rent" },
            { id: "c1", keep: false, reason: "Joke with no complaint" },
            { id: "c2", keep: true, reason: "Same need, would pay" },
            { id: "c3", keep: false, reason: "Self-promotion" },
          ],
        },
      },
    ]);

    const result = await run({ db, sources: [source], model, now, deadline: noDeadline });

    expect(result).toMatchObject({ distill: { status: "finished" } });
    const rows = await db.select().from(signals).orderBy(asc(signals.externalId));
    expect(rows.map((r) => [r.externalId, r.distillStatus, r.dropReason])).toEqual([
      ["c1", "dropped", "Joke with no complaint"],
      ["c2", "kept", null],
      ["c3", "dropped", "Self-promotion"],
      ["p1", "kept", null],
    ]);
    expect(await getDistillStatus(db, settings, now)).toEqual({
      lastFinishedAt: now,
      inProgressSince: null,
      spentTodayUsd: 0.01,
      capUsd: 1,
    });
  });

  it("sends only signals fetched since the last pass, once the distill interval has passed", async () => {
    const db = await createTestDb();
    const threads = [thread];
    const { source } = testSource("rent", threads, 1);
    const model = createFakeModel([
      { role: "filter", reply: { verdicts: [{ id: "c1", keep: false, reason: "Joke" }] } },
    ]);
    const sentToFilter = () => model.calls.map((c) => JSON.stringify(c.messages));

    await run({ db, sources: [source], model, now, deadline: noDeadline });
    threads.push({ title: "Groceries", post: signal("p2", "erin") });
    // Fetched an hour later, but the next distill isn't due until a day after the first.
    const early = await run({ db, sources: [source], model, now: hoursLater(1), deadline: noDeadline });
    expect(early).toMatchObject({ distill: { status: "not-due" } });
    expect(model.calls).toHaveLength(1);

    await run({ db, sources: [source], model, now: hoursLater(24), deadline: noDeadline });

    expect(model.calls).toHaveLength(2);
    expect(sentToFilter()[1]).toContain("text of p2");
    expect(sentToFilter()[1]).not.toContain("text of c1");
    expect(sentToFilter()[1]).not.toContain("text of p1");
  });

  it("stops when the day's spend reaches the cap and resumes the next day", async () => {
    const db = await createTestDb();
    // Each source is its own filter batch, and each fake call costs one cent.
    const sources = [
      testSource("a", [{ title: "A", post: signal("a1", "alice") }]).source,
      testSource("b", [{ title: "B", post: signal("b1", "bob") }]).source,
    ];
    const model = keepEverything();
    const capped = { ...settings, dailySpendCapUsd: 0.01 };

    const first = await run({ db, sources, model, settings: capped, now, deadline: noDeadline });
    expect(first).toMatchObject({ distill: { status: "stopped", reason: "budget" } });
    expect(model.calls).toHaveLength(1);
    expect(await pendingCount(db)).toBe(1);

    const sameDay = await run({ db, sources, model, settings: capped, now: hoursLater(1), deadline: noDeadline });
    expect(sameDay).toMatchObject({ distill: { status: "stopped", reason: "budget" } });
    expect(model.calls).toHaveLength(1);
    expect(await getDistillStatus(db, capped, hoursLater(1))).toMatchObject({
      inProgressSince: now,
      spentTodayUsd: 0.01,
    });

    const nextDay = await run({ db, sources, model, settings: capped, now: hoursLater(24), deadline: noDeadline });
    expect(nextDay).toMatchObject({ distill: { status: "finished" } });
    expect(model.calls).toHaveLength(2);
    expect(await pendingCount(db)).toBe(0);
  });

  it("stops at the deadline mid-pass and finishes the pass on the next tick", async () => {
    const db = await createTestDb();
    const sources = [
      testSource("a", [{ title: "A", post: signal("a1", "alice") }]).source,
      testSource("b", [{ title: "B", post: signal("b1", "bob") }]).source,
    ];
    const fake = keepEverything();
    // Each filter call takes longer than the time left, so only one fits before the deadline.
    const slow: Model = {
      call: async (request) => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return fake.call(request);
      },
    };

    const first = await run({ db, sources, model: slow, now, deadline: Date.now() + 100 });
    expect(first).toMatchObject({ distill: { status: "stopped", reason: "deadline" }, stoppedEarly: true });
    expect(fake.calls).toHaveLength(1);
    expect(await pendingCount(db)).toBe(1);

    const second = await run({ db, sources, model: slow, now: hoursLater(1), deadline: noDeadline });
    expect(second).toMatchObject({ distill: { status: "finished" }, stoppedEarly: false });
    expect(fake.calls).toHaveLength(2);
    expect(await pendingCount(db)).toBe(0);
  });
});
