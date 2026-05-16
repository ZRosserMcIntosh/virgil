/**
 * VIRGIL — /permissions
 *
 * The Virgil ↔ Verônica boundary control panel.
 * Shows what crosses each direction, what is blocked, and what requires explicit consent.
 * Server-rendered — reads live ProfileFact veronicaVisible counts from DB.
 */

import { prisma } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

export default async function PermissionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [totalStellaFacts, visibleStellaFacts, totalRosserFacts] = await Promise.all([
    prisma.profileFact.count({ where: { subject: "STELLA" } }),
    prisma.profileFact.count({ where: { subject: "STELLA", veronicaVisible: true } }),
    prisma.profileFact.count({ where: { subject: "ROSSER" } }),
  ]);

  const blockedStellaFacts = totalStellaFacts - visibleStellaFacts;

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <div className="v-label">Access Control</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Permissions</h1>
        <p className="mt-2 text-sm text-bone-400">
          Controls what information crosses the Virgil ↔ Verônica boundary in each direction.
        </p>
      </header>

      {/* ── Boundary diagram ── */}
      <div className="v-card overflow-hidden">
        <div className="border-b border-ink-700 px-5 py-3">
          <div className="v-label">The Boundary</div>
        </div>
        <div className="grid grid-cols-1 gap-px bg-ink-700 sm:grid-cols-3">
          {/* Virgil column */}
          <div className="bg-ink-950 px-5 py-5">
            <div className="mb-3 font-serif text-lg text-bone-50">VIRGIL</div>
            <div className="text-[10px] uppercase tracking-wider text-bone-400 mb-2">Knows about</div>
            <ul className="space-y-1 text-xs text-bone-300">
              <li className="flex items-center gap-2"><Dot color="green" /> All Rosser profile facts</li>
              <li className="flex items-center gap-2"><Dot color="green" /> Stella facts marked Verônica-visible</li>
              <li className="flex items-center gap-2"><Dot color="red" /> Stella&apos;s personal conversations</li>
              <li className="flex items-center gap-2"><Dot color="red" /> Stella&apos;s private memories</li>
              <li className="flex items-center gap-2"><Dot color="red" /> Stella&apos;s health/legal/financial data</li>
            </ul>
          </div>

          {/* Arrow column */}
          <div className="bg-ink-950 flex flex-col items-center justify-center gap-4 px-5 py-5">
            <FlowArrow label="Stella facts (V-visible only)" direction="right" color="amber" />
            <FlowArrow label="Nothing" direction="left" color="red" />
          </div>

          {/* Verônica column */}
          <div className="bg-ink-950 px-5 py-5">
            <div className="mb-3 font-serif text-lg text-bone-50">VERÔNICA</div>
            <div className="text-[10px] uppercase tracking-wider text-bone-400 mb-2">Knows about</div>
            <ul className="space-y-1 text-xs text-bone-300">
              <li className="flex items-center gap-2"><Dot color="green" /> Stella&apos;s personal conversations</li>
              <li className="flex items-center gap-2"><Dot color="green" /> Stella&apos;s own profile facts</li>
              <li className="flex items-center gap-2"><Dot color="green" /> Stella facts marked Verônica-visible</li>
              <li className="flex items-center gap-2"><Dot color="amber" /> Rosser strengths (honest, caveated)</li>
              <li className="flex items-center gap-2"><Dot color="red" /> Rosser&apos;s profile facts</li>
              <li className="flex items-center gap-2"><Dot color="red" /> Rosser&apos;s conversations with Virgil</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Live fact counts ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Rosser facts" value={totalRosserFacts} note="in Virgil only" color="default" />
        <StatCard label="Stella facts (total)" value={totalStellaFacts} note="stored privately" color="default" />
        <StatCard label="Shared with Verônica" value={visibleStellaFacts} note="V-visible flag set" color="green" />
        <StatCard label="Private from Verônica" value={blockedStellaFacts} note="not shared" color="red" />
      </div>

      {/* ── Rules table ── */}
      <div className="v-card overflow-hidden">
        <div className="border-b border-ink-700 px-5 py-3">
          <div className="v-label">Sharing Rules</div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-ink-900 text-left text-[11px] uppercase tracking-wider text-bone-400">
            <tr>
              <th className="px-5 py-3">Data Type</th>
              <th className="px-5 py-3">Virgil Can See</th>
              <th className="px-5 py-3">Verônica Can See</th>
              <th className="px-5 py-3">Requires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-700">
            {SHARING_RULES.map((r) => (
              <tr key={r.type} className="text-xs">
                <td className="px-5 py-3 font-medium text-bone-100">{r.type}</td>
                <td className="px-5 py-3"><Badge ok={r.virgil} /></td>
                <td className="px-5 py-3"><Badge ok={r.veronica} /></td>
                <td className="px-5 py-3 text-bone-400">{r.requires}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Boundary principles ── */}
      <div className="v-card v-card-pad space-y-4">
        <div className="v-label">Governing Principles</div>
        <div className="space-y-3">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="flex gap-3 text-sm">
              <span className="mt-0.5 shrink-0 text-bone-500">{p.n}</span>
              <div>
                <span className="font-medium text-bone-100">{p.title} — </span>
                <span className="text-bone-400">{p.body}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="flex flex-wrap gap-3 text-xs">
        <a href="/memory" className="rounded bg-ink-800 px-3 py-2 text-bone-200 hover:bg-ink-700 transition-colors">
          → Edit profile facts &amp; V-visibility
        </a>
        <a href="/veronica" className="rounded bg-ink-800 px-3 py-2 text-bone-200 hover:bg-ink-700 transition-colors">
          → Preview Verônica interface
        </a>
        <a href="/security" className="rounded bg-ink-800 px-3 py-2 text-bone-200 hover:bg-ink-700 transition-colors">
          → Security audit log
        </a>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Dot({ color }: { color: "green" | "red" | "amber" }) {
  const cls = {
    green: "bg-signal-green",
    red:   "bg-signal-red",
    amber: "bg-signal-amber",
  }[color];
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${cls}`} />;
}

function FlowArrow({
  label, direction, color,
}: {
  label: string; direction: "left" | "right"; color: "amber" | "red";
}) {
  const textColor = color === "amber" ? "text-signal-amber" : "text-signal-red";
  return (
    <div className={`flex flex-col items-center gap-1 text-center ${textColor}`}>
      <div className="text-xs">{label}</div>
      <div className="text-lg">{direction === "right" ? "→" : "←"}</div>
    </div>
  );
}

function StatCard({
  label, value, note, color,
}: {
  label: string; value: number; note: string; color: "default" | "green" | "red";
}) {
  const valColor = {
    default: "text-bone-50",
    green:   "text-signal-green",
    red:     "text-signal-red",
  }[color];
  return (
    <div className="v-card px-4 py-4">
      <div className={`font-serif text-3xl ${valColor}`}>{value}</div>
      <div className="mt-1 text-xs font-medium text-bone-200">{label}</div>
      <div className="text-[10px] text-bone-500">{note}</div>
    </div>
  );
}

function Badge({ ok }: { ok: boolean | "partial" }) {
  if (ok === true)      return <span className="text-signal-green">✓ yes</span>;
  if (ok === false)     return <span className="text-signal-red">✗ no</span>;
  return <span className="text-signal-amber">◐ partial</span>;
}

// ── Static data ───────────────────────────────────────────────────────────────

const SHARING_RULES: {
  type: string;
  virgil: boolean | "partial";
  veronica: boolean | "partial";
  requires: string;
}[] = [
  { type: "Rosser profile facts",          virgil: true,      veronica: false,     requires: "N/A — Virgil only" },
  { type: "Stella profile facts",          virgil: "partial", veronica: true,      requires: "V-visible flag per fact" },
  { type: "Stella → Verônica chats",       virgil: false,     veronica: true,      requires: "Stella authentication" },
  { type: "Rosser → Virgil chats",         virgil: true,      veronica: false,     requires: "N/A — Virgil only" },
  { type: "Verônica core memory (Rosser)", virgil: false,     veronica: true,      requires: "Built-in library only" },
  { type: "Rosser strengths library",      virgil: false,     veronica: true,      requires: "Built-in, honest + caveated" },
  { type: "Rosser flaws library",          virgil: false,     veronica: true,      requires: "Built-in, honest" },
  { type: "Stella private memories",       virgil: false,     veronica: "partial", requires: "Stella explicit consent per item" },
  { type: "Audit logs",                    virgil: true,      veronica: false,     requires: "Owner access only" },
  { type: "Session tokens / credentials",  virgil: false,     veronica: false,     requires: "Never crosses — system level only" },
];

const PRINCIPLES = [
  {
    n:     "I.",
    title: "Minimum necessary",
    body:  "Neither Virgil nor Verônica receives information beyond what it needs to serve its principal.",
  },
  {
    n:     "II.",
    title: "Explicit consent for crossing",
    body:  "A Stella fact only crosses to Verônica when the V-visible flag is set by Rosser. Nothing crosses automatically.",
  },
  {
    n:     "III.",
    title: "No reverse channel",
    body:  "Verônica cannot pass Stella's personal conversations, memories, or private data back to Virgil under any condition.",
  },
  {
    n:     "IV.",
    title: "Stella's data is Stella's",
    body:  "Even facts about Stella stored in Verônica are hers. Rosser seeding a fact does not give him access to it via Verônica.",
  },
  {
    n:     "V.",
    title: "Audit everything",
    body:  "Every cross-boundary data access — present or future — is logged with timestamp, accessor, and data type.",
  },
];
