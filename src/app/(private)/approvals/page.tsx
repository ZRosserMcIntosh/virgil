import { prisma } from "@/lib/db/client";
export const dynamic = "force-dynamic";

const RISK_COLOR: Record<string, string> = {
  LOW: "text-bone-200",
  MEDIUM: "text-signal-amber",
  HIGH: "text-signal-red",
  CRITICAL: "text-signal-red",
};

export default async function ApprovalsPage() {
  const approvals = await prisma.approval.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { project: true },
  });
  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Approval Queue</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Prepared, not executed</h1>
        <p className="mt-1 text-xs text-bone-400">
          Items below are staged and require explicit approval before any external action is taken.
        </p>
      </header>
      <div className="space-y-3">
        {approvals.length === 0 && (
          <div className="v-card v-card-pad text-bone-400">Queue is empty.</div>
        )}
        {approvals.map((a) => (
          <div key={a.id} className="v-card v-card-pad">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-bone-400">{a.actionType}</div>
                <div className="mt-1 font-serif text-lg text-bone-50">{a.title}</div>
                <p className="mt-2 text-sm text-bone-200">{a.summary}</p>
                {a.explanation && (
                  <p className="mt-2 text-xs text-bone-400">{a.explanation}</p>
                )}
              </div>
              <div className="shrink-0 text-right text-[11px] uppercase tracking-wider">
                <div className={RISK_COLOR[a.riskLevel] ?? ""}>{a.riskLevel}</div>
                <div className="text-bone-400">requires lvl {a.approvalRequiredLevel}</div>
                {a.project && <div className="text-bone-400">{a.project.name}</div>}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="v-btn">Approve</button>
              <button className="v-btn">Reject</button>
              <button className="v-btn">Open</button>
            </div>
            <div className="mt-2 text-[10px] text-bone-400">
              created {a.createdAt.toLocaleString()}
              {a.preparedByModel ? ` · ${a.preparedByModel}` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
