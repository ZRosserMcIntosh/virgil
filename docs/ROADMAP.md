# VIRGIL — Engineering Roadmap

**Last audit:** May 2026
**Verdict:** Architecture is serious. Identity boundaries and pipeline duplication are the risks. Fix the promises before expanding the features.

---

## Phase 0 — Stop the leaks (CRITICAL — before any feature work)

| # | Issue | Status | Detail |
|---|---|---|---|
| 0.1 | Verônica principal identity model | 🔴 | `trust.isOwner` used as Verônica principal — backwards. Need companion-specific principal resolver. |
| 0.2 | Route/nav/API separation by companion | 🔴 | Private layout shows all modules to all identities. OWNER pages must be owner-gated, Verônica pages must be pepper-gated. |
| 0.3 | ProfileFacts auth hardening | 🔴 | Any authenticated session can CRUD any ProfileFact. Need subject-based ownership. |
| 0.4 | Message ownership mutation fix | 🔴 | Feedback PATCH validates conversation ownership but not message-belongs-to-conversation. |
| 0.5 | Require VERONICA_CPF_PEPPER | 🔴 | Silent fallback to default pepper string. Must fail in production. |
| 0.6 | Unify streaming + non-streaming pipeline | 🔴 | Streaming route skips audit, provider ledger, output validation. Duplicated security = bug nursery. |
| 0.7 | Tests for all of the above | 🔴 | No test suite exists. |

---

## Phase 1 — Make it trustworthy

| # | Feature | Status | Detail |
|---|---|---|---|
| 1.1 | WebAuthn / passkeys | 🔴 | Replace password login. Recovery codes. Session step-up for sensitive actions. |
| 1.2 | Trusted device management | 🔴 | Enroll, list, revoke devices. |
| 1.3 | Security console | 🔴 | Sessions, devices, login attempts, denial list, adversary scores, lockdown UI, event resolution. |
| 1.4 | Env validation (zod) | 🔴 | Fail on startup if critical env vars missing. |
| 1.5 | Production deployment checklist | 🔴 | Secret rotation, CSP nonces, rate limiting, CSRF, Cloudflare JWT verification. |
| 1.6 | Encrypted fields real | 🔴 | `encrypted` boolean on ProfileFact is decorative. Must actually encrypt/decrypt. |

---

## Phase 2 — Make it useful every day

| # | Feature | Status | Detail |
|---|---|---|---|
| 2.1 | Provider wiring | ✅ | OpenAI + Anthropic live. |
| 2.2 | Streaming responses | ✅ | Token-by-token streaming live. |
| 2.3 | Voice output (TTS) | ✅ | ElevenLabs wired. |
| 2.4 | Voice input (STT) | ✅ | Web Speech API wired. |
| 2.5 | Tool use (agent loop) | ✅ | datetime, weather, search, calculator, memory. |
| 2.6 | Sovereign persona | ✅ | Independent judgment, zero hedging, push-back. |
| 2.7 | Token / cost usage page | 🟡 | Building now. |
| 2.8 | Conversation branching | 🟡 | Branch a response into a new conversation. |
| 2.9 | Conversation search | 🔴 | Full-text across messages. |
| 2.10 | Real memory review UI | 🔴 | Approve/reject/edit queue, merge, supersede, pin, sacred flags. |
| 2.11 | Better briefing | ✅ | Time-aware, profile-aware, downvote signal. Needs connector data next. |
| 2.12 | Gmail connector | 🔴 | OAuth, sync, triage, draft staging. |
| 2.13 | Calendar connector | 🔴 | OAuth, sync, event creation, briefing integration. |
| 2.14 | GitHub connector | 🔴 | App install, repo read, issue/PR triage. |
| 2.15 | Approval queue execution | 🔴 | Real approve/reject/execute with rollback. |
| 2.16 | Local model node | 🔴 | Ollama / llama.cpp for sensitive routes. |

---

## Phase 3 — Make it alive

| # | Feature | Status |
|---|---|---|
| 3.1 | Morning / evening briefings (cron) | 🔴 |
| 3.2 | Active notifications | 🔴 |
| 3.3 | Connector sync jobs | 🔴 |
| 3.4 | Agent framework | 🔴 |
| 3.5 | Project cockpits | 🔴 |
| 3.6 | Verônica privacy dashboard | 🔴 |
| 3.7 | Cross-companion consent ledger | 🔴 |
| 3.8 | Command palette | 🔴 |
| 3.9 | PWA install | 🔴 |

---

## Phase 4 — Stark-tier

| # | Feature | Status |
|---|---|---|
| 4.1 | Browser automation (Playwright sandbox) | 🔴 |
| 4.2 | Code execution sandbox | 🔴 |
| 4.3 | Knowledge graph (pgvector + MemoryEdge) | 🔴 |
| 4.4 | Encrypted personal archive | 🔴 |
| 4.5 | Multi-device native apps | 🔴 |
| 4.6 | Home / vehicle / health integrations | 🔴 |

---

## Highest-priority API integrations (in order)

1. **Gmail** (Google OAuth) — read, triage, draft, send-with-approval
2. **Google Calendar** (Google OAuth) — read, create events, briefing integration
3. **Google Contacts** (Google People API) — person context for emails/calendar
4. **GitHub** (GitHub App) — repo read, issue/PR triage, deploy status
5. **Vercel** — deployment status, redeploy trigger
6. **Cloudflare** — DNS, WAF events, Access JWT verification
7. **Sentry** — error monitoring, alerts
8. **Resend** — transactional email for Virgil notifications
9. **Perplexity** — real-time web search (already wired as tool, needs key)
10. **Stripe** — payment/subscription data for Katura/K99
11. **Shopify** (Katura/K99) — order data, inventory
12. **Twilio** — SMS/voice for emergency alerts
13. **Notion / Linear** — project management sync
14. **Google Drive** — document access

---

## Connector implementation standard (per connector)

Each connector must have:
1. **OAuth/config** — connect/disconnect UI, scope display
2. **Sync** — last sync time, logs, manual resync, webhook where available
3. **Scoped access** — owner-only default, ScopeGrant for delegation
4. **Action staging** — read vs write separation, approval requirement for writes
5. **Rate limit handling** — retry/backoff
6. **Error logging** — connector-specific error table

---

## Command page feature requests (queued)

- [ ] Branch a response into a new conversation
- [ ] Highlight / bookmark a message for later
- [ ] "Respond to this" — quote-reply within conversation
- [ ] Conversation search (full-text)
- [ ] "Prepared, not sent" drafts center
- [ ] Natural language staging ("Draft this email", "Stage a calendar event")
