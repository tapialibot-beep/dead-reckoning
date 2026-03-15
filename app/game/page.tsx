'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  const teamName = useGameStore((s) => s.teamName)
  const startedAt = useGameStore((s) => s.startedAt)
  const completedAt = useGameStore((s) => s.completedAt)
  const visitedNodeIds = useGameStore((s) => s.visitedNodeIds)
  const decisions = useGameStore((s) => s.decisions)
  const scores = useGameStore((s) => s.scores)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const currentPressure = useGameStore((s) => s.currentPressure)
  const roomCode = useGameStore((s) => s.roomCode)
  const router = useRouter()

  // Track which sessions have already been persisted
  const persistedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!scenario) {
      if (roomCode) {
        // Load scenario from room config
        fetch(`/api/rooms?code=${roomCode}`)
          .then(res => res.json())
          .then(data => {
            if (data.room?.scenarioId) {
              return loadScenario(`${data.room.scenarioId}.json`)
            }
            throw new Error('Room not found or expired')
          })
          .then(result => {
            if (result.ok) {
              startGame(result.scenario, 'dev-player', teamName ?? undefined)
            } else {
              console.error('Failed to load scenario:', result.errors)
            }
          })
          .catch(err => console.error('Room scenario load error:', err))
      } else {
        // No room code — redirect to team setup
        router.replace('/team-setup')
      }
    }
  }, [scenario, startGame, roomCode, router])

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
      teamName: teamName ?? undefined,
      roomCode: roomCode ?? undefined,
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
    visitedNodeIds, decisions, scores, currentPressure, currentNodeId, roomCode,
  ])

  return (
    <>
      <DeskLayout />
      <DecisionPointModal />
    </>
  )
}
