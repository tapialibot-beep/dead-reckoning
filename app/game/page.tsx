'use client'

import { useEffect, useRef } from 'react'
import { DeskLayout } from '@/app/components/desk'
import { DecisionPointModal } from '@/app/components/decision'
import { useGameStore } from '@/app/store/gameStore'
import { loadScenario } from '@/app/lib/scenarioLoader'
import { buildSessionRecord, persistSession } from '@/app/lib/sessionStorage'

export default function GamePage() {
  const scenario = useGameStore((s) => s.scenario)
  const startGame = useGameStore((s) => s.startGame)
  const sessionStatus = useGameStore((s) => s.sessionStatus)
  const sessionId = useGameStore((s) => s.sessionId)
  const playerId = useGameStore((s) => s.playerId)
  const startedAt = useGameStore((s) => s.startedAt)
  const completedAt = useGameStore((s) => s.completedAt)
  const visitedNodeIds = useGameStore((s) => s.visitedNodeIds)
  const decisions = useGameStore((s) => s.decisions)
  const scores = useGameStore((s) => s.scores)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const currentPressure = useGameStore((s) => s.currentPressure)

  // Track which sessions have already been persisted
  const persistedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!scenario) {
      loadScenario('july-crisis-1914.json').then(result => {
        if (result.ok) {
          startGame(result.scenario, 'dev-player')
        } else {
          console.error('Failed to load scenario:', result.errors)
        }
      })
    }
  }, [scenario, startGame])

  // Persist session to Vercel KV when run completes
  useEffect(() => {
    if (
      sessionStatus !== 'completed' ||
      !sessionId || !playerId || !scenario ||
      !startedAt || !completedAt || !currentNodeId ||
      persistedRef.current.has(sessionId)
    ) return

    persistedRef.current.add(sessionId)

    const record = buildSessionRecord({
      sessionId,
      scenarioId: scenario.id,
      playerId,
      actorRole: scenario.role,
      startedAt,
      completedAt,
      visitedNodeIds,
      decisions,
      scores,
      finalPressure: currentPressure,
      currentNodeId,
      scenario,
    })

    persistSession(record)
  }, [
    sessionStatus, sessionId, playerId, scenario, startedAt, completedAt,
    visitedNodeIds, decisions, scores, currentPressure, currentNodeId,
  ])

  return (
    <>
      <DeskLayout />
      <DecisionPointModal />
    </>
  )
}
