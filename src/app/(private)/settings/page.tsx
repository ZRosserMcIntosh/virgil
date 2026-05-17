/**
 * VIRGIL — Settings / API Keys status page.
 *
 * Shows every connector in the registry with a ✅ / ❌ status indicator.
 * Server-rendered; process.env is read at module load inside the registry.
 */
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import {
  CONNECTOR_REGISTRY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ConnectorDef,
  type ConnectorCategory,
} from "@/lib/virgil/connectors/registry";
import NotificationPreferences from "@/components/NotificationPreferences";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const user = email ? await prisma.user.findUnique({ where: { email } }) : null;

  // Load notification prefs (or default all false)
  const rawPrefs = user
    ? await (async () => {
        try {
          return await (prisma as any).notificationPreference.findUnique({ where: { userId: user.id } });
        } catch { return null; }
      })()
    : null;

  const notifPrefs = {
    briefingEmail:  rawPrefs?.briefingEmail  ?? false,
    deadlineAlerts: rawPrefs?.deadlineAlerts ?? true,
    securityAlerts: rawPrefs?.securityAlerts ?? true,
    prAlerts:       rawPrefs?.prAlerts       ?? false,
    emailDigest:    rawPrefs?.emailDigest    ?? false,
  };

  const byCategory = new Map<ConnectorCategory, ConnectorDef[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);
  for (const c of CONNECTOR_REGISTRY) {
    byCategory.get(c.category)?.push(c);
  }

  const totalConfigured = CONNECTOR_REGISTRY.filter((c) => c.configured).length;
  const totalMissing = CONNECTOR_REGISTRY.filter((c) => !c.configured).length;

  return (
    <div className="space-y-8">
      <header>
        <div className="v-label">Settings</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">API Keys &amp; Connectors</h1>
        <p className="mt-2 text-sm text-bone-400">
          {totalConfigured} configured &nbsp;·&nbsp;{" "}
          <span className="text-signal-red">{totalMissing} missing</span>
        </p>
      </header>

      {CATEGORY_ORDER.map((cat) => {
        const connectors = byCategory.get(cat) ?? [];
        if (connectors.length === 0) return null;
        const isCritical = cat === "critical";
        return (
          <section key={cat} className="v-card v-card-pad">
            <div className={`v-label mb-4 ${isCritical ? "text-signal-amber" : ""}`}>
              {CATEGORY_LABELS[cat]}
            </div>
            <div className="divide-y divide-ink-700">
              {connectors.map((c) => (
                <ConnectorRow key={c.id} connector={c} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="v-card v-card-pad">
        <div className="v-label mb-3">Virgil Policy Flags</div>
        <div className="divide-y divide-ink-700 text-sm">
          <FlagRow name="VIRGIL_LOCAL_ONLY" value={process.env.VIRGIL_LOCAL_ONLY ?? "false"} />
          <FlagRow name="VIRGIL_AUTO_BLACK_DOOR" value={process.env.VIRGIL_AUTO_BLACK_DOOR ?? "true"} />
          <FlagRow name="VIRGIL_OWNER_NAME" value={process.env.VIRGIL_OWNER_NAME ?? "(default: Rosser)"} />
        </div>
      </section>

      <NotificationPreferences initial={notifPrefs} />
    </div>
  );
}

function ConnectorRow({ connector: c }: { connector: ConnectorDef }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 text-sm">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-bone-100">{c.name}</span>
          {c.docsUrl && (
            <a
              href={c.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-bone-500 underline underline-offset-2 hover:text-bone-300"
            >
              docs ↗
            </a>
          )}
        </div>
        <div className="mt-0.5 text-[12px] text-bone-400">{c.description}</div>
        <div className="mt-1 flex flex-wrap gap-1">
          {c.envVars.map((v) => (
            <span
              key={v}
              className="rounded bg-ink-800 px-1.5 py-0.5 font-mono text-[10px] text-bone-400"
            >
              {v}
            </span>
          ))}
        </div>
      </div>
      <div className="shrink-0 pt-0.5">
        {c.configured ? (
          <span className="text-base" title="Configured">✅</span>
        ) : (
          <span className="text-base" title="Not configured">❌</span>
        )}
      </div>
    </div>
  );
}

function FlagRow({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="font-mono text-[12px] text-bone-300">{name}</span>
      <span className="text-bone-100">{value}</span>
    </div>
  );
}
