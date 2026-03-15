'use client'

import { useGameStore } from '@/app/store/gameStore'
import VoiceSelector from './VoiceSelector'

export default function TopBar() {
  const scenario = useGameStore((s) => s.scenario)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const sessionStatus = useGameStore((s) => s.sessionStatus)
  const isPaused = useGameStore((s) => s.isPaused)

  const currentNode = currentNodeId ? scenario?.nodes[currentNodeId] : null

  const status =
    sessionStatus === 'idle'
      ? 'STANDBY'
      : sessionStatus === 'completed'
        ? 'COMPLETED'
        : sessionStatus === 'abandoned'
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
          {currentNode ? currentNode.description : '\u2014 No active scenario \u2014'}
        </span>
      </div>
      <div className="topbar-status">
        <span className="topbar-label">STATUS</span>
        <span
          className={`topbar-value ${status === 'ACTIVE' ? 'status-active' : status === 'PAUSED' ? 'status-paused' : ''}`}
        >
          {status}
        </span>
      </div>
      <VoiceSelector />
    </div>
  )
}
