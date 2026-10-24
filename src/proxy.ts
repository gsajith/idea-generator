// Sends every request without an allowlisted session to sign-in (see `authorized` in auth.ts).
// The dashboard layout checks the session again, since the proxy alone isn't an authorization layer.
export { auth as proxy } from "@/auth";

export const config = {
  // Everything except sign-in itself, the tick endpoint (it has its own secret) and static files.
  matcher: ["/((?!api/auth|api/tick|_next/static|_next/image|favicon.ico).*)"],
};
