"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/db/client";
import { isAllowedEmail } from "@/lib/allowlist";
import { createAnthropicModel } from "@/model/anthropic";
import { interviewTurn, type InterviewTurn } from "@/profile/interview";
import { getProfile, saveProfile } from "@/profile/store";

// Saved exactly as typed, so the editor's text matches the saved text afterwards.
const profileText = z.string().regex(/\S/, "Profile is blank").max(20_000);

const conversation = z
  .array(z.object({ from: z.enum(["interviewer", "builder"]), text: z.string().max(5_000) }))
  .max(40);

// Server actions take direct POSTs, so each one checks the session itself.
async function requireBuilder() {
  const session = await auth();
  if (!isAllowedEmail(session?.user?.email)) throw new Error("Not signed in");
}

export async function saveProfileAction(text: string): Promise<void> {
  await requireBuilder();
  await saveProfile(getDb(), profileText.parse(text));
  revalidatePath("/profile");
}

/** Runs one interview turn against the saved profile, so a re-run updates it. */
export async function interviewTurnAction(messages: unknown): Promise<InterviewTurn> {
  await requireBuilder();
  const existing = await getProfile(getDb());
  return interviewTurn(createAnthropicModel(), {
    conversation: conversation.parse(messages),
    existingProfile: existing?.text ?? null,
  });
}
