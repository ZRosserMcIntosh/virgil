"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;          // local UUID (used as key before DB save)
  dbId?: string;       // DB id after persistence
  role: "user" | "assistant";
  content: string;
  meta?: { usedModel?: string; sensitivity?: string; blackDoor?: boolean };
  feedback?: "UP" | "DOWN";
  feedbackNote?: string;
}

interface ConvSummary {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

interface CompanionConfig {
  name: string;
  subtitle: string;
  placeholder: string;
  sendLabel: string;
  apiEndpoint: string;
  apiBodyKey: string;
  disclaimer: string;
  assistantBadge: (meta?: Message["meta"]) => string;
  newConvLabel: string;
  historyLabel: string;
}

interface MemoryProposal {
  id: string;  // local UUID assigned client-side
  title: string;
  content: string;
  category: string;
  importance: number;
  sensitivity: string;
}

// ── Companion configs ─────────────────────────────────────────────────────────

const VIRGIL_CONFIG: CompanionConfig = {
  name: "VIRGIL",
  subtitle: "Private Command Intelligence",
  placeholder: "Brief me. Or give an order.",
  sendLabel: "Send",
  apiEndpoint: "/api/virgil",
  apiBodyKey: "input",
  disclaimer: "Inputs are classified before any cloud model is invoked. Sensitive data is redacted or kept local.",
  assistantBadge: (meta) => meta?.blackDoor ? "Virgil · black door" : "Virgil",
  newConvLabel: "New conversation",
  historyLabel: "History",
};

const VERONICA_CONFIG: CompanionConfig = {
  name: "VERÔNICA",
  subtitle: "Inteligência Privada",
  placeholder: "Diga-me o que precisa.",
  sendLabel: "Enviar",
  apiEndpoint: "/api/virgil",
  apiBodyKey: "input",
  disclaimer: "Suas conversas são criptografadas com sua chave pessoal.",
  assistantBadge: () => "VERÔNICA",
  newConvLabel: "Nova conversa",
  historyLabel: "Histórico",
};

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CommandPage() {
  const { data: session } = useSession();
  const companion = (session?.user as any)?.companion === "VERONICA" ? "VERONICA" : "VIRGIL";
  const cfg = companion === "VERONICA" ? VERONICA_CONFIG : VIRGIL_CONFIG;

  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [busy, setBusy]               = useState(false);
  const [convId, setConvId]           = useState<string | null>(null);
  const [convList, setConvList]       = useState<ConvSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [feedbackId, setFeedbackId]   = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [proposals, setProposals]     = useState<MemoryProposal[]>([]);
  const [proposing, setProposing]     = useState(false);
  const [savingIds, setSavingIds]     = useState<Set<string>>(new Set());

  const bottomRef  = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Load conversation list ────────────────────────────────────────────────

  const loadConvList = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?companion=${companion}`);
      if (res.ok) setConvList(await res.json());
    } catch { /* silent */ }
  }, [companion]);

  useEffect(() => { loadConvList(); }, [loadConvList]);

  // ── Load a specific conversation ─────────────────────────────────────────

  async function loadConversation(id: string) {
    setConvId(id);
    setMessages([]);
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      if (!res.ok) return;
      const rows = await res.json();
      setMessages(rows.map((r: any) => ({
        id: r.id,
        dbId: r.id,
        role: r.role,
        content: r.content,
        meta: r.meta ?? undefined,
        feedback: r.feedback ?? undefined,
        feedbackNote: r.feedbackNote ?? undefined,
      })));
    } catch { /* silent */ }
  }

  function startNewConversation() {
    setConvId(null);
    setMessages([]);
    setInput("");
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  async function send() {
    const q = input.trim();
    if (!q || busy) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: q };
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
        meta: { usedModel: data.usedModel, sensitivity: data.sensitivity, blackDoor: data.blackDoor },
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // ── Persist ──────────────────────────────────────────────────────────
      let cid = convId;
      if (!cid) {
        const created = await fetch("/api/conversations", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ companion, title: q.slice(0, 80) }),
        }).then((r) => r.json());
        cid = created.id;
        setConvId(cid);
        setConvList((prev) => [created, ...prev]);
      }
      if (cid) {
        await fetch(`/api/conversations/${cid}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([
            { role: "user",      content: q,                     meta: null },
            { role: "assistant", content: assistantMsg.content,  meta: assistantMsg.meta ?? null },
          ]),
        });
      }

    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "assistant",
        content: companion === "VERONICA"
          ? "Desculpe, houve um erro de conexão."
          : "Connection error. Please try again.",
      }]);
    } finally {
      setBusy(false);
    }
  }

  // ── Feedback ─────────────────────────────────────────────────────────────

  async function submitFeedback(msg: Message, vote: "UP" | "DOWN", note?: string) {
    // Optimistic update
    setMessages((prev) => prev.map((m) =>
      m.id === msg.id ? { ...m, feedback: vote, feedbackNote: note } : m
    ));
    setFeedbackId(null);
    setFeedbackNote("");

    if (!convId || !msg.dbId) return; // not yet persisted
    await fetch(`/api/conversations/${convId}/messages/${msg.dbId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedback: vote, feedbackNote: note ?? null }),
    }).catch(() => { /* silent */ });
  }

  // ── Auto-scroll + textarea resize ────────────────────────────────────────

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // ── Memory proposals ──────────────────────────────────────────────────────

  async function proposeMemories() {
    if (!convId || proposing) return;
    setProposing(true);
    setProposals([]);
    try {
      const res = await fetch(`/api/conversations/${convId}/propose-memory`, { method: "POST" });
      const data = await res.json();
      const raw: MemoryProposal[] = (data.proposals ?? []).map((p: Omit<MemoryProposal, "id">) => ({
        ...p,
        id: crypto.randomUUID(),
      }));
      setProposals(raw);
    } catch { /* silent */ } finally {
      setProposing(false);
    }
  }

  async function saveProposal(p: MemoryProposal) {
    setSavingIds((prev) => new Set(prev).add(p.id));
    try {
      await fetch("/api/virgil/memory-inferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title:       p.title,
          content:     p.content,
          category:    p.category,
          importance:  p.importance,
          sensitivity: p.sensitivity,
          sourceConversationId: convId,
        }),
      });
      setProposals((prev) => prev.filter((x) => x.id !== p.id));
    } catch { /* silent */ } finally {
      setSavingIds((prev) => { const s = new Set(prev); s.delete(p.id); return s; });
    }
  }

  function dismissProposal(id: string) {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="-mx-4 -my-5 sm:-mx-6 sm:-my-6 lg:-mx-8 lg:-my-8 flex h-dvh overflow-hidden">

      {/* ── Conversation sidebar — desktop ── */}
      {sidebarOpen && (
        <aside className="hidden w-52 shrink-0 flex-col border-r border-ink-700 bg-ink-950 sm:flex">
          <ConvSidebar
            cfg={cfg}
            convId={convId}
            convList={convList}
            onNew={startNewConversation}
            onSelect={loadConversation}
          />
        </aside>
      )}

      {/* ── Conversation sidebar — mobile drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-ink-700 bg-ink-950">
            <div className="flex items-center justify-between border-b border-ink-700 px-3 py-3">
              <span className="text-[10px] uppercase tracking-wider text-bone-400">{cfg.historyLabel}</span>
              <button onClick={() => setSidebarOpen(false)} title="Close" className="p-1 text-bone-400 hover:text-bone-200">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </button>
            </div>
            <ConvSidebar
              cfg={cfg}
              convId={convId}
              convList={convList}
              onNew={() => { startNewConversation(); setSidebarOpen(false); }}
              onSelect={(id: string) => { loadConversation(id); setSidebarOpen(false); }}
            />
          </div>
        </div>
      )}

      {/* ── Main chat area ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <div className="shrink-0 border-b border-ink-700 px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="hidden rounded p-1 text-bone-400 hover:bg-ink-800 hover:text-bone-200 transition-colors sm:block"
              title="Toggle history"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2" y1="4" x2="14" y2="4" /><line x1="2" y1="8" x2="14" y2="8" /><line x1="2" y1="12" x2="14" y2="12" />
              </svg>
            </button>
            <span className="font-serif text-lg tracking-wide text-bone-50">{cfg.name}</span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-bone-400">{cfg.subtitle}</span>
            {convId && (
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={proposeMemories}
                  disabled={proposing || messages.length < 2}
                  className="rounded bg-ink-800 px-2.5 py-1 text-[10px] text-bone-300 hover:bg-ink-700 transition-colors disabled:opacity-40"
                  title="Extract memorable facts from this conversation"
                >
                  {proposing ? "Extracting…" : "⟳ Extract memories"}
                </button>
                <button
                  onClick={startNewConversation}
                  className="rounded bg-ink-800 px-2.5 py-1 text-[10px] text-bone-300 hover:bg-ink-700 transition-colors"
                >
                  + {cfg.newConvLabel}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message thread */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="font-serif text-4xl tracking-wide text-bone-50 opacity-20">{cfg.name}</div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.28em] text-bone-400 opacity-40">{cfg.subtitle}</div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-0 px-4 py-6 lg:px-6">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  cfg={cfg}
                  feedbackId={feedbackId}
                  feedbackNote={feedbackNote}
                  setFeedbackId={setFeedbackId}
                  setFeedbackNote={setFeedbackNote}
                  onFeedback={submitFeedback}
                />
              ))}
              {busy && (
                <div className="flex items-start gap-3 py-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-700">
                    <span className="text-[9px] uppercase tracking-widest text-bone-300">V</span>
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

        {/* Memory proposals panel */}
        {proposals.length > 0 && (
          <div className="shrink-0 border-t border-ink-700 bg-ink-900/80 px-4 py-3 lg:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-signal-amber">
                  {proposals.length} memory proposal{proposals.length > 1 ? "s" : ""} — approve or dismiss
                </span>
                <button onClick={() => setProposals([])} className="text-[10px] text-bone-500 hover:text-bone-300">
                  dismiss all
                </button>
              </div>
              <div className="space-y-2">
                {proposals.map((p) => (
                  <div key={p.id} className="flex items-start gap-3 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-bone-100">{p.title}</div>
                      <div className="mt-0.5 text-[11px] text-bone-400 leading-relaxed">{p.content}</div>
                      <div className="mt-1 flex gap-2 text-[10px] text-bone-500">
                        <span>{p.category}</span>
                        <span>·</span>
                        <span>importance {p.importance}</span>
                        <span>·</span>
                        <span>{p.sensitivity}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                      <button
                        onClick={() => saveProposal(p)}
                        disabled={savingIds.has(p.id)}
                        className="rounded bg-signal-green/10 px-2.5 py-1 text-[10px] text-signal-green hover:bg-signal-green/20 transition-colors disabled:opacity-40"
                      >
                        {savingIds.has(p.id) ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => dismissProposal(p.id)}
                        className="rounded px-2 py-1 text-[10px] text-bone-500 hover:text-bone-300 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input bar */}
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
            <p className="mt-1.5 text-center text-[10px] text-bone-400 opacity-60">{cfg.disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Conversation sidebar (shared between desktop aside + mobile drawer) ───────

function ConvSidebar({
  cfg, convId, convList, onNew, onSelect,
}: {
  cfg: CompanionConfig;
  convId: string | null;
  convList: ConvSummary[];
  onNew: () => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-ink-700 px-3 py-3">
        <span className="text-[10px] uppercase tracking-wider text-bone-400">{cfg.historyLabel}</span>
        <button
          onClick={onNew}
          className="rounded bg-ink-700 px-2 py-1 text-[10px] text-bone-200 hover:bg-ink-600 transition-colors"
        >
          + New
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {convList.length === 0 && (
          <p className="px-3 py-4 text-xs text-bone-500">No conversations yet.</p>
        )}
        {convList.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full px-3 py-2.5 text-left transition-colors hover:bg-ink-800 ${
              convId === c.id ? "bg-ink-800" : ""
            }`}
          >
            <div className="truncate text-xs text-bone-200">{c.title ?? "Untitled"}</div>
            <div className="mt-0.5 text-[10px] text-bone-500">
              {new Date(c.updatedAt).toLocaleDateString()} · {c._count.messages} msgs
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({
  msg, cfg, feedbackId, feedbackNote, setFeedbackId, setFeedbackNote, onFeedback,
}: {
  msg: Message;
  cfg: CompanionConfig;
  feedbackId: string | null;
  feedbackNote: string;
  setFeedbackId: (id: string | null) => void;
  setFeedbackNote: (v: string) => void;
  onFeedback: (msg: Message, vote: "UP" | "DOWN", note?: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end py-2">
        <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-ink-700 px-4 py-2.5">
          <p className="text-sm leading-relaxed text-bone-100 whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  const isOpenNote = feedbackId === msg.id;

  return (
    <div className="flex items-start gap-3 py-2 group">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink-600 bg-ink-800">
        <span className="text-[9px] uppercase tracking-widest text-bone-300">V</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-bone-400">{cfg.assistantBadge(msg.meta)}</div>
        <p className="text-sm leading-relaxed text-bone-50 whitespace-pre-wrap">{msg.content}</p>

        {/* Feedback controls */}
        <div className="mt-2 flex items-center gap-1.5">
          <button
            onClick={() => onFeedback(msg, "UP")}
            className={`rounded p-1 text-xs transition-colors ${
              msg.feedback === "UP"
                ? "text-signal-green"
                : "text-bone-600 opacity-0 group-hover:opacity-100 hover:text-signal-green"
            }`}
            title="Good response"
          >
            <ThumbUp />
          </button>
          <button
            onClick={() => {
              if (msg.feedback === "DOWN" && !isOpenNote) {
                setFeedbackId(msg.id);
              } else {
                onFeedback(msg, "DOWN");
              }
            }}
            className={`rounded p-1 text-xs transition-colors ${
              msg.feedback === "DOWN"
                ? "text-signal-red"
                : "text-bone-600 opacity-0 group-hover:opacity-100 hover:text-signal-red"
            }`}
            title="Poor response"
          >
            <ThumbDown />
          </button>
          {msg.meta?.usedModel && (
            <span className="ml-1 text-[9px] text-bone-600 opacity-0 group-hover:opacity-100 transition-opacity">
              {msg.meta.usedModel}
            </span>
          )}
        </div>

        {/* Feedback note input */}
        {isOpenNote && (
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={feedbackNote}
              onChange={(e) => setFeedbackNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onFeedback(msg, "DOWN", feedbackNote);
                if (e.key === "Escape") { setFeedbackId(null); setFeedbackNote(""); }
              }}
              placeholder="Optional note (Enter to save, Esc to cancel)"
              className="flex-1 rounded border border-ink-600 bg-ink-800 px-2.5 py-1 text-xs text-bone-200 outline-none focus:border-ink-400 placeholder-bone-500"
            />
            <button
              onClick={() => onFeedback(msg, "DOWN", feedbackNote)}
              className="rounded bg-ink-700 px-2 py-1 text-xs text-bone-200 hover:bg-ink-600 transition-colors"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function ThumbUp() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5 6.5 1.5a1 1 0 0 1 1 0V5h3a1 1 0 0 1 1 1l-.8 4.5a1 1 0 0 1-1 .8H4V6.5Z" />
      <line x1="4" y1="6.5" x2="2" y2="6.5" /><line x1="2" y1="6.5" x2="2" y2="11.3" /><line x1="2" y1="11.3" x2="4" y2="11.3" />
    </svg>
  );
}

function ThumbDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 7.5 7.5 12.5a1 1 0 0 1-1 0V9H3.5a1 1 0 0 1-1-1l.8-4.5A1 1 0 0 1 4.3 2.7H10V7.5Z" />
      <line x1="10" y1="7.5" x2="12" y2="7.5" /><line x1="12" y1="7.5" x2="12" y2="2.7" /><line x1="12" y1="2.7" x2="10" y2="2.7" />
    </svg>
  );
}
