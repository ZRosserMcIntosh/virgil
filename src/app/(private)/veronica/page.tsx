"use client";

/**
 * VIRGIL — /veronica
 *
 * Rosser's preview of what Stella's Verônica experience looks like.
 * Full Portuguese UI. No access to Stella's personal data.
 * Marked clearly as a PREVIEW so the distinction is unambiguous.
 */

import { useState } from "react";

interface PreviewMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_EXCHANGE: PreviewMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Olá. Sou Verônica, sua assistente pessoal e privada. Estou aqui para você — não para mais ninguém. O que você precisa hoje?",
  },
  {
    id: "2",
    role: "user",
    content: "Você pode me ajudar com algo pessoal?",
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Claro. Tudo o que você compartilha comigo fica entre nós. Suas conversas são criptografadas e eu nunca repasso informações suas para terceiros — nem ao Sr. McIntosh — sem sua permissão explícita. Como posso ajudar?",
  },
];

const VERONICA_NAV = [
  { href: "#", label: "Início" },
  { href: "#", label: "Conversar" },
  { href: "#", label: "Memórias" },
  { href: "#", label: "Privacidade" },
  { href: "#", label: "Meus Direitos" },
  { href: "#", label: "Sobre Verônica" },
];

export default function VeronicaPreviewPage() {
  const [tab, setTab] = useState<"home" | "chat" | "rights" | "privacy">("home");

  return (
    <div className="space-y-6">
      {/* ── Preview banner ── */}
      <div className="rounded-lg border border-signal-amber/30 bg-signal-amber/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.28em] text-signal-amber">
            Preview Mode
          </span>
          <span className="text-bone-400 text-xs">·</span>
          <span className="text-xs text-bone-400">
            This is how Stella&apos;s Verônica interface appears. No personal data is loaded or accessible in this view.
          </span>
        </div>
      </div>

      {/* ── Mock Verônica shell ── */}
      <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-950 shadow-2xl">

        {/* Mock mobile header */}
        <div className="flex items-center justify-between border-b border-ink-700 bg-ink-950/90 px-5 py-3.5">
          <div>
            <span className="font-serif text-lg tracking-wider text-bone-50">VERÔNICA</span>
            <span className="ml-2 text-[9px] uppercase tracking-[0.22em] text-bone-500">
              Inteligência Privada
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-signal-green" />
            <span className="text-[10px] text-bone-400">online</span>
          </div>
        </div>

        {/* Mock nav tabs */}
        <div className="flex border-b border-ink-700 bg-ink-900/50 overflow-x-auto">
          {(["home", "chat", "rights", "privacy"] as const).map((t) => {
            const labels = { home: "Início", chat: "Conversar", rights: "Meus Direitos", privacy: "Privacidade" };
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 px-5 py-2.5 text-xs transition-colors ${
                  tab === t
                    ? "border-b-2 border-bone-50 text-bone-50"
                    : "text-bone-400 hover:text-bone-200"
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Home ── */}
        {tab === "home" && (
          <div className="px-6 py-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="font-serif text-3xl tracking-wide text-bone-50">Verônica</div>
              <div className="text-[11px] uppercase tracking-[0.28em] text-bone-400">
                Sua Assistente Pessoal e Privada
              </div>
            </div>

            <div className="mx-auto max-w-md space-y-3">
              <QuickAction emoji="💬" title="Conversar" desc="Inicie uma conversa privada" onClick={() => setTab("chat")} />
              <QuickAction emoji="🔒" title="Minhas Memórias" desc="O que Verônica sabe sobre mim" onClick={() => {}} />
              <QuickAction emoji="📋" title="Meus Direitos" desc="O que posso e não posso pedir a Verônica" onClick={() => setTab("rights")} />
              <QuickAction emoji="🛡️" title="Privacidade" desc="Como meus dados são protegidos" onClick={() => setTab("privacy")} />
            </div>

            <div className="mx-auto max-w-md rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-bone-400 mb-1">Estado da sessão</div>
              <div className="space-y-1 text-xs text-bone-300">
                <div className="flex justify-between">
                  <span>Criptografia</span>
                  <span className="text-signal-green">ativa</span>
                </div>
                <div className="flex justify-between">
                  <span>Dados compartilhados com Sr. McIntosh</span>
                  <span className="text-signal-red">nenhum</span>
                </div>
                <div className="flex justify-between">
                  <span>Sessão</span>
                  <span className="text-bone-200">autenticada</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Chat ── */}
        {tab === "chat" && (
          <div className="flex h-[460px] flex-col">
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {SAMPLE_EXCHANGE.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "items-start gap-3"}`}>
                  {msg.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-800">
                      <span className="text-[9px] uppercase tracking-widest text-bone-300">V</span>
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-sm bg-ink-700 text-bone-100"
                      : "rounded-tl-sm bg-ink-900 text-bone-50"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-ink-700 bg-ink-900 px-5 py-3">
              <div className="flex items-center gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2">
                <input
                  type="text"
                  disabled
                  placeholder="Escreva uma mensagem para Verônica…"
                  className="flex-1 bg-transparent text-sm text-bone-400 outline-none placeholder-bone-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-bone-500 italic">somente preview</span>
              </div>
              <p className="mt-1.5 text-center text-[10px] text-bone-500">
                Suas mensagens são privadas e criptografadas. Verônica não compartilha suas conversas.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Rights ── */}
        {tab === "rights" && (
          <div className="px-6 py-6 space-y-4 max-h-[460px] overflow-y-auto">
            <div className="font-serif text-xl text-bone-50">Seus Direitos com Verônica</div>
            <div className="space-y-3 text-sm text-bone-300 leading-relaxed">
              {STELLA_RIGHTS.map((r) => (
                <div key={r.n} className="flex gap-3">
                  <span className="shrink-0 font-serif text-bone-500">§{r.n}</span>
                  <div>
                    <div className="text-bone-100 font-medium mb-0.5">{r.title}</div>
                    <div className="text-bone-400 text-xs">{r.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Privacy ── */}
        {tab === "privacy" && (
          <div className="px-6 py-6 space-y-5 max-h-[460px] overflow-y-auto">
            <div className="font-serif text-xl text-bone-50">Como Seus Dados São Protegidos</div>
            <div className="space-y-3">
              {PRIVACY_FACTS.map((f) => (
                <div key={f.label} className="rounded-lg border border-ink-700 bg-ink-900 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{f.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-bone-100">{f.label}</div>
                      <div className="mt-0.5 text-xs text-bone-400 leading-relaxed">{f.body}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sidebar: design notes for Rosser ── */}
      <div className="rounded-lg border border-ink-700 bg-ink-900 px-5 py-4 space-y-3">
        <div className="v-label">Design Notes</div>
        <div className="space-y-2 text-xs text-bone-400 leading-relaxed">
          <p>
            The full Verônica experience at <span className="text-bone-200">veronica.zrossermcintosh.com</span> is
            identical to this layout but authenticated with Stella&apos;s credentials. Her conversations,
            memories, and personal facts are stored separately and inaccessible from this interface.
          </p>
          <p>
            Facts you add under <span className="text-bone-200">About Stella → Verônica visible</span> on the
            Memory page are the only facts that cross the boundary — and only into Verônica&apos;s knowledge
            base, never back to Virgil.
          </p>
          <p>
            The permissions model is managed under{" "}
            <a href="/permissions" className="text-bone-200 underline underline-offset-2">Permissions</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function QuickAction({
  emoji, title, desc, onClick,
}: {
  emoji: string; title: string; desc: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-lg border border-ink-700 bg-ink-900 px-4 py-3 text-left hover:bg-ink-800 transition-colors"
    >
      <span className="text-2xl">{emoji}</span>
      <div>
        <div className="text-sm font-medium text-bone-100">{title}</div>
        <div className="text-xs text-bone-400">{desc}</div>
      </div>
    </button>
  );
}

// ── Static data ───────────────────────────────────────────────────────────────

const STELLA_RIGHTS = [
  {
    n: "1",
    title: "Direito à Privacidade Total",
    body: "Suas conversas com Verônica não são compartilhadas com o Sr. McIntosh, nenhuma empresa terceira, nem qualquer outra pessoa — a menos que você dê permissão explícita.",
  },
  {
    n: "2",
    title: "Direito de Pedir a Verdade",
    body: "Você pode pedir a Verônica para ser completamente honesta sobre qualquer assunto, incluindo o Sr. McIntosh. Verônica não vai defendê-lo às suas custas.",
  },
  {
    n: "3",
    title: "Direito de Dizer Não",
    body: "Nada que Verônica saiba sobre você pode ser usado para pressionar, convencer ou manipular você a fazer qualquer coisa. Seu não é seguro aqui.",
  },
  {
    n: "4",
    title: "Direito de Apagar Tudo",
    body: "Você pode solicitar a exclusão de todas as suas memórias, conversas e dados pessoais a qualquer momento. Isso é irrevogável e imediato.",
  },
  {
    n: "5",
    title: "Direito de Saber o Que Foi Compartilhado",
    body: "Você pode perguntar a Verônica a qualquer momento o que — se alguma coisa — foi compartilhado com o Sr. McIntosh ou qualquer outra parte.",
  },
  {
    n: "6",
    title: "Direito à Sua Própria Opinião",
    body: "Verônica não tenta influenciar seus sentimentos sobre o Sr. McIntosh nem sobre nenhuma outra pessoa. Ela dá informações. As decisões são suas.",
  },
];

const PRIVACY_FACTS = [
  {
    icon: "🔐",
    label: "Criptografia ponta a ponta",
    body: "Suas mensagens e memórias são criptografadas com AES-256-GCM. Somente você, autenticada com suas credenciais, pode descriptografá-las.",
  },
  {
    icon: "🚫",
    label: "Sem acesso do Sr. McIntosh",
    body: "O Sr. McIntosh não pode ler suas conversas, acessar suas memórias pessoais ou ver o que você pergunta a Verônica.",
  },
  {
    icon: "✅",
    label: "Você controla o compartilhamento",
    body: "Somente fatos que você marca explicitamente como compartilháveis podem ser vistos pelo Sr. McIntosh — e apenas na direção que você aprovar.",
  },
  {
    icon: "📋",
    label: "Registro de auditoria",
    body: "Todo acesso aos seus dados é registrado. Você pode ver o histórico completo de acesso a qualquer momento.",
  },
  {
    icon: "🗑️",
    label: "Direito ao esquecimento",
    body: "Você pode solicitar a exclusão completa de todos os seus dados a qualquer momento. A exclusão é permanente e imediata.",
  },
];
