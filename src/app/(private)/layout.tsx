import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { buildTrustContext } from "@/lib/auth/trust-context";
import { headers } from "next/headers";

const NAV: { href: string; label: string }[] = [
  { href: "/briefing",  label: "Briefing" },
  { href: "/command",   label: "Command" },
  { href: "/memory",    label: "Memory" },
  { href: "/projects",  label: "Projects" },
  { href: "/agents",    label: "Agents" },
  { href: "/github",    label: "GitHub" },
  { href: "/gmail",     label: "Gmail" },
  { href: "/calendar",  label: "Calendar" },
  { href: "/approvals", label: "Approvals" },
  { href: "/security",  label: "Security" },
  { href: "/settings",  label: "Settings" },
];

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const h = await headers();
  const trust = await buildTrustContext({
    session,
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
  });

  // Outsider somehow holding a session? Send them away with no detail.
  if (!trust.isOwner) redirect("/login");

  return (
    <div className="grid min-h-dvh grid-cols-[240px_1fr]">
      <aside className="border-r border-ink-700 bg-ink-950/80 p-5">
        <div className="mb-8">
          <div className="font-serif text-xl tracking-wider text-bone-50">VIRGIL</div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-bone-400">
            Command Intelligence
          </div>
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded px-2 py-1.5 text-sm text-bone-200 hover:bg-ink-800 hover:text-bone-50"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 v-divider" />
        <div className="mt-4 space-y-1 text-[11px] text-bone-400">
          <div>Auth level: <span className="text-bone-100">{trust.authorizationLevel}/6</span></div>
          <div>
            Device:{" "}
            <span className={trust.isTrustedDevice ? "text-signal-green" : "text-signal-amber"}>
              {trust.isTrustedDevice ? "trusted" : "unverified"}
            </span>
          </div>
          <div>
            Verification:{" "}
            <span className={trust.strongVerified ? "text-signal-green" : "text-signal-amber"}>
              {trust.strongVerified ? "strong" : "basic"}
            </span>
          </div>
          <div>Risk: <span className="text-bone-100">{trust.riskScore}/100</span></div>
        </div>
      </aside>
      <main className="px-8 py-6">{children}</main>
    </div>
  );
}
