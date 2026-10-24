import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { isAllowedEmail } from "@/lib/allowlist";
import { NavLink } from "./nav-link";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!isAllowedEmail(session?.user?.email)) redirect("/api/auth/signin");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-800 p-4">
        <p className="mb-6 px-3 text-sm font-semibold">Idea generator</p>
        <nav className="flex flex-col gap-1">
          <NavLink href="/">Ideas</NavLink>
          <NavLink href="/needs">Needs</NavLink>
          <NavLink href="/sources">Sources</NavLink>
          <NavLink href="/profile">Profile</NavLink>
        </nav>
        <form
          className="mt-auto"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <p className="truncate px-3 text-xs text-neutral-500">{session?.user?.email}</p>
          <button className="mt-2 px-3 text-sm text-neutral-400 hover:text-neutral-100">Sign out</button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
