import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--desk-bg)' }}>
      <main className="text-center px-8">
        <p className="text-sm tracking-[0.3em] uppercase mb-4" style={{ color: 'var(--sepia)' }}>
          An Historical Decision Game
        </p>
        <h1 className="text-6xl font-bold mb-4 tracking-tight" style={{ color: 'var(--paper)', fontFamily: 'Georgia, serif' }}>
          Dead Reckoning
        </h1>
        <p className="text-lg mb-12 max-w-md mx-auto" style={{ color: 'var(--paper-dark)' }}>
          Navigate pivotal moments in history armed only with the information available at the time.
        </p>
        <Link
          href="/game"
          className="inline-block px-8 py-3 text-sm tracking-widest uppercase font-semibold transition-all hover:opacity-80"
          style={{ background: 'var(--paper)', color: 'var(--ink)', letterSpacing: '0.15em' }}
        >
          Begin
        </Link>
      </main>
    </div>
  );
}
