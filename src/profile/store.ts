import type { Db } from "@/db/client";
import { builderProfile } from "@/db/schema";

export type BuilderProfile = { text: string; updatedAt: Date };

/** The saved builder profile, or null before the first save. */
export async function getProfile(db: Db): Promise<BuilderProfile | null> {
  const [row] = await db
    .select({ text: builderProfile.text, updatedAt: builderProfile.updatedAt })
    .from(builderProfile);
  return row ?? null;
}

/** Writes the builder profile, creating its single row on the first save. */
export async function saveProfile(db: Db, text: string): Promise<void> {
  const updatedAt = new Date();
  await db
    .insert(builderProfile)
    .values({ text, updatedAt })
    .onConflictDoUpdate({ target: builderProfile.id, set: { text, updatedAt } });
}
