'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore } from '@/app/store/gameStore'
import type { ConfidenceLevel, DecisionOption } from '@/app/types/scenario'
import { useMilitaryTTS } from '@/app/hooks/useMilitaryTTS'

// ─── Code label map — scanning anchors for each option slot ───────────────
// Index 0→EXECUTE, 1→DEFER, 2→HOLD, 3→ADVISE, 4→ABORT
const CODE_LABELS = ['EXECUTE', 'DEFER', 'HOLD', 'ADVISE', 'ABORT']

// Urgency stamps — replaces prose importance indicators
export type UrgencyStamp = 'FLASH' | 'IMMEDIATE' | 'PRIORITY' | 'ROUTINE'

// ─── Timer Display ─────────────────────────────────────────

function WireDeadlineTimer() {
  const timer = useGameStore((s) => s.wireDeadlineTimer)
  const active = useGameStore((s) => s.wireTimerActive)
  const tickWireDeadline = useGameStore((s) => s.tickWireDeadline)
  const pauseWireDeadline = useGameStore((s) => s.pauseWireDeadline)
  const resumeWireDeadline = useGameStore((s) => s.resumeWireDeadline)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(tickWireDeadline, 1000)
    return () => clearInterval(interval)
  }, [active, tickWireDeadline])

  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
  const isUrgent = timer <= 15

  const urgencyStamp: UrgencyStamp = timer > 60 ? 'ROUTINE' : timer > 30 ? 'PRIORITY' : timer > 15 ? 'IMMEDIATE' : 'FLASH'

  return (
    <div className="wire-timer">
      <div className="wire-timer-label">WIRE DEADLINE</div>
      <div className={`wire-timer-clock ${isUrgent ? 'wire-timer-urgent' : ''}`}>
        {timeStr}
      </div>
      <div className={`wire-urgency-stamp wire-urgency-${urgencyStamp.toLowerCase()}`}>
        {urgencyStamp}
      </div>
      {active ? (
        <button className="wire-timer-pause" onClick={pauseWireDeadline} title="Pause timer (Teacher mode)">
          ❚❚ PAUSE
        </button>
      ) : (
        <button className="wire-timer-pause" onClick={resumeWireDeadline} title="Resume timer">
          ▶ RESUME
        </button>
      )}
    </div>
  )
}

// ─── Option Card — BLUF format with expand toggle ──────────────────────────

