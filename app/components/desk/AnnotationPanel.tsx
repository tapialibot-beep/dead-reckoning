'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function AnnotationPanel() {
  const scenario = useGameStore((s) => s.scenario)
  const session = useGameStore((s) => s.session)
  const currentPhaseIndex = useGameStore((s) => s.currentPhaseIndex)
  const recordDecision = useGameStore((s) => s.recordDecision)
  const advancePhase = useGameStore((s) => s.advancePhase)

  const currentPhase = scenario?.phases[currentPhaseIndex]
  const decision = currentPhase?.decision
  const decisions = session?.decisions ?? []

  const hasDecidedThisPhase = decisions.some(
    (d) => d.phaseId === currentPhase?.id
  )

  const handleChoose = (optionId: string) => {
    if (!currentPhase || !decision) return
    const option = decision.options.find((o) => o.id === optionId)
    if (!option) return

    recordDecision({
      phaseId: currentPhase.id,
      decisionId: decision.id,
      chosenOptionId: optionId,
      timeSpent: currentPhase.timeLimit - useGameStore.getState().timeRemaining,
      outcome: option.outcome,
    })
  }

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
                return (
                  <div key={i} className="doc-card">
                    <div className="doc-card-type">Phase {i + 1} Decision</div>
                    <div className="doc-card-title">{option?.text ?? 'Unknown'}</div>
                    <div className="doc-card-date">
                      {d.outcome} &middot; {d.timeSpent}s elapsed
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="annotation-section">
          <h4 className="annotation-heading">Decision</h4>
          {!decision || hasDecidedThisPhase ? (
            <div className="annotation-placeholder">
              {hasDecidedThisPhase ? (
                <>
                  <p>Decision recorded.</p>
                  {currentPhaseIndex < (scenario?.phases.length ?? 0) - 1 && (
                    <button className="decision-option" onClick={advancePhase}>
                      Proceed to next phase &rarr;
                    </button>
                  )}
                </>
              ) : (
                <p>No decision pending.</p>
              )}
            </div>
          ) : (
            <div>
              <div className="decision-prompt">{decision.prompt}</div>
              {decision.options.map((option) => (
                <button
                  key={option.id}
                  className="decision-option"
                  onClick={() => handleChoose(option.id)}
                >
                  {option.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
