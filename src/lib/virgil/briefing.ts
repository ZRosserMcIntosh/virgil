/**
 * VIRGIL — Briefing engine.
 *
 * v0 reads from the local DB only and produces a structured briefing.
 * Later this composes signals from connectors (GitHub, Gmail, Calendar,
 * Katura, K99, Maverick) and asks the SUMMARY model to synthesize.
 */

import { prisma } from "@/lib/db/client";

export interface BriefingItem {
  title: string;
  detail: string;
  severity: "info" | "low" | "medium" | "high";
  source: string;
}

export interface Briefing {
  opening: string;
  topMatters: BriefingItem[];
  risks: BriefingItem[];
  opportunities: BriefingItem[];
  pendingApprovals: number;
  recommendedNext: string;
  generatedAt: string;
}

export async function generateBriefing(ownerId: string): Promise<Briefing> {
  const [pendingApprovals, recentSecurity, projects] = await Promise.all([
    prisma.approval.count({ where: { requesterId: ownerId, status: "PENDING" } }),
    prisma.securityEvent.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.findMany({ orderBy: { priority: "desc" }, take: 6 }),
  ]);

  const topMatters: BriefingItem[] = [];
  const risks: BriefingItem[] = [];
  const opportunities: BriefingItem[] = [];

  if (pendingApprovals > 0) {
    topMatters.push({
      title: `${pendingApprovals} pending approval${pendingApprovals === 1 ? "" : "s"}`,
      detail: "Items are staged but not executed.",
      severity: "medium",
      source: "approvals",
    });
  }

  for (const ev of recentSecurity) {
    risks.push({
      title: `Security: ${ev.type}`,
      detail: ev.summary,
      severity: ev.severity === "CRITICAL" || ev.severity === "HIGH" ? "high" : "medium",
      source: "security",
    });
  }

  for (const p of projects) {
    if (p.health === "RED") {
      risks.push({
        title: `${p.name} health: RED`,
        detail: p.description ?? "No description.",
        severity: "high",
        source: "projects",
      });
    } else if (p.health === "GREEN" && p.priority >= 70) {
      opportunities.push({
        title: `${p.name} steady`,
        detail: p.description ?? "On track.",
        severity: "info",
        source: "projects",
      });
    }
  }

  const opening =
    topMatters.length === 0 && risks.length === 0
      ? "Good evening, sir. Nothing requires your attention right now."
      : `Good evening, sir. ${topMatters.length + risks.length} matter${
          topMatters.length + risks.length === 1 ? "" : "s"
        } worth your attention.`;

  const recommendedNext =
    risks[0]?.title ?? topMatters[0]?.title ?? "Review the projects panel and rest.";

  return {
    opening,
    topMatters,
    risks,
    opportunities,
    pendingApprovals,
    recommendedNext,
    generatedAt: new Date().toISOString(),
  };
}
