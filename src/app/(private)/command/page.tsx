"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  meta?: {
    usedModel?: string;
    sensitivity?: string;
    blackDoor?: boolean;
  };
}

interface CompanionConfig {
  name: string;
  subtitle: string;
  placeholder: string;
  sendLabel: string;
  apiEndpoint: string;
  apiBodyKey: string;
  disclaimer: string;
  userLabel: string;
  assistantBadge: (meta?: Message["meta"]) => string;
}

// ── Companion config ─────────────────────────────────────────────────────────
const VIRGIL_CONFIG: CompanionConfig = {
  name: "VIRGIL",
  subtitle: "Private Command Intelligence",
  placeholder: "Brief me. Or give an order.",
  sendLabel: "Send",
  apiEndpoint: "/api/virgil",
  apiBodyKey: "input",
  disclaimer: "Inputs are classified before any cloud model is invoked. Sensitive data is redacted or kept local.",
  userLabel: "Sir",
  assistantBadge: (meta?: Message["meta"]) =>
    meta?.blackDoor ? "Virgil · black door" : "Virgil",
};

const VERONICA_CONFIG: CompanionConfig = {
  name: "VERÔNICA",
  subtitle: "Inteligência Privada",
  placeholder: "Diga-me o que precisa, Stella.",
  sendLabel: "Enviar",
  apiEndpoint: "/api/veronica/command",
  apiBodyKey: "input",
  disclaimer: "Suas conversas são criptografadas com sua chave pessoal. Nem o administrador consegue lê-las.",
  userLabel: "Stella",
  assistantBadge: (_meta?: Message["meta"]): string => "Verônica",
};

export default function CommandPage() {
  const { data: session } = useSession();
  const companion = (session?.user as any)?.companion === "VERONICA" ? "VERONICA" : "VIRGIL";
  const cfg = companion === "VERONICA" ? VERONICA_CONFIG : VIRGIL_CONFIG;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch(cfg.apiEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [cfg.apiBodyKey]: q }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.message ?? data.reply ?? "—",
        meta: {
          usedModel: data.usedModel,
          sensitivity: data.sensitivity,
          blackDoor: data.blackDoor,
        },
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: companion === "VERONICA"
            ? "Desculpe, houve um erro de conexão."
            : "Connection error. Please try again.",
          meta: {},
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[calc(100dvh-56px)] flex-col lg:h-dvh">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-ink-700 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg tracking-wide text-bone-50">{cfg.name}</span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-bone-400">
            {cfg.subtitle}
          </span>
        </div>
      </div>

      {/* ── Message thread ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="font-serif text-4xl tracking-wide text-bone-50 opacity-20">
              {cfg.name}
            </div>
            <div className="mt-2 text-[11px] uppercase tracking-[0.28em] text-bone-400 opacity-40">
              {cfg.subtitle}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-0 px-4 py-6 lg:px-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} cfg={cfg} />
            ))}

            {/* Typing indicator */}
            {busy && (
              <div className="flex items-start gap-3 py-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700">
                  <span className="text-[9px] uppercase tracking-widest text-bone-300">
                    {companion === "VERONICA" ? "V" : "V"}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bone-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bone-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-bone-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-ink-700 bg-ink-900 px-4 py-3 lg:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 focus-within:border-ink-500 transition-colors">
            <textarea
              ref={textareaRef}
              className="flex-1 resize-none bg-transparent text-sm text-bone-100 placeholder-bone-400 outline-none"
              rows={1}
              placeholder={cfg.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-md bg-ink-600 px-3 py-1.5 text-xs font-medium tracking-wide text-bone-100 transition-colors hover:bg-ink-500 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {busy ? "…" : cfg.sendLabel}
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-bone-400 opacity-60">
            {cfg.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  cfg,
}: {
  msg: Message;
  cfg: typeof VIRGIL_CONFIG;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end py-2">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-ink-700 px-4 py-2.5">
          <p className="text-sm leading-relaxed text-bone-100 whitespace-pre-wrap">
            {msg.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 py-2">
      {/* Avatar */}
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-800">
        <span className="text-[9px] uppercase tracking-widest text-bone-300">V</span>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-bone-400">
          {cfg.assistantBadge(msg.meta)}
        </div>
        <p className="text-sm leading-relaxed text-bone-50 whitespace-pre-wrap">
          {msg.content}
        </p>
        {(msg.meta?.usedModel || msg.meta?.sensitivity) && (
          <div className="mt-2 text-[10px] uppercase tracking-wider text-bone-400 opacity-60">
            {msg.meta.usedModel && <span>model: {msg.meta.usedModel}</span>}
            {msg.meta.usedModel && msg.meta.sensitivity && <span className="mx-1">·</span>}
            {msg.meta.sensitivity && <span>sensitivity: {msg.meta.sensitivity}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
