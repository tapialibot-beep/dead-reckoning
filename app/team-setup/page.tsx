'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/app/store/gameStore'

export default function TeamSetupPage() {
  const [teamName, setTeamNameLocal] = useState('')
  const [roomCode, setRoomCodeLocal] = useState('')
  const [historicalModeLocal, setHistoricalModeLocal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const setTeamName = useGameStore((s) => s.setTeamName)
  const setRoomCode = useGameStore((s) => s.setRoomCode)
  const setHistoricalMode = useGameStore((s) => s.setHistoricalMode)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedName = teamName.trim()
    const trimmedCode = roomCode.trim().toUpperCase()
    if (!trimmedName) return
    setError(null)

    // If room code provided, validate it and check team name uniqueness
    if (trimmedCode) {
      setChecking(true)
      try {
        const res = await fetch(`/api/rooms?code=${trimmedCode}`)
        if (!res.ok) {
          const data = await res.json()
          setError(data.error === 'Room expired' ? 'This room has expired.' : 'Invalid room code.')
          setChecking(false)
          return
        }
        const data = await res.json()

        // Check team name uniqueness within room
        if (data.teams?.includes(trimmedName)) {
          setError(`Team name "${trimmedName}" is already taken in this room.`)
          setChecking(false)
          return
        }

        // Apply room settings
        setRoomCode(trimmedCode)
        if (data.room?.historicalMode) {
          setHistoricalMode(true)
        } else {
          setHistoricalMode(historicalModeLocal)
        }
      } catch {
        setError('Could not validate room code. Try again.')
        setChecking(false)
        return
      }
      setChecking(false)
    } else {
      setRoomCode(null)
      setHistoricalMode(historicalModeLocal)
    }

    setTeamName(trimmedName)
    router.push('/game')
  }

  return (
    <div className="flex min-h-screen items-center justify-center landing-bg">
      <main className="text-center px-8 max-w-md w-full">
        <p className="text-sm tracking-[0.3em] uppercase mb-4 text-sepia">
          Before You Begin
        </p>
        <h1 className="text-4xl font-bold mb-3 tracking-tight text-paper font-period">
          Name Your Team
        </h1>
        <p className="text-base mb-10 text-paper-dark">
          Your team name will appear in the classroom view so your teacher can follow your progress.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamNameLocal(e.target.value)}
            placeholder="e.g. The War Council"
            maxLength={40}
            autoFocus
            className="w-full px-4 py-3 text-center text-lg bg-transparent border-b-2 border-sepia text-paper placeholder-sepia/50 focus:outline-none focus:border-paper transition-colors font-period"
          />
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCodeLocal(e.target.value.toUpperCase())}
            placeholder="Room Code (optional)"
            maxLength={6}
            className="w-full px-4 py-3 text-center text-sm tracking-[0.3em] bg-transparent border-b-2 border-sepia/50 text-paper placeholder-sepia/40 focus:outline-none focus:border-paper transition-colors font-mono uppercase"
          />
          {error && (
            <p className="text-xs text-red-400 tracking-wide">{error}</p>
          )}
          <label className="flex items-center gap-3 cursor-pointer text-sm tracking-widest uppercase text-sepia mt-2">
            <input
              type="checkbox"
              checked={historicalModeLocal}
              onChange={(e) => setHistoricalModeLocal(e.target.checked)}
              className="w-4 h-4 accent-sepia cursor-pointer"
            />
            Historical Mode
          </label>
          {historicalModeLocal && (
            <p className="text-xs text-sepia/70 mt-1 tracking-wide">
              Decisions are made for you — follow the real historical actor&apos;s choices.
            </p>
          )}
          <button
            type="submit"
            disabled={!teamName.trim() || checking}
            className="mt-4 inline-block px-8 py-3 text-sm tracking-widest uppercase font-semibold transition-all hover:opacity-80 btn-begin disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {checking ? 'Checking...' : 'Enter the Situation Room'}
          </button>
        </form>
      </main>
    </div>
  )
}
