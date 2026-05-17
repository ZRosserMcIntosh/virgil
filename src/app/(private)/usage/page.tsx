/**
 * VIRGIL — /usage
 *
 * Token and cost tracking page. Shows provider call history, token consumption,
 * estimated costs, and breakdowns by model, companion, and time period.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export const metadata = {
  title: "Virgil — Usage",
  description: "Token and cost tracking.",
};

export default async function UsagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  // Only owner can see usage
  const companion = (session.user as any).companion ?? "VIRGIL";
  if (companion !== "VIRGIL") redirect("/command");

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  // Aggregate all-time stats
  const allCalls = await prisma.providerCall.findMany({
    select: {
      provider: true,
      model: true,
      taskClass: true,
      promptTokens: true,
      completionTokens: true,
      costUsd: true,
      latencyMs: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const monthCalls = allCalls.filter((c) => c.createdAt >= startOfMonth);
  const weekCalls = allCalls.filter((c) => c.createdAt >= startOfWeek);

  function aggregate(calls: typeof allCalls) {
    const totalPromptTokens = calls.reduce((s, c) => s + c.promptTokens, 0);
    const totalCompletionTokens = calls.reduce((s, c) => s + c.completionTokens, 0);
    const totalCost = calls.reduce((s, c) => s + c.costUsd, 0);
    const avgLatency = calls.length
      ? Math.round(calls.reduce((s, c) => s + c.latencyMs, 0) / calls.length)
      : 0;

    // Group by model
    const byModel: Record<string, { calls: number; tokens: number; cost: number }> = {};
    for (const c of calls) {
      const key = `${c.provider}:${c.model}`;
      if (!byModel[key]) byModel[key] = { calls: 0, tokens: 0, cost: 0 };
      byModel[key].calls += 1;
      byModel[key].tokens += c.promptTokens + c.completionTokens;
      byModel[key].cost += c.costUsd;
    }

    return { totalPromptTokens, totalCompletionTokens, totalCost, avgLatency, byModel, count: calls.length };
  }

  const all = aggregate(allCalls);
  const month = aggregate(monthCalls);
  const week = aggregate(weekCalls);

  // ElevenLabs — estimate from env (no tracking table yet)
  // Placeholder until we add voice call logging

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-serif text-2xl tracking-wide text-bone-50">Usage & Costs</h1>
        <p className="mt-1 text-xs text-bone-400">Token consumption, provider costs, and model breakdown.</p>
      </header>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card label="This week" value={`${week.count} calls`} sub={`${fmtTokens(week.totalPromptTokens + week.totalCompletionTokens)} tokens`} />
        <Card label="This month" value={`${month.count} calls`} sub={`${fmtTokens(month.totalPromptTokens + month.totalCompletionTokens)} tokens`} />
        <Card label="All time" value={`${all.count} calls`} sub={`${fmtTokens(all.totalPromptTokens + all.totalCompletionTokens)} tokens`} />
        <Card label="Avg latency" value={`${all.avgLatency}ms`} sub={`across ${all.count} calls`} />
      </div>

      {/* ── Token breakdown ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-bone-200">Token breakdown — this month</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Prompt tokens" value={fmtTokens(month.totalPromptTokens)} />
          <Stat label="Completion tokens" value={fmtTokens(month.totalCompletionTokens)} />
          <Stat label="Total tokens" value={fmtTokens(month.totalPromptTokens + month.totalCompletionTokens)} />
        </div>
      </section>

      {/* ── By model ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-bone-200">By model — this month</h2>
        {Object.keys(month.byModel).length === 0 ? (
          <p className="text-xs text-bone-500">No calls this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-ink-700 text-left text-bone-500">
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4 text-right">Calls</th>
                  <th className="pb-2 pr-4 text-right">Tokens</th>
                  <th className="pb-2 text-right">Est. cost</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(month.byModel)
                  .sort((a, b) => b[1].tokens - a[1].tokens)
                  .map(([model, stats]) => (
                    <tr key={model} className="border-b border-ink-800">
                      <td className="py-2 pr-4 text-bone-200">{model}</td>
                      <td className="py-2 pr-4 text-right text-bone-300">{stats.calls}</td>
                      <td className="py-2 pr-4 text-right text-bone-300">{fmtTokens(stats.tokens)}</td>
                      <td className="py-2 text-right text-bone-400">{stats.cost > 0 ? `$${stats.cost.toFixed(4)}` : "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Recent calls ── */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-bone-200">Recent calls (last 50)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-ink-700 text-left text-bone-500">
                <th className="pb-2 pr-3">Time</th>
                <th className="pb-2 pr-3">Model</th>
                <th className="pb-2 pr-3">Task</th>
                <th className="pb-2 pr-3 text-right">Prompt</th>
                <th className="pb-2 pr-3 text-right">Completion</th>
                <th className="pb-2 text-right">Latency</th>
              </tr>
            </thead>
            <tbody>
              {allCalls.slice(0, 50).map((c, i) => (
                <tr key={i} className="border-b border-ink-800">
                  <td className="py-1.5 pr-3 text-bone-500 whitespace-nowrap">
                    {c.createdAt.toLocaleDateString()} {c.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-1.5 pr-3 text-bone-200">{c.provider}:{c.model}</td>
                  <td className="py-1.5 pr-3 text-bone-400">{c.taskClass}</td>
                  <td className="py-1.5 pr-3 text-right text-bone-300">{fmtTokens(c.promptTokens)}</td>
                  <td className="py-1.5 pr-3 text-right text-bone-300">{fmtTokens(c.completionTokens)}</td>
                  <td className="py-1.5 text-right text-bone-400">{c.latencyMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Cost estimates ── */}
      <section className="rounded-lg border border-ink-700 bg-ink-900 px-5 py-4">
        <h2 className="mb-2 text-sm font-medium text-bone-200">Estimated monthly costs</h2>
        <div className="space-y-1 text-xs text-bone-400">
          <p><strong className="text-bone-300">OpenAI (gpt-4o):</strong> ~$2.50/1M input, $10/1M output. {fmtTokens(month.totalPromptTokens)} prompt + {fmtTokens(month.totalCompletionTokens)} completion this month.</p>
          <p><strong className="text-bone-300">Anthropic (claude-3.5-sonnet):</strong> ~$3/1M input, $15/1M output.</p>
          <p><strong className="text-bone-300">ElevenLabs:</strong> Billed by character. Free tier: 10k chars/mo. Starter ($5/mo): 30k. Creator ($22/mo): 100k.</p>
          <p><strong className="text-bone-300">Perplexity (sonar):</strong> ~$5/1000 queries if configured.</p>
          <p className="mt-2 text-bone-500">Cost tracking will become precise once provider-specific pricing is integrated into the ProviderCall ledger.</p>
        </div>
      </section>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-bone-500">{label}</div>
      <div className="mt-1 text-lg font-medium text-bone-50">{value}</div>
      <div className="mt-0.5 text-[11px] text-bone-400">{sub}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink-700 bg-ink-900/50 px-3 py-2">
      <div className="text-[10px] text-bone-500">{label}</div>
      <div className="text-sm font-medium text-bone-100">{value}</div>
    </div>
  );
}
