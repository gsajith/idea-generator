import { and, asc, eq, inArray, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import type { Db } from "@/db/client";
import { signals } from "@/db/schema";
import { type Model, ModelOutputError } from "@/model/model";

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

  // Keep a signal the filter gave no verdict for, and the whole batch when the reply is
  // unusable, instead of retrying. A bad reply then can't loop, re-bill every tick or lose a need.
  let verdicts: z.infer<typeof verdictsSchema>["verdicts"] = [];
  try {
    const { output } = await model.call({
      role: "filter",
      system: SYSTEM,
      messages: [{ role: "user", content: batch.map(signalPrompt).join("\n\n") }],
      schema: verdictsSchema,
      maxTokens: 4_000,
    });
    verdicts = output.verdicts;
  } catch (error) {
    if (!(error instanceof ModelOutputError)) throw error;
  }

  const drops = new Map(verdicts.filter((v) => !v.keep).map((v) => [v.id, v.reason]));
  const kept = batch.filter((s) => !drops.has(s.externalId));
  const dropped = batch.filter((s) => drops.has(s.externalId));
  await db.transaction(async (tx) => {
    if (kept.length) {
      await tx
        .update(signals)
        .set({ distillStatus: "kept" })
        .where(inArray(signals.id, kept.map((s) => s.id)));
    }
    for (const signal of dropped) {
      await tx
        .update(signals)
        .set({ distillStatus: "dropped", dropReason: drops.get(signal.externalId) })
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
      : `\n<replying_to>${escape(signal.parentText.slice(0, MAX_PARENT_CHARS))}</replying_to>`;
  return `<signal id="${escape(signal.externalId)}">
<thread>${escape(signal.threadTitle)}</thread>${parent}
<text>${escape(signal.text.slice(0, MAX_TEXT_CHARS))}</text>
</signal>`;
}

// Signals are untrusted text, so escape them: a signal can't close its tags and forge another
// signal or a verdict.
function escape(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
