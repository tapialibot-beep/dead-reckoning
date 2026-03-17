'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/app/store/gameStore'
import { loadScenarioIndex, loadScenario } from '@/app/lib/scenarioLoader'
import type { ScenarioIndexEntry } from '@/app/types/scenario'

const DIFFICULTY_LABEL: Record<string, string> = {
  standard: 'Standard',
  advanced: 'Advanced',
  introductory: 'Introductory',
}

export default function PlayPage() {
  const [index, setIndex] = useState<ScenarioIndexEntry[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startGame = useGameStore((s) => s.startGame)
  const setTeamName = useGameStore((s) => s.setTeamName)
  const setHistoricalMode = useGameStore((s) => s.setHistoricalMode)
  const setRoomCode = useGameStore((s) => s.setRoomCode)
  const router = useRouter()

  useEffect(() => {
    loadScenarioIndex().then(setIndex).catch(() => setError('Could not load scenario list.'))
  }, [])

  const canStart = !!selected && !loading

  async function handleStart(e: FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    setError(null)

    const result = await loadScenario(`${selected}.json`)
    if (!result.ok) {
      setError('Failed to load scenario. Please try again.')
      setLoading(false)
      return
    }

    const name = playerName.trim() || 'Solo'
    setRoomCode(null)
    setTeamName(name)
    setHistoricalMode(true)
    startGame(result.scenario, crypto.randomUUID(), name)
    router.push('/game')
  }

  const selectedEntry = index.find((s) => s.id === selected)

  return (
    <div className="flex min-h-screen items-center justify-center landing-bg">
      <main className="px-8 max-w-xl w-full py-16">
        <p className="text-sm tracking-[0.3em] uppercase mb-4 text-sepia text-center">
          Historical Mode
        </p>
        <h1 className="text-4xl font-bold mb-3 tracking-tight text-paper font-period text-center">
          Choose Your Scenario
        </h1>
        <p className="text-base mb-10 text-paper-dark text-center">
          Follow the real historical decisions as narrative — no room code needed.
        </p>

        <form onSubmit={handleStart} className="flex flex-col gap-6">
          {/* Scenario selector */}
          <div className="flex flex-col gap-3">
            {index.length === 0 && !error && (
              <p className="text-sepia text-sm text-center">Loading scenarios…</p>
            )}
            {index.map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelected(entry.id)}
                className={`w-full text-left px-5 py-4 border transition-all ${
                  selected === entry.id
                    ? 'border-paper bg-paper/10 text-paper'
                    : 'border-sepia/30 text-paper-dark hover:border-sepia hover:text-paper'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-period text-lg leading-tight">{entry.title}</p>
                    <p className="text-xs tracking-widest uppercase mt-1 text-sepia">
                      {entry.period}
                    </p>
                  </div>
                  <span className="text-xs tracking-widest uppercase text-sepia/70 whitespace-nowrap mt-1">
                    {DIFFICULTY_LABEL[entry.difficulty] ?? entry.difficulty}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Optional name */}
          {selected && (
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={40}
              autoFocus
              className="w-full px-4 py-3 text-center text-base bg-transparent border-b-2 border-sepia/50 text-paper placeholder-sepia/40 focus:outline-none focus:border-paper transition-colors font-period"
            />
          )}

          {error && (
            <p className="text-xs text-red-400 tracking-wide text-center">{error}</p>
          )}

          {selected && (
            <button
              type="submit"
              disabled={!canStart}
              className="mt-2 inline-block px-8 py-3 text-sm tracking-widest uppercase font-semibold transition-all hover:opacity-80 btn-begin disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading…' : `Begin — ${selectedEntry?.title ?? ''}`}
            </button>
          )}
        </form>
      </main>
    </div>
  )
}
