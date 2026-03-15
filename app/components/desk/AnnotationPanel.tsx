'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function AnnotationPanel() {
  const scenario = useGameStore((s) => s.scenario)
  const currentNodeId = useGameStore((s) => s.currentNodeId)
  const sessionStatus = useGameStore((s) => s.sessionStatus)
  const decisions = useGameStore((s) => s.decisions)
  const scores = useGameStore((s) => s.scores)
  const openDecisionModal = useGameStore((s) => s.openDecisionModal)
  const navigateToNode = useGameStore((s) => s.navigateToNode)
  const decisionModalPhase = useGameStore((s) => s.decisionModalPhase)

  const currentNode = currentNodeId ? scenario?.nodes[currentNodeId] : null
  const hasDecidedAtCurrentNode = decisions.some(d => d.nodeId === currentNodeId)

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
                const node = scenario?.nodes[d.nodeId]
                const option = node?.options?.find(o => o.id === d.chosenOptionId)
                const score = scores.find(s => s.nodeId === d.nodeId)
                return (
                  <div key={i} className="doc-card">
                    <div className="doc-card-type">Decision {i + 1}</div>
                    <div className="doc-card-title">{option?.text ?? 'Unknown'}</div>
                    <div className="doc-card-date">
                      {d.outcome} &middot; {d.confidence} &middot; {score?.scorePoints ?? 0} pts
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="annotation-section">
          <h4 className="annotation-heading">Decision</h4>
          {sessionStatus === 'completed' ? (
            <div className="annotation-placeholder">
              <p>Scenario complete.</p>
            </div>
          ) : hasDecidedAtCurrentNode ? (
            <div className="annotation-placeholder">
              <p>Decision recorded.</p>
            </div>
          ) : decisionModalPhase !== 'closed' ? (
            <div className="annotation-placeholder">
              <p>Decision briefing in progress...</p>
            </div>
          ) : currentNode?.type === 'crisis' ? (
            <div>
              <div className="decision-prompt">
                {currentNode.prompt ?? 'No decision pending.'}
              </div>
              <button
                className="decision-option"
                onClick={openDecisionModal}
                style={{ fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                OPEN DECISION BRIEF
              </button>
            </div>
          ) : currentNode?.type === 'consequence' && currentNode.nextNodeId ? (
            <div>
              {currentNode.imageUrl && (
                <div className="dp-scene-image">
                  <img src={currentNode.imageUrl} alt={currentNode.name} />
                </div>
              )}
              <div className="decision-prompt">{currentNode.description}</div>
              <button
                className="decision-option"
                onClick={() => navigateToNode(currentNode.nextNodeId!)}
                style={{ fontWeight: 'bold', letterSpacing: '0.1em', textTransform: 'uppercase' }}
              >
                CONTINUE &rarr;
              </button>
            </div>
          ) : (
            <div className="annotation-placeholder">
              <p>&mdash;</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
