'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import type { Room, GameSessionRecord } from '@/app/types/scenario'

interface RoomData {
  room: Room
  sessions: GameSessionRecord[]
  teams: string[]
}

// Outcome badge colors
const OUTCOME_COLORS: Record<string, string> = {
  correct: '#2d6a2d',
  plausible: '#8b7355',
  wrong: '#8b1a1a',
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  return (
    <span
      className="td-outcome-badge"
      style={{ background: OUTCOME_COLORS[outcome] ?? OUTCOME_COLORS.plausible }}
    >
      {outcome.toUpperCase()}
    </span>
  )
}

export default function RoomDashboardPage() {
  const params = useParams()
  const code = (params.code as string)?.toUpperCase()
  const [data, setData] = useState<RoomData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRoom = useCallback(async () => {
    if (!code) return
    try {
      const res = await fetch(`/api/rooms?code=${code}`)
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || 'Failed to load room')
        setLoading(false)
        return
      }
      const roomData = await res.json()
      setData(roomData)
      setError(null)
    } catch {
      setError('Network error — could not load room')
    }
    setLoading(false)
  }, [code])

  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  if (loading) {
    return (
      <div className="tv-container">
        <div className="td-loading">LOADING ROOM DATA...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="tv-container">
        <div className="tv-header">
          <div className="tv-classification-stamp">TEACHER ACCESS — ROOM DASHBOARD</div>
          <h1 className="tv-title">Room {code}</h1>
        </div>
        <div className="tv-parse-error">
          <span className="tv-parse-error-label">ERROR</span>
          <span>{error}</span>
        </div>
        <a href="/teacher" className="td-back-link">← Back to Teacher Dashboard</a>
      </div>
    )
  }

  if (!data) return null

  const { room, sessions } = data
  const completedSessions = sessions.filter(s => s.completedAt)
  const inProgressSessions = sessions.filter(s => !s.completedAt)

  return (
    <div className="tv-container">
      {/* Header */}
      <div className="tv-header">
        <div className="tv-classification-stamp">TEACHER ACCESS — ROOM DASHBOARD</div>
        <h1 className="tv-title">Room {room.code}</h1>
        <p className="tv-subtitle">
          Scenario: {room.scenarioId.replace(/-/g, ' ')} |
          {room.historicalMode ? ' Historical Mode' : ' Free Play'} |
          Expires: {new Date(room.expiresAt).toLocaleDateString()}
        </p>
      </div>

      {/* Room code display for sharing */}
      <div className="td-code-share">
        <span className="td-code-label">SHARE THIS CODE WITH YOUR CLASS</span>
        <span className="td-code-big">{room.code}</span>
      </div>

      {/* Stats */}
      <div className="tv-stats">
        <div className="tv-stat">
          <span className="tv-stat-value">{sessions.length}</span>
          <span className="tv-stat-label">TOTAL TEAMS</span>
        </div>
        <div className="tv-stat">
          <span className="tv-stat-value">{completedSessions.length}</span>
          <span className="tv-stat-label">COMPLETED</span>
        </div>
        <div className="tv-stat">
          <span className="tv-stat-value">{inProgressSessions.length}</span>
          <span className="tv-stat-label">IN PROGRESS</span>
        </div>
        <div className="tv-stat">
          <span className="tv-stat-value">
            {completedSessions.length > 0
              ? Math.round(completedSessions.reduce((sum, s) => sum + s.score, 0) / completedSessions.length)
              : '—'}
          </span>
          <span className="tv-stat-label">AVG SCORE</span>
        </div>
      </div>

      {/* Refresh button */}
      <button
        className="tv-validate-btn td-refresh-btn"
        onClick={() => { setLoading(true); fetchRoom() }}
      >
        REFRESH
      </button>

      {/* Sessions table */}
      {sessions.length === 0 ? (
        <div className="td-empty">
          No teams have joined this room yet. Share the code <strong>{room.code}</strong> with your students.
        </div>
      ) : (
        <div className="td-table-wrap">
          <table className="td-table">
            <thead>
              <tr>
                <th>TEAM</th>
                <th>STATUS</th>
                <th>CURRENT NODE</th>
                <th>DECISIONS</th>
                <th>SCORE</th>
                <th>OUTCOME</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="td-team-name">{session.teamName || 'Anonymous'}</td>
                  <td>
                    <span className={`td-status ${session.completedAt ? 'td-status-done' : 'td-status-active'}`}>
                      {session.completedAt ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </td>
                  <td className="td-node">
                    {session.visitedNodeIds[session.visitedNodeIds.length - 1] ?? '—'}
                  </td>
                  <td>
                    <div className="td-decisions">
                      {session.decisions.length === 0 ? '—' : session.decisions.map((d, i) => (
                        <OutcomeBadge key={i} outcome={d.outcome} />
                      ))}
                    </div>
                  </td>
                  <td className="td-score">{session.completedAt ? session.score : '—'}</td>
                  <td className="td-outcome">
                    {session.completedAt ? (
                      <span className="td-outcome-category">{session.outcomeCategory}</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision detail per team */}
      {completedSessions.length > 0 && (
        <div className="td-detail-section">
          <div className="tv-section-label" style={{ marginBottom: '1rem' }}>DECISION BREAKDOWN BY TEAM</div>
          {completedSessions.map(session => (
            <details key={session.id} className="td-team-detail">
              <summary className="td-team-summary">
                {session.teamName || 'Anonymous'} — Score: {session.score} — {session.outcomeTitle}
              </summary>
              <div className="td-team-decisions">
                {session.decisions.map((d, i) => (
                  <div key={i} className="td-decision-row">
                    <span className="td-decision-node">{d.nodeId}</span>
                    <span className="td-decision-option">Option: {d.chosenOptionId}</span>
                    <span className="td-decision-confidence">Confidence: {d.confidence}</span>
                    <OutcomeBadge outcome={d.outcome} />
                    <span className="td-decision-time">{d.timeSpent}s</span>
                  </div>
                ))}
                <div className="td-calibration">
                  Calibration: {session.calibration.correct} correct | {session.calibration.overconfident} overconfident | {session.calibration.underconfident} underconfident
                </div>
              </div>
            </details>
          ))}
        </div>
      )}

      <a href="/teacher" className="td-back-link">← Back to Teacher Dashboard</a>
    </div>
  )
}
