/**
 * /audit — Audit log page (owner only).
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db/client";

export const metadata = { title: "Virgil — Audit Log" };
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if ((session.user as any).companion !== "VIRGIL" && (session.user as any).companion !== undefined) redirect("/command");

  const events = await prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { email: true, identity: true } } },
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl tracking-wide text-bone-50">Audit Log</h1>
        <p className="mt-1 text-xs text-bone-400">Every action taken through the system.</p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-ink-700 text-left text-bone-500">
              <th className="pb-2 pr-3">Time</th>
              <th className="pb-2 pr-3">Identity</th>
              <th className="pb-2 pr-3">Action</th>
              <th className="pb-2 pr-3">Result</th>
              <th className="pb-2 pr-3">Model</th>
              <th className="pb-2">Detail</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-bone-500">No audit events.</td></tr>
            )}
            {events.map((e) => (
              <tr key={e.id} className="border-b border-ink-800">
                <td className="py-1.5 pr-3 text-bone-500 whitespace-nowrap">
                  {e.createdAt.toLocaleDateString()} {e.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="py-1.5 pr-3 text-bone-300">{e.identity ?? "—"}</td>
                <td className="py-1.5 pr-3 text-bone-200">{e.actionRequested}</td>
                <td className="py-1.5 pr-3">
                  <span className={
                    e.result === "ok" ? "text-signal-green" :
                    e.result === "denied" ? "text-signal-red" :
                    "text-signal-amber"
                  }>{e.result}</span>
                </td>
                <td className="py-1.5 pr-3 text-bone-400">{e.modelUsed ?? "—"}</td>
                <td className="py-1.5 text-bone-500 max-w-xs truncate">{e.resultDetail ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
