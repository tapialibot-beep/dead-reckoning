"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function AccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        router.push(from);
      } else {
        const data = await res.json();
        setError(data.error ?? "Invalid code");
        setLoading(false);
      }
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center landing-bg">
      <main className="text-center px-8 max-w-sm w-full">
        {/* Classification header */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.4em] uppercase mb-2 text-sepia opacity-70">
            Restricted Access
          </p>
          <div className="border-t border-b border-sepia/30 py-3 mb-4">
            <p className="text-xs tracking-[0.25em] uppercase text-sepia">
              DEAD RECKONING — BETA
            </p>
          </div>
          <p className="text-sm text-paper-dark opacity-60 leading-relaxed">
            This simulation is currently available<br />
            by invitation only.
          </p>
        </div>

        {/* Code entry */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-[0.3em] uppercase text-sepia mb-2">
              Access Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER CODE"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="w-full px-4 py-3 text-center text-sm tracking-[0.4em] uppercase font-mono
                         bg-transparent border border-sepia/40 text-paper
                         placeholder:text-sepia/30 focus:outline-none focus:border-sepia
                         transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs tracking-widest uppercase text-red-stamp">
              — {error} —
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full px-6 py-3 text-xs tracking-[0.4em] uppercase font-semibold
                       transition-all hover:opacity-80 disabled:opacity-30 btn-begin"
          >
            {loading ? "Verifying..." : "Submit"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense>
      <AccessForm />
    </Suspense>
  );
}
