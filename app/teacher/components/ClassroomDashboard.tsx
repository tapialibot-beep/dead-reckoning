'use client'

/**
 * KAR-44 — Classroom Dashboard
 * Live class results view for teachers: teams panel, decision splits, leaderboard, export.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Room, GameSessionRecord, OutcomeCategory } from '@/app/types/scenario'

// ─── Types ──────────────────────────────────────────────────────────────────

interface RoomData {
  room: Room
  sessions: GameSessionRecord[]
  teams: string[]
}

interface DecisionSplit {
  nodeId: string
  options: {
    optionId: string
    outcome: 'correct' | 'plausible' | 'wrong'
    count: number
    pct: number
  }[]
  total: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const OUTCOME_COLORS: Record<string, string> = {
  correct: '#2d6a2d',
  plausible: '#7a6030',
  wrong: '#8b1a1a',
}

const OUTCOME_BORDER: Record<string, string> = {
  correct: '#4a8a4a',
  plausible: '#a88040',
  wrong: '#c41e1e',
}

const OUTCOME_CATEGORY_LABEL: Record<OutcomeCategory, string> = {
  historical: 'Historical',
  divergent: 'Divergent',
  avoided: 'Avoided',
  catastrophic: 'Catastrophic',
}

const POLL_INTERVAL_MS = 15_000

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calibrationEmoji(calibration: GameSessionRecord['calibration']): string {
  const { total, correct, overconfident, underconfident } = calibration
  if (total === 0) return ''
  const wellCalibrated = total - overconfident - underconfident
  if (wellCalibrated / total >= 0.5) return '🎯'
  if (overconfident > underconfident) return '⚠️'
  return '🤷'
}

function buildDecisionSplits(sessions: GameSessionRecord[]): DecisionSplit[] {
  // Only use completed sessions
  const completed = sessions.filter(s => s.completedAt)
  if (completed.length === 0) return []

  // Collect all nodeIds in encounter order (first session's order as canonical)
  const nodeOrder: string[] = []
  const seenNodes = new Set<string>()
  for (const session of completed) {
    for (const d of session.decisions) {
      if (!seenNodes.has(d.nodeId)) {
        seenNodes.add(d.nodeId)
        nodeOrder.push(d.nodeId)
      }
    }
  }

  // For each node, tally option selections
  return nodeOrder.map(nodeId => {
    const tally = new Map<string, { outcome: 'correct' | 'plausible' | 'wrong'; count: number }>()

    for (const session of completed) {
      const dec = session.decisions.find(d => d.nodeId === nodeId)
      if (!dec) continue
      const existing = tally.get(dec.chosenOptionId)
      if (existing) {
        existing.count++
      } else {
        tally.set(dec.chosenOptionId, { outcome: dec.outcome, count: 1 })
      }
    }

    const total = Array.from(tally.values()).reduce((s, v) => s + v.count, 0)
    const options = Array.from(tally.entries())
      .map(([optionId, { outcome, count }]) => ({
        optionId,
        outcome,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)

    return { nodeId, options, total }
  })
}

function buildExportText(data: RoomData): string {
  const { room, sessions, teams } = data
  const completed = sessions.filter(s => s.completedAt)
  const lines: string[] = [
    `DEAD RECKONING — CLASS RESULTS`,
    `Room: ${room.code}  |  Scenario: ${room.scenarioId}  |  Exported: ${new Date().toLocaleString()}`,
    `Teams joined: ${teams.length}  |  Completed: ${completed.length}`,
    '',
    '─── LEADERBOARD ───',
  ]

  const sorted = [...completed].sort((a, b) => b.score - a.score)
  sorted.forEach((s, i) => {
    const emoji = calibrationEmoji(s.calibration)
    const cal = s.calibration
    lines.push(
      `${i + 1}. ${s.teamName ?? 'Anonymous'} — Score: ${s.score}  Outcome: ${OUTCOME_CATEGORY_LABEL[s.outcomeCategory] ?? s.outcomeCategory}  Calibration: ${cal.correct} correct / ${cal.overconfident} overconfident / ${cal.underconfident} underconfident ${emoji}`
    )
  })

  if (teams.length > completed.length) {
    const completedNames = new Set(completed.map(s => s.teamName).filter((n): n is string => !!n))
    const pending = teams.filter(t => !completedNames.has(t))
    if (pending.length > 0) {
      lines.push('', '─── PENDING TEAMS ───')
      pending.forEach(t => lines.push(`• ${t}`))
    }
  }

  return lines.join('\n')
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TeamsPanel({
  teams,
  sessions,
}: {
  teams: string[]
  sessions: GameSessionRecord[]
}) {
  const completedNames = new Set(
    sessions.filter(s => s.completedAt).map(s => s.teamName).filter((n): n is string => !!n)
  )
  const inProgressNames = new Set(
    sessions.filter(s => !s.completedAt).map(s => s.teamName).filter((n): n is string => !!n)
  )

  const allTeams = [...teams]
  // Add any session team names not in the teams list (edge case)
  sessions.forEach(s => {
    if (s.teamName && !allTeams.includes(s.teamName)) allTeams.push(s.teamName)
  })

  if (allTeams.length === 0) {
    return (
      <div className="cd-empty-hint">
        No teams have joined yet. Share the room code with your students.
      </div>
    )
  }

  return (
    <div className="cd-teams-grid">
      {allTeams.map(team => {
        const done = completedNames.has(team)
        const active = inProgressNames.has(team)
        return (
          <div
            key={team}
            className={`cd-team-chip ${done ? 'cd-team-done' : active ? 'cd-team-active' : 'cd-team-waiting'}`}
          >
            <span className="cd-team-chip-name">{team}</span>
            <span className="cd-team-chip-status">
              {done ? 'DONE' : active ? 'PLAYING' : 'WAITING'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function DecisionSplitsPanel({ splits }: { splits: DecisionSplit[] }) {
  if (splits.length === 0) {
    return (
      <div className="cd-empty-hint">
        No completed runs yet — decision data will appear here once teams finish.
      </div>
    )
  }

  return (
    <div className="cd-splits-list">
      {splits.map(split => (
        <div key={split.nodeId} className="cd-split-block">
          <div className="cd-split-header">
            <span className="cd-split-node">{split.nodeId}</span>
            <span className="cd-split-count">{split.total} response{split.total !== 1 ? 's' : ''}</span>
          </div>
          <div className="cd-split-bars">
            {split.options.map(opt => (
              <div key={opt.optionId} className="cd-split-bar-row">
                <div className="cd-split-option-id">{opt.optionId}</div>
                <div className="cd-split-bar-track">
                  <div
                    className="cd-split-bar-fill"
                    style={{
                      width: `${opt.pct}%`,
                      background: OUTCOME_COLORS[opt.outcome] ?? OUTCOME_COLORS.plausible,
                      borderRight: opt.pct > 0 ? `2px solid ${OUTCOME_BORDER[opt.outcome] ?? OUTCOME_BORDER.plausible}` : 'none',
                    }}
                  />
                </div>
                <div className="cd-split-bar-meta">
                  <span
                    className="cd-split-outcome-tag"
                    style={{
                      color: OUTCOME_BORDER[opt.outcome] ?? OUTCOME_BORDER.plausible,
                      borderColor: OUTCOME_COLORS[opt.outcome] ?? OUTCOME_COLORS.plausible,
                    }}
                  >
                    {opt.outcome.toUpperCase()}
                  </span>
                  <span className="cd-split-pct">{opt.pct}%</span>
                  <span className="cd-split-raw">({opt.count})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Leaderboard({ sessions }: { sessions: GameSessionRecord[] }) {
  const completed = [...sessions.filter(s => s.completedAt)].sort(
    (a, b) => b.score - a.score
  )

  if (completed.length === 0) {
    return (
      <div className="cd-empty-hint">
        Waiting for students to complete their runs...
      </div>
    )
  }

  return (
    <div className="cd-leaderboard">
      {completed.map((session, i) => {
        const emoji = calibrationEmoji(session.calibration)
        const outcomeLabel = OUTCOME_CATEGORY_LABEL[session.outcomeCategory] ?? session.outcomeCategory
        return (
          <div key={session.id} className="cd-lb-row">
            <span className="cd-lb-rank">#{i + 1}</span>
            <div className="cd-lb-team">
              <span className="cd-lb-name">{session.teamName ?? 'Anonymous'}</span>
              <span className="cd-lb-outcome">{outcomeLabel}</span>
            </div>
            <div className="cd-lb-right">
              <span className="cd-lb-score">{session.score}</span>
              {emoji && <span className="cd-lb-emoji" title={
                emoji === '🎯' ? 'Well-calibrated' : emoji === '⚠️' ? 'Overconfident' : 'Underconfident'
              }>{emoji}</span>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClassroomDashboard() {
  const [roomCode, setRoomCode] = useState('')
  const [activeCode, setActiveCode] = useState<string | null>(null)
  const [data, setData] = useState<RoomData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [copyDone, setCopyDone] = useState(false)
  const [activePanel, setActivePanel] = useState<'teams' | 'splits' | 'leaderboard'>('leaderboard')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchRoom = useCallback(async (code: string, silent = false) => {
    if (!silent) setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/rooms?code=${encodeURIComponent(code)}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? `Error ${res.status}`)
        if (!silent) setLoading(false)
        return
      }
      const roomData: RoomData = await res.json()
      setData(roomData)
      setLastRefresh(new Date())
    } catch {
      setError('Network error — could not load room')
    }

    if (!silent) setLoading(false)
  }, [])

  // Start/restart the polling interval when activeCode changes
  useEffect(() => {
    if (!activeCode) return

    fetchRoom(activeCode)

    timerRef.current = setInterval(() => {
      fetchRoom(activeCode, true)
    }, POLL_INTERVAL_MS)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeCode, fetchRoom])

  function handleView(e: React.FormEvent) {
    e.preventDefault()
    const code = roomCode.trim().toUpperCase()
    if (code.length !== 6) return
    setData(null)
    setError(null)
    setActiveCode(code)
  }

  function handleExport() {
    if (!data) return
    const text = buildExportText(data)
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    }).catch(() => {
      // Fallback: open in a new window
      const win = window.open('', '_blank')
      if (win) {
        win.document.write('<pre>' + text.replace(/</g, '&lt;') + '</pre>')
        win.document.close()
      }
    })
  }

  const splits = data ? buildDecisionSplits(data.sessions) : []

  // ─── Render ───

  return (
    <div className="cd-container">

      {/* Room code form */}
      <div className="cd-room-form-wrap">
        <div className="tv-section-label">VIEW ROOM DASHBOARD</div>
        <form onSubmit={handleView} className="cd-room-form">
          <input
            type="text"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={6}
            className="tv-lookup-input cd-code-input"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="tv-validate-btn cd-view-btn"
            disabled={roomCode.trim().length !== 6 || loading}
          >
            {loading ? 'LOADING...' : 'VIEW DASHBOARD'}
          </button>
        </form>
        {activeCode && (
          <div className="cd-active-code-hint">
            Viewing room <strong>{activeCode}</strong>
            {lastRefresh && (
              <span className="cd-last-refresh">
                {' '}— refreshed {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="tv-parse-error">
          <span className="tv-parse-error-label">ERROR</span>
          <span>{error}</span>
        </div>
      )}

      {/* Loading (first fetch) */}
      {loading && !data && (
        <div className="td-loading">LOADING ROOM DATA...</div>
      )}

      {/* Dashboard content */}
      {data && !loading && (
        <>
          {/* Summary stats */}
          <div className="tv-stats cd-stats">
            <div className="tv-stat">
              <span className="tv-stat-value">{data.teams.length}</span>
              <span className="tv-stat-label">TEAMS JOINED</span>
            </div>
            <div className="tv-stat">
              <span className="tv-stat-value">
                {data.sessions.filter(s => s.completedAt).length}
              </span>
              <span className="tv-stat-label">COMPLETED</span>
            </div>
            <div className="tv-stat">
              <span className="tv-stat-value">
                {data.sessions.filter(s => !s.completedAt).length}
              </span>
              <span className="tv-stat-label">IN PROGRESS</span>
            </div>
            <div className="tv-stat">
              <span className="tv-stat-value">
                {data.sessions.filter(s => s.completedAt).length > 0
                  ? Math.round(
                      data.sessions
                        .filter(s => s.completedAt)
                        .reduce((sum, s) => sum + s.score, 0) /
                      data.sessions.filter(s => s.completedAt).length
                    )
                  : '—'}
              </span>
              <span className="tv-stat-label">AVG SCORE</span>
            </div>
          </div>

          {/* Panel tabs */}
          <div className="tv-tab-strip tv-tab-strip-sub cd-panel-tabs">
            <button
              className={`tv-tab ${activePanel === 'leaderboard' ? 'tv-tab-active' : ''}`}
              onClick={() => setActivePanel('leaderboard')}
            >
              LEADERBOARD
            </button>
            <button
              className={`tv-tab ${activePanel === 'teams' ? 'tv-tab-active' : ''}`}
              onClick={() => setActivePanel('teams')}
            >
              TEAMS
            </button>
            <button
              className={`tv-tab ${activePanel === 'splits' ? 'tv-tab-active' : ''}`}
              onClick={() => setActivePanel('splits')}
            >
              DECISION SPLITS
            </button>
          </div>

          {/* Panel content */}
          <div className="cd-panel-body">
            {activePanel === 'leaderboard' && (
              <Leaderboard sessions={data.sessions} />
            )}
            {activePanel === 'teams' && (
              <TeamsPanel teams={data.teams} sessions={data.sessions} />
            )}
            {activePanel === 'splits' && (
              <DecisionSplitsPanel splits={splits} />
            )}
          </div>

          {/* Action bar */}
          <div className="cd-action-bar">
            <button
              className="tv-validate-btn cd-export-btn"
              onClick={handleExport}
              disabled={data.sessions.filter(s => s.completedAt).length === 0}
            >
              {copyDone ? 'COPIED TO CLIPBOARD' : 'EXPORT RESULTS'}
            </button>
            <div className="cd-poll-note">
              Auto-refreshes every 15 seconds
            </div>
          </div>
        </>
      )}

    </div>
  )
}
