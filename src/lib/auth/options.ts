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
import { compare as bcryptCompare } from "bcryptjs";
import { derivePrincipalKey, hashDerivedKey, hashCPF } from "@/lib/veronica/encryption";

export const authOptions: AuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [
    // ── Rosser (Owner) ───────────────────────────────────────────────────
    CredentialsProvider({
      id: "credentials",
      name: "Owner",
      credentials: {
        email: { label: "Email", type: "email" },
        key: { label: "Owner Key", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.key) return null;

        const ownerEmail = process.env.VIRGIL_OWNER_EMAIL;
        const ownerPassword = process.env.VIRGIL_OWNER_PASSWORD;
        if (!ownerEmail || !ownerPassword) return null;

        if (
          credentials.email.toLowerCase().trim() !== ownerEmail.toLowerCase().trim() ||
          credentials.key !== ownerPassword
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: ownerEmail } });
        if (!user || user.identity !== "OWNER" || user.suspended) return null;

        return { id: user.id, email: user.email, name: user.name ?? "Rosser", companion: "VIRGIL" };
      },
    }),

    // ── Stella (Pepper → Veronica) ───────────────────────────────────────
    CredentialsProvider({
      id: "veronica",
      name: "Veronica",
      credentials: {
        cpf: { label: "CPF", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.cpf || !credentials?.password) return null;

        const stellaEmail = process.env.VERONICA_PRINCIPAL_EMAIL;
        if (!stellaEmail) return null;

        const user = await prisma.user.findUnique({
          where: { email: stellaEmail.toLowerCase().trim() },
        });
        if (!user || user.identity !== "PEPPER" || user.suspended) return null;
        if (!(user as any).veronicaOnboarded) return null;

        // Verify CPF hash matches
        const cpfHashed = hashCPF(credentials.cpf);
        if (cpfHashed !== (user as any).cpfHash) return null;

        // Verify password via bcrypt
        const passwordMatch = await bcryptCompare(
          credentials.password,
          (user as any).passwordHash ?? "",
        );
        if (!passwordMatch) return null;

        // Re-derive the encryption key and verify it matches
        const derivedKey = derivePrincipalKey(credentials.cpf, credentials.password);
        const keyHash = hashDerivedKey(derivedKey);
        if (keyHash !== (user as any).principalKeyHash) return null;

        // Return user with the derived key — will be stored in encrypted JWT only
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "Stella",
          companion: "VERONICA",
          principalKey: derivedKey, // Ephemeral — lives in JWT, not DB
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.companion = (user as any).companion ?? "VIRGIL";
        // Store the principal key in the JWT if present (Stella only)
        if ((user as any).principalKey) {
          token.principalKey = (user as any).principalKey;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as any).id = token.uid;
        (session.user as any).companion = token.companion ?? "VIRGIL";
        // IMPORTANT: principalKey is intentionally NOT passed to the session
        // object that is visible client-side. It stays in the server-side JWT.
      }
      return session;
    },
  },
};
