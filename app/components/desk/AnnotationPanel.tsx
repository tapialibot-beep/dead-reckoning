'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function AnnotationPanel() {
  const scenario = useGameStore((s) => s.scenario)
  const session = useGameStore((s) => s.session)
  const currentPhaseIndex = useGameStore((s) => s.currentPhaseIndex)
  const openDecisionModal = useGameStore((s) => s.openDecisionModal)
  const advancePhase = useGameStore((s) => s.advancePhase)
  const decisionModalPhase = useGameStore((s) => s.decisionModalPhase)

  const currentPhase = scenario?.phases[currentPhaseIndex]
  const decisions = session?.decisions ?? []
  const scores = session?.scores ?? []

  const hasDecidedThisPhase = decisions.some(
    (d) => d.phaseId === currentPhase?.id
  )

  const currentScore = scores.find((s) => s.phaseId === currentPhase?.id)
  const isLastPhase = currentPhaseIndex >= (scenario?.phases.length ?? 0) - 1

  return (
    <div className="desk-panel desk-annotations">
      <div className="panel-header">
        <span className="panel-title">WORKSPACE</span>
      </div>
      <div className="panel-body">
        <div className="annotation-section">
          <h4 className="annotation-heading">Notes</h4>
          {decisions.length === 0 ? (
            <div className="annotation-placeholder">
              <p>Your annotations and decision notes will appear here.</p>
            </div>
          ) : (
            <div className="annotation-notes">
              {decisions.map((d, i) => {
                const phase = scenario?.phases.find((p) => p.id === d.phaseId)
                const option = phase?.decision.options.find(
                  (o) => o.id === d.chosenOptionId
                )
                const score = scores.find((s) => s.phaseId === d.phaseId)
                return (
                  <div key={i} className="doc-card">
                    <div className="doc-card-type">Phase {i + 1} Decision</div>
                    <div className="doc-card-title">{option?.text ?? 'Unknown'}</div>
                    <div className="doc-card-date">
                      {d.outcome} &middot; {d.confidenceLevel} &middot; {score?.scorePoints ?? 0} pts
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="annotation-section">
          <h4 className="annotation-heading">Decision</h4>
          {hasDecidedThisPhase ? (
            <div className="annotation-placeholder">
              <p>Decision recorded.</p>
              {currentScore && (
                <p style={{ fontSize: '0.75rem', marginTop: '0.35rem', opacity: 0.7 }}>
                  Score: {currentScore.scorePoints}/100
                </p>
              )}
              {!isLastPhase && (
                <button className="decision-option" onClick={advancePhase}>
                  Proceed to next phase &rarr;
                </button>
              )}
              {isLastPhase && session?.status === 'completed' && (
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--sepia)' }}>
                  Scenario complete.
                </p>
              )}
            </div>
          ) : decisionModalPhase !== 'closed' ? (
            <div className="annotation-placeholder">
              <p>Decision briefing in progress...</p>
            </div>
          ) : (
            <div>
              <div className="decision-prompt">
                {currentPhase?.decision.prompt ?? 'No decision pending.'}
              </div>
              <button
                className="decision-option"
                onClick={openDecisionModal}
                style={{ fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                OPEN DECISION BRIEF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
