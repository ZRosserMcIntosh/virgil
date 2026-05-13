"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email, key, redirect: false });
    setBusy(false);
    if (!res || res.error) {
      // Identical wording for any failure. No hints.
      setError("Access denied.");
      return;
    }
    router.replace("/briefing");
  }

  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-serif text-3xl tracking-wide text-bone-50">VIRGIL</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.32em] text-bone-400">
            Private Command Intelligence
          </div>
        </div>
        <form onSubmit={onSubmit} className="v-card v-card-pad space-y-4">
          <div>
            <label className="v-label">Identity</label>
            <input
              className="v-input mt-1"
              type="email"
              autoComplete="username"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="v-label">Owner Key</label>
            <input
              className="v-input mt-1"
              type="password"
              autoComplete="current-password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>
          <button className="v-btn w-full justify-center" disabled={busy}>
            {busy ? "…" : "Enter"}
          </button>
          {error && (
            <div className="text-center text-sm text-signal-red">{error}</div>
          )}
        </form>
        <p className="mt-6 text-center text-[11px] tracking-wider text-bone-400">
          Unauthorized access is logged.
        </p>
      </div>
    </main>
  );
}
