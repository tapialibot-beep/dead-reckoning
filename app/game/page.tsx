'use client'

import { useEffect } from 'react'
import { DeskLayout } from '@/app/components/desk'
import { DecisionPointModal } from '@/app/components/decision'
import { useGameStore } from '@/app/store/gameStore'
import { loadScenario } from '@/app/lib/scenarioLoader'

export default function GamePage() {
  const scenario = useGameStore((s) => s.scenario)
  const startGame = useGameStore((s) => s.startGame)

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

  return (
    <>
      <DeskLayout />
      <DecisionPointModal />
    </>
  )
}
