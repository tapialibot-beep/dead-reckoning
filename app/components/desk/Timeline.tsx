'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function Timeline() {
  const scenario = useGameStore((s) => s.scenario)
  const visitedNodeIds = useGameStore((s) => s.visitedNodeIds)
  const timeRemaining = useGameStore((s) => s.timeRemaining)

  // Count crisis nodes visited = decisions made so far
  const decisionCount = scenario
    ? visitedNodeIds.filter(id => scenario.nodes[id]?.type === 'crisis').length
    : 0

  // Progress bar grows 15% per decision, capped at 90% — no total revealed
  const progressPercent = Math.min(decisionCount * 15, 90)

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const clock = timeRemaining > 0
    ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : '--:--'

  return (
    <div className="desk-timeline">
      <div className="timeline-track">
        <div className="timeline-label">
          {scenario ? `DECISION ${decisionCount} OF ?` : 'TIMELINE'}
        </div>
        <div className="timeline-bar">
          <div
            className="timeline-progress"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="timeline-clock">{clock}</div>
      </div>
    </div>
  )
}
