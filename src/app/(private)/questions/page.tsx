"use client";

import { useEffect, useState, useCallback } from "react";
import { QUESTION_DOMAIN_LABELS } from "@/lib/virgil/questions/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  domain: string;
  question: string;
  reason: string;
  priority: number;
  emotionalWeight: "LIGHT" | "MODERATE" | "HEAVY";
  timing: string;
  status: string;
  answers: { answer: string; createdAt: string }[];
}

interface Inference {
  id: string;
  proposedMemory: string;
  category: string;
  confidence: number;
  sensitivity: string;
  inferenceReason: string;
  status: string;
  question?: { question: string; domain: string } | null;
}

type PageState = "loading" | "error" | "unseeded" | "idle" | "session" | "session_complete";

// ── Weight badge colors ───────────────────────────────────────────────────────

const WEIGHT_COLORS = {
  LIGHT:    "text-signal-green border-signal-green/30 bg-signal-green/10",
  MODERATE: "text-signal-amber border-signal-amber/30 bg-signal-amber/10",
  HEAVY:    "text-signal-red   border-signal-red/30   bg-signal-red/10",
};

const SENSITIVITY_COLORS: Record<string, string> = {
  LOW:    "text-signal-green",
  MEDIUM: "text-signal-amber",
  HIGH:   "text-signal-red",
  SACRED: "text-signal-red font-semibold",
};

// ── Main page component ──────────────────────────────────────────────────────

