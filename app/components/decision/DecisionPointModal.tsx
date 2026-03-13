'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/app/store/gameStore'
import { ConfidenceLevel, DecisionOption } from '@/app/types'

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

  return (
    <div className="wire-timer">
      <div className="wire-timer-label">WIRE DEADLINE</div>
      <div className={`wire-timer-clock ${isUrgent ? 'wire-timer-urgent' : ''}`}>
        {timeStr}
      </div>
      {active ? (
        <button
          className="wire-timer-pause"
          onClick={pauseWireDeadline}
          title="Pause timer (Teacher mode)"
        >
          ❚❚ PAUSE
        </button>
      ) : (
        <button
          className="wire-timer-pause"
          onClick={resumeWireDeadline}
          title="Resume timer"
        >
          ▶ RESUME
        </button>
      )}
    </div>
  )
}

// ─── Option Card ───────────────────────────────────────────

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
  const riskColors: Record<string, string> = {
    low: 'risk-low',
    medium: 'risk-medium',
    high: 'risk-high',
  }

  return (
    <button
      className={`dp-option-card ${isSelected ? 'dp-option-selected' : ''} ${isFocused ? 'dp-option-focused' : ''}`}
      onClick={onSelect}
      data-index={index}
      role="radio"
      aria-checked={isSelected}
      tabIndex={isFocused ? 0 : -1}
    >
      <div className="dp-option-header">
        <span className="dp-option-number">ASSESSMENT {String.fromCharCode(65 + index)}</span>
        <span className={`dp-risk-badge ${riskColors[option.riskLevel]}`}>
          {option.riskLevel.toUpperCase()} RISK
        </span>
      </div>
      <div className="dp-option-text">{option.text}</div>
      <div className="dp-option-basis">
        <span className="dp-basis-label">INTELLIGENCE BASIS:</span> {option.intelligenceBasis}
      </div>
    </button>
  )
}

// ─── Confidence Selector ───────────────────────────────────

