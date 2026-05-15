# Virgil — SQL Migrations

Run these in order in the **Supabase SQL Editor**.  
Each file is idempotent where possible, but run them sequentially.

| File | Contents | Status |
|------|----------|--------|
| `01_singleton_indexes.sql` | Partial unique indexes for OWNER/PEPPER singletons | ✅ Run already |
| `02_question_mode.sql` | Personal Question Mode — all 5 tables and enums | ⏳ Needs running |
| `03_veronica_privacy.sql` | Veronica privacy — User columns, audit log, encrypted conversation/memory tables | ⏳ Needs running |

---

## How to run

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Open the file contents (copy below or open the file)
3. Paste the entire file
4. Click **Run**
5. Confirm "Success. No rows returned."

---

## After `03_veronica_privacy.sql`

Create Stella's user row (replace email):

```sql
INSERT INTO "User" (id, email, name, identity, "veronicaOnboarded", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'stellas-real-email@example.com',
  'Stella',
  'PEPPER',
  false,
  NOW(),
  NOW()
);
```

Then set in Vercel → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `VERONICA_PRINCIPAL_EMAIL` | Stella's email |
| `VERONICA_CPF_PEPPER` | Any random 32+ character string (keep secret) |
| `VERONICA_DOMAIN` | `veronica.zrossermcintosh.com` |
| `VERONICA_OPENAI_API_KEY` | Separate OpenAI key for Veronica |
| `VERONICA_ANTHROPIC_API_KEY` | Separate Anthropic key for Veronica |
