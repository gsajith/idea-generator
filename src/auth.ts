import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAllowedEmail } from "@/lib/allowlist";

// Google reads AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET; sessions are signed with AUTH_SECRET.
export const { handlers, auth, signOut } = NextAuth({
  providers: [Google],
  theme: { colorScheme: "dark" },
  callbacks: {
    // Refuse sign-in for anyone not on the allowlist, and only trust verified Google emails.
    signIn({ profile }) {
      return Boolean(profile?.email_verified) && isAllowedEmail(profile?.email);
    },
    // Used by the proxy: requests without an allowlisted session go to the sign-in page.
    authorized({ auth }) {
      return isAllowedEmail(auth?.user?.email);
    },
  },
});
