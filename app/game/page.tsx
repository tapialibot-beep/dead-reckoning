'use client'

import { useEffect } from 'react'
import { DeskLayout } from '@/app/components/desk'
import { DecisionPointModal } from '@/app/components/decision'
import { useGameStore } from '@/app/store/gameStore'
import { julyCrisis1914 } from '@/app/scenarios/july-crisis-1914'

export default function GamePage() {
  const scenario = useGameStore((s) => s.scenario)
  const startGame = useGameStore((s) => s.startGame)

  useEffect(() => {
    if (!scenario) {
      startGame(julyCrisis1914, 'dev-player')
    }
  }, [scenario, startGame])

  return (
    <>
      <DeskLayout />
      <DecisionPointModal />
    </>
  )
}
