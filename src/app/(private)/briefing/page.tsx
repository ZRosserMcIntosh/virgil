import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";
import { generateBriefing } from "@/lib/virgil/briefing";

export const dynamic = "force-dynamic";

export default async function BriefingPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  const owner = email ? await prisma.user.findUnique({ where: { email } }) : null;
  if (!owner) return <div>Access denied.</div>;

  const briefing = await generateBriefing(owner.id);

  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Command Briefing</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">{briefing.opening}</h1>
        <div className="mt-2 flex items-center gap-4 flex-wrap">
          <span className="text-xs text-bone-400">
            generated {new Date(briefing.generatedAt).toLocaleString()}
          </span>
          {briefing.weather && (
            <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-1.5">
              <span className="text-xl" aria-label={briefing.weather.condition}>{briefing.weather.icon}</span>
              <div>
                <span className="text-sm font-medium text-bone-100">{briefing.weather.temp}°F</span>
                <span className="ml-1.5 text-xs text-bone-400">{briefing.weather.condition}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Top Matters" items={briefing.topMatters} empty="Nothing urgent." />
        <Panel title="Risks"       items={briefing.risks}       empty="No active risks logged." />
        <Panel title="Opportunities" items={briefing.opportunities} empty="None surfaced." />
      </section>

      <section className="v-card v-card-pad">
        <div className="v-label">Recommended Next</div>
        <div className="mt-2 text-bone-100">{briefing.recommendedNext}</div>
        <div className="mt-3 text-xs text-bone-400">
          Pending approvals: {briefing.pendingApprovals}
        </div>
      </section>
    </div>
  );
}

function Panel({
  title,
  items,
  empty,
}: {
  title: string;
  items: { title: string; detail: string; severity: string; source: string }[];
  empty: string;
}) {
  const severityColor: Record<string, string> = {
    high:   "text-signal-red",
    medium: "text-signal-amber",
    low:    "text-signal-steel",
    info:   "text-signal-green",
  };

  return (
    <div className="v-card v-card-pad">
      <div className="v-label">{title}</div>
      {items.length === 0 ? (
        <div className="mt-3 text-sm text-bone-400">{empty}</div>
      ) : (
        <ul className="mt-3 space-y-3">
          {items.map((it, i) => (
            <li key={i} className="border-l-2 border-ink-600 pl-3">
              <div className={`text-sm font-medium ${severityColor[it.severity] ?? "text-bone-50"}`}>{it.title}</div>
              <div className="mt-0.5 text-xs text-bone-300 leading-relaxed">{it.detail}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-bone-500">
                {it.source}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
