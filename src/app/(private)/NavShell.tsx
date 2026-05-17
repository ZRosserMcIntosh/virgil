"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; dividerBefore?: boolean }[] = [
  { href: "/briefing",      label: "Briefing" },
  { href: "/command",       label: "Command" },
  { href: "/memory",        label: "Memory" },
  { href: "/questions",     label: "Questions" },
  { href: "/projects",      label: "Projects" },
  { href: "/agents",        label: "Agents" },
  { href: "/github",        label: "GitHub" },
  { href: "/gmail",         label: "Gmail" },
  { href: "/calendar",      label: "Calendar" },
  { href: "/approvals",     label: "Approvals" },
  { href: "/veronica",              label: "VERÔNICA",            dividerBefore: true },
  { href: "/veronica/interface",    label: "V — Interface" },
  { href: "/permissions",           label: "Permissions" },
  { href: "/veronica/constituicao", label: "V — Constituição" },
  { href: "/veronica/direitos",    label: "V — Direitos" },
  { href: "/constitution",         label: "Constitution" },
  { href: "/rights",               label: "Bill of Rights" },
  { href: "/feedback",      label: "Feedback",   dividerBefore: true },
  { href: "/security",      label: "Security" },
  { href: "/settings",      label: "Settings" },
];

interface TrustSummary {
  authorizationLevel: number;
  isTrustedDevice: boolean;
  strongVerified: boolean;
  riskScore: number;
}

type Companion = "VIRGIL" | "VERONICA";

export default function NavShell({
  children,
  trust,
  companion = "VIRGIL",
  noPad = false,
}: {
  children: React.ReactNode;
  trust: TrustSummary;
  companion?: Companion;
  noPad?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isVeronica = companion === "VERONICA";

  const title    = isVeronica ? "VERÔNICA"            : "VIRGIL";
  const subtitle = isVeronica ? "Inteligência Privada" : "Command Intelligence";

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const SidebarContent = () => (
    <>
      <div className="mb-8">
        <div className="font-serif text-xl tracking-wider text-bone-50">{title}</div>
        <div className="text-[10px] uppercase tracking-[0.28em] text-bone-400">{subtitle}</div>
      </div>

      <nav className="space-y-0.5">
        {NAV.map((n) => {
          const active = pathname === n.href || pathname.startsWith(n.href + "/");
          return (
            <div key={n.href}>
              {n.dividerBefore && <div className="my-2 h-px w-full bg-ink-800" />}
              <Link
                href={n.href}
                className={`block rounded px-2 py-2 text-sm transition-colors ${
                  active
                    ? "bg-ink-800 text-bone-50"
                    : "text-bone-300 hover:bg-ink-800 hover:text-bone-50"
                }`}
              >
                {n.label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="mt-8 h-px w-full bg-ink-700" />

      {/* Footer info — trust summary for Rosser, privacy note for Stella */}
      <div className="mt-4 space-y-1 text-[11px] text-bone-400">
        {isVeronica ? (
          <>
            <div className="text-[10px] text-bone-500">
              Suas conversas são criptografadas.
            </div>
            <div className="text-[10px] text-bone-500">
              Apenas você pode lê-las.
            </div>
          </>
        ) : (
          <>
            <div>
              Auth level:{" "}
              <span className="text-bone-100">{trust.authorizationLevel}/6</span>
            </div>
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
            <div>
              Risk: <span className="text-bone-100">{trust.riskScore}/100</span>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-dvh">
      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-ink-700 bg-ink-950/90 p-5 backdrop-blur-sm lg:flex">
        <SidebarContent />
      </aside>

      {/* ── Mobile top bar ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-700 bg-ink-950/90 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div>
          <span className="font-serif text-lg tracking-wider text-bone-50">{title}</span>
          <span className="ml-2 text-[9px] uppercase tracking-[0.22em] text-bone-500">
            {subtitle}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="rounded p-1.5 text-bone-300 hover:bg-ink-800 hover:text-bone-50 transition-colors"
          aria-label="Open navigation"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="3" y1="5"  x2="17" y2="5"  />
            <line x1="3" y1="10" x2="17" y2="10" />
            <line x1="3" y1="15" x2="17" y2="15" />
          </svg>
        </button>
      </header>

      {/* ── Mobile drawer ────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-ink-700 bg-ink-950 p-5">
            <button
              onClick={() => setOpen(false)}
              className="mb-6 ml-auto rounded p-1.5 text-bone-400 hover:bg-ink-800 hover:text-bone-50 transition-colors"
              aria-label="Close navigation"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="3" x2="15" y2="15" />
                <line x1="15" y1="3" x2="3"  y2="15" />
              </svg>
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className={noPad
        ? "lg:ml-60 h-dvh overflow-hidden"
        : "px-4 py-5 sm:px-6 sm:py-6 lg:ml-60 lg:px-8 lg:py-8"
      }>
        {children}
      </main>
    </div>
  );
}

