import { timingSafeEqual } from "node:crypto";
import { getDb } from "@/db/client";
import { createAnthropicModel } from "@/model/anthropic";
import { getSettings } from "@/settings";
import { sources } from "@/sources/registry";
import { tick } from "@/tick/tick";

// Vercel Hobby stops a function at 300 seconds. The tick stops starting new work after 240,
// which leaves a minute for the unit of work in progress to finish.
export const maxDuration = 300;
const TICK_TIME_MS = 240_000;
// Holds a model call that starts just before the deadline inside that last minute. A failed
// call isn't retried here; the next tick picks the work up instead.
const MODEL_CALL_TIMEOUT_MS = 50_000;

/** Runs scheduled work. Called hourly by .github/workflows/tick.yml with the TICK_SECRET bearer. */
export async function POST(request: Request) {
  if (!hasTickSecret(request.headers.get("authorization"))) {
    return new Response("Unauthorized", { status: 401 });
  }
  const start = Date.now();
  const result = await tick({
    db: getDb(),
    model: createAnthropicModel({ timeoutMs: MODEL_CALL_TIMEOUT_MS, maxRetries: 0 }),
    sources,
    settings: getSettings(),
    now: new Date(start),
    deadline: start + TICK_TIME_MS,
    leaseMs: maxDuration * 1000,
  });
  return Response.json(result);
}

function hasTickSecret(authorization: string | null): boolean {
  const secret = process.env.TICK_SECRET;
  if (!secret || !authorization) return false;
  const given = Buffer.from(authorization);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