export default function QuestionsPage() {
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg]   = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [inferences, setInferences] = useState<Inference[]>([]);
  const [depth, setDepth]         = useState<"LIGHT" | "STANDARD" | "DEEP">("STANDARD");
  const [domain, setDomain]       = useState<string>("");
  const [busy, setBusy]           = useState(false);

  const loadInferences = useCallback(async () => {
    try {
      const res = await fetch("/api/virgil/memory-inferences");
      if (res.ok) setInferences(await res.json());
    } catch { /* non-blocking */ }
  }, []);

  const initialLoad = useCallback(async () => {
    try {
      const res = await fetch("/api/virgil/questions?status=UNASKED&limit=1");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.message ?? `API error ${res.status} — the database tables may not exist yet. Run the schema SQL in Supabase.`);
        setPageState("error");
        return;
      }
      const data = await res.json();
      setPageState(data.length > 0 ? "idle" : "unseeded");
      loadInferences();
    } catch (e: unknown) {
      setErrorMsg(String(e));
      setPageState("error");
    }
  }, [loadInferences]);

  useEffect(() => { initialLoad(); }, [initialLoad]);

  // ── Seed + immediately start a session ──────────────────────────────────
  async function seedAndStart() {
    setBusy(true);
    setErrorMsg("");
    try {
      const seedRes = await fetch("/api/virgil/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed_starters" }),
      });
      if (!seedRes.ok) throw new Error((await seedRes.json().catch(() => ({}))).message ?? `Seed failed (${seedRes.status})`);
      await doStartSession();
    } catch (e: unknown) {
      setErrorMsg(String(e));
      setPageState("error");
    } finally {
      setBusy(false);
    }
  }

  // ── Start a session (questions already exist) ───────────────────────────
  async function startSession() {
    setBusy(true);
    setErrorMsg("");
    try {
      await doStartSession();
    } catch (e: unknown) {
      setErrorMsg(String(e));
    } finally {
      setBusy(false);
    }
  }

  async function doStartSession() {
    const res = await fetch("/api/virgil/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start_session", depth, domain: domain || undefined }),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? `Session failed (${res.status})`);
    const data = await res.json();
    const qs: Question[] = data.questions ?? [];
    setQuestions(qs);
    setPageState(qs.length > 0 ? "session" : "session_complete");
  }

  async function answerQuestion(id: string, answer: string, generateFollowups: boolean) {
    const res = await fetch(`/api/virgil/questions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, generateFollowups }),
    });
    if (res.ok) {
      setQuestions((prev) => {
        const next = prev.filter((q) => q.id !== id);
        if (next.length === 0) setPageState("session_complete");
        return next;
      });
      await loadInferences();
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/virgil/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setQuestions((prev) => {
      const next = prev.filter((q) => q.id !== id);
      if (next.length === 0) setPageState("session_complete");
      return next;
    });
  }

  async function approveInference(id: string) {
    await fetch(`/api/virgil/memory-inferences/${id}/approve`, { method: "POST" });
    setInferences((prev) => prev.filter((i) => i.id !== id));
  }

  async function rejectInference(id: string) {
    await fetch(`/api/virgil/memory-inferences/${id}/reject`, { method: "POST" });
    setInferences((prev) => prev.filter((i) => i.id !== id));
  }

  // ── Render states ────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <div className="space-y-6">
        <Header />
        <div className="flex items-center gap-3 text-sm text-bone-400">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-bone-400 border-t-transparent" />
          Loading…
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="space-y-6">
        <Header />
        <div className="v-card v-card-pad max-w-2xl space-y-3 border-signal-red/40">
          <div className="v-label text-signal-red">System Error</div>
          <p className="text-sm text-bone-100">{errorMsg}</p>
          <p className="text-xs text-bone-400">
            The most likely cause is that the new database tables have not yet been
            created in Supabase. Run the schema SQL from the last migration diff in
            the Supabase SQL Editor, then refresh this page.
          </p>
          <button className="v-btn" onClick={() => { setPageState("loading"); initialLoad(); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (pageState === "unseeded") {
    return (
      <div className="space-y-6">
        <Header />
        <div className="v-card v-card-pad max-w-xl space-y-4">
          <p className="text-bone-100 font-medium">Foundational calibration not yet started.</p>
          <p className="text-sm text-bone-400">
            Virgil will generate a starter bank of questions about command style, faith,
            judgment, and long-term priorities — then begin the first session immediately.
          </p>
          <button className="v-btn" onClick={seedAndStart} disabled={busy}>
            {busy
              ? <><Spinner /> Preparing first session…</>
              : "Begin Calibration"}
          </button>
          {errorMsg && <p className="text-xs text-signal-red">{errorMsg}</p>}
        </div>
      </div>
    );
  }

  if (pageState === "session_complete") {
    return (
      <div className="space-y-8">
        <Header />
        <div className="v-card v-card-pad max-w-xl space-y-3">
          <div className="text-bone-100 font-medium">Session complete.</div>
          <p className="text-sm text-bone-400">
            All questions answered or deferred. Review any pending memories below,
            then start another session when ready.
          </p>
          <button className="v-btn" onClick={() => { setPageState("idle"); setQuestions([]); }}>
            Start Another Session
          </button>
        </div>
        <MemoryPanel inferences={inferences} onApprove={approveInference} onReject={rejectInference} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header />

      {/* Error banner */}
      {errorMsg && (
        <div className="rounded border border-signal-red/40 bg-signal-red/10 px-4 py-3 text-sm text-signal-red">
          {errorMsg}
        </div>
      )}

      {/* Session Controls */}
      {pageState === "idle" && (
        <section className="v-card v-card-pad space-y-5 max-w-2xl">
          <div className="v-label">New Session</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="v-label" htmlFor="depth-select">Session Depth</label>
              <select
                id="depth-select"
                className="v-input"
                value={depth}
                onChange={(e) => setDepth(e.target.value as "LIGHT" | "STANDARD" | "DEEP")}
              >
                <option value="LIGHT">Light — 1 question</option>
                <option value="STANDARD">Standard — 3 questions</option>
                <option value="DEEP">Deep — 5 questions</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="v-label" htmlFor="domain-select">Domain</label>
              <select
                id="domain-select"
                className="v-input"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              >
                <option value="">All Domains</option>
                {Object.entries(QUESTION_DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="v-btn" onClick={startSession} disabled={busy}>
            {busy ? <><Spinner /> Preparing…</> : "Start Session"}
          </button>
        </section>
      )}

      {/* Active Questions */}
      {pageState === "session" && questions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="v-label">{questions.length} question{questions.length !== 1 ? "s" : ""} remaining</div>
            <button
              className="v-btn-ghost text-xs"
              onClick={() => { setPageState("idle"); setQuestions([]); }}
            >
              End Session
            </button>
          </div>
          {questions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onAnswer={answerQuestion}
              onStatus={updateStatus}
            />
          ))}
        </section>
      )}

      {/* Memory Review */}
      <MemoryPanel inferences={inferences} onApprove={approveInference} onReject={rejectInference} />
    </div>
  );
}

// ── Shared components ─────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="space-y-1">
      <div className="v-label">Personal Question Mode</div>
      <h1 className="font-serif text-3xl text-bone-50">Know Thyself</h1>
      <p className="text-sm text-bone-400">
        Virgil learns how to serve better by asking better questions over time.
      </p>
    </header>
  );
}

function Spinner() {
  return (
    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
  );
}

function MemoryPanel({
  inferences,
  onApprove,
  onReject,
}: {
  inferences: Inference[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  if (inferences.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="v-label">Memory Review — {inferences.length} pending</div>
      <p className="text-xs text-bone-400">
        Virgil will not save these until you approve them.
        Sacred memories require explicit approval and are never auto-saved.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        {inferences.map((inf) => (
          <InferenceCard key={inf.id} inference={inf} onApprove={onApprove} onReject={onReject} />
        ))}
      </div>
    </section>
  );
}

function QuestionCard({
  question,
  onAnswer,
  onStatus,
}: {
  question: Question;
  onAnswer: (id: string, answer: string, generateFollowups: boolean) => Promise<void>;
  onStatus: (id: string, status: string) => Promise<void>;
}) {
  const [answer, setAnswer]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [followups, setFollowups] = useState(false);

  async function submit() {
    if (!answer.trim() || saving) return;
    setSaving(true);
    await onAnswer(question.id, answer, followups);
    setSaving(false);
  }

  return (
    <div className="v-card v-card-pad space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded border border-ink-600 px-2 py-0.5 text-bone-300">
          {QUESTION_DOMAIN_LABELS[question.domain] ?? question.domain}
        </span>
        <span className={`rounded border px-2 py-0.5 ${WEIGHT_COLORS[question.emotionalWeight]}`}>
          {question.emotionalWeight}
        </span>
        <span className="text-bone-500">Priority {question.priority}</span>
      </div>

      <p className="text-bone-100 text-[15px] leading-relaxed">{question.question}</p>

      <p className="text-xs text-bone-400 italic">
        Sir, I am asking because: {question.reason}
      </p>

      <textarea
        className="v-input w-full min-h-[96px] resize-y"
        placeholder="Answer as briefly or as fully as you wish. Virgil will distill the rest."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) submit(); }}
      />

      <label className="flex items-center gap-2 text-xs text-bone-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={followups}
          onChange={(e) => setFollowups(e.target.checked)}
          className="rounded"
        />
        Generate follow-up questions from this answer
      </label>

      <div className="flex flex-wrap gap-2">
        <button className="v-btn" onClick={submit} disabled={saving || !answer.trim()}>
          {saving ? <><Spinner /> Saving…</> : "Save Answer"}
        </button>
        <button className="v-btn-ghost" onClick={() => onStatus(question.id, "DEFERRED")} disabled={saving}>
          Defer
        </button>
        <button className="v-btn-ghost text-bone-500" onClick={() => onStatus(question.id, "RETIRED")} disabled={saving}>
          Retire
        </button>
      </div>
    </div>
  );
}

function InferenceCard({
  inference,
  onApprove,
  onReject,
}: {
  inference: Inference;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}) {
  const [acting, setActing] = useState(false);

  async function act(fn: () => Promise<void>) {
    setActing(true);
    await fn();
    setActing(false);
  }

  return (
    <div className="v-card v-card-pad space-y-3">
      {inference.sensitivity === "SACRED" && (
        <div className="rounded bg-signal-red/10 border border-signal-red/30 px-3 py-1.5 text-xs text-signal-red">
          Sacred memory — explicit approval required.
        </div>
      )}
      <p className="text-bone-100 text-sm leading-relaxed">{inference.proposedMemory}</p>
      <div className="flex flex-wrap gap-3 text-xs text-bone-400">
        <span>Category: <span className="text-bone-200">{inference.category}</span></span>
        <span>Confidence: <span className="text-bone-200">{Math.round(inference.confidence * 100)}%</span></span>
        <span className={SENSITIVITY_COLORS[inference.sensitivity] ?? "text-bone-300"}>
          {inference.sensitivity}
        </span>
      </div>
      {inference.inferenceReason && (
        <p className="text-xs text-bone-500 italic">{inference.inferenceReason}</p>
      )}
      <div className="flex gap-2">
        <button className="v-btn" onClick={() => act(() => onApprove(inference.id))} disabled={acting}>
          Approve
        </button>
        <button className="v-btn-ghost text-bone-500" onClick={() => act(() => onReject(inference.id))} disabled={acting}>
          Reject
        </button>
      </div>
    </div>
  );
}

// ── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  domain: string;
  question: string;
  reason: string;
  priority: number;
  emotionalWeight: "LIGHT" | "MODERATE" | "HEAVY";
  timing: string;
  status: string;
  answers: { answer: string; createdAt: string }[];
}

interface Inference {
  id: string;
  proposedMemory: string;
  category: string;
  confidence: number;
  sensitivity: string;
  inferenceReason: string;
  status: string;
  question?: { question: string; domain: string } | null;
}