function ConfidenceSelector({
  selected,
  onSelect,
}: {
  selected: ConfidenceLevel | null
  onSelect: (level: ConfidenceLevel) => void
}) {
  const levels: { level: ConfidenceLevel; label: string; description: string }[] = [
    { level: 'certain', label: 'CERTAIN', description: 'The evidence is conclusive.' },
    { level: 'probable', label: 'PROBABLE', description: 'The evidence strongly suggests this.' },
    { level: 'unclear', label: 'UNCLEAR', description: 'The evidence is ambiguous.' },
  ]

  return (
    <div className="dp-confidence">
      <div className="dp-confidence-prompt">
        How confident are you in this assessment?
      </div>
      <div className="dp-confidence-options" role="radiogroup" aria-label="Confidence level">
        {levels.map((l) => (
          <button
            key={l.level}
            className={`dp-confidence-stamp ${selected === l.level ? 'dp-stamp-selected' : ''}`}
            onClick={() => onSelect(l.level)}
            role="radio"
            aria-checked={selected === l.level}
          >
            <span className="dp-stamp-label">{l.label}</span>
            <span className="dp-stamp-desc">{l.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Debrief Panel ─────────────────────────────────────────

function DebriefPanel() {
  const scenario = useGameStore((s) => s.scenario)
  const currentPhaseIndex = useGameStore((s) => s.currentPhaseIndex)
  const session = useGameStore((s) => s.session)
  const selectedOptionId = useGameStore((s) => s.selectedOptionId)
  const closeDebrief = useGameStore((s) => s.closeDebrief)
  const advancePhase = useGameStore((s) => s.advancePhase)

  if (!scenario || !session) return null

  const phase = scenario.phases[currentPhaseIndex]
  const decision = phase.decision
  const chosenOption = decision.options.find((o) => o.id === selectedOptionId)
  const latestScore = session.scores[session.scores.length - 1]
  const isLastPhase = currentPhaseIndex >= scenario.phases.length - 1

  if (!chosenOption || !latestScore) return null

  const outcomeLabels: Record<string, { label: string; className: string }> = {
    correct: { label: 'HISTORICALLY ACCURATE', className: 'outcome-correct' },
    plausible: { label: 'HISTORICALLY PLAUSIBLE', className: 'outcome-plausible' },
    wrong: { label: 'HISTORICALLY INACCURATE', className: 'outcome-wrong' },
  }

  const outcomeInfo = outcomeLabels[chosenOption.outcome]
  const timedOut = latestScore.timeRemaining === 0 && latestScore.scorePoints === 0

  // Alternate history: debrief notes for unchosen options
  const unchosenOptions = decision.options.filter((o) => o.id !== selectedOptionId)

  const handleProceed = () => {
    closeDebrief()
    if (!isLastPhase) {
      advancePhase()
    }
  }

  return (
    <div className="dp-debrief">
      <div className="dp-debrief-header">
        <span className="dp-debrief-stamp">OUTCOME CLASSIFIED</span>
      </div>

      {timedOut && (
        <div className="dp-timeout-notice">
          NO RECOMMENDATION FILED — Wire deadline expired. The worst-case assessment was forwarded by default.
        </div>
      )}

      {/* What actually happened */}
      <div className="dp-debrief-section">
        <div className="dp-debrief-label">YOUR ASSESSMENT</div>
        <div className="dp-debrief-choice">{chosenOption.text}</div>
        <div className={`dp-outcome-badge ${outcomeInfo.className}`}>
          {outcomeInfo.label}
        </div>
        <div className="dp-debrief-note">{chosenOption.debriefNote}</div>
      </div>

      {/* Consequences */}
      <div className="dp-debrief-section">
        <div className="dp-debrief-label">CONSEQUENCES</div>
        <ul className="dp-consequences-list">
          {chosenOption.consequences.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      {/* Alternate history — what would have happened */}
      <div className="dp-debrief-section">
        <div className="dp-debrief-label">ALTERNATE HISTORY</div>
        {unchosenOptions.map((opt) => (
          <div key={opt.id} className="dp-alternate">
            <div className="dp-alternate-option">
              &ldquo;{opt.text}&rdquo;
            </div>
            <div className="dp-alternate-note">{opt.debriefNote}</div>
          </div>
        ))}
      </div>

      {/* Score */}
      <div className="dp-debrief-section">
        <div className="dp-debrief-label">SCORE CONTRIBUTION</div>
        <div className="dp-score-display">
          <span className="dp-score-points">{latestScore.scorePoints}</span>
          <span className="dp-score-max">/ 100</span>
        </div>
        <div className="dp-score-breakdown">
          {chosenOption.outcome === 'wrong' && latestScore.confidenceLevel === 'certain' && (
            <span className="dp-score-flavor">Overconfident — the evidence did not support certainty.</span>
          )}
          {chosenOption.outcome === 'correct' && latestScore.confidenceLevel === 'certain' && (
            <span className="dp-score-flavor">Decisive and correct — the mark of a skilled analyst.</span>
          )}
          {chosenOption.outcome === 'correct' && latestScore.confidenceLevel !== 'certain' && (
            <span className="dp-score-flavor">Correct assessment, but your hesitation cost conviction points.</span>
          )}
          {chosenOption.outcome === 'plausible' && latestScore.confidenceLevel === 'certain' && (
            <span className="dp-score-flavor">A defensible reading, but certainty was premature. The evidence was more ambiguous than you judged.</span>
          )}
          {chosenOption.outcome === 'plausible' && latestScore.confidenceLevel !== 'certain' && (
            <span className="dp-score-flavor">A reasonable assessment with calibrated confidence. Many analysts agreed with you.</span>
          )}
          {chosenOption.outcome === 'wrong' && latestScore.confidenceLevel !== 'certain' && (
            <span className="dp-score-flavor">Incorrect assessment, but at least you hedged your confidence.</span>
          )}
        </div>
      </div>

      <button className="dp-proceed-btn" onClick={handleProceed}>
        {isLastPhase ? 'END OF SCENARIO' : 'PROCEED TO NEXT PHASE'} &rarr;
      </button>
    </div>
  )
}

// ─── Main Modal ────────────────────────────────────────────

export default function DecisionPointModal() {
  const scenario = useGameStore((s) => s.scenario)
  const currentPhaseIndex = useGameStore((s) => s.currentPhaseIndex)
  const modalPhase = useGameStore((s) => s.decisionModalPhase)
  const selectedOptionId = useGameStore((s) => s.selectedOptionId)
  const selectedConfidence = useGameStore((s) => s.selectedConfidence)
  const selectOption = useGameStore((s) => s.selectOption)
  const selectConfidenceLevel = useGameStore((s) => s.selectConfidenceLevel)
  const confirmDecision = useGameStore((s) => s.confirmDecision)
  const closeDebrief = useGameStore((s) => s.closeDebrief)

  const containerRef = useRef<HTMLDivElement>(null)

  // Track focused card index for arrow key navigation
  const focusedIndexRef = useRef(0)
  const setFocusedIdx = useCallback((idx: number) => {
    focusedIndexRef.current = idx
    // Force re-render by setting state indirectly through DOM
    containerRef.current?.querySelectorAll('[data-index]').forEach((el, i) => {
      if (i === idx) {
        (el as HTMLElement).focus()
      }
    })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (modalPhase === 'closed') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (modalPhase === 'choosing') {
        const optionCount = scenario?.phases[currentPhaseIndex]?.decision.options.length ?? 3

        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          e.preventDefault()
          const next = (focusedIndexRef.current + 1) % optionCount
          setFocusedIdx(next)
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          e.preventDefault()
          const prev = (focusedIndexRef.current - 1 + optionCount) % optionCount
          setFocusedIdx(prev)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const options = scenario?.phases[currentPhaseIndex]?.decision.options
          if (options && options[focusedIndexRef.current]) {
            selectOption(options[focusedIndexRef.current].id)
          }
        }
      }

      // ESC closes with concept of "are you sure"
      if (e.key === 'Escape') {
        e.preventDefault()
        // In debrief, ESC closes debrief
        if (modalPhase === 'debrief') {
          closeDebrief()
        }
        // During choosing/confidence — ESC is intentionally a no-op.
        // You can't walk away from the wire desk. The timer is running.
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [modalPhase, scenario, currentPhaseIndex, selectOption, closeDebrief, setFocusedIdx])

  // Focus trap — focus first card when modal opens
  useEffect(() => {
    if (modalPhase === 'choosing') {
      setTimeout(() => {
        const firstCard = containerRef.current?.querySelector('[data-index="0"]') as HTMLElement
        firstCard?.focus()
      }, 100)
    }
  }, [modalPhase])

  if (modalPhase === 'closed' || !scenario) return null

  const phase = scenario.phases[currentPhaseIndex]
  const decision = phase.decision

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
        <div className="dp-header">
          <div className="dp-classification">CLASSIFIED — DECISION REQUIRED</div>
          <div className="dp-phase-title">{phase.name}</div>
          <div className="dp-pressure-context">{decision.pressureContext}</div>
        </div>

        {/* Timer — always visible during choosing/confidence */}
        {(modalPhase === 'choosing' || modalPhase === 'confidence') && (
          <WireDeadlineTimer />
        )}

        {/* Choosing phase */}
        {modalPhase === 'choosing' && (
          <div className="dp-body">
            <div className="dp-briefing">
              <div className="dp-briefing-label">BRIEFING</div>
              <div className="dp-briefing-text">{decision.prompt}</div>
            </div>
            <div className="dp-options" role="radiogroup" aria-label="Decision options">
              {decision.options.map((option, i) => (
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
        {modalPhase === 'confidence' && (
          <div className="dp-body">
            <div className="dp-chosen-summary">
              <div className="dp-chosen-label">YOUR RECOMMENDATION</div>
              <div className="dp-chosen-text">
                {decision.options.find((o) => o.id === selectedOptionId)?.text}
              </div>
            </div>
            <ConfidenceSelector
              selected={selectedConfidence}
              onSelect={selectConfidenceLevel}
            />
            <button
              className="dp-confirm-btn"
              onClick={confirmDecision}
              disabled={!selectedConfidence}
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
