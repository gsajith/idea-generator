"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/db/client";
import { isAllowedEmail } from "@/lib/allowlist";
import { createAnthropicModel } from "@/model/anthropic";
import { interviewMessageSchema, interviewTurn, type InterviewTurn } from "@/profile/interview";
import { PROFILE_MAX_LENGTH } from "@/profile/limits";
import { saveProfile } from "@/profile/store";

// Saved exactly as typed, so the editor's text matches the saved text afterwards.
const profileTextSchema = z.string().regex(/\S/, "Profile is blank").max(PROFILE_MAX_LENGTH);

const conversationSchema = z.array(interviewMessageSchema).max(40);

// Server actions take direct POSTs, so each one checks the session itself.
async function requireBuilder() {
  const session = await auth();
  if (!isAllowedEmail(session?.user?.email)) throw new Error("Not signed in");
}

export async function saveProfileAction(text: string): Promise<void> {
  await requireBuilder();
  await saveProfile(getDb(), profileTextSchema.parse(text));
  revalidatePath("/profile");
}

/**
 * Runs one interview turn. It builds on the profile text in the editor, saved or not,
 * so a re-run updates the profile and keeps unsaved edits.
 */
export async function interviewTurnAction(messages: unknown, profileText: unknown): Promise<InterviewTurn> {
  await requireBuilder();
  const existing = z.string().max(PROFILE_MAX_LENGTH).parse(profileText);
  return interviewTurn(createAnthropicModel(), {
    conversation: conversationSchema.parse(messages),
    existingProfile: existing.trim() ? existing : null,
  });
}
