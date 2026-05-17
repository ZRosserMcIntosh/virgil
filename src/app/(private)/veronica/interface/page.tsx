/**
 * VIRGIL — /veronica/interface
 *
 * A faithful structural preview of what Stella's VERÔNICA experience looks like.
 * Renders the full shell: nav, command area, sample exchange, layout.
 *
 * This page has zero access to Stella's real data — no DB queries, no sessions,
 * no memory, no conversations. All content is static demo material.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export const metadata = {
  title: "VERÔNICA — Interface Preview",
  description: "Structural preview of Stella's VERÔNICA interface.",
};

// ── Static demo exchange ──────────────────────────────────────────────────────

const DEMO_MESSAGES = [
  {
    id: "1",
    role: "assistant" as const,
    content:
      "Olá, Stella. Aqui é Verônica — sua assistente pessoal e privada. Estou aqui para você, e somente para você. O que você precisa hoje?",
  },
  {
    id: "2",
    role: "user" as const,
    content: "Verônica, preciso organizar minha semana. Tenho muita coisa acumulada.",
  },
  {
    id: "3",
    role: "assistant" as const,
    content:
      "Entendo. Vamos reduzir isso a algo gerenciável.\n\nMe diga: qual é a coisa mais importante que precisa estar resolvida até sexta-feira? Começamos por ela. O resto vem depois.",
  },
  {
    id: "4",
    role: "user" as const,
    content: "Preciso responder e-mails do trabalho e também ligar para minha mãe.",
  },
  {
    id: "5",
    role: "assistant" as const,
    content:
      "Dois itens, então. Aqui está uma ordem que faz sentido:\n\n1. Ligue para sua mãe primeiro — é mais pessoal, e fica mais fácil trabalhar depois que você se sentir conectada.\n2. Depois, separe 45 minutos para os e-mails. Se quiser, me manda os assuntos e posso ajudar a redigir.\n\nIsso resolve os dois. O que mais está acumulado?",
  },
];

const DEMO_NAV = [
  { label: "Início" },
  { label: "Conversar", active: true },
  { label: "Memórias" },
  { label: "Perguntas" },
  { label: "Privacidade" },
  { label: "Meus Direitos" },
  { label: "Sobre Verônica" },
  { label: "Configurações" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function VeronicaInterfacePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-4">

      {/* ── Preview banner ── */}
      <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/5 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-[10px] uppercase tracking-[0.28em] text-signal-amber">
            Interface Preview
          </span>
          <span className="text-bone-500 text-xs">·</span>
          <span className="text-xs text-bone-400">
            Structural mockup of Stella&rsquo;s VERÔNICA experience. No real data. No access to her conversations, memory, or account.
          </span>
        </div>
      </div>

      {/* ── Full shell mockup ── */}
      <div className="overflow-hidden rounded-xl border border-ink-700 shadow-2xl h-[calc(100vh-180px)] min-h-[560px]">

        <div className="flex h-full">

          {/* ── Stella's nav sidebar ── */}
          <aside className="flex w-52 shrink-0 flex-col border-r border-ink-700 bg-ink-950">

            {/* Brand */}
            <div className="border-b border-ink-700 px-4 py-4">
              <div className="font-serif text-base tracking-wide text-bone-50">VERÔNICA</div>
              <div className="mt-0.5 text-[9px] uppercase tracking-[0.28em] text-bone-500">
                Inteligência Privada
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {DEMO_NAV.map((item) => (
                <div
                  key={item.label}
                  className={`mx-2 my-0.5 cursor-default rounded px-3 py-2 text-sm transition-colors ${
                    item.active
                      ? "bg-ink-700 text-bone-50"
                      : "text-bone-400 hover:bg-ink-800 hover:text-bone-200"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </nav>

            {/* Trust footer — Stella's version */}
            <div className="border-t border-ink-800 px-3 py-3 space-y-0.5">
              <div className="text-[9px] text-bone-600">Conta: Stella Barbosa</div>
              <div className="text-[9px] text-bone-600">Privacidade: total</div>
              <div className="text-[9px] text-bone-600">Sessão: protegida</div>
            </div>
          </aside>

          {/* ── Command area ── */}
          <div className="flex flex-1 flex-col min-w-0 bg-ink-900">

            {/* Header */}
            <div className="shrink-0 border-b border-ink-700 bg-ink-900 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-serif text-lg tracking-wide text-bone-50">VERÔNICA</span>
                <span className="text-[10px] uppercase tracking-[0.28em] text-bone-400">
                  Inteligência Privada
                </span>
                <div className="ml-auto">
                  <span className="rounded bg-ink-800 px-2.5 py-1 text-[10px] text-bone-400">
                    Nova conversa
                  </span>
                </div>
              </div>
            </div>

            {/* Message thread */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-3xl space-y-0 px-5 py-6">
                {DEMO_MESSAGES.map((msg) =>
                  msg.role === "user" ? (
                    <div key={msg.id} className="flex justify-end py-2">
                      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-ink-700 px-4 py-2.5">
                        <p className="text-sm leading-relaxed text-bone-100 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex items-start gap-3 py-2">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-800">
                        <span className="text-[9px] uppercase tracking-widest text-bone-300">V</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 text-[10px] uppercase tracking-wider text-bone-400">
                          VERÔNICA
                        </div>
                        <p className="text-sm leading-relaxed text-bone-50 whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Input bar — non-functional, visual only */}
            <div className="shrink-0 border-t border-ink-700 bg-ink-900 px-5 py-3">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2.5 opacity-60">
                  <span className="flex-1 text-sm text-bone-500">Diga-me o que precisa.</span>
                  <span className="shrink-0 rounded-md bg-ink-600 px-3 py-1 text-xs text-bone-400">
                    Enviar
                  </span>
                </div>
                <p className="mt-1.5 text-center text-[10px] text-bone-500 opacity-50">
                  Suas conversas são criptografadas com sua chave pessoal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Layout notes ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Note
          label="Language"
          value="Full Portuguese UI. All labels, placeholders, prompts, and system messages in pt-BR."
        />
        <Note
          label="Privacy boundary"
          value="Stella's conversations, memory, and account are fully isolated. Mr. McIntosh has no read access."
        />
        <Note
          label="Persona"
          value="VERÔNICA is warmer and more personal than Virgil — part confidante, part guardian. Formal but not cold."
        />
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Note({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
      <div className="mb-1 text-[10px] uppercase tracking-wider text-bone-500">{label}</div>
      <p className="text-xs leading-relaxed text-bone-300">{value}</p>
    </div>
  );
}
