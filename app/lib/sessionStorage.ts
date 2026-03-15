/**
 * Dead Reckoning v2.0 — Session persistence
 * KAR-32: Builds a GameSessionRecord from live store state and POSTs it to /api/sessions.
 */

import type { GameSessionRecord, OutcomeCategory } from '@/app/types/scenario'

export interface StoreSnapshot {
  sessionId: string
  scenarioId: string
  playerId: string
  teamName?: string
  roomCode?: string
  actorRole: string
  startedAt: string
  completedAt: string
  visitedNodeIds: string[]
  decisions: GameSessionRecord['decisions']
  scores: Array<{ outcomeClassification: string; confidenceLevel: string; scorePoints: number }>
  finalPressure: number
  currentNodeId: string
  // The scenario object for outcome lookup
  scenario: {
    nodes: Record<string, {
      type: string
      outcome?: { category: string; title: string; scoreMultiplier: number }
    }>
  }
}

/**
 * Builds a GameSessionRecord from store state snapshot.
 * Called when sessionStatus transitions to 'completed'.
 */
export function buildSessionRecord(snap: StoreSnapshot): GameSessionRecord {
  const resolutionNode = snap.scenario.nodes[snap.currentNodeId]
  const outcome = resolutionNode?.outcome

  const totalScore = snap.scores.reduce((sum, s) => {
    const multiplier = outcome?.scoreMultiplier ?? 1.0
    return sum + Math.round(s.scorePoints * multiplier)
  }, 0)

  const calibration = snap.decisions.reduce(
    (acc, d) => {
      acc.total++
      if (d.confidence === 'high' && d.outcome !== 'wrong') acc.correct++
      else if (d.confidence === 'high' && d.outcome === 'wrong') acc.overconfident++
      else if (d.confidence === 'low' && d.outcome !== 'wrong') acc.underconfident++
      return acc
    },
    { total: 0, correct: 0, overconfident: 0, underconfident: 0 }
  )

  return {
    id: snap.sessionId,
    scenarioId: snap.scenarioId,
    playerId: snap.playerId,
    teamName: snap.teamName,
    roomCode: snap.roomCode,
    actorRole: snap.actorRole,
    startedAt: snap.startedAt,
    completedAt: snap.completedAt,
    visitedNodeIds: snap.visitedNodeIds,
    decisions: snap.decisions,
    finalPressure: snap.finalPressure,
    outcomeCategory: (outcome?.category ?? 'catastrophic') as OutcomeCategory,
    outcomeTitle: outcome?.title ?? 'Unknown outcome',
    score: totalScore,
    calibration,
  }
}

/**
 * Persists a session record to Vercel KV via the /api/sessions endpoint.
 * Never throws — errors are logged but not propagated.
 */
export async function persistSession(record: GameSessionRecord): Promise<void> {
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
    if (!res.ok) {
      const body = await res.text()
      console.error(`Session persist failed (HTTP ${res.status}):`, body)
    }
  } catch (err) {
    console.error('Session persist network error:', err)
  }
}
