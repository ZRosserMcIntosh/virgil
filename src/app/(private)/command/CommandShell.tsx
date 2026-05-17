"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Message {
  id: string;          // local UUID (used as key before DB save)
  dbId?: string;       // DB id after persistence
  role: "user" | "assistant";
  content: string;
  meta?: { usedModel?: string; sensitivity?: string; blackDoor?: boolean };
  feedback?: "UP" | "DOWN";
  feedbackNote?: string;
  editedFrom?: string; // original content if edited
  quotedId?: string;   // id of the message being replied to
  quotedSnippet?: string; // short excerpt of the quoted message
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
  id: string;
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

// ── Shell ─────────────────────────────────────────────────────────────────────

export default function CommandShell({ initialConvId }: { initialConvId?: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const companion = (session?.user as any)?.companion === "VERONICA" ? "VERONICA" : "VIRGIL";
  const cfg = companion === "VERONICA" ? VERONICA_CONFIG : VIRGIL_CONFIG;

  const [messages, setMessages]         = useState<Message[]>([]);
  const [input, setInput]               = useState("");
  const [busy, setBusy]                 = useState(false);
  const [convId, setConvId]             = useState<string | null>(null);
  const [convList, setConvList]         = useState<ConvSummary[]>([]);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [feedbackId, setFeedbackId]     = useState<string | null>(null);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [proposals, setProposals]       = useState<MemoryProposal[]>([]);
  const [proposing, setProposing]       = useState(false);
  const [savingIds, setSavingIds]       = useState<Set<string>>(new Set());
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speakingId, setSpeakingId]     = useState<string | null>(null);
  const [listening, setListening]       = useState(false);
  const [convSearch, setConvSearch]     = useState("");
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editDraft, setEditDraft]       = useState("");
  const [paletteOpen, setPaletteOpen]   = useState(false);
  const [quoteMsg, setQuoteMsg]         = useState<Message | null>(null);
  const [modelOverride, setModelOverride] = useState<string>("auto");

  const bottomRef      = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const mediaRecRef    = useRef<MediaRecorder | null>(null);
  const chunksRef      = useRef<Blob[]>([]);

  // ── Load conversation list ────────────────────────────────────────────────

  const loadConvList = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations?companion=${companion}`);
      if (res.ok) setConvList(await res.json());
    } catch { /* silent */ }
  }, [companion]);

  useEffect(() => { loadConvList(); }, [loadConvList]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        startNewConversation();
        textareaRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setEditingId(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // ── Load conversation from URL param on mount ─────────────────────────────

  useEffect(() => {
    if (initialConvId) loadConversation(initialConvId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConvId]);

  // ── Load a specific conversation ─────────────────────────────────────────

  async function loadConversation(id: string) {
    setConvId(id);
    setMessages([]);
    router.replace(`/command/${id}`);
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
    router.push("/command");
  }

  // ── Edit + re-run a user message ─────────────────────────────────────────

  async function commitEdit(msg: Message) {
    const newContent = editDraft.trim();
    if (!newContent || newContent === msg.content) { setEditingId(null); return; }

    // Truncate messages at edit point (remove this message and everything after)
    const idx = messages.findIndex((m) => m.id === msg.id);
    const assistantId = crypto.randomUUID();
    setMessages([
      ...messages.slice(0, idx),
      { ...msg, content: newContent, editedFrom: msg.content },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setEditingId(null);
    setEditDraft("");
    await sendText(newContent, assistantId);
  }

  // ── Send (streaming) ─────────────────────────────────────────────────────

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const assistantId = crypto.randomUUID();
    const quoted = quoteMsg;
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: q,
        ...(quoted && { quotedId: quoted.id, quotedSnippet: quoted.content.slice(0, 120) }),
      },
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setInput("");
    setQuoteMsg(null);
    await sendText(q, assistantId, quoted);
  }

  // ── Feedback ─────────────────────────────────────────────────────────────

  async function submitFeedback(msg: Message, vote: "UP" | "DOWN", note?: string) {
    setMessages((prev) => prev.map((m) =>
      m.id === msg.id ? { ...m, feedback: vote, feedbackNote: note } : m
    ));
    setFeedbackId(null);
    setFeedbackNote("");

    if (!convId || !msg.dbId) return;
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

  // ── Microphone — ElevenLabs STT via MediaRecorder ────────────────────────

  async function toggleMic() {
    // ── Stop recording ──────────────────────────────────────────────────────
    if (listening) {
      mediaRecRef.current?.stop();          // triggers onstop → transcribe
      setListening(false);
      return;
    }

    // ── Start recording ─────────────────────────────────────────────────────
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert("Microphone access denied. Please allow microphone use in your browser settings.");
      return;
    }

    // Pick the best supported container (webm is preferred for Chromium; ogg for Firefox)
    const mimeType =
      MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")           ? "audio/webm"
      : MediaRecorder.isTypeSupported("audio/ogg;codecs=opus") ? "audio/ogg;codecs=opus"
      : "";

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // Stop all tracks so the mic indicator goes away
      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
      chunksRef.current = [];

      if (blob.size < 500) return; // too short to be useful

      // Transcribe via ElevenLabs
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      form.append("companion", companion);

      try {
        const res = await fetch("/api/virgil/transcribe", { method: "POST", body: form });
        if (!res.ok) return;
        const { text } = await res.json();
        if (!text) return;

        // If auto-send mode: send immediately. Otherwise: drop into input box.
        const q = text.trim();
        const assistantId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: q },
          { id: assistantId,         role: "assistant", content: "" },
        ]);
        sendText(q, assistantId);
      } catch { /* silent */ }
    };

    mediaRecRef.current = recorder;
    recorder.start();
    setListening(true);
  }

  // ── sendText (core — used by both send() and voice) ──────────────────────

  async function sendText(q: string, assistantId: string, quoted?: Message | null) {
    setBusy(true);
    let fullText = "";
    let meta: Message["meta"] = {};

    // Prepend quoted context for the model if this is a reply
    const contextualInput = quoted
      ? `[Replying to: "${quoted.content.slice(0, 200)}${quoted.content.length > 200 ? "…" : ""}"]\n\n${q}`
      : q;

    try {
      const res = await fetch("/api/virgil/stream", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-virgil-companion": companion,
        },
        body: JSON.stringify({
          input: contextualInput,
          ...(modelOverride !== "auto" && { modelOverride }),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          if (payload.startsWith("[META]")) {
            try { meta = JSON.parse(payload.slice(6)); } catch { /* ignore */ }
            continue;
          }
          const chunk = payload.replace(/\\n/g, "\n");
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: fullText } : m)
          );
        }
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: fullText, meta } : m)
      );

      if (voiceEnabled && fullText) {
        speakMessage({ id: assistantId, role: "assistant", content: fullText, meta });
      }

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
        // Reflect the new conversation in the URL
        router.replace(`/command/${cid}`);
      }
      if (cid) {
        await fetch(`/api/conversations/${cid}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify([
            { role: "user",      content: q,        meta: null },
            { role: "assistant", content: fullText,  meta: meta ?? null },
          ]),
        });

        // Auto-generate title for new conversations (fire and forget)
        if (!convId) {
          fetch(`/api/conversations/${cid}/auto-title`, { method: "POST" })
            .then((r) => r.json())
            .then(({ title }) => {
              if (title) setConvList((prev) => prev.map((c) => c.id === cid ? { ...c, title } : c));
            })
            .catch(() => { /* silent */ });
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: companion === "VERONICA" ? "Desculpe, houve um erro de conexão." : "Connection error. Please try again." }
            : m
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function speakMessage(msg: Message) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (speakingId === msg.id) {
      setSpeakingId(null);
      return;
    }

    setSpeakingId(msg.id);
    try {
      const res = await fetch("/api/virgil/speak", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: msg.content, companion }),
      });
      if (!res.ok) { setSpeakingId(null); return; }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setSpeakingId(null); URL.revokeObjectURL(url); };
      await audio.play();
    } catch {
      setSpeakingId(null);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
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
            search={convSearch}
            onSearchChange={setConvSearch}
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
              search={convSearch}
              onSearchChange={setConvSearch}
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
            <div className="ml-auto flex items-center gap-2">
              {/* Voice toggle */}
              <button
                onClick={() => {
                  if (voiceEnabled && audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                    setSpeakingId(null);
                  }
                  setVoiceEnabled((v) => !v);
                }}
                className={`rounded p-1.5 text-bone-400 transition-colors hover:bg-ink-800 ${voiceEnabled ? "text-signal-green" : ""}`}
                title={voiceEnabled ? "Voice on — click to disable" : "Enable voice"}
              >
                <SpeakerIcon active={voiceEnabled} />
              </button>
              {convId && (
                <>
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
                </>
              )}
            </div>
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
                  onSpeak={voiceEnabled ? speakMessage : undefined}
                  isSpeaking={speakingId === msg.id}
                  editingId={editingId}
                  editDraft={editDraft}
                  setEditingId={setEditingId}
                  setEditDraft={setEditDraft}
                  onCommitEdit={commitEdit}
                  onReply={setQuoteMsg}
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
          <div className="mx-auto max-w-3xl space-y-1.5">
            {/* Quote preview bar */}
            {quoteMsg && (
              <div className="flex items-start gap-2 rounded-md border border-ink-600 bg-ink-800/60 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-bone-500 mb-0.5">Replying to</div>
                  <div className="truncate text-xs text-bone-300">{quoteMsg.content.slice(0, 140)}{quoteMsg.content.length > 140 ? "…" : ""}</div>
                </div>
                <button
                  onClick={() => setQuoteMsg(null)}
                  className="shrink-0 text-bone-500 hover:text-bone-300 transition-colors"
                  title="Cancel reply"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <line x1="2" y1="2" x2="10" y2="10" /><line x1="10" y1="2" x2="2" y2="10" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 focus-within:border-ink-500 transition-colors">
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none bg-transparent text-sm text-bone-100 placeholder-bone-400 outline-none"
                rows={1}
                placeholder={quoteMsg ? "Reply…" : cfg.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={busy}
              />
              {/* Model selector */}
              <select
                value={modelOverride}
                onChange={(e) => setModelOverride(e.target.value)}
                className="shrink-0 rounded bg-ink-700 border-none text-[10px] text-bone-400 px-1.5 py-1 outline-none hover:text-bone-200 transition-colors cursor-pointer"
                title="Model override"
              >
                <option value="auto">Auto</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="gpt-4o-mini">GPT-4o mini</option>
                <option value="claude-3-5-sonnet">Claude Sonnet</option>
                <option value="claude-3-haiku">Claude Haiku</option>
              </select>
              {/* Microphone button */}
              <button
                onClick={toggleMic}
                disabled={busy}
                className={`shrink-0 rounded-md p-1.5 transition-colors disabled:opacity-30 ${
                  listening
                    ? "bg-signal-red/20 text-signal-red animate-pulse"
                    : "text-bone-400 hover:bg-ink-700 hover:text-bone-200"
                }`}
                title={listening ? "Tap to stop recording" : "Speak — powered by ElevenLabs"}
              >
                <MicIcon active={listening} />
              </button>
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

    {/* ── Command Palette ── */}
    {paletteOpen && (
      <CommandPalette
        onClose={() => setPaletteOpen(false)}
        onNewConv={() => { startNewConversation(); setPaletteOpen(false); textareaRef.current?.focus(); }}
        onSearch={(q) => { setConvSearch(q); setSidebarOpen(true); setPaletteOpen(false); }}
        convList={convList}
        onSelectConv={(id) => { loadConversation(id); setPaletteOpen(false); }}
      />
    )}
    </>
  );
}

// ── Conversation sidebar ──────────────────────────────────────────────────────

function ConvSidebar({
  cfg, convId, convList, onNew, onSelect, search, onSearchChange,
}: {
  cfg: CompanionConfig;
  convId: string | null;
  convList: ConvSummary[];
  onNew: () => void;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  const filtered = search.trim()
    ? convList.filter((c) => (c.title ?? "").toLowerCase().includes(search.toLowerCase()))
    : convList;

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
      <div className="px-2 py-2">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
          className="w-full rounded border border-ink-600 bg-ink-800 px-2.5 py-1.5 text-[11px] text-bone-200 placeholder-bone-500 outline-none focus:border-ink-400"
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-xs text-bone-500">{search ? "No matches." : "No conversations yet."}</p>
        )}
        {filtered.map((c) => (
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
  onSpeak, isSpeaking, editingId, editDraft, setEditingId, setEditDraft, onCommitEdit, onReply,
}: {
  msg: Message;
  cfg: CompanionConfig;
  feedbackId: string | null;
  feedbackNote: string;
  setFeedbackId: (id: string | null) => void;
  setFeedbackNote: (v: string) => void;
  onFeedback: (msg: Message, vote: "UP" | "DOWN", note?: string) => void;
  onSpeak?: (msg: Message) => void;
  isSpeaking?: boolean;
  editingId: string | null;
  editDraft: string;
  setEditingId: (id: string | null) => void;
  setEditDraft: (v: string) => void;
  onCommitEdit: (msg: Message) => void;
  onReply: (msg: Message) => void;
}) {
  const isEditing = editingId === msg.id;

  if (msg.role === "user") {
    return (
      <div className="flex justify-end py-2 group">
        <div className="max-w-[80%] relative">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <textarea
                autoFocus
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                title="Edit your message"
                placeholder="Edit your message…"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onCommitEdit(msg); }
                  if (e.key === "Escape") { setEditingId(null); setEditDraft(""); }
                }}
                className="w-full min-w-[260px] resize-none rounded-lg border border-ink-500 bg-ink-700 px-3 py-2 text-sm text-bone-100 outline-none focus:border-ink-400"
                rows={Math.max(2, editDraft.split("\n").length)}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setEditingId(null); setEditDraft(""); }}
                  className="rounded px-2.5 py-1 text-xs text-bone-400 hover:text-bone-200 transition-colors"
                >Cancel</button>
                <button
                  onClick={() => onCommitEdit(msg)}
                  className="rounded bg-ink-600 px-2.5 py-1 text-xs text-bone-100 hover:bg-ink-500 transition-colors"
                >Re-run</button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl rounded-tr-sm bg-ink-700 px-4 py-2.5 relative">
              {/* Quoted snippet */}
              {msg.quotedSnippet && (
                <div className="mb-2 rounded border-l-2 border-ink-400 bg-ink-800/60 px-2.5 py-1.5 text-xs text-bone-400 italic">
                  {msg.quotedSnippet.slice(0, 120)}{msg.quotedSnippet.length > 120 ? "…" : ""}
                </div>
              )}
              <p className="text-sm leading-relaxed text-bone-100 whitespace-pre-wrap">{msg.content}</p>
              {msg.editedFrom && (
                <span className="absolute -bottom-4 right-0 text-[9px] text-bone-600 italic">edited</span>
              )}
            </div>
          )}
          {/* Left action buttons on hover */}
          {!isEditing && (
            <div className="absolute -left-16 top-1.5 hidden group-hover:flex items-center gap-0.5">
              <button
                onClick={() => { setEditDraft(msg.content); setEditingId(msg.id); }}
                className="rounded p-1 text-bone-600 hover:text-bone-300 transition-colors"
                title="Edit and re-run"
              >
                <EditIcon />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(msg.content)}
                className="rounded p-1 text-bone-600 hover:text-bone-300 transition-colors"
                title="Copy"
              >
                <CopyIcon />
              </button>
            </div>
          )}
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
        {/* Markdown rendered response */}
        <div className="prose prose-invert prose-sm max-w-none text-bone-50
          prose-headings:text-bone-100 prose-headings:font-serif
          prose-p:text-bone-50 prose-p:leading-relaxed
          prose-a:text-signal-amber prose-a:no-underline hover:prose-a:underline
          prose-code:text-signal-green prose-code:bg-ink-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
          prose-pre:bg-ink-900 prose-pre:border prose-pre:border-ink-700 prose-pre:rounded-lg
          prose-blockquote:border-l-ink-600 prose-blockquote:text-bone-400
          prose-li:text-bone-50 prose-strong:text-bone-100 prose-hr:border-ink-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {msg.content}
          </ReactMarkdown>
        </div>

        {/* Feedback + voice controls */}
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
          {onSpeak && (
            <button
              onClick={() => onSpeak(msg)}
              className={`rounded p-1 transition-colors ${
                isSpeaking
                  ? "text-signal-green"
                  : "text-bone-600 opacity-0 group-hover:opacity-100 hover:text-bone-200"
              }`}
              title={isSpeaking ? "Stop" : "Read aloud"}
            >
              <SpeakerIcon active={!!isSpeaking} />
            </button>
          )}
          {/* Copy button */}
          <button
            onClick={() => navigator.clipboard.writeText(msg.content)}
            className="rounded p-1 text-bone-600 opacity-0 group-hover:opacity-100 hover:text-bone-300 transition-opacity"
            title="Copy response"
          >
            <CopyIcon />
          </button>
          {/* Reply button */}
          <button
            onClick={() => onReply(msg)}
            className="rounded p-1 text-bone-600 opacity-0 group-hover:opacity-100 hover:text-bone-300 transition-opacity"
            title="Quote-reply"
          >
            <ReplyIcon />
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

function SpeakerIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 5h2.5L8 2v10L4.5 9H2V5Z" />
      <path d="M10 4.5a3.5 3.5 0 0 1 0 5" />
      {active && <path d="M11.5 2.5a6 6 0 0 1 0 9" />}
    </svg>
  );
}

function MicIcon({ active }: { active: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4.5" y="1" width="5" height="7" rx="2.5" fill={active ? "currentColor" : "none"} />
      <path d="M2 7a5 5 0 0 0 10 0" />
      <line x1="7" y1="12" x2="7" y2="14" />
      <line x1="4.5" y1="14" x2="9.5" y2="14" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="8" height="8" rx="1" />
      <path d="M10 4V3a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2.5 11.5 4.5 5 11H3V9L9.5 2.5Z" />
      <line x1="8" y1="4" x2="10" y2="6" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4,3 1,6 4,9" />
      <path d="M1 6h7a4 4 0 0 1 4 4v1" />
    </svg>
  );
}

// ── Command Palette ───────────────────────────────────────────────────────────

function CommandPalette({
  onClose, onNewConv, onSearch, convList, onSelectConv,
}: {
  onClose: () => void;
  onNewConv: () => void;
  onSearch: (q: string) => void;
  convList: ConvSummary[];
  onSelectConv: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filteredConvs = query.trim()
    ? convList.filter((c) => (c.title ?? "").toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : convList.slice(0, 6);

  const actions = [
    { label: "New conversation", hint: "⌘K", action: onNewConv },
    { label: "Search conversations", hint: "", action: () => onSearch(query) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl border border-ink-600 bg-ink-900 shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-ink-700 px-4 py-3">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 text-bone-500">
            <circle cx="6" cy="6" r="4" /><line x1="9.5" y1="9.5" x2="13" y2="13" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-sm text-bone-100 placeholder-bone-500 outline-none"
          />
          <kbd className="rounded border border-ink-600 px-1.5 py-0.5 text-[10px] text-bone-500">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-ink-800">
          {/* Quick actions */}
          <div className="px-2 py-1">
            <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-bone-600">Actions</div>
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm text-bone-200 hover:bg-ink-700 transition-colors"
              >
                <span>{a.label}</span>
                {a.hint && <kbd className="text-[10px] text-bone-500">{a.hint}</kbd>}
              </button>
            ))}
          </div>
          {/* Conversations */}
          {filteredConvs.length > 0 && (
            <div className="px-2 py-1">
              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-bone-600">Conversations</div>
              {filteredConvs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectConv(c.id)}
                  className="flex w-full items-center justify-between rounded px-3 py-2.5 text-sm text-bone-200 hover:bg-ink-700 transition-colors"
                >
                  <span className="truncate">{c.title ?? "Untitled"}</span>
                  <span className="shrink-0 text-[10px] text-bone-500">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
          {query && filteredConvs.length === 0 && (
            <div className="px-5 py-4 text-sm text-bone-500">No conversations matching &ldquo;{query}&rdquo;</div>
          )}
        </div>
        <div className="border-t border-ink-800 px-4 py-2 text-[10px] text-bone-600">
          ↑↓ navigate · Enter select · Esc close · ⌘/ toggle
        </div>
      </div>
    </div>
  );
}
