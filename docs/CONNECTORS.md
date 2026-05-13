# VIRGIL — Connector / API Inventory

The full integration map. Phased from "deep first" (week one) to
"Stark-tier" (mature). All connectors flow through the same access
model: **owner-only by default**, scope-grantable to a Pepper or
Delegate, never auto-executed.

Sensitivity column controls cloud routing. `OWNER_ONLY` data never
leaves the box.

---

## Phase 1 — Deep first (must work before launch)

| # | Connector       | Provider                | Read | Write | Auth          | Sensitivity            |
|---|-----------------|-------------------------|------|-------|---------------|------------------------|
| 1 | Auth            | NextAuth (→ WebAuthn)   |  ✓   |   ✓   | Passkey       | SECURITY_SECRET        |
| 2 | Database        | Supabase Postgres       |  ✓   |   ✓   | Connection str| OWNER_ONLY             |
| 3 | Object storage  | AWS S3                  |  ✓   |   ✓   | IAM role      | OWNER_ONLY             |
| 4 | Envelope keys   | AWS KMS                 |  ✓   |   ✓   | IAM role      | SECURITY_SECRET        |
| 5 | Hosting         | Vercel API              |  ✓   |   —   | Token         | BUSINESS_INTERNAL      |
| 6 | Edge perimeter  | Cloudflare Access       |  ✓   |   —   | API token     | SECURITY_SECRET        |
| 7 | LLM (default)   | OpenAI                  |  —   |   ✓   | API key       | varies (gateway)       |
| 8 | LLM (high-stk)  | Anthropic Claude        |  —   |   ✓   | API key       | varies (gateway)       |
| 9 | Local LLM       | Ollama (llama.cpp node) |  —   |   ✓   | localhost     | NEVER_SEND_TO_CLOUD ok |
|10 | Email (system)  | Resend                  |  —   |   ✓   | API key       | BUSINESS_INTERNAL      |

---

## Phase 2 — Working life (weeks 2–6)

| # | Connector            | Provider                  | R | W | Sensitivity           |
|---|----------------------|---------------------------|---|---|-----------------------|
|11 | Email (Rosser)       | Gmail API                 | ✓ | ✓ | PERSONAL_PRIVATE      |
|12 | Calendar             | Google Calendar           | ✓ | ✓ | PERSONAL_PRIVATE      |
|13 | Contacts             | Google People             | ✓ | — | PERSONAL_PRIVATE      |
|14 | Drive                | Google Drive              | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|15 | Code                 | GitHub                    | ✓ | ✓ | BUSINESS_INTERNAL     |
|16 | Issue tracker        | Linear                    | ✓ | ✓ | BUSINESS_INTERNAL     |
|17 | Docs / wiki          | Notion                    | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|18 | Chat                 | Slack                     | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|19 | SMS                  | Twilio                    | ✓ | ✓ | PERSONAL_PRIVATE      |
|20 | Voice in/out         | Twilio Voice / Whisper    | ✓ | ✓ | PERSONAL_SACRED       |
|21 | Errors               | Sentry                    | ✓ | — | BUSINESS_INTERNAL     |
|22 | Web search           | Brave Search API          | ✓ | — | PUBLIC                |
|23 | Web fetch            | Firecrawl / Browserless   | ✓ | — | PUBLIC                |
|24 | Maps / location      | Mapbox                    | ✓ | — | PERSONAL_PRIVATE      |
|25 | Weather              | Tomorrow.io               | ✓ | — | PUBLIC                |

---

## Phase 3 — Operating the businesses (Katura / K99 / Maverick)

| # | Connector            | Provider                  | R | W | Sensitivity           |
|---|----------------------|---------------------------|---|---|-----------------------|
|26 | Katura store         | Shopify Admin API         | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|27 | K99 store            | Shopify Admin API         | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|28 | Payments             | Stripe                    | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|29 | Accounting           | QuickBooks Online         | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|30 | Banking              | Plaid                     | ✓ | — | OWNER_ONLY            |
|31 | Ad spend             | Meta Marketing            | ✓ | — | BUSINESS_CONFIDENTIAL |
|32 | Ad spend             | Google Ads                | ✓ | — | BUSINESS_CONFIDENTIAL |
|33 | Analytics            | GA4 / PostHog             | ✓ | — | BUSINESS_INTERNAL     |
|34 | Email marketing      | Klaviyo                   | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|35 | Reviews / support    | Gorgias / Zendesk         | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|36 | Shipping             | ShipStation / EasyPost    | ✓ | ✓ | BUSINESS_INTERNAL     |
|37 | Inventory            | Cin7 / Katana             | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|38 | Maverick LMS         | (vendor TBD)              | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|39 | Maverick CRM         | HubSpot                   | ✓ | ✓ | BUSINESS_CONFIDENTIAL |
|40 | Document signing     | DocuSign                  | ✓ | ✓ | BUSINESS_CONFIDENTIAL |

---

## Phase 4 — Personal infrastructure

