import { and, asc, eq, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { Db } from "@/db/client";
import { signals } from "@/db/schema";
import type { Model } from "@/model/model";

const BATCH_SIZE = 25;
// The prompt cuts long signals short, so one rant can't blow up a batch's cost.
const MAX_TEXT_CHARS = 2_000;
const MAX_PARENT_CHARS = 500;

const SYSTEM = `You filter raw posts and comments from online communities before a product research pipeline reads them. The pipeline looks for needs: problems real people have that a product could solve.

Keep a signal if it:
- describes a problem, frustration, wish or workaround
- says they would pay for something, or agrees with a need stated above it ("same, I'd pay for this")
- argues against a possible product, for example by naming an existing product that already solves the problem or objecting to the price

Drop a signal if it is a meme or joke, self-promotion or an ad, news or an announcement with no complaint, thanks or a greeting, or off-topic chatter.

When unsure, keep it. Give every signal a verdict with a reason of a few words.`;

const verdictsSchema = z.object({
  verdicts: z.array(z.object({ id: z.string(), keep: z.boolean(), reason: z.string() })),
});

/**
 * Sends the next batch of pending signals in the pass to the filter role and marks each one
 * kept or dropped. Returns false when the pass has no pending signals left.
 */
export async function filterNextBatch(db: Db, model: Model, passStartedAt: Date): Promise<boolean> {
  const batch = await nextBatch(db, passStartedAt);
  if (!batch.length) return false;

  const { output } = await model.call({
    role: "filter",
    system: SYSTEM,
    messages: [{ role: "user", content: batch.map(signalPrompt).join("\n\n") }],
    schema: verdictsSchema,
    maxTokens: 4_000,
  });

  // Keep a signal the filter gave no verdict for instead of retrying it, so a bad reply can't
  // loop or lose a need.
  const verdicts = new Map(output.verdicts.map((v) => [v.id, v]));
  await db.transaction(async (tx) => {
    for (const signal of batch) {
      const verdict = verdicts.get(signal.externalId);
      const dropped = verdict !== undefined && !verdict.keep;
      await tx
        .update(signals)
        .set(dropped ? { distillStatus: "dropped", dropReason: verdict.reason } : { distillStatus: "kept" })
        .where(eq(signals.id, signal.id));
    }
  });
  return true;
}

type BatchSignal = Awaited<ReturnType<typeof nextBatch>>[number];

// A batch holds signals from one source, so external ids are unique within it and the
// model can answer by id.
async function nextBatch(db: Db, passStartedAt: Date) {
  const parent = alias(signals, "parent");
  const rows = await db
    .select({
      id: signals.id,
      sourceId: signals.sourceId,
      externalId: signals.externalId,
      threadTitle: signals.threadTitle,
      text: signals.text,
      parentText: parent.text,
    })
    .from(signals)
    .leftJoin(parent, eq(signals.parentId, parent.id))
    .where(and(eq(signals.distillStatus, "pending"), lte(signals.fetchedAt, passStartedAt)))
    .orderBy(asc(signals.sourceId), asc(signals.publishedAt), asc(signals.id))
    .limit(BATCH_SIZE);
  return rows.filter((r) => r.sourceId === rows[0].sourceId);
}

function signalPrompt(signal: BatchSignal): string {
  const parent =
    signal.parentText === null
      ? ""
      : `\n<replying_to>${signal.parentText.slice(0, MAX_PARENT_CHARS)}</replying_to>`;
  return `<signal id="${signal.externalId}">
<thread>${signal.threadTitle}</thread>${parent}
<text>${signal.text.slice(0, MAX_TEXT_CHARS)}</text>
</signal>`;
}