function OptionCard({
  option,
  index,
  isSelected,
  isFocused,
  onSelect,
}: {
  option: DecisionOption
  index: number
  isSelected: boolean
  isFocused: boolean
  onSelect: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { speak, stop } = useMilitaryTTS()
  const codeLabel = CODE_LABELS[index] ?? `OPTION ${String.fromCharCode(65 + index)}`

  const readText = `${codeLabel}. ${option.text}`

  return (
    <div
      className={`dp-option-card ${isSelected ? 'dp-option-selected' : ''} ${isFocused ? 'dp-option-focused' : ''}`}
      role="radio"
      aria-checked={isSelected}
      tabIndex={isFocused ? 0 : -1}
      data-index={index}
      onMouseEnter={() => speak(readText)}
      onFocus={() => speak(readText)}
      onMouseLeave={stop}
      onBlur={stop}
    >
      <button
        className="dp-option-select-area"
        onClick={onSelect}
        tabIndex={-1}
        aria-label={`Select ${codeLabel}: ${option.text}`}
      >
        <div className="dp-option-header">
          <span className="dp-option-code-label">{codeLabel}</span>
        </div>
        <div className={`dp-option-text ${expanded ? '' : 'dp-option-clamped'}`}>
          {option.text}
        </div>
      </button>
      {/* Expand toggle — outside the select button to avoid nested button */}
      <button
        className="dp-option-expand"
        onClick={(e) => { e.stopPropagation(); setExpanded(v => !v) }}
        tabIndex={-1}
        aria-label={expanded ? 'Collapse dispatch' : 'Read full dispatch'}
      >
        {expanded ? '▲ COLLAPSE' : '▼ READ DISPATCH'}
      </button>
    </div>
  )
}

// ─── Confidence Selector — NATO 5-level ────────────────────────────────────

const NATO_CONFIDENCE: { level: ConfidenceLevel; natoLabel: string; natoNumber: string; description: string }[] = [
  { level: 'high',   natoLabel: 'CERTAIN',   natoNumber: '1',   description: 'Evidence is conclusive. No reasonable doubt.' },
  { level: 'medium', natoLabel: 'PROBABLE',  natoNumber: '2–3', description: 'Evidence strongly supports this assessment.' },
  { level: 'low',    natoLabel: 'POSSIBLE',  natoNumber: '4–5', description: 'Evidence is ambiguous or incomplete.' },
]

function ConfidenceSelector({
  selected,
  onSelect,
}: {
  selected: ConfidenceLevel | null
  onSelect: (level: ConfidenceLevel) => void
}) {
  const { speak, stop } = useMilitaryTTS()

  return (
    <div className="dp-confidence">
      <div className="dp-confidence-prompt">
        State your confidence in this assessment.
      </div>
      <div className="dp-confidence-options" role="radiogroup" aria-label="Confidence level">
        {NATO_CONFIDENCE.map((l) => (
          <button
            key={l.level}
            className={`dp-confidence-stamp ${selected === l.level ? 'dp-stamp-selected' : ''}`}
            onClick={() => onSelect(l.level)}
            role="radio"
            aria-checked={selected === l.level}
            onMouseEnter={() => speak(`${l.natoLabel}. ${l.description}`)}
            onFocus={() => speak(`${l.natoLabel}. ${l.description}`)}
            onMouseLeave={stop}
            onBlur={stop}
          >
            <span className="dp-stamp-nato-number">{l.natoNumber}</span>
            <span className="dp-stamp-label">{l.natoLabel}</span>
            <span className="dp-stamp-desc">{l.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Debrief Panel — 4-tab layout ─────────────────────────────────────────

type DebriefTab = 'flash' | 'assessment' | 'alt-history' | 'score'

const TAB_LABELS: { id: DebriefTab; label: string }[] = [
  { id: 'flash',       label: 'FLASH REPORT' },
  { id: 'assessment',  label: 'ASSESSMENT' },
  { id: 'alt-history', label: 'ALT HISTORY' },
  { id: 'score',       label: 'SCORE' },
]

function DebriefPanel() {
  const scenario = useGameStore((s) => s.scenario)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const visitedNodeIds = useGameStore((s) => s.visitedNodeIds)
  const selectedOptionId = useGameStore((s) => s.selectedOptionId)
  const scores = useGameStore((s) => s.scores)
  const closeDebrief = useGameStore((s) => s.closeDebrief)
  const sessionStatus = useGameStore((s) => s.sessionStatus)
  const { speak, stop } = useMilitaryTTS()

  const [activeTab, setActiveTab] = useState<DebriefTab>('flash')

  if (!scenario || !currentNodeId) return null

  const currentNode = scenario.nodes[currentNodeId]
  const isResolution = currentNode?.type === 'resolution'

  const previousCrisisNodeId = [...visitedNodeIds]
    .slice(0, -1)
    .reverse()
    .find(id => scenario.nodes[id]?.type === 'crisis')

  const crisisNode = previousCrisisNodeId ? scenario.nodes[previousCrisisNodeId] : null
  const chosenOption = crisisNode?.options?.find(o => o.id === selectedOptionId)
  const latestScore = scores[scores.length - 1]

  const outcomeLabels: Record<string, { label: string; className: string }> = {
    correct:   { label: 'HISTORICALLY ACCURATE',  className: 'outcome-correct' },
    plausible: { label: 'HISTORICALLY PLAUSIBLE', className: 'outcome-plausible' },
    wrong:     { label: 'HISTORICALLY INACCURATE', className: 'outcome-wrong' },
  }

  const timedOut = latestScore?.timeRemaining === 0 && latestScore?.scorePoints === 0
  const unchosenOptions = crisisNode?.options?.filter(o => o.id !== selectedOptionId) ?? []

  const outcomeCategoryLabels: Record<string, string> = {
    historical:   'HISTORICAL OUTCOME',
    divergent:    'DIVERGENT HISTORY',
    avoided:      'WAR AVOIDED',
    catastrophic: 'CATASTROPHIC FAILURE',
  }

  return (
    <div className="dp-debrief">
      <div className="dp-debrief-header">
        <span className="dp-debrief-stamp">OUTCOME CLASSIFIED</span>
      </div>

      {timedOut && (
        <div className="dp-timeout-notice">
          NO RECOMMENDATION FILED — Wire deadline expired. Worst-case forwarded by default.
        </div>
      )}

      {/* Tab strip */}
      <div className="dp-tab-strip" role="tablist">
        {TAB_LABELS.map(tab => (
          <button
            key={tab.id}
            className={`dp-tab ${activeTab === tab.id ? 'dp-tab-active' : ''}`}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            onMouseEnter={() => speak(tab.label)}
            onMouseLeave={stop}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: FLASH REPORT — situation update + resolution outcome */}
      {activeTab === 'flash' && (
        <div className="dp-tab-panel" role="tabpanel">
          {currentNode && (
            <div className="dp-debrief-section">
              <div className="dp-debrief-label">SITUATION UPDATE</div>
              <div className="dp-debrief-note">{currentNode.description}</div>
            </div>
          )}
          {isResolution && currentNode?.outcome && (
            <div className="dp-debrief-section">
              <div className="dp-debrief-label">
                {outcomeCategoryLabels[currentNode.outcome.category] ?? 'OUTCOME'}
              </div>
              <div className="dp-debrief-choice">{currentNode.outcome.title}</div>
              <div className="dp-debrief-note">{currentNode.outcome.summary}</div>
              <div className="dp-debrief-note dp-note-faded">
                {currentNode.outcome.historicalNote}
              </div>
            </div>
          )}
          {chosenOption && (
            <div className="dp-debrief-section">
              <div className="dp-debrief-label">CONSEQUENCES</div>
              <ul className="dp-consequences-list">
                {chosenOption.consequences.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Tab: ASSESSMENT — chosen option + outcome badge */}
      {activeTab === 'assessment' && (
        <div className="dp-tab-panel" role="tabpanel">
          {chosenOption ? (
            <div className="dp-debrief-section">
              <div className="dp-debrief-label">YOUR ASSESSMENT</div>
              <div className="dp-debrief-choice">{chosenOption.text}</div>
              <div className={`dp-outcome-badge ${outcomeLabels[chosenOption.outcome]?.className ?? ''}`}>
                {outcomeLabels[chosenOption.outcome]?.label}
              </div>
              <div className="dp-debrief-note">{chosenOption.debriefNote}</div>
            </div>
          ) : (
            <div className="dp-debrief-section">
              <div className="dp-debrief-note dp-note-faded">No assessment recorded.</div>
            </div>
          )}
        </div>
      )}

      {/* Tab: ALT HISTORY — unchosen options */}
      {activeTab === 'alt-history' && (
        <div className="dp-tab-panel" role="tabpanel">
          {unchosenOptions.length > 0 ? (
            unchosenOptions.map((opt) => (
              <div key={opt.id} className="dp-alternate">
                <div className="dp-alternate-option">&ldquo;{opt.text}&rdquo;</div>
                <div className="dp-alternate-note">{opt.debriefNote}</div>
              </div>
            ))
          ) : (
            <div className="dp-debrief-note dp-note-faded">No alternate paths available.</div>
          )}
        </div>
      )}

      {/* Tab: SCORE */}
      {activeTab === 'score' && (
        <div className="dp-tab-panel" role="tabpanel">
          {latestScore ? (
            <div className="dp-debrief-section">
              <div className="dp-debrief-label">SCORE CONTRIBUTION</div>
              <div className="dp-score-display">
                <span className="dp-score-points">{latestScore.scorePoints}</span>
                <span className="dp-score-max">/ 100</span>
              </div>
              <div className="dp-score-breakdown">
                {latestScore.outcomeClassification === 'wrong' && latestScore.confidenceLevel === 'high' && (
                  <span className="dp-score-flavor">Overconfident — evidence did not support certainty.</span>
                )}
                {latestScore.outcomeClassification === 'correct' && latestScore.confidenceLevel === 'high' && (
                  <span className="dp-score-flavor">Decisive and correct — the mark of a skilled analyst.</span>
                )}
                {latestScore.outcomeClassification === 'correct' && latestScore.confidenceLevel !== 'high' && (
                  <span className="dp-score-flavor">Correct assessment, but hesitation cost conviction points.</span>
                )}
                {latestScore.outcomeClassification === 'plausible' && latestScore.confidenceLevel === 'high' && (
                  <span className="dp-score-flavor">Defensible reading, but certainty was premature.</span>
                )}
                {latestScore.outcomeClassification === 'plausible' && latestScore.confidenceLevel !== 'high' && (
                  <span className="dp-score-flavor">Reasonable assessment with calibrated confidence.</span>
                )}
                {latestScore.outcomeClassification === 'wrong' && latestScore.confidenceLevel !== 'high' && (
                  <span className="dp-score-flavor">Incorrect assessment, but at least you hedged.</span>
                )}
              </div>
            </div>
          ) : (
            <div className="dp-debrief-note dp-note-faded">Score not yet calculated.</div>
          )}
        </div>
      )}

      <button
        className="dp-proceed-btn"
        onClick={closeDebrief}
        onMouseEnter={() => speak(sessionStatus === 'completed' ? 'End of scenario' : 'Proceed')}
        onMouseLeave={stop}
      >
        {sessionStatus === 'completed' ? 'END OF SCENARIO' : 'PROCEED'} &rarr;
      </button>
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────

export default function DecisionPointModal() {
  const scenario = useGameStore((s) => s.scenario)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const modalPhase = useGameStore((s) => s.decisionModalPhase)
  const selectedOptionId = useGameStore((s) => s.selectedOptionId)
  const selectedConfidence = useGameStore((s) => s.selectedConfidence)
  const selectOption = useGameStore((s) => s.selectOption)
  const selectConfidenceLevel = useGameStore((s) => s.selectConfidenceLevel)
  const confirmDecision = useGameStore((s) => s.confirmDecision)
  const closeDebrief = useGameStore((s) => s.closeDebrief)
  const { speak, stop } = useMilitaryTTS()

  const containerRef = useRef<HTMLDivElement>(null)
  const focusedIndexRef = useRef(0)

  const currentNode = currentNodeId ? scenario?.nodes[currentNodeId] : null

  const setFocusedIdx = useCallback((idx: number) => {
    focusedIndexRef.current = idx
    containerRef.current?.querySelectorAll('[data-index]').forEach((el, i) => {
      if (i === idx) (el as HTMLElement).focus()
    })
  }, [])

  useEffect(() => {
    if (modalPhase === 'closed') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalPhase === 'choosing') {
        const optionCount = currentNode?.options?.length ?? 3

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault()
          setFocusedIdx((focusedIndexRef.current + 1) % optionCount)
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault()
          setFocusedIdx((focusedIndexRef.current - 1 + optionCount) % optionCount)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const options = currentNode?.options
          if (options?.[focusedIndexRef.current]) {
            selectOption(options[focusedIndexRef.current].id)
          }
        }
      }

      if (e.key === 'Escape' && modalPhase === 'debrief') {
        e.preventDefault()
        closeDebrief()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalPhase, currentNode, selectOption, closeDebrief, setFocusedIdx])

  useEffect(() => {
    if (modalPhase === 'choosing') {
      setTimeout(() => {
        const firstCard = containerRef.current?.querySelector('[data-index="0"]') as HTMLElement
        firstCard?.focus()
      }, 100)
    }
  }, [modalPhase])

  if (modalPhase === 'closed' || !scenario) return null

  return (
    <div
      className="dp-overlay"
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-label="Decision Point"
    >
      <div className="dp-modal">
        {/* Header */}
        {(modalPhase === 'choosing' || modalPhase === 'confidence') && currentNode && (
          <div className="dp-header">
            <div className="dp-classification">CLASSIFIED — DECISION REQUIRED</div>
            <div className="dp-phase-title">{currentNode.name}</div>
            <div className="dp-pressure-context">{currentNode.description}</div>
          </div>
        )}

        {/* Timer */}
        {(modalPhase === 'choosing' || modalPhase === 'confidence') && <WireDeadlineTimer />}

        {/* Choosing phase */}
        {modalPhase === 'choosing' && currentNode?.options && (
          <div className="dp-body">
            <div className="dp-briefing">
              <div className="dp-briefing-label">BRIEFING</div>
              <div className="dp-briefing-text">{currentNode.prompt}</div>
            </div>
            <div className="dp-options" role="radiogroup" aria-label="Decision options">
              {currentNode.options.map((option, i) => (
                <OptionCard
                  key={option.id}
                  option={option}
                  index={i}
                  isSelected={selectedOptionId === option.id}
                  isFocused={false}
                  onSelect={() => selectOption(option.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Confidence phase */}
        {modalPhase === 'confidence' && currentNode?.options && (
          <div className="dp-body">
            <div className="dp-chosen-summary">
              <div className="dp-chosen-label">YOUR RECOMMENDATION</div>
              <div className="dp-chosen-text">
                {currentNode.options.find(o => o.id === selectedOptionId)?.text}
              </div>
            </div>
            <ConfidenceSelector selected={selectedConfidence} onSelect={selectConfidenceLevel} />
            <button
              className="dp-confirm-btn"
              onClick={confirmDecision}
              disabled={!selectedConfidence}
              onMouseEnter={() => speak('Stamp and send assessment')}
              onMouseLeave={stop}
            >
              STAMP &amp; SEND ASSESSMENT
            </button>
          </div>
        )}

        {/* Debrief phase */}
        {modalPhase === 'debrief' && <DebriefPanel />}
      </div>
    </div>
  )
}
