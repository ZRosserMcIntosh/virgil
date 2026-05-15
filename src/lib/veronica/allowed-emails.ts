/**
 * Parses and validates the VERONICA_ALLOWED_EMAILS environment variable.
 *
 * Set as a comma-separated list:
 *   VERONICA_ALLOWED_EMAILS=stellaemjuris@gmail.com,stella@otherdomain.com,...
 *
 * Falls back to VERONICA_PRINCIPAL_EMAIL if VERONICA_ALLOWED_EMAILS is not set.
 */

export function getAllowedStellaEmails(): string[] {
  const raw =
    process.env.VERONICA_ALLOWED_EMAILS ?? process.env.VERONICA_PRINCIPAL_EMAIL ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isStellaEmail(email: string): boolean {
  const allowed = getAllowedStellaEmails();
  return allowed.includes(email.trim().toLowerCase());
}
