export default function LandingPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-black px-6">
      <h1 className="mb-20 text-center font-serif text-2xl tracking-[0.35em] text-white/85 sm:text-3xl">
        VIRGIL &amp; VERÔNICA
      </h1>

      <div className="flex flex-col gap-5 sm:flex-row sm:gap-8">
        <a
          href="/login?p=rosser"
          className="block min-w-[160px] border border-white/15 px-10 py-4 text-center text-sm tracking-[0.25em] text-white/70 transition hover:border-white/50 hover:text-white"
        >
          ROSSER
        </a>
        <a
          href="/login?p=stella"
          className="block min-w-[160px] border border-white/15 px-10 py-4 text-center text-sm tracking-[0.25em] text-white/70 transition hover:border-white/50 hover:text-white"
        >
          STELLA
        </a>
      </div>

      <p className="mt-16 text-[10px] tracking-[0.2em] text-white/20">
        Acesso não autorizado é registrado.
      </p>
    </main>
  );
}