| # | Connector            | Provider                  | R | W | Sensitivity           |
|---|----------------------|---------------------------|---|---|-----------------------|
|41 | Password vault       | 1Password Connect         | ✓ | — | SECURITY_SECRET       |
|42 | Health               | Apple HealthKit (export)  | ✓ | — | PERSONAL_SACRED       |
|43 | Fitness              | Whoop / Oura              | ✓ | — | PERSONAL_PRIVATE      |
|44 | Sleep                | Eight Sleep               | ✓ | — | PERSONAL_PRIVATE      |
|45 | Home automation      | Home Assistant            | ✓ | ✓ | PERSONAL_PRIVATE      |
|46 | Cameras              | UniFi Protect             | ✓ | — | SECURITY_SECRET       |
|47 | Locks / alarm        | August / SimpliSafe       | ✓ | ✓ | SECURITY_SECRET       |
|48 | Vehicle              | Tesla / Smartcar          | ✓ | — | PERSONAL_PRIVATE      |
|49 | Music                | Spotify                   | ✓ | ✓ | PERSONAL_PRIVATE      |
|50 | Reading              | Readwise / Pocket         | ✓ | — | PERSONAL_PRIVATE      |
|51 | Files (sync)         | iCloud (shortcut bridge)  | ✓ | — | PERSONAL_PRIVATE      |
|52 | Travel               | TripIt                    | ✓ | — | PERSONAL_PRIVATE      |
|53 | Flights live         | FlightAware               | ✓ | — | PERSONAL_PRIVATE      |
|54 | News                 | RSS / Feedly              | ✓ | — | PUBLIC                |
|55 | Markets              | Polygon.io / Alpaca       | ✓ | — | BUSINESS_INTERNAL     |

---

## Phase 5 — Stark tier (mature, optional)

| # | Connector            | Provider                  | R | W | Sensitivity           |
|---|----------------------|---------------------------|---|---|-----------------------|
|56 | Vector search        | pgvector (in-DB)          | ✓ | ✓ | OWNER_ONLY            |
|57 | Embeddings           | OpenAI / local            | — | ✓ | varies                |
|58 | OCR                  | AWS Textract              | — | ✓ | BUSINESS_CONFIDENTIAL |
|59 | Speech-to-text       | OpenAI Whisper / local    | — | ✓ | varies                |
|60 | Text-to-speech       | ElevenLabs / local        | — | ✓ | varies                |
|61 | Image gen            | Replicate / local SDXL    | — | ✓ | BUSINESS_INTERNAL     |
|62 | Code execution       | E2B / Modal sandbox       | — | ✓ | BUSINESS_INTERNAL     |
|63 | Browser automation   | Playwright on Browserless | ✓ | ✓ | varies                |
|64 | Personal CRM         | self-hosted               | ✓ | ✓ | PERSONAL_PRIVATE      |
|65 | Knowledge graph      | self-hosted Neo4j         | ✓ | ✓ | OWNER_ONLY            |
|66 | Backups              | Backblaze B2 / S3 Glacier | ✓ | ✓ | OWNER_ONLY            |
|67 | Monitoring           | Better Stack / Uptime     | ✓ | — | BUSINESS_INTERNAL     |
|68 | Status pages         | Statuspage.io             | ✓ | ✓ | PUBLIC                |
|69 | DNS                  | Cloudflare DNS            | ✓ | ✓ | SECURITY_SECRET       |
|70 | TLS / certs          | Let's Encrypt (ACME)      | ✓ | ✓ | SECURITY_SECRET       |
|71 | Secrets manager      | AWS Secrets / Doppler     | ✓ | ✓ | SECURITY_SECRET       |
|72 | Identity provider    | WorkOS (delegate SSO)     | ✓ | ✓ | SECURITY_SECRET       |
|73 | Push (mobile)        | Apple APNs                | — | ✓ | PERSONAL_PRIVATE      |
|74 | Push (desktop)       | Pushover / ntfy           | — | ✓ | PERSONAL_PRIVATE      |
|75 | Device posture       | Tailscale / Kolide        | ✓ | — | SECURITY_SECRET       |
|76 | Time-tracking        | Toggl                     | ✓ | — | PERSONAL_PRIVATE      |
|77 | Investment tracking  | Wealthfront API           | ✓ | — | OWNER_ONLY            |
|78 | Crypto wallets       | Etherscan / read-only RPC | ✓ | — | OWNER_ONLY            |

---

## Notes on access control

- Every connector record lives in `Connector` (Prisma model).
  Credentials encrypted at rest with the master `ENCRYPTION_KEY`.
- Pepper visibility on connector data is opt-in per connector via
  `ScopeGrant` rows. Default: invisible.
- Delegates get connector access scoped to a `Project`. Never global.
- Connectors classified `OWNER_ONLY` or `SECURITY_SECRET` are
  unreachable through the Pepper / Delegate / Guest portals — the
  permission gate refuses before the connector code even runs.
