# VIRGIL — Full API Inventory (240 integrations)

Master reference. Every API Virgil will connect to, organized by domain,
with access class, sensitivity tier, auth method, provider docs, and phase.

---

## Access classes

| Class | Meaning |
|-------|---------|
| **READ** | Virgil can pull data. No approval needed. |
| **DRAFT/STAGE** | Virgil prepares action in the approval queue. Does not execute. |
| **EXECUTE** | Virgil acts. **Always requires Rosser approval.** No exceptions. |

---

## Sensitivity tiers

| Tier | Cloud routing |
|------|---------------|
| `PUBLIC` | Cloud OK |
| `BUSINESS_INTERNAL` | Cloud OK with redaction |
| `BUSINESS_CONFIDENTIAL` | Cloud OK with heavy redaction |
| `PERSONAL_PRIVATE` | Local preferred, cloud with redaction |
| `PERSONAL_SACRED` | Local only, never cloud |
| `SECURITY_SECRET` | Local only, never cloud |
| `OWNER_ONLY` | Local only, owner eyes only, never cloud |

---

## Category 1 — Identity, Permissions & Security (1–15)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 1 | OAuth 2.0 / OIDC | Protocol | R | SECURITY_SECRET | — | 1 | [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749) |
| 2 | WebAuthn / Passkeys | W3C | R/W | SECURITY_SECRET | — | 1 | [webauthn.io](https://webauthn.io) |
| 3 | Apple Sign In | Apple | R | SECURITY_SECRET | OAuth | 2 | [Apple Dev](https://developer.apple.com/sign-in-with-apple/) |
| 4 | Google OAuth | Google | R | SECURITY_SECRET | OAuth | 1 | [Google Identity](https://developers.google.com/identity) |
| 5 | Microsoft Entra ID | Microsoft | R | SECURITY_SECRET | OAuth | 3 | [MS Entra](https://learn.microsoft.com/en-us/entra/) |
| 6 | Supabase Auth | Supabase | R/W | SECURITY_SECRET | API key | 1 | [Supabase Auth](https://supabase.com/docs/guides/auth) |
| 7 | YubiKey / FIDO2 | Yubico | R | SECURITY_SECRET | USB/NFC | 2 | [Yubico Dev](https://developers.yubico.com/) |
| 8 | 1Password Connect | 1Password | R | SECURITY_SECRET | Token | 2 | [1P Connect](https://developer.1password.com/docs/connect/) |
| 9 | Bitwarden Secrets | Bitwarden | R | SECURITY_SECRET | Token | 3 | [BW Secrets](https://bitwarden.com/help/secrets-manager/) |
| 10 | Device fingerprinting | FingerprintJS | R | SECURITY_SECRET | API key | 1 | [FingerprintJS](https://fingerprint.com/developers/) |
| 11 | IP allowlist / geofencing | Cloudflare | R | SECURITY_SECRET | API token | 1 | [CF Access](https://developers.cloudflare.com/cloudflare-one/) |
| 12 | Audit log API | Internal | R/W | OWNER_ONLY | Internal | 1 | Internal |
| 13 | AWS Secrets Manager | AWS | R/W | SECURITY_SECRET | IAM | 2 | [AWS SM](https://docs.aws.amazon.com/secretsmanager/) |
| 14 | Doppler | Doppler | R | SECURITY_SECRET | Token | 3 | [Doppler](https://docs.doppler.com/) |
| 15 | Session management | NextAuth | R/W | SECURITY_SECRET | Internal | 1 | [NextAuth](https://next-auth.js.org/) |

---

## Category 2 — Email, Calendar, Documents & Contacts (16–40)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 16 | Gmail API | Google | R/D/E | PERSONAL_PRIVATE | OAuth | 1 | [Gmail API](https://developers.google.com/gmail/api) |
| 17 | Google Calendar | Google | R/D/E | PERSONAL_PRIVATE | OAuth | 1 | [Calendar API](https://developers.google.com/calendar) |
| 18 | Google Drive | Google | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 1 | [Drive API](https://developers.google.com/drive) |
| 19 | Google Docs | Google | R/D | BUSINESS_CONFIDENTIAL | OAuth | 1 | [Docs API](https://developers.google.com/docs) |
| 20 | Google Sheets | Google | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 1 | [Sheets API](https://developers.google.com/sheets) |
| 21 | Google Slides | Google | R/D | BUSINESS_INTERNAL | OAuth | 2 | [Slides API](https://developers.google.com/slides) |
| 22 | Google People / Contacts | Google | R | PERSONAL_PRIVATE | OAuth | 1 | [People API](https://developers.google.com/people) |
| 23 | Google Tasks | Google | R/D/E | PERSONAL_PRIVATE | OAuth | 2 | [Tasks API](https://developers.google.com/tasks) |
| 24 | Google Chat | Google | R/D | BUSINESS_INTERNAL | OAuth | 3 | [Chat API](https://developers.google.com/chat) |
| 25 | Google Meet transcripts | Google | R | BUSINESS_CONFIDENTIAL | OAuth | 3 | [Meet REST](https://developers.google.com/meet) |
| 26 | Microsoft Graph Mail | Microsoft | R/D/E | PERSONAL_PRIVATE | OAuth | 3 | [Graph Mail](https://learn.microsoft.com/en-us/graph/api/resources/mail-api-overview) |
| 27 | Microsoft Graph Calendar | Microsoft | R/D/E | PERSONAL_PRIVATE | OAuth | 3 | [Graph Cal](https://learn.microsoft.com/en-us/graph/api/resources/calendar) |
| 28 | Microsoft Graph Contacts | Microsoft | R | PERSONAL_PRIVATE | OAuth | 3 | [Graph Contacts](https://learn.microsoft.com/en-us/graph/api/resources/contact) |
| 29 | Microsoft OneDrive | Microsoft | R/D | BUSINESS_CONFIDENTIAL | OAuth | 3 | [Graph Drive](https://learn.microsoft.com/en-us/graph/api/resources/onedrive) |
| 30 | Microsoft SharePoint | Microsoft | R | BUSINESS_CONFIDENTIAL | OAuth | 4 | [Graph SP](https://learn.microsoft.com/en-us/graph/api/resources/sharepoint) |
| 31 | Microsoft Teams | Microsoft | R/D | BUSINESS_INTERNAL | OAuth | 3 | [Teams API](https://learn.microsoft.com/en-us/graph/api/resources/teams-api-overview) |
| 32 | Microsoft To Do | Microsoft | R/D | PERSONAL_PRIVATE | OAuth | 3 | [To Do API](https://learn.microsoft.com/en-us/graph/api/resources/todo-overview) |
| 33 | Microsoft Planner | Microsoft | R/D | BUSINESS_INTERNAL | OAuth | 4 | [Planner](https://learn.microsoft.com/en-us/graph/api/resources/planner-overview) |
| 34 | Dropbox | Dropbox | R/D | BUSINESS_CONFIDENTIAL | OAuth | 3 | [Dropbox API](https://www.dropbox.com/developers) |
| 35 | Box | Box | R/D | BUSINESS_CONFIDENTIAL | OAuth | 4 | [Box Dev](https://developer.box.com/) |
| 36 | iCloud Calendar / CalDAV | Apple | R | PERSONAL_PRIVATE | App-specific pw | 3 | [CalDAV](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/CloudKitWebServicesReference/) |
| 37 | iCloud Contacts / CardDAV | Apple | R | PERSONAL_PRIVATE | App-specific pw | 3 | [CardDAV](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/CloudKitWebServicesReference/) |
| 38 | Apple EventKit | Apple | R | PERSONAL_PRIVATE | Native bridge | 4 | [EventKit](https://developer.apple.com/documentation/eventkit) |
| 39 | Apple Reminders | Apple | R | PERSONAL_PRIVATE | Native bridge | 4 | [EventKit](https://developer.apple.com/documentation/eventkit) |
| 40 | Local file indexer | Custom | R | OWNER_ONLY | Local | 4 | Internal |

---

## Category 3 — Messaging & Calls (41–60)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 41 | Twilio SMS | Twilio | R/D/E | PERSONAL_PRIVATE | API key | 1 | [Twilio Messaging](https://www.twilio.com/docs/messaging) |
| 42 | Twilio Voice | Twilio | R/D/E | PERSONAL_SACRED | API key | 2 | [Twilio Voice](https://www.twilio.com/docs/voice) |
| 43 | Twilio WhatsApp | Twilio | R/D/E | PERSONAL_PRIVATE | API key | 2 | [Twilio WA](https://www.twilio.com/docs/whatsapp) |
| 44 | Twilio Conversations | Twilio | R/D | PERSONAL_PRIVATE | API key | 2 | [Conversations](https://www.twilio.com/docs/conversations) |
| 45 | SendGrid email delivery | Twilio | D/E | BUSINESS_INTERNAL | API key | 2 | [SendGrid](https://docs.sendgrid.com/) |
| 46 | WhatsApp Business Cloud | Meta | R/D/E | PERSONAL_PRIVATE | Bearer | 2 | [WA Cloud](https://developers.facebook.com/docs/whatsapp/cloud-api) |
| 47 | Telegram Bot | Telegram | R/D/E | PERSONAL_PRIVATE | Bot token | 3 | [Telegram Bot](https://core.telegram.org/bots/api) |
| 48 | Discord | Discord | R/D | PERSONAL_PRIVATE | OAuth/Bot | 3 | [Discord Dev](https://discord.com/developers) |
| 49 | Slack | Slack | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 1 | [Slack API](https://api.slack.com/) |
| 50 | Signal bridge | Signal/Unofficial | R/D | PERSONAL_SACRED | Local | 4 | [signal-cli](https://github.com/AsamK/signal-cli) |
| 51 | Apple Messages bridge | Custom | R/D | PERSONAL_SACRED | Mac relay | 5 | Requires local Mac |
| 52 | iOS Shortcuts bridge | Apple | R/E | PERSONAL_PRIVATE | HTTP/x-callback | 2 | [Shortcuts](https://support.apple.com/guide/shortcuts/welcome/ios) |
| 53 | Android SMS/RCS bridge | Custom | R/D | PERSONAL_PRIVATE | Local | 5 | Requires Android bridge |
| 54 | Zoom | Zoom | R/D/E | BUSINESS_INTERNAL | OAuth | 2 | [Zoom API](https://developers.zoom.us/) |
| 55 | Google Meet | Google | R | BUSINESS_INTERNAL | OAuth | 3 | [Meet API](https://developers.google.com/meet) |
| 56 | Teams calling | Microsoft | R/D | BUSINESS_INTERNAL | OAuth | 4 | [Teams API](https://learn.microsoft.com/en-us/graph/api/resources/call) |
| 57 | Calendly | Calendly | R/D | PERSONAL_PRIVATE | OAuth | 2 | [Calendly API](https://developer.calendly.com/) |
| 58 | OpenPhone | OpenPhone | R/D | BUSINESS_INTERNAL | API key | 3 | [OpenPhone](https://www.openphone.com/docs) |
| 59 | Aircall | Aircall | R/D | BUSINESS_INTERNAL | OAuth | 4 | [Aircall Dev](https://developer.aircall.io/) |
| 60 | RingCentral | RingCentral | R/D | BUSINESS_INTERNAL | OAuth | 4 | [RC Dev](https://developers.ringcentral.com/) |

---

## Category 4 — Money, Banking, Cards & Accounting (61–90)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 61 | Plaid Auth | Plaid | R | OWNER_ONLY | API key | 1 | [Plaid](https://plaid.com/docs/) |
| 62 | Plaid Transactions | Plaid | R | OWNER_ONLY | API key | 1 | [Plaid Tx](https://plaid.com/docs/api/products/transactions/) |
| 63 | Plaid Balance | Plaid | R | OWNER_ONLY | API key | 1 | [Plaid Bal](https://plaid.com/docs/api/products/balance/) |
| 64 | Plaid Identity | Plaid | R | OWNER_ONLY | API key | 2 | [Plaid ID](https://plaid.com/docs/api/products/identity/) |
| 65 | Plaid Investments | Plaid | R | OWNER_ONLY | API key | 2 | [Plaid Inv](https://plaid.com/docs/api/products/investments/) |
| 66 | Plaid Liabilities | Plaid | R | OWNER_ONLY | API key | 2 | [Plaid Liab](https://plaid.com/docs/api/products/liabilities/) |
| 67 | MX | MX | R | OWNER_ONLY | API key | 3 | [MX](https://docs.mx.com/) |
| 68 | Finicity / Mastercard OB | Mastercard | R | OWNER_ONLY | API key | 4 | [Finicity](https://developer.mastercard.com/open-banking/) |
| 69 | Yodlee | Envestnet | R | OWNER_ONLY | API key | 4 | [Yodlee](https://developer.yodlee.com/) |
| 70 | Stripe Payments | Stripe | R/D/E | BUSINESS_CONFIDENTIAL | API key | 1 | [Stripe](https://docs.stripe.com/api) |
| 71 | Stripe Billing | Stripe | R/D/E | BUSINESS_CONFIDENTIAL | API key | 1 | [Billing](https://docs.stripe.com/billing) |
| 72 | Stripe Invoicing | Stripe | R/D/E | BUSINESS_CONFIDENTIAL | API key | 1 | [Invoicing](https://docs.stripe.com/invoicing) |
| 73 | Stripe Treasury | Stripe | R/D/E | OWNER_ONLY | API key | 3 | [Treasury](https://docs.stripe.com/treasury) |
| 74 | Stripe Issuing | Stripe | R/D/E | OWNER_ONLY | API key | 3 | [Issuing](https://docs.stripe.com/issuing) |
| 75 | Stripe Tax | Stripe | R | BUSINESS_CONFIDENTIAL | API key | 2 | [Tax](https://docs.stripe.com/tax) |
| 76 | Wise | Wise | R/D/E | OWNER_ONLY | API key | 2 | [Wise API](https://api-docs.transferwise.com/) |
| 77 | Mercury | Mercury | R/D/E | OWNER_ONLY | API key | 1 | [Mercury](https://docs.mercury.com/) |
| 78 | Brex | Brex | R/D | OWNER_ONLY | API key | 3 | [Brex Dev](https://developer.brex.com/) |
| 79 | Ramp | Ramp | R/D | OWNER_ONLY | API key | 3 | [Ramp](https://docs.ramp.com/) |
| 80 | Amex data export | Amex | R | OWNER_ONLY | Scrape/CSV | 4 | Manual |
| 81 | Chase bank data | Chase/Plaid | R | OWNER_ONLY | Aggregator | 2 | Via Plaid |
| 82 | QuickBooks Online | Intuit | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 1 | [QBO API](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities) |
| 83 | Xero | Xero | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 2 | [Xero Dev](https://developer.xero.com/) |
| 84 | FreshBooks | FreshBooks | R/D | BUSINESS_CONFIDENTIAL | OAuth | 3 | [FreshBooks](https://www.freshbooks.com/api) |
| 85 | Gusto payroll | Gusto | R/D/E | OWNER_ONLY | OAuth | 3 | [Gusto Dev](https://docs.gusto.com/) |
| 86 | Deel | Deel | R/D | BUSINESS_CONFIDENTIAL | API key | 4 | [Deel API](https://developer.deel.com/) |
| 87 | Rippling | Rippling | R/D | BUSINESS_CONFIDENTIAL | OAuth | 4 | [Rippling](https://developer.rippling.com/) |
| 88 | Carta | Carta | R | OWNER_ONLY | OAuth | 4 | [Carta Dev](https://carta.com/) |
| 89 | AngelList / fund admin | AngelList | R | OWNER_ONLY | API key | 5 | [AngelList](https://www.angellist.com/) |
| 90 | DocuSign payment hooks | DocuSign | R/D | BUSINESS_CONFIDENTIAL | OAuth | 3 | [DocuSign](https://developers.docusign.com/) |

---

## Category 5 — Trading, Brokerage & Market Data (91–110)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 91 | Interactive Brokers | IBKR | R/D/E | OWNER_ONLY | TWS/Gateway | 2 | [IBKR API](https://ibkrcampus.com/campus/ibkr-api-page/) |
| 92 | Schwab | Schwab | R/D | OWNER_ONLY | OAuth | 3 | [Schwab Dev](https://developer.schwab.com/) |
| 93 | Tradier | Tradier | R/D/E | OWNER_ONLY | OAuth | 2 | [Tradier](https://documentation.tradier.com/) |
| 94 | Alpaca | Alpaca | R/D/E | OWNER_ONLY | API key | 1 | [Alpaca](https://alpaca.markets/docs/api-references/) |
| 95 | Polygon.io | Polygon | R | BUSINESS_INTERNAL | API key | 1 | [Polygon](https://polygon.io/docs) |
| 96 | ThetaData | ThetaData | R | BUSINESS_INTERNAL | API key | 2 | [ThetaData](https://www.thetadata.net/) |
| 97 | ORATS | ORATS | R | BUSINESS_INTERNAL | API key | 2 | [ORATS](https://docs.orats.io/) |
| 98 | Tradier options chain | Tradier | R | BUSINESS_INTERNAL | OAuth | 2 | [Tradier](https://documentation.tradier.com/) |
| 99 | Cboe data | Cboe | R | BUSINESS_INTERNAL | API key | 3 | [Cboe](https://www.cboe.com/data/) |
| 100 | Nasdaq Data Link | Nasdaq | R | BUSINESS_INTERNAL | API key | 3 | [Nasdaq](https://data.nasdaq.com/) |
| 101 | Intrinio | Intrinio | R | BUSINESS_INTERNAL | API key | 3 | [Intrinio](https://docs.intrinio.com/) |
| 102 | Tiingo | Tiingo | R | BUSINESS_INTERNAL | API key | 2 | [Tiingo](https://api.tiingo.com/) |
| 103 | Twelve Data | Twelve Data | R | BUSINESS_INTERNAL | API key | 3 | [TwelveData](https://twelvedata.com/docs) |
| 104 | Alpha Vantage | Alpha Vantage | R | PUBLIC | API key | 2 | [AV](https://www.alphavantage.co/documentation/) |
| 105 | TradingView webhooks | TradingView | R | BUSINESS_INTERNAL | Webhook | 3 | [TV Alerts](https://www.tradingview.com/support/solutions/43000529348/) |
| 106 | Thinkorswim export | Schwab | R | OWNER_ONLY | File import | 4 | Manual |
| 107 | QuantConnect | QuantConnect | R/D | BUSINESS_INTERNAL | API key | 3 | [QC API](https://www.quantconnect.com/docs/v2/) |
| 108 | AWS/GCP dataset storage | AWS/GCP | R/W | BUSINESS_INTERNAL | IAM | 2 | [S3](https://docs.aws.amazon.com/s3/) |
| 109 | SPX options backtester | Custom | R/D | OWNER_ONLY | Internal | 3 | Internal (Redentor) |
| 110 | Redentor Fund ledger | Custom | R | OWNER_ONLY | Internal | 3 | Internal |

---

## Category 6 — Health, Sleep, Fitness & Food (111–125)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 111 | Apple HealthKit | Apple | R | PERSONAL_SACRED | Native bridge | 2 | [HealthKit](https://developer.apple.com/documentation/healthkit) |
| 112 | Apple WorkoutKit | Apple | R | PERSONAL_SACRED | Native bridge | 3 | [WorkoutKit](https://developer.apple.com/documentation/workoutkit) |
| 113 | Oura | Oura | R | PERSONAL_PRIVATE | OAuth | 2 | [Oura API](https://cloud.ouraring.com/docs/) |
| 114 | Fitbit | Google | R | PERSONAL_PRIVATE | OAuth | 3 | [Fitbit API](https://dev.fitbit.com/) |
| 115 | Garmin Health | Garmin | R | PERSONAL_PRIVATE | OAuth | 4 | [Garmin Dev](https://developer.garmin.com/) |
| 116 | Whoop | Whoop | R | PERSONAL_PRIVATE | OAuth | 2 | [Whoop Dev](https://developer.whoop.com/) |
| 117 | Withings | Withings | R | PERSONAL_PRIVATE | OAuth | 3 | [Withings API](https://developer.withings.com/) |
| 118 | MyFitnessPal import | MFP | R | PERSONAL_PRIVATE | CSV/Export | 3 | Manual |
| 119 | Cronometer | Cronometer | R | PERSONAL_PRIVATE | Export | 3 | [Cronometer](https://cronometer.com/) |
| 120 | Sleep Cycle export | Sleep Cycle | R | PERSONAL_PRIVATE | Export | 3 | Manual |
| 121 | Dexcom CGM | Dexcom | R | PERSONAL_SACRED | OAuth | 4 | [Dexcom Dev](https://developer.dexcom.com/) |
| 122 | Labcorp / Quest data | Labcorp | R | PERSONAL_SACRED | Portal parse | 5 | Manual |
| 123 | Pharmacy APIs | Various | R | PERSONAL_SACRED | Varies | 5 | Varies |
| 124 | Medication reminders | Custom | R/W | PERSONAL_SACRED | Internal | 3 | Internal |
| 125 | Sobriety / journal | Custom | R/W | PERSONAL_SACRED | Internal | 2 | Internal |

---

## Category 7 — Smart Home, Location & Physical Environment (126–145)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 126 | Home Assistant REST | HA | R/D/E | PERSONAL_PRIVATE | Long-lived token | 2 | [HA REST](https://developers.home-assistant.io/docs/api/rest/) |
| 127 | Home Assistant WebSocket | HA | R | PERSONAL_PRIVATE | Token | 2 | [HA WS](https://developers.home-assistant.io/docs/api/websocket/) |
| 128 | Apple HomeKit | Apple | R/E | PERSONAL_PRIVATE | Native bridge | 4 | [HomeKit](https://developer.apple.com/homekit/) |
| 129 | Philips Hue | Signify | R/E | PERSONAL_PRIVATE | Local/Cloud | 2 | [Hue Dev](https://developers.meethue.com/) |
| 130 | Lutron | Lutron | R/E | PERSONAL_PRIVATE | Token | 3 | [Lutron](https://www.lutron.com/) |
| 131 | Sonos | Sonos | R/E | PERSONAL_PRIVATE | OAuth | 3 | [Sonos Dev](https://developer.sonos.com/) |
| 132 | Ring | Ring/Amazon | R | SECURITY_SECRET | OAuth | 3 | [Ring API](https://ring.com/) |
| 133 | Nest | Google | R/E | PERSONAL_PRIVATE | OAuth | 3 | [Nest SDM](https://developers.google.com/nest/device-access) |
| 134 | Ecobee | Ecobee | R/E | PERSONAL_PRIVATE | OAuth | 3 | [Ecobee Dev](https://www.ecobee.com/developers/) |
| 135 | UniFi Protect | Ubiquiti | R | SECURITY_SECRET | Local API | 2 | [UniFi](https://ubntwiki.com/products/software/unifi-protect) |
| 136 | UniFi Network | Ubiquiti | R | SECURITY_SECRET | Local API | 2 | [UniFi Net](https://ubntwiki.com/) |
| 137 | Eufy / Reolink cameras | Various | R | SECURITY_SECRET | Local | 4 | Varies |
| 138 | August / Yale locks | Assa Abloy | R/E | SECURITY_SECRET | OAuth | 3 | [August](https://august.com/) |
| 139 | Garage (MyQ alternative) | Ratgdo/Local | R/E | SECURITY_SECRET | Local | 4 | [ratgdo](https://github.com/PaulWieland/ratgdo) |
| 140 | Tesla Powerwall / Solar | Tesla | R | PERSONAL_PRIVATE | OAuth | 4 | [Tesla API](https://developer.tesla.com/) |
| 141 | SmartThings | Samsung | R/E | PERSONAL_PRIVATE | OAuth | 4 | [ST Dev](https://developer.smartthings.com/) |
| 142 | Shelly | Shelly | R/E | PERSONAL_PRIVATE | Local/Cloud | 3 | [Shelly Dev](https://shelly-api-docs.shelly.cloud/) |
| 143 | Aqara | Aqara | R/E | PERSONAL_PRIVATE | OAuth | 4 | [Aqara Dev](https://developer.aqara.com/) |
| 144 | Zigbee2MQTT | Custom | R/E | PERSONAL_PRIVATE | MQTT | 3 | [Z2M](https://www.zigbee2mqtt.io/) |
| 145 | Matter | CSA | R/E | PERSONAL_PRIVATE | Local | 4 | [Matter](https://csa-iot.org/all-solutions/matter/) |

---

## Category 8 — Business Operations & CRM (146–175)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 146 | HubSpot | HubSpot | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 2 | [HubSpot](https://developers.hubspot.com/) |
| 147 | Salesforce | Salesforce | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 4 | [SF Dev](https://developer.salesforce.com/) |
| 148 | Pipedrive | Pipedrive | R/D | BUSINESS_CONFIDENTIAL | API key | 3 | [Pipedrive](https://developers.pipedrive.com/) |
| 149 | Airtable | Airtable | R/D/E | BUSINESS_INTERNAL | API key | 2 | [Airtable](https://airtable.com/developers) |
| 150 | Notion | Notion | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 1 | [Notion API](https://developers.notion.com/) |
| 151 | Slack | Slack | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 1 | [Slack](https://api.slack.com/) |
| 152 | GitHub REST | GitHub | R/D/E | BUSINESS_INTERNAL | OAuth/PAT | 1 | [GH REST](https://docs.github.com/en/rest) |
| 153 | GitHub GraphQL | GitHub | R/D | BUSINESS_INTERNAL | OAuth/PAT | 1 | [GH GraphQL](https://docs.github.com/en/graphql) |
| 154 | GitHub Actions | GitHub | R/D/E | BUSINESS_INTERNAL | PAT | 1 | [GH Actions](https://docs.github.com/en/rest/actions) |
| 155 | Linear | Linear | R/D/E | BUSINESS_INTERNAL | OAuth | 1 | [Linear API](https://developers.linear.app/) |
| 156 | Jira | Atlassian | R/D | BUSINESS_INTERNAL | OAuth | 3 | [Jira API](https://developer.atlassian.com/cloud/jira/platform/) |
| 157 | Asana | Asana | R/D | BUSINESS_INTERNAL | OAuth | 3 | [Asana Dev](https://developers.asana.com/) |
| 158 | Trello | Atlassian | R/D | BUSINESS_INTERNAL | API key | 4 | [Trello](https://developer.atlassian.com/cloud/trello/) |
| 159 | ClickUp | ClickUp | R/D | BUSINESS_INTERNAL | API key | 4 | [ClickUp](https://clickup.com/api) |
| 160 | Monday.com | Monday | R/D | BUSINESS_INTERNAL | API key | 4 | [Monday](https://developer.monday.com/) |
| 161 | Vercel | Vercel | R/D/E | BUSINESS_INTERNAL | Token | 1 | [Vercel API](https://vercel.com/docs/rest-api) |
| 162 | Netlify | Netlify | R/D | BUSINESS_INTERNAL | PAT | 4 | [Netlify](https://docs.netlify.com/api/) |
| 163 | Cloudflare | Cloudflare | R/D/E | SECURITY_SECRET | API token | 1 | [CF API](https://developers.cloudflare.com/api/) |
| 164 | Supabase Management | Supabase | R/D/E | SECURITY_SECRET | API key | 1 | [Supabase](https://supabase.com/docs/reference) |
| 165 | Firebase | Google | R/D | BUSINESS_INTERNAL | Service acct | 4 | [Firebase](https://firebase.google.com/docs/reference) |
| 166 | Postgres direct | Self | R/W | OWNER_ONLY | Conn string | 1 | [Prisma](https://www.prisma.io/docs) |
| 167 | Prisma admin layer | Prisma | R/W | OWNER_ONLY | Internal | 1 | Internal |
| 168 | Sentry | Sentry | R | BUSINESS_INTERNAL | API key | 1 | [Sentry API](https://docs.sentry.io/api/) |
| 169 | Datadog | Datadog | R | BUSINESS_INTERNAL | API key | 3 | [DD API](https://docs.datadoghq.com/api/) |
| 170 | PostHog | PostHog | R | BUSINESS_INTERNAL | API key | 2 | [PostHog](https://posthog.com/docs/api) |
| 171 | Segment | Twilio | R/W | BUSINESS_INTERNAL | API key | 3 | [Segment](https://segment.com/docs/) |
| 172 | Customer.io | Customer.io | R/D/E | BUSINESS_CONFIDENTIAL | API key | 3 | [CIO](https://customer.io/docs/api/) |
| 173 | Intercom | Intercom | R/D | BUSINESS_CONFIDENTIAL | OAuth | 3 | [Intercom](https://developers.intercom.com/) |
| 174 | Zendesk | Zendesk | R/D | BUSINESS_CONFIDENTIAL | OAuth | 2 | [Zendesk](https://developer.zendesk.com/) |
| 175 | Crisp / HelpScout | Crisp | R/D | BUSINESS_CONFIDENTIAL | API key | 4 | [Crisp](https://docs.crisp.chat/api/) |

---

## Category 9 — Legal, Contracts, Identity & Government (176–195)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 176 | DocuSign | DocuSign | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 2 | [DocuSign](https://developers.docusign.com/) |
| 177 | Adobe Sign | Adobe | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 3 | [Adobe Sign](https://www.adobe.com/sign/developer.html) |
| 178 | PandaDoc | PandaDoc | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 3 | [PandaDoc](https://developers.pandadoc.com/) |
| 179 | Dropbox Sign | Dropbox | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 4 | [DS API](https://developers.dropboxsign.com/) |
| 180 | Clio | Clio | R/D | BUSINESS_CONFIDENTIAL | OAuth | 3 | [Clio Dev](https://app.clio.com/api/v4/documentation) |
| 181 | LawPay | LawPay | R/D/E | BUSINESS_CONFIDENTIAL | API key | 3 | [LawPay](https://www.lawpay.com/) |
| 182 | LegalZoom entity data | LegalZoom | R | BUSINESS_CONFIDENTIAL | Portal parse | 5 | Manual |
| 183 | Stripe Identity | Stripe | R/D | PERSONAL_PRIVATE | API key | 3 | [Stripe ID](https://docs.stripe.com/identity) |
| 184 | Persona | Persona | R/D | PERSONAL_PRIVATE | API key | 3 | [Persona](https://docs.withpersona.com/) |
| 185 | Alloy | Alloy | R | PERSONAL_PRIVATE | API key | 4 | [Alloy](https://docs.alloy.com/) |
| 186 | Onfido | Onfido | R/D | PERSONAL_PRIVATE | API key | 4 | [Onfido](https://documentation.onfido.com/) |
| 187 | Middesk | Middesk | R | BUSINESS_CONFIDENTIAL | API key | 4 | [Middesk](https://docs.middesk.com/) |
| 188 | IRS / EIN workflows | IRS | R | OWNER_ONLY | Manual | 5 | Manual |
| 189 | Corporate registry APIs | Various | R | BUSINESS_CONFIDENTIAL | Varies | 5 | State-specific |
| 190 | Notarization platform | Notarize | R/D/E | BUSINESS_CONFIDENTIAL | OAuth | 4 | [Notarize](https://www.notarize.com/) |
| 191 | Secure document vault | AWS S3 + KMS | R/W | OWNER_ONLY | IAM | 1 | Internal |
| 192 | OCR / document extraction | AWS Textract | R | BUSINESS_CONFIDENTIAL | IAM | 2 | [Textract](https://docs.aws.amazon.com/textract/) |
| 193 | E-sign approval workflow | Internal | R/W | BUSINESS_CONFIDENTIAL | Internal | 2 | Internal |
| 194 | Legal deadline system | Internal | R/W | BUSINESS_CONFIDENTIAL | Internal | 3 | Internal |
| 195 | Case evidence indexer | Internal | R/W | OWNER_ONLY | Internal | 4 | Internal |

---

## Category 10 — Travel, Vehicles, Logistics (196–220)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 196 | Uber | Uber | R/D | PERSONAL_PRIVATE | OAuth | 3 | [Uber Dev](https://developer.uber.com/) |
| 197 | Lyft Business | Lyft | R/D | PERSONAL_PRIVATE | OAuth | 4 | [Lyft](https://www.lyft.com/business) |
| 198 | Google Maps | Google | R | PUBLIC | API key | 1 | [Maps API](https://developers.google.com/maps) |
| 199 | Apple MapKit | Apple | R | PUBLIC | JWT | 3 | [MapKit JS](https://developer.apple.com/maps/) |
| 200 | Waze / traffic data | Google | R | PUBLIC | API key | 4 | Via Google Maps |
| 201 | FlightAware | FlightAware | R | PERSONAL_PRIVATE | API key | 2 | [FlightAware](https://flightaware.com/commercial/aeroapi/) |
| 202 | Amadeus | Amadeus | R/D | PERSONAL_PRIVATE | API key | 3 | [Amadeus](https://developers.amadeus.com/) |
| 203 | Duffel | Duffel | R/D/E | PERSONAL_PRIVATE | API key | 3 | [Duffel](https://duffel.com/docs/api) |
| 204 | Skyscanner / RapidAPI | Various | R | PUBLIC | API key | 4 | [Skyscanner](https://developers.skyscanner.net/) |
| 205 | Delta email parser | Custom | R | PERSONAL_PRIVATE | Email parse | 4 | Internal |
| 206 | United/AA/SW parser | Custom | R | PERSONAL_PRIVATE | Email parse | 4 | Internal |
| 207 | Hotel booking APIs | Amadeus | R/D | PERSONAL_PRIVATE | API key | 4 | [Amadeus Hotels](https://developers.amadeus.com/) |
| 208 | Airbnb | Airbnb | R | PERSONAL_PRIVATE | Scrape | 5 | Limited |
| 209 | TripIt | TripIt | R | PERSONAL_PRIVATE | OAuth | 2 | [TripIt API](https://www.tripit.com/developer) |
| 210 | Kayak/Expedia | Affiliate | R | PUBLIC | Affiliate | 5 | Varies |
| 211 | Blacklane | Blacklane | R/D | PERSONAL_PRIVATE | API key | 4 | [Blacklane](https://www.blacklane.com/) |
| 212 | Private aviation quotes | Custom | R/D | PERSONAL_PRIVATE | Manual | 5 | Manual |
| 213 | Tesla API | Tesla | R/D/E | PERSONAL_PRIVATE | OAuth | 2 | [Tesla Dev](https://developer.tesla.com/) |
| 214 | Porsche Connect | Porsche | R | PERSONAL_PRIVATE | OAuth | 5 | [Porsche](https://connect.porsche.com/) |
| 215 | BMW Connected | BMW | R | PERSONAL_PRIVATE | OAuth | 5 | [BMW Dev](https://developer.bmwgroup.com/) |
| 216 | Mercedes me | Mercedes | R | PERSONAL_PRIVATE | OAuth | 5 | [MB Dev](https://developer.mercedes-benz.com/) |
| 217 | OnStar | GM | R | PERSONAL_PRIVATE | OAuth | 5 | [OnStar](https://developer.gm.com/) |
| 218 | Fuel / charging APIs | PlugShare | R | PUBLIC | API key | 3 | [PlugShare](https://www.plugshare.com/) |
| 219 | Insurance policy parser | Custom | R | OWNER_ONLY | Document parse | 4 | Internal |
| 220 | Vehicle maintenance | Custom | R/W | PERSONAL_PRIVATE | Internal | 3 | Internal |

---

## Category 11 — AI, Voice, Memory & Agent Stack (221–240)

| # | API | Provider | Access | Sensitivity | Auth | Phase | Docs |
|---|-----|----------|--------|-------------|------|-------|------|
| 221 | OpenAI | OpenAI | R/W | varies (gateway) | API key | 1 | [OpenAI](https://platform.openai.com/docs) |
| 222 | Anthropic Claude | Anthropic | R/W | varies (gateway) | API key | 1 | [Anthropic](https://docs.anthropic.com/) |
| 223 | Google Gemini | Google | R/W | varies (gateway) | API key | 2 | [Gemini](https://ai.google.dev/docs) |
| 224 | Mistral | Mistral | R/W | varies (gateway) | API key | 3 | [Mistral](https://docs.mistral.ai/) |
| 225 | Groq | Groq | R/W | varies (gateway) | API key | 2 | [Groq](https://console.groq.com/docs/) |
| 226 | ElevenLabs voice | ElevenLabs | R/W | varies | API key | 2 | [ElevenLabs](https://elevenlabs.io/docs/api-reference/) |
| 227 | Deepgram STT | Deepgram | R | varies | API key | 2 | [Deepgram](https://developers.deepgram.com/) |
| 228 | AssemblyAI | AssemblyAI | R | varies | API key | 3 | [AssemblyAI](https://www.assemblyai.com/docs) |
| 229 | Whisper (local) | OpenAI/local | R | OWNER_ONLY | Local | 2 | [Whisper](https://github.com/openai/whisper) |
| 230 | Pinecone | Pinecone | R/W | varies | API key | 2 | [Pinecone](https://docs.pinecone.io/) |
| 231 | Weaviate | Weaviate | R/W | varies | API key | 3 | [Weaviate](https://weaviate.io/developers/weaviate) |
| 232 | Qdrant | Qdrant | R/W | varies | API key | 3 | [Qdrant](https://qdrant.tech/documentation/) |
| 233 | pgvector | Self-hosted | R/W | OWNER_ONLY | Conn string | 1 | [pgvector](https://github.com/pgvector/pgvector) |
| 234 | LangSmith tracing | LangChain | R/W | BUSINESS_INTERNAL | API key | 2 | [LangSmith](https://docs.smith.langchain.com/) |
| 235 | Browser automation | Browserless | R | varies | API key | 3 | [Browserless](https://docs.browserless.io/) |
| 236 | Local computer-use agent | Custom | R/E | OWNER_ONLY | Local | 5 | Internal |
| 237 | OCR engine | Tesseract/Textract | R | varies | Local/IAM | 2 | [Textract](https://docs.aws.amazon.com/textract/) |
| 238 | Document parser | Unstructured | R | varies | API key | 2 | [Unstructured](https://unstructured-io.github.io/unstructured/) |
| 239 | RAG knowledge base | Internal | R/W | OWNER_ONLY | Internal | 2 | Internal |
| 240 | Personal memory service | Internal | R/W | OWNER_ONLY | Internal | 1 | Internal |

---

## Phase priority map

| Phase | Count | Focus |
|-------|-------|-------|
| **1 — Launch** | ~25 | Auth, Gmail, Calendar, Drive, GitHub, Stripe, Plaid, Mercury, Slack, Notion, Linear, Vercel, Cloudflare, Supabase, OpenAI, Anthropic, pgvector, memory |
| **2 — Working life** | ~35 | Twilio, WhatsApp, DocuSign, HealthKit, Oura, Whoop, Home Assistant, FlightAware, Tesla, PostHog, Deepgram, ElevenLabs, LangSmith, vector DBs |
| **3 — Business ops** | ~35 | Shopify (Katura/K99), QBO, Xero, HubSpot, Zendesk, Clio, IBKR, market data, Zigbee, browser automation |
| **4 — Full life** | ~30 | Apple bridges, Sonos, locks, cameras, Garmin, BMW, insurance, corporate registries, Salesforce |
| **5 — Stark tier** | ~15 | iMessage bridge, Signal, private aviation, local computer agent, knowledge graph, crypto wallets |

---

## Env var naming convention

Every connector key in `.env.local` follows this pattern:

```
<PROVIDER>_API_KEY       — primary auth token
<PROVIDER>_CLIENT_ID     — OAuth client ID
<PROVIDER>_CLIENT_SECRET — OAuth client secret
<PROVIDER>_WEBHOOK_SECRET — webhook signature key
```

All keys are stored encrypted at rest in the `Connector` table with AES-256-GCM
using the master `ENCRYPTION_KEY`. The `.env.local` values are only used during
initial connector setup; after that, Virgil reads from the database.

---

## Rules

1. **READ freely.** Virgil sees the whole battlefield.
2. **DRAFT/STAGE carefully.** Virgil prepares action in the approval queue.
3. **EXECUTE only with Rosser approval.** Every time. No exceptions.
4. **Audit everything.** What Virgil saw, recommended, drafted, and executed.
5. **Pepper sees scoped grants only.** Never financial, legal, health, or security data unless explicitly granted.
6. **OWNER_ONLY data never touches cloud.** Routed to local model or mock.
7. **Every connector goes through the permission broker.** No direct access.
