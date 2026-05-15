"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "rosser" | "stella-login" | "stella-onboard";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const principal = params.get("p"); // "rosser" | "stella"
  const isStella = principal === "stella";

  const [mode, setMode] = useState<Mode>(isStella ? "stella-login" : "rosser");
  const [email, setEmail] = useState("");
  const [key, setKey] = useState("");
  const [cpf, setCpf] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if Stella is already onboarded
  useEffect(() => {
    if (!isStella) return;
    fetch("/api/veronica/auth/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.onboarded === false) setMode("stella-onboard");
        else setMode("stella-login");
      })
      .catch(() => setMode("stella-login"));
  }, [isStella]);

  // ── Rosser login ─────────────────────────────────────────────────────────
  async function loginRosser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", { email, key, redirect: false });
    setBusy(false);
    if (!res || res.error) {
      setError("Access denied.");
      return;
    }
    router.replace("/briefing");
  }

  // ── Stella onboarding (first time) ───────────────────────────────────────
  async function onboardStella(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/veronica/auth/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Erro ao criar conta.");
        return;
      }
      setSuccess("Conta criada com sucesso. Faça login agora.");
      setMode("stella-login");
      setCpf("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Erro de rede.");
    } finally {
      setBusy(false);
    }
  }

  // ── Stella login ─────────────────────────────────────────────────────────
  async function loginStella(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("veronica", { cpf, password: key, redirect: false });
    setBusy(false);
    if (!res || res.error) {
      setError("Acesso negado.");
      return;
    }
    router.replace("/command");
  }

  // ── Rosser form ──────────────────────────────────────────────────────────
  if (mode === "rosser") {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="font-serif text-3xl tracking-wide text-bone-50">VIRGIL</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.32em] text-bone-400">
              Private Command Intelligence
            </div>
          </div>
          <form onSubmit={loginRosser} className="v-card v-card-pad space-y-4">
            <div>
              <label htmlFor="r-email" className="v-label">Identity</label>
              <input
                id="r-email"
                className="v-input mt-1"
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
            {error && <div className="text-center text-sm text-signal-red">{error}</div>}
          </form>
          <p className="mt-6 text-center text-[11px] tracking-wider text-bone-400">
            Unauthorized access is logged.
          </p>
        </div>
      </main>
    );
  }

  // ── Stella onboarding form ───────────────────────────────────────────────
  if (mode === "stella-onboard") {
    return (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="font-serif text-3xl tracking-wide text-bone-50">VERÔNICA</div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.32em] text-bone-400">
              Primeira vez? Vamos criar sua conta.
            </div>
          </div>
          <form onSubmit={onboardStella} className="v-card v-card-pad space-y-4">
            <div>
              <label className="v-label">Seu CPF</label>
              <p className="mt-0.5 text-[10px] text-bone-500">
                Usado para verificar sua identidade e gerar sua chave de criptografia.
                Nunca é armazenado em texto puro.
              </p>
              <input
                className="v-input mt-1"
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                autoComplete="off"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="v-label">Escolha uma senha</label>
              <input
                className="v-input mt-1"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="v-label">Confirme a senha</label>
              <input
                className="v-input mt-1"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="rounded border border-ink-600 bg-ink-900/50 px-3 py-2.5 text-[11px] text-bone-400 space-y-1.5">
              <p className="font-medium text-bone-200">🔒 Garantia de privacidade</p>
              <p>Seu CPF e sua senha geram uma chave de criptografia única.</p>
              <p>Essa chave <strong className="text-bone-100">nunca</strong> é armazenada no banco de dados.</p>
              <p>Nem o administrador do sistema consegue ler suas conversas.</p>
              <p>Isso é garantido por matemática, não por promessa.</p>
            </div>

            <button className="v-btn w-full justify-center" disabled={busy}>
              {busy ? "Criando…" : "Criar Conta"}
            </button>
            {error && <div className="text-center text-sm text-signal-red">{error}</div>}
            {success && <div className="text-center text-sm text-signal-green">{success}</div>}
          </form>
        </div>
      </main>
    );
  }

  // ── Stella login form ────────────────────────────────────────────────────
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="font-serif text-3xl tracking-wide text-bone-50">VERÔNICA</div>
          <div className="mt-1 text-[11px] uppercase tracking-[0.32em] text-bone-400">
            Inteligência Privada
          </div>
        </div>
        <form onSubmit={loginStella} className="v-card v-card-pad space-y-4">
          <div>
            <label className="v-label">CPF</label>
            <input
              className="v-input mt-1"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              autoComplete="off"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="v-label">Senha</label>
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
            {busy ? "…" : "Entrar"}
          </button>
          {error && <div className="text-center text-sm text-signal-red">{error}</div>}
          {success && <div className="text-center text-sm text-signal-green">{success}</div>}
        </form>
        <p className="mt-6 text-center text-[11px] tracking-wider text-bone-400">
          Acesso não autorizado é registrado.
        </p>
      </div>
    </main>
  );
}
