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
  const [questions, setQuestions]         = useState<Question[]>([]);
  const [inferences, setInferences]       = useState<Inference[]>([]);
  const [depth, setDepth]                 = useState<"LIGHT" | "STANDARD" | "DEEP">("STANDARD");
  const [domain, setDomain]               = useState<string>("");
  const [loading, setLoading]             = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [seeded, setSeeded]               = useState<boolean | null>(null);

  const loadInferences = useCallback(async () => {
    const res = await fetch("/api/virgil/memory-inferences");
    if (res.ok) setInferences(await res.json());
  }, []);

  const checkSeeded = useCallback(async () => {
    const res = await fetch("/api/virgil/questions?status=UNASKED&limit=1");
    if (res.ok) {
      const data = await res.json();
      setSeeded(data.length > 0);
    }
  }, []);

  useEffect(() => {
    checkSeeded();
    loadInferences();
  }, [checkSeeded, loadInferences]);

  async function seedStarters() {
    setLoading(true);
    await fetch("/api/virgil/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "seed_starters" }) });
    setSeeded(true);
    setLoading(false);
  }

  async function startSession() {
    setLoading(true);
    const res = await fetch("/api/virgil/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start_session", depth, domain: domain || undefined }),
    });
    if (res.ok) {
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setSessionActive(true);
    }
    setLoading(false);
  }

  async function answerQuestion(id: string, answer: string, generateFollowups: boolean) {
    const res = await fetch(`/api/virgil/questions/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer, generateFollowups }),
    });
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      await loadInferences();
    }
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/virgil/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function approveInference(id: string) {
    await fetch(`/api/virgil/memory-inferences/${id}/approve`, { method: "POST" });
    setInferences((prev) => prev.filter((i) => i.id !== id));
  }

  async function rejectInference(id: string) {
    await fetch(`/api/virgil/memory-inferences/${id}/reject`, { method: "POST" });
    setInferences((prev) => prev.filter((i) => i.id !== id));
  }

  // ── First visit: not seeded ──────────────────────────────────────────────
  if (seeded === false) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="v-card v-card-pad max-w-xl space-y-4">
          <p className="text-bone-100">
            Virgil has not yet completed a foundational calibration session.
          </p>
          <p className="text-sm text-bone-400">
            This first session will ask a small set of questions about command style,
            faith, judgment, and long-term priorities. The purpose is to help Virgil
            advise you with greater precision.
          </p>
          <button
            className="v-btn"
            onClick={seedStarters}
            disabled={loading}
          >
            {loading ? "Preparing…" : "Generate Foundational Questions"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Header />

      {/* Session Controls */}
      {!sessionActive && (
        <section className="v-card v-card-pad space-y-4 max-w-2xl">
          <div className="v-label">Session Controls</div>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="v-label mb-1">Session Depth</label>
              <select
                title="Session depth"
                className="v-input"
                onChange={(e) => setDepth(e.target.value as "LIGHT" | "STANDARD" | "DEEP")}
              >
                <option value="LIGHT">Light — 1 question, no heavy topics</option>
                <option value="STANDARD">Standard — 3 questions</option>
                <option value="DEEP">Deep — 5 questions, all topics</option>
              </select>
            </div>
            <div>
              <label className="v-label mb-1">Domain</label>
              <select
                title="Domain filter"
                className="v-input"
                onChange={(e) => setDomain(e.target.value)}
              >
                <option value="">All Domains</option>
                {Object.entries(QUESTION_DOMAIN_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="v-btn" onClick={startSession} disabled={loading}>
            {loading ? "Preparing questions…" : "Start Question Session"}
          </button>
        </section>
      )}

      {/* Active Questions */}
      {sessionActive && questions.length > 0 && (
        <section className="space-y-4">
          <div className="v-label">Active Questions — {questions.length} remaining</div>
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

      {sessionActive && questions.length === 0 && (
        <section className="v-card v-card-pad max-w-xl space-y-3">
          <div className="text-bone-100 font-medium">Session complete.</div>
          <p className="text-sm text-bone-400">
            All questions in this session have been answered or deferred. Virgil will
            incorporate approved memories into future responses.
          </p>
          <button className="v-btn" onClick={() => { setSessionActive(false); setQuestions([]); }}>
            Start Another Session
          </button>
        </section>
      )}

      {/* Memory Review Panel */}
      {inferences.length > 0 && (
        <section className="space-y-4">
          <div className="v-label">Memory Review — {inferences.length} pending</div>
          <p className="text-xs text-bone-400">
            Virgil will not save these memories until you approve them.
            Sacred memories require explicit approval and are never auto-saved.
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {inferences.map((inf) => (
              <InferenceCard
                key={inf.id}
                inference={inf}
                onApprove={approveInference}
                onReject={rejectInference}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="space-y-1">
      <div className="v-label">Personal Question Mode</div>
      <h1 className="font-serif text-3xl text-bone-50">Question the King</h1>
      <p className="text-sm text-bone-400">
        Virgil learns how to serve you better by asking better questions over time.
      </p>
    </header>
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
  const [answer, setAnswer]   = useState("");
  const [saving, setSaving]   = useState(false);
  const [followups, setFollowups] = useState(false);

  async function submit(withFollowups: boolean) {
    if (!answer.trim()) return;
    setSaving(true);
    await onAnswer(question.id, answer, withFollowups);
    setSaving(false);
  }

  return (
    <div className="v-card v-card-pad space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded border border-ink-600 px-2 py-0.5 text-bone-300">
            {QUESTION_DOMAIN_LABELS[question.domain] ?? question.domain}
          </span>
          <span className={`rounded border px-2 py-0.5 text-xs ${WEIGHT_COLORS[question.emotionalWeight]}`}>
            {question.emotionalWeight}
          </span>
          <span className="text-bone-500">Priority {question.priority}</span>
        </div>
      </div>

      {/* Question */}
      <p className="text-bone-100 text-[15px] leading-relaxed">{question.question}</p>

      {/* Reason */}
      <p className="text-xs text-bone-400 italic">
        Sir, I am asking because: {question.reason}
      </p>

      {/* Answer box */}
      <textarea
        className="v-input w-full min-h-[96px] resize-y"
        placeholder="Answer as briefly or as fully as you want. Virgil will distill the useful parts afterward."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      />

      {/* Follow-ups toggle */}
      <label className="flex items-center gap-2 text-xs text-bone-400 cursor-pointer">
        <input
          type="checkbox"
          checked={followups}
          onChange={(e) => setFollowups(e.target.checked)}
          className="rounded"
        />
        Generate follow-up questions from this answer
      </label>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          className="v-btn"
          onClick={() => submit(followups)}
          disabled={saving || !answer.trim()}
        >
          {saving ? "Saving…" : "Save Answer"}
        </button>
        <button
          className="v-btn-ghost text-sm"
          onClick={() => onStatus(question.id, "DEFERRED")}
          disabled={saving}
        >
          Defer
        </button>
        <button
          className="v-btn-ghost text-sm text-bone-500"
          onClick={() => onStatus(question.id, "RETIRED")}
          disabled={saving}
        >
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
          Sacred memory — requires explicit approval.
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
        <button
          className="v-btn text-sm"
          onClick={() => act(() => onApprove(inference.id))}
          disabled={acting}
        >
          Approve
        </button>
        <button
          className="v-btn-ghost text-sm text-bone-500"
          onClick={() => act(() => onReject(inference.id))}
          disabled={acting}
        >
          Reject
        </button>
      </div>
    </div>
  );
}
