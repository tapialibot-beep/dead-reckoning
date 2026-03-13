'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function TopBar() {
  const scenario = useGameStore((s) => s.scenario)
  const session = useGameStore((s) => s.session)
  const currentPhaseIndex = useGameStore((s) => s.currentPhaseIndex)
  const isPaused = useGameStore((s) => s.isPaused)

  const currentPhase = scenario?.phases[currentPhaseIndex]
  const status = !session
    ? 'STANDBY'
    : session.status === 'completed'
      ? 'COMPLETED'
      : session.status === 'abandoned'
        ? 'ABANDONED'
        : isPaused
          ? 'PAUSED'
          : 'ACTIVE'

  return (
    <div className="desk-topbar">
      <div className="topbar-role">
        <span className="topbar-label">ROLE</span>
        <span className="topbar-value">
          {scenario ? scenario.role : '\u2014 Awaiting Assignment \u2014'}
        </span>
      </div>
      <div className="topbar-objective">
        <span className="topbar-label">OBJECTIVE</span>
        <span className="topbar-value">
          {currentPhase ? currentPhase.description : '\u2014 No active scenario \u2014'}
        </span>
      </div>
      <div className="topbar-status">
        <span className="topbar-label">STATUS</span>
        <span className={`topbar-value ${status === 'ACTIVE' ? 'status-active' : status === 'PAUSED' ? 'status-paused' : ''}`}>
          {status}
        </span>
      </div>
    </div>
  )
}
