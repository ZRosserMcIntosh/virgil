/**
 * VIRGIL — Encryption (AES-256-GCM, envelope-ready).
 *
 * v0 uses a single master key from ENCRYPTION_KEY (32-byte base64). Roadmap:
 *   - per-record DEK wrapped by KEK in KMS
 *   - per-category key separation (security secrets vs personal sacred)
 *   - HSM-backed master key
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const k = process.env.ENCRYPTION_KEY;
  if (!k) throw new Error("ENCRYPTION_KEY is not set. Refusing to operate without master key.");
  const buf = Buffer.from(k, "base64");
  if (buf.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must decode to 32 bytes (got ${buf.length}).`);
  }
  return buf;
}

/** Returns base64( iv(12) || tag(16) || ciphertext ). */
export function encryptString(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString("base64");
}

export function decryptString(payload: string): string {
  const key = getKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < 12 + 16 + 1) throw new Error("Ciphertext too short.");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return pt.toString("utf8");
}

/** Stable hash for fingerprints/IPs we must reference but not store raw. */
export function hashOpaque(input: string, salt = "virgil"): string {
  return createHash("sha256").update(salt + ":" + input).digest("hex");
}
