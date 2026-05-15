/**
 * POST /api/veronica/auth/onboard
 *
 * Stella's first-time setup:
 *   1. Validate CPF (format + check digits)
 *   2. Hash CPF with server-side pepper (HMAC-SHA256)
 *   3. Hash password with bcrypt
 *   4. Derive encryption key from CPF + password (PBKDF2)
 *   5. Store: cpfHash, passwordHash, principalKeyHash
 *   6. Mark onboarded
 *
 * The encryption key itself is NEVER stored. Only a verification hash
 * of the key is stored so we can confirm it at login time.
 *
 * CRITICAL: This endpoint can only be called ONCE. After onboarding,
 * it permanently refuses to run again.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { hash as bcryptHash } from "bcryptjs";
import {
  isValidCPF,
  hashCPF,
  derivePrincipalKey,
  hashDerivedKey,
} from "@/lib/veronica/encryption";
import { isStellaEmail } from "@/lib/veronica/allowed-emails";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email: rawEmail, cpf, password } = await req.json();
  const email = rawEmail?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ message: "E-mail é obrigatório." }, { status: 400 });
  }

  if (!isStellaEmail(email)) {
    return NextResponse.json({ message: "Conta não encontrada." }, { status: 404 });
  }

  const user = await (prisma.user as any).findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ message: "Conta não encontrada." }, { status: 404 });
  }

  if (user.identity !== "PEPPER") {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  // Refuse if already onboarded
  if ((user as any).veronicaOnboarded) {
    return NextResponse.json({ message: "Conta já foi criada." }, { status: 400 });
  }

  // Validate CPF
  if (!cpf || !isValidCPF(cpf)) {
    return NextResponse.json({ message: "CPF inválido." }, { status: 400 });
  }

  // Validate password
  if (!password || password.length < 8) {
    return NextResponse.json({ message: "A senha deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  // 1. Hash CPF (HMAC — cannot be reversed, cannot be rainbow-tabled)
  const cpfHashed = hashCPF(cpf);

  // 2. Hash password (bcrypt — slow hash for brute-force resistance)
  const passwordHashed = await bcryptHash(password, 12);

  // 3. Derive the encryption key (this key encrypts all her data)
  const derivedKey = derivePrincipalKey(cpf, password);

  // 4. Hash the derived key for verification at login time
  // The actual key is DISCARDED after this. It will be re-derived at login.
  const keyHash = hashDerivedKey(derivedKey);

  // 5. Update user record
  await (prisma.user as any).update({
    where: { id: user.id },
    data: {
      cpfHash: cpfHashed,
      passwordHash: passwordHashed,
      principalKeyHash: keyHash,
      veronicaOnboarded: true,
    },
  });

  return NextResponse.json({ ok: true, message: "Conta criada com sucesso." });
}
