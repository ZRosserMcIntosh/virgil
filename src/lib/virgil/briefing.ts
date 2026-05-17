/**
 * VIRGIL — Briefing engine.
 *
 * v0 reads from the local DB only and produces a structured briefing.
 * Later this composes signals from connectors (GitHub, Gmail, Calendar,
 * Katura, K99, Maverick) and asks the SUMMARY model to synthesize.
 */

import { prisma } from "@/lib/db/client";

// ── Weather helper (Open-Meteo — no API key required) ────────────────────────

interface WeatherSummary {
  temp: number;     // °F
  condition: string;
  icon: string;
}

async function fetchWeather(lat = 30.2672, lon = -97.7431): Promise<WeatherSummary | null> {
  // Defaults to Austin, TX. Override with user's lat/lon when profile supports it.
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode&temperature_unit=fahrenheit&timezone=auto`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) return null;
    const data = await res.json();
    const temp  = Math.round(data.current.temperature_2m);
    const code  = data.current.weathercode as number;
    const { condition, icon } = wmoDescription(code);
    return { temp, condition, icon };
  } catch {
    return null;
  }
}

function wmoDescription(code: number): { condition: string; icon: string } {
  if (code === 0)                    return { condition: "Clear sky",          icon: "☀️" };
  if (code <= 2)                     return { condition: "Partly cloudy",      icon: "⛅" };
  if (code === 3)                    return { condition: "Overcast",            icon: "☁️" };
  if (code <= 49)                    return { condition: "Foggy",               icon: "🌫️" };
  if (code <= 59)                    return { condition: "Drizzle",             icon: "🌦️" };
  if (code <= 69)                    return { condition: "Rain",                icon: "🌧️" };
  if (code <= 79)                    return { condition: "Snow",                icon: "❄️" };
  if (code <= 84)                    return { condition: "Rain showers",        icon: "🌧️" };
  if (code <= 94)                    return { condition: "Snow showers",        icon: "🌨️" };
  return                                    { condition: "Thunderstorm",        icon: "⛈️" };
}

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
  weather?: WeatherSummary;
}

export async function generateBriefing(ownerId: string): Promise<Briefing> {
  const [pendingApprovals, recentSecurity, projects, profileFactCount, recentConvs, downvoteCount, openTasks, weather] = await Promise.all([
    prisma.approval.count({ where: { requesterId: ownerId, status: "PENDING" } }),
    prisma.securityEvent.findMany({
      where: { resolved: false },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.project.findMany({ orderBy: { priority: "desc" }, take: 6 }),
    (prisma as any).profileFact.count(),
    (prisma as any).virgilConversation.count({ where: { userId: ownerId } }),
    (prisma as any).virgilMessage.count({
      where: { feedback: "DOWN", conversation: { userId: ownerId } },
    }),
    (prisma as any).task?.count({ where: { status: "TODO" } }).catch(() => 0),
    fetchWeather(),
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

  // Open tasks
  if (openTasks > 0) {
    topMatters.push({
      title: `${openTasks} open task${openTasks === 1 ? "" : "s"}`,
      detail: "Visit Tasks to review your to-do list.",
      severity: openTasks > 5 ? "high" : "medium",
      source: "tasks",
    });
  }

  // Surface low-profile-completeness as a top matter
  if (profileFactCount === 0) {
    topMatters.push({
      title: "Profile empty",
      detail: "No profile facts on record. Visit Memory to add context about yourself.",
      severity: "medium",
      source: "memory",
    });
  }

  // Surface persistent downvotes as a quality signal
  if (downvoteCount >= 3) {
    topMatters.push({
      title: `${downvoteCount} downvoted response${downvoteCount === 1 ? "" : "s"} on record`,
      detail: "Review the Feedback page to identify quality patterns.",
      severity: "medium",
      source: "feedback",
    });
  }

  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const weatherLine = weather
    ? ` ${weather.icon} ${weather.temp}°F, ${weather.condition}.`
    : "";

  const totalMatters = topMatters.length + risks.length;
  const conversationLine =
    recentConvs > 0
      ? ` ${recentConvs} conversation${recentConvs === 1 ? "" : "s"} on record.`
      : "";

  const opening =
    totalMatters === 0
      ? `${timeOfDay}, sir. Nothing requires your immediate attention.${conversationLine}${weatherLine}`
      : `${timeOfDay}, sir. ${totalMatters} matter${
          totalMatters === 1 ? "" : "s"
        } worth your attention.${conversationLine}${weatherLine}`;

  const recommendedNext =
    risks[0]?.title ?? topMatters[0]?.title ?? "Review the projects panel.";

  return {
    opening,
    topMatters,
    risks,
    opportunities,
    pendingApprovals,
    recommendedNext,
    generatedAt: new Date().toISOString(),
    weather: weather ?? undefined,
  };
}
