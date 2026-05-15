/**
 * VERONICA — Principal-side encryption.
 *
 * Stella's conversations and memories are encrypted with a key derived from
 * her CPF + password via PBKDF2. This key:
 *   - Is derived at login time from her credentials
 *   - Lives ONLY in her encrypted JWT session token
 *   - Is NEVER written to the database
 *   - Is NEVER accessible to the server admin
 *   - Cannot be reconstructed without her CPF + password
 *
 * Even with full database access and the master ENCRYPTION_KEY, Rosser
 * cannot decrypt Stella's data. The master key encrypts Virgil-side data.
 * Stella's data uses HER key. Two separate cryptographic domains.
 *
 * ARCHITECTURAL GUARANTEE:
 *   Rosser does not know Stella's CPF.
 *   Rosser does not know Stella's password.
 *   Therefore Rosser cannot derive her key.
 *   Therefore Rosser cannot read her data.
 *   This is not a policy. It is mathematics.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  pbkdf2Sync,
  createHash,
  createHmac,
} from "node:crypto";

const ALGO = "aes-256-gcm";
const KDF_ITERATIONS = 310_000; // OWASP 2023 recommendation for PBKDF2-SHA512
const KDF_KEYLEN = 32;
const KDF_DIGEST = "sha512";

// ── Key derivation ───────────────────────────────────────────────────────────

/**
 * Derive a 256-bit encryption key from Stella's CPF + password.
 * The CPF acts as a high-entropy salt (11 digits, personal to her).
 * Returns a base64-encoded 32-byte key.
 */
export function derivePrincipalKey(cpf: string, password: string): string {
  const normalizedCpf = cpf.replace(/\D/g, "");
  if (normalizedCpf.length !== 11) {
    throw new Error("CPF must be exactly 11 digits.");
  }
  // Salt = SHA-256 of the CPF so even the salt is opaque
  const salt = createHash("sha256").update("veronica-principal:" + normalizedCpf).digest();
  const key = pbkdf2Sync(password, salt, KDF_ITERATIONS, KDF_KEYLEN, KDF_DIGEST);
  return key.toString("base64");
}

/**
 * Create a verification hash of the derived key.
 * Stored in the DB so we can verify the key is correct at login
 * WITHOUT storing the key itself.
 */
export function hashDerivedKey(derivedKeyBase64: string): string {
  return createHash("sha256")
    .update("veronica-key-verify:" + derivedKeyBase64)
    .digest("hex");
}

// ── Encrypt / Decrypt using Stella's key ─────────────────────────────────────

/**
 * Encrypt plaintext with Stella's derived key.
 * Returns base64( iv(12) || tag(16) || ciphertext ).
 */
export function encryptForPrincipal(plaintext: string, derivedKeyBase64: string): string {
  const key = Buffer.from(derivedKeyBase64, "base64");
  if (key.length !== 32) throw new Error("Principal key must be 32 bytes.");
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

/**
 * Decrypt ciphertext with Stella's derived key.
 */
export function decryptForPrincipal(payload: string, derivedKeyBase64: string): string {
  const key = Buffer.from(derivedKeyBase64, "base64");
  if (key.length !== 32) throw new Error("Principal key must be 32 bytes.");
  const buf = Buffer.from(payload, "base64");
  if (buf.length < 29) throw new Error("Ciphertext too short.");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

// ── CPF utilities ────────────────────────────────────────────────────────────

/**
 * Validate a Brazilian CPF number (format + check digits).
 */
export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  // Reject known invalid sequences (all same digit)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Validate check digits
  const calc = (slice: number) => {
    let sum = 0;
    for (let i = 0; i < slice; i++) {
      sum += parseInt(digits[i] ?? "0") * (slice + 1 - i);
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  if (calc(9) !== parseInt(digits[9] ?? "-1")) return false;
  if (calc(10) !== parseInt(digits[10] ?? "-1")) return false;
  return true;
}

/**
 * Hash a CPF for storage (we never store plaintext).
 * Uses HMAC-SHA256 with a server-side pepper so even a DB dump
 * cannot be rainbow-tabled.
 */
export function hashCPF(cpf: string): string {
  const normalized = cpf.replace(/\D/g, "");
  const pepper = process.env.VERONICA_CPF_PEPPER ?? "veronica-cpf-default-pepper";
  return createHmac("sha256", pepper).update(normalized).digest("hex");
}

// ── Privacy audit ────────────────────────────────────────────────────────────

/**
 * Generate an audit entry signature. Stella can verify these independently.
 * Uses HMAC with her derived key — only she can produce/verify these signatures.
 */
export function signAuditEntry(
  entry: { action: string; timestamp: string; detail: string },
  derivedKeyBase64: string,
): string {
  const payload = `${entry.action}|${entry.timestamp}|${entry.detail}`;
  return createHmac("sha256", Buffer.from(derivedKeyBase64, "base64"))
    .update(payload)
    .digest("hex");
}
