// ============================================================
// Auth.js (NextAuth v5) — Google sign-in.
// JWT sessions (no DB round-trip per request); users/accounts
// persisted via the Prisma adapter. The session user id is the
// ONLY identity the server ever trusts — never a client value.
//
// When env vars are missing the app runs in local-only mode:
// sign-in UI hides and the sync API answers 503.
// ============================================================
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

export const authEnabled = Boolean(
  process.env.AUTH_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.DATABASE_URL,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  // failed sign-ins return to the app instead of a raw error response
  pages: { error: "/more" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // on first sign-in, pin the database user id into the token
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
