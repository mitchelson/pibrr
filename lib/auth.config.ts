import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

/**
 * Edge-safe NextAuth config (no database imports).
 * Used by middleware; full callbacks with SQL live in lib/auth.ts.
 */
export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.ministerioIds = (token.ministerioIds as string[]) || []
      }
      return session
    },
  },
} satisfies NextAuthConfig
