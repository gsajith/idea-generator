import { getDb } from "@/db/client";
import { getProfile } from "@/profile/store";
import { ProfileEditor } from "./profile-editor";

export default async function ProfilePage() {
  const profile = await getProfile(getDb());

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Idea generation reads this to keep ideas buildable for you. Needs never read it.
      </p>
      <ProfileEditor savedText={profile?.text ?? ""} updatedAt={profile?.updatedAt ?? null} />
    </div>
  );
}
