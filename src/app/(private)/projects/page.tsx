import { prisma } from "@/lib/db/client";
export const dynamic = "force-dynamic";

const HEALTH_COLOR: Record<string, string> = {
  GREEN: "text-signal-green",
  YELLOW: "text-signal-amber",
  RED: "text-signal-red",
  UNKNOWN: "text-bone-400",
};

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({ orderBy: { priority: "desc" } });
  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Projects</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Project Registry</h1>
      </header>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => (
          <div key={p.id} className="v-card v-card-pad">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-bone-400">{p.type}</div>
                <div className="mt-1 font-serif text-xl text-bone-50">{p.name}</div>
              </div>
              <div className={`text-[11px] uppercase tracking-wider ${HEALTH_COLOR[p.health] ?? "text-bone-400"}`}>
                {p.health}
              </div>
            </div>
            <p className="mt-2 text-sm text-bone-300">{p.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-bone-400">
              <div>Priority: <span className="text-bone-100">{p.priority}</span></div>
              <div>Status: <span className="text-bone-100">{p.status}</span></div>
              <div>Repos: <span className="text-bone-100">{p.connectedRepos.length}</span></div>
              <div>Agents: <span className="text-bone-100">{p.connectedAgentIds.length}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
