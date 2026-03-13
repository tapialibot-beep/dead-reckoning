'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function Timeline() {
  const scenario = useGameStore((s) => s.scenario)
  const currentPhaseIndex = useGameStore((s) => s.currentPhaseIndex)
  const timeRemaining = useGameStore((s) => s.timeRemaining)

  const currentPhase = scenario?.phases[currentPhaseIndex]
  const totalPhases = scenario?.phases.length ?? 0
  const progressPercent = totalPhases > 0 ? ((currentPhaseIndex) / totalPhases) * 100 : 0

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const clock = timeRemaining > 0
    ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : '--:--'

  return (
    <div className="desk-timeline">
      <div className="timeline-track">
        <div className="timeline-label">
          {currentPhase ? `PHASE ${currentPhaseIndex + 1}/${totalPhases}` : 'TIMELINE'}
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
