/**
 * VIRGIL — Connector Registry
 *
 * Single source of truth for every external API integration.
 * Each entry declares the env vars required, the category, the display name,
 * and whether the key is currently configured.
 *
 * This registry drives:
 *   - The settings/keys status page (✅ / ❌ / ⚠️)
 *   - Runtime guard checks before connector calls
 *   - Future connector health-check pings
 */

export type ConnectorStatus = "configured" | "missing" | "untested";
export type ConnectorCategory =
  | "critical"
  | "llm"
  | "voice"
  | "calendar_email"
  | "communication"
  | "payments_finance"
  | "storage"
  | "search"
  | "code_dev"
  | "crm_business"
  | "maps_travel"
  | "real_estate"
  | "trading_finance"
  | "monitoring_security";

export interface ConnectorDef {
  id: string;
  name: string;
  category: ConnectorCategory;
  envVars: string[];
  description: string;
  docsUrl?: string;
  /** True when all envVars are non-empty in process.env. */
  configured: boolean;
}

function allSet(keys: string[]): boolean {
  return keys.every((k) => !!process.env[k]);
}

export const CONNECTOR_REGISTRY: ConnectorDef[] = [
  // ── CRITICAL ─────────────────────────────────────────────────────────────
  {
    id: "supabase_db",
    name: "Supabase (Database)",
    category: "critical",
    envVars: ["DATABASE_URL"],
    description: "Postgres connection. Required for all data operations.",
    docsUrl: "https://supabase.com/docs/guides/database/connecting-to-postgres",
    configured: allSet(["DATABASE_URL"]),
  },
  {
    id: "nextauth",
    name: "NextAuth",
    category: "critical",
    envVars: ["NEXTAUTH_SECRET", "NEXTAUTH_URL"],
    description: "Authentication. Required for all session-gated routes.",
    configured: allSet(["NEXTAUTH_SECRET", "NEXTAUTH_URL"]),
  },
  {
    id: "encryption",
    name: "Encryption Key",
    category: "critical",
    envVars: ["ENCRYPTION_KEY"],
    description: "AES-256-GCM master key. Required for memory encryption.",
    configured: allSet(["ENCRYPTION_KEY"]),
  },
  {
    id: "owner_creds",
    name: "Owner Identity",
    category: "critical",
    envVars: ["VIRGIL_OWNER_EMAIL", "VIRGIL_OWNER_PASSWORD"],
    description: "Owner login credentials.",
    configured: allSet(["VIRGIL_OWNER_EMAIL", "VIRGIL_OWNER_PASSWORD"]),
  },

  // ── LLM PROVIDERS ─────────────────────────────────────────────────────────
  {
    id: "openai",
    name: "OpenAI",
    category: "llm",
    envVars: ["OPENAI_API_KEY"],
    description: "GPT-4o, o1, embeddings.",
    docsUrl: "https://platform.openai.com/api-keys",
    configured: allSet(["OPENAI_API_KEY"]),
  },
  {
    id: "anthropic",
    name: "Anthropic",
    category: "llm",
    envVars: ["ANTHROPIC_API_KEY"],
    description: "Claude 3.5 Sonnet / Opus.",
    docsUrl: "https://console.anthropic.com/settings/keys",
    configured: allSet(["ANTHROPIC_API_KEY"]),
  },
  {
    id: "google_ai",
    name: "Google Gemini",
    category: "llm",
    envVars: ["GOOGLE_GENERATIVE_AI_API_KEY"],
    description: "Gemini 2.0 Flash / Pro.",
    docsUrl: "https://aistudio.google.com/app/apikey",
    configured: allSet(["GOOGLE_GENERATIVE_AI_API_KEY"]),
  },
  {
    id: "groq",
    name: "Groq",
    category: "llm",
    envVars: ["GROQ_API_KEY"],
    description: "Fast inference (Llama, Mixtral) for low-latency tasks.",
    docsUrl: "https://console.groq.com/keys",
    configured: allSet(["GROQ_API_KEY"]),
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    category: "llm",
    envVars: ["XAI_API_KEY"],
    description: "Grok-2.",
    docsUrl: "https://x.ai/api",
    configured: allSet(["XAI_API_KEY"]),
  },

  // ── VOICE ─────────────────────────────────────────────────────────────────
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    category: "voice",
    envVars: ["ELEVENLABS_API_KEY"],
    description: "Text-to-speech synthesis.",
    docsUrl: "https://elevenlabs.io/",
    configured: allSet(["ELEVENLABS_API_KEY"]),
  },
  {
    id: "deepgram",
    name: "Deepgram",
    category: "voice",
    envVars: ["DEEPGRAM_API_KEY"],
    description: "Speech-to-text transcription.",
    docsUrl: "https://console.deepgram.com/",
    configured: allSet(["DEEPGRAM_API_KEY"]),
  },

  // ── CALENDAR & EMAIL ──────────────────────────────────────────────────────
  {
    id: "google_workspace",
    name: "Google Workspace",
    category: "calendar_email",
    envVars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"],
    description: "Gmail, Google Calendar, Google Drive.",
    docsUrl: "https://console.cloud.google.com/",
    configured: allSet(["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]),
  },
  {
    id: "microsoft_365",
    name: "Microsoft 365",
    category: "calendar_email",
    envVars: ["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID"],
    description: "Outlook, Teams, OneDrive.",
    docsUrl: "https://portal.azure.com/",
    configured: allSet(["MICROSOFT_CLIENT_ID", "MICROSOFT_CLIENT_SECRET", "MICROSOFT_TENANT_ID"]),
  },

  // ── COMMUNICATION ─────────────────────────────────────────────────────────
  {
    id: "twilio",
    name: "Twilio",
    category: "communication",
    envVars: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    description: "SMS and voice calls.",
    docsUrl: "https://console.twilio.com/",
    configured: allSet(["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]),
  },
  {
    id: "resend",
    name: "Resend",
    category: "communication",
    envVars: ["RESEND_API_KEY"],
    description: "Transactional email.",
    docsUrl: "https://resend.com/api-keys",
    configured: allSet(["RESEND_API_KEY"]),
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    category: "communication",
    envVars: ["SENDGRID_API_KEY"],
    description: "Email marketing and transactional.",
    docsUrl: "https://app.sendgrid.com/settings/api_keys",
    configured: allSet(["SENDGRID_API_KEY"]),
  },
  {
    id: "slack",
    name: "Slack",
    category: "communication",
    envVars: ["SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET"],
    description: "Slack messaging and notifications.",
    docsUrl: "https://api.slack.com/apps",
    configured: allSet(["SLACK_BOT_TOKEN"]),
  },

  // ── PAYMENTS & FINANCE ────────────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    category: "payments_finance",
    envVars: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    description: "Payment processing, invoicing, subscriptions.",
    docsUrl: "https://dashboard.stripe.com/apikeys",
    configured: allSet(["STRIPE_SECRET_KEY"]),
  },
  {
    id: "plaid",
    name: "Plaid",
    category: "payments_finance",
    envVars: ["PLAID_CLIENT_ID", "PLAID_SECRET"],
    description: "Bank account linking, transaction data.",
    docsUrl: "https://dashboard.plaid.com/developers/keys",
    configured: allSet(["PLAID_CLIENT_ID", "PLAID_SECRET"]),
  },

  // ── STORAGE ───────────────────────────────────────────────────────────────
  {
    id: "supabase_storage",
    name: "Supabase Storage",
    category: "storage",
    envVars: ["SUPABASE_SERVICE_ROLE_KEY"],
    description: "File storage, private buckets.",
    configured: allSet(["SUPABASE_SERVICE_ROLE_KEY"]),
  },
  {
    id: "aws_s3",
    name: "AWS S3",
    category: "storage",
    envVars: ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_S3_BUCKET"],
    description: "Object storage, backups.",
    docsUrl: "https://console.aws.amazon.com/iam/",
    configured: allSet(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"]),
  },
  {
    id: "cloudflare_r2",
    name: "Cloudflare R2",
    category: "storage",
    envVars: ["CLOUDFLARE_R2_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_KEY", "CLOUDFLARE_R2_BUCKET"],
    description: "S3-compatible object storage, zero egress.",
    docsUrl: "https://dash.cloudflare.com/r2",
    configured: allSet(["CLOUDFLARE_R2_ACCESS_KEY", "CLOUDFLARE_R2_SECRET_KEY"]),
  },

  // ── SEARCH & KNOWLEDGE ────────────────────────────────────────────────────
  {
    id: "perplexity",
    name: "Perplexity",
    category: "search",
    envVars: ["PERPLEXITY_API_KEY"],
    description: "Real-time web search and research.",
    docsUrl: "https://docs.perplexity.ai/",
    configured: allSet(["PERPLEXITY_API_KEY"]),
  },
  {
    id: "tavily",
    name: "Tavily",
    category: "search",
    envVars: ["TAVILY_API_KEY"],
    description: "AI-optimized web search for agents.",
    docsUrl: "https://tavily.com/",
    configured: allSet(["TAVILY_API_KEY"]),
  },
  {
    id: "exa",
    name: "Exa",
    category: "search",
    envVars: ["EXA_API_KEY"],
    description: "Semantic web search.",
    docsUrl: "https://exa.ai/",
    configured: allSet(["EXA_API_KEY"]),
  },
  {
    id: "serper",
    name: "Serper",
    category: "search",
    envVars: ["SERPER_API_KEY"],
    description: "Google search results API.",
    docsUrl: "https://serper.dev/",
    configured: allSet(["SERPER_API_KEY"]),
  },

  // ── CODE & DEV TOOLS ──────────────────────────────────────────────────────
  {
    id: "github",
    name: "GitHub",
    category: "code_dev",
    envVars: ["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY", "GITHUB_INSTALLATION_ID"],
    description: "Repos, PRs, issues, code review.",
    docsUrl: "https://github.com/settings/apps",
    configured: allSet(["GITHUB_APP_ID", "GITHUB_APP_PRIVATE_KEY"]),
  },
  {
    id: "linear",
    name: "Linear",
    category: "code_dev",
    envVars: ["LINEAR_API_KEY"],
    description: "Project and issue tracking.",
    docsUrl: "https://linear.app/settings/api",
    configured: allSet(["LINEAR_API_KEY"]),
  },
  {
    id: "notion",
    name: "Notion",
    category: "code_dev",
    envVars: ["NOTION_API_KEY"],
    description: "Docs, databases, wikis.",
    docsUrl: "https://www.notion.so/my-integrations",
    configured: allSet(["NOTION_API_KEY"]),
  },

  // ── CRM & BUSINESS ────────────────────────────────────────────────────────
  {
    id: "airtable",
    name: "Airtable",
    category: "crm_business",
    envVars: ["AIRTABLE_API_KEY", "AIRTABLE_BASE_ID"],
    description: "Flexible database / CRM.",
    docsUrl: "https://airtable.com/account",
    configured: allSet(["AIRTABLE_API_KEY"]),
  },
  {
    id: "hubspot",
    name: "HubSpot",
    category: "crm_business",
    envVars: ["HUBSPOT_API_KEY"],
    description: "CRM, deals, contacts, marketing.",
    docsUrl: "https://app.hubspot.com/profile-preferences/integrations",
    configured: allSet(["HUBSPOT_API_KEY"]),
  },

  // ── MAPS & TRAVEL ─────────────────────────────────────────────────────────
  {
    id: "google_maps",
    name: "Google Maps",
    category: "maps_travel",
    envVars: ["GOOGLE_MAPS_API_KEY"],
    description: "Geocoding, directions, places.",
    docsUrl: "https://console.cloud.google.com/",
    configured: allSet(["GOOGLE_MAPS_API_KEY"]),
  },
  {
    id: "amadeus",
    name: "Amadeus",
    category: "maps_travel",
    envVars: ["AMADEUS_API_KEY", "AMADEUS_API_SECRET"],
    description: "Flight and hotel search.",
    docsUrl: "https://developers.amadeus.com/",
    configured: allSet(["AMADEUS_API_KEY", "AMADEUS_API_SECRET"]),
  },

  // ── REAL ESTATE ───────────────────────────────────────────────────────────
  {
    id: "attom",
    name: "ATTOM",
    category: "real_estate",
    envVars: ["ATTOM_API_KEY"],
    description: "Property data, valuations, ownership.",
    docsUrl: "https://api.attomdata.com/",
    configured: allSet(["ATTOM_API_KEY"]),
  },

  // ── TRADING & FINANCIAL DATA ──────────────────────────────────────────────
  {
    id: "alpaca",
    name: "Alpaca",
    category: "trading_finance",
    envVars: ["ALPACA_API_KEY", "ALPACA_API_SECRET"],
    description: "Stock trading, paper and live.",
    docsUrl: "https://app.alpaca.markets/paper/dashboard/overview",
    configured: allSet(["ALPACA_API_KEY", "ALPACA_API_SECRET"]),
  },
  {
    id: "polygon",
    name: "Polygon.io",
    category: "trading_finance",
    envVars: ["POLYGON_API_KEY"],
    description: "Real-time and historical market data.",
    docsUrl: "https://polygon.io/dashboard/api-keys",
    configured: allSet(["POLYGON_API_KEY"]),
  },
  {
    id: "alpha_vantage",
    name: "Alpha Vantage",
    category: "trading_finance",
    envVars: ["ALPHA_VANTAGE_API_KEY"],
    description: "Stock, forex, crypto data.",
    docsUrl: "https://www.alphavantage.co/support/#api-key",
    configured: allSet(["ALPHA_VANTAGE_API_KEY"]),
  },
  {
    id: "coinbase",
    name: "Coinbase Advanced",
    category: "trading_finance",
    envVars: ["COINBASE_API_KEY", "COINBASE_API_SECRET"],
    description: "Crypto trading and portfolio.",
    docsUrl: "https://www.coinbase.com/settings/api",
    configured: allSet(["COINBASE_API_KEY", "COINBASE_API_SECRET"]),
  },

  // ── MONITORING & SECURITY ─────────────────────────────────────────────────
  {
    id: "sentry",
    name: "Sentry",
    category: "monitoring_security",
    envVars: ["SENTRY_DSN"],
    description: "Error tracking and performance monitoring.",
    docsUrl: "https://sentry.io/settings/",
    configured: allSet(["SENTRY_DSN"]),
  },
  {
    id: "upstash_redis",
    name: "Upstash Redis",
    category: "monitoring_security",
    envVars: ["UPSTASH_REDIS_URL", "UPSTASH_REDIS_TOKEN"],
    description: "Rate limiting, caching, session storage.",
    docsUrl: "https://console.upstash.com/",
    configured: allSet(["UPSTASH_REDIS_URL", "UPSTASH_REDIS_TOKEN"]),
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    category: "monitoring_security",
    envVars: ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"],
    description: "DNS, WAF, CDN, access rules.",
    docsUrl: "https://dash.cloudflare.com/profile/api-tokens",
    configured: allSet(["CLOUDFLARE_API_TOKEN"]),
  },
];

export const CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  critical:           "Critical — App Will Not Start Without These",
  llm:                "LLM Providers",
  voice:              "Voice (TTS / STT)",
  calendar_email:     "Calendar & Email",
  communication:      "Communication",
  payments_finance:   "Payments & Finance",
  storage:            "Storage",
  search:             "Search & Knowledge",
  code_dev:           "Code & Developer Tools",
  crm_business:       "CRM & Business",
  maps_travel:        "Maps & Travel",
  real_estate:        "Real Estate",
  trading_finance:    "Trading & Financial Data",
  monitoring_security:"Monitoring & Security",
};

export const CATEGORY_ORDER: ConnectorCategory[] = [
  "critical",
  "llm",
  "voice",
  "calendar_email",
  "communication",
  "payments_finance",
  "storage",
  "search",
  "code_dev",
  "crm_business",
  "maps_travel",
  "real_estate",
  "trading_finance",
  "monitoring_security",
];
