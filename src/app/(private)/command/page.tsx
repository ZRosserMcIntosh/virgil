"use client";

import { useState } from "react";

interface Reply {
  message: string;
  usedModel?: string;
  sensitivity?: string;
  blackDoor?: boolean;
}

export default function CommandPage() {
  const [input, setInput] = useState("");
  const [replies, setReplies] = useState<{ q: string; r: Reply }[]>([]);
  const [busy, setBusy] = useState(false);

  async function ask() {
    const q = input.trim();
    if (!q || busy) return;
    setBusy(true);
    setInput("");
    try {
      const res = await fetch("/api/virgil", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ input: q }),
      });
      const r: Reply = await res.json();
      setReplies((prev) => [{ q, r }, ...prev]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="v-label">Command</div>
        <h1 className="mt-1 font-serif text-3xl text-bone-50">Ask Virgil</h1>
      </header>

      <div className="v-card v-card-pad">
        <div className="flex gap-2">
          <input
            className="v-input"
            placeholder="Brief me. Or give an order."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
          />
          <button className="v-btn" onClick={ask} disabled={busy}>
            {busy ? "…" : "Send"}
          </button>
        </div>
        <div className="mt-2 text-[11px] text-bone-400">
          Inputs are classified locally before any cloud model is invoked. Sensitive data
          is redacted or kept local. External actions are prepared, not executed.
        </div>
      </div>

      <div className="space-y-4">
        {replies.map((row, i) => (
          <div key={i} className="v-card v-card-pad">
            <div className="text-xs uppercase tracking-wider text-bone-400">You</div>
            <div className="text-sm text-bone-100">{row.q}</div>
            <div className="mt-3 text-xs uppercase tracking-wider text-bone-400">
              Virgil {row.r.blackDoor ? "· black door" : ""}
            </div>
            <div className="text-bone-50">{row.r.message}</div>
            {(row.r.usedModel || row.r.sensitivity) && (
              <div className="mt-2 text-[10px] uppercase tracking-wider text-bone-400">
                {row.r.usedModel ? `model: ${row.r.usedModel}` : ""}
                {row.r.sensitivity ? `  ·  sensitivity: ${row.r.sensitivity}` : ""}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
