/**
 * NextAuth options — v0 placeholder.
 *
 * Single-owner credential check. Migrate to WebAuthn/passkeys before
 * any production traffic. The credential is gated on:
 *   - email matches VIRGIL_OWNER_EMAIL
 *   - password matches VIRGIL_OWNER_PASSWORD
 *   - the owner User row exists with identity = "OWNER"
 */

import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db/client";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Owner",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const ownerEmail = process.env.VIRGIL_OWNER_EMAIL;
        const ownerPassword = process.env.VIRGIL_OWNER_PASSWORD;
        if (!ownerEmail || !ownerPassword) return null;

        if (
          credentials.email.toLowerCase().trim() !== ownerEmail.toLowerCase().trim() ||
          credentials.password !== ownerPassword
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
        if (!user || user.identity !== "OWNER" || user.suspended) return null;

        return { id: user.id, email: user.email, name: user.name ?? "Rosser" };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      return session;
    },
  },
};
