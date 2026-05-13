# VIRGIL

Private command intelligence for Rosser McIntosh. Single-tenant, security-first.

> "Sir, I have prepared this. I have not sent it."

---

## Identity model

| Identity    | Slots | Capability                                               |
|-------------|-------|----------------------------------------------------------|
| `OWNER`     | 1     | Full ladder (rungs 0–6). Only identity that can execute. |
| `PEPPER`    | 1     | Singleton. Warm access. Scoped grants only. No execute.  |
| `DELEGATE`  | n     | Project-scoped. Approval queue only.                     |
| `GUEST`     | n     | Read-only, narrow.                                       |
| `STRANGER`  | —     | Default. Access denied.                                  |
| `ADVERSARY` | n     | Honeypot / Black Door target. Zero disclosure.           |

Singleton enforcement: `prisma/sql/01_singleton_indexes.sql`.

---

## Defense in depth

1. Cloudflare Access — in front of `/login` + `/api/*`
2. Edge middleware — honeypot 404s, security headers, CSP, API origin guard
3. Identity gate — lockdown → denial-list → outsider check
4. Input scan — prompt injection / authority-claim / impersonation patterns
5. Sensitivity classifier — owner-only data never leaves the box
6. Privacy gateway — redact → cloud → rehydrate for owner only
7. Black Door Protocol — `Access denied.`, full internal record, no leak
8. Lockdown singleton — manual cold-shut for the entire system
9. Append-only audit log — metadata only, identity-partitioned

---

## Local setup

```bash
cp .env.example .env.local
# Fill: DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY,
#       VIRGIL_OWNER_EMAIL, VIRGIL_OWNER_PASSWORD

npm install
npx prisma db push
psql "$DIRECT_URL" -f prisma/sql/01_singleton_indexes.sql
npm run db:seed
npm run dev
```

Open http://localhost:3000/login

---

## Vercel deployment

1. Supabase Pro — create project, copy DATABASE_URL (port 6543) and DIRECT_URL (port 5432)
2. Vercel — import repo, set all env vars from .env.example
3. Cloudflare Access — policy on /login and /api/* scoped to owner email + device posture
4. AWS — create S3 bucket + KMS key, add keys to Vercel env
5. Migrate from local: npx prisma migrate deploy && psql "$DIRECT_URL" -f prisma/sql/01_singleton_indexes.sql && npm run db:seed

---

## Connector inventory

See docs/CONNECTORS.md — 78 integrations across 5 phases.

---

## Status

v0.1 — schema + identity model + full pipeline. LLM clients are stubs; mock provider
active until API keys are wired. Next: WebAuthn, local model node, S3+KMS, live connectors.
