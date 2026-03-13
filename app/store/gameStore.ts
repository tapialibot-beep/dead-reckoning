import { create } from 'zustand'
import {
  ConfidenceLevel,
  DecisionScore,
  GameSession,
  HistoricalDocument,
  PlayerDecision,
  Scenario,
  DecisionOutcome,
} from '../types'

// KAR-15: Scoring matrix — confidence × outcome
const SCORE_MATRIX: Record<DecisionOutcome, Record<ConfidenceLevel, number>> = {
  correct: { certain: 100, probable: 80, unclear: 60 },
  plausible: { certain: 30, probable: 50, unclear: 45 },
  wrong: { certain: 0, probable: 15, unclear: 25 },
}

export function calculateScore(
  outcome: DecisionOutcome,
  confidence: ConfidenceLevel
): number {
  return SCORE_MATRIX[outcome][confidence]
}

// KAR-15: Decision Point modal phases
type DecisionModalPhase =
  | 'closed'        // No modal
  | 'choosing'      // Selecting an option
  | 'confidence'    // Rating confidence after selection
  | 'debrief'       // Showing outcome reveal

interface GameState {
  // Current game state
  scenario: Scenario | null
  session: GameSession | null
  currentPhaseIndex: number
  visibleDocuments: HistoricalDocument[]
  selectedDocument: HistoricalDocument | null
  timeRemaining: number
  isPaused: boolean

  // KAR-15: Decision Point modal state
  decisionModalPhase: DecisionModalPhase
  selectedOptionId: string | null
  selectedConfidence: ConfidenceLevel | null
  wireDeadlineTimer: number // seconds remaining on 90s wire deadline
  wireTimerActive: boolean

  // Actions
  startGame: (scenario: Scenario, playerId: string) => void
  selectDocument: (doc: HistoricalDocument | null) => void
  recordDecision: (decision: PlayerDecision) => void
  advancePhase: () => void
  unlockDocuments: (documentIds: string[]) => void
  setTimeRemaining: (seconds: number) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  resetGame: () => void

  // KAR-15: Decision Point actions
  openDecisionModal: () => void
  selectOption: (optionId: string) => void
  selectConfidenceLevel: (level: ConfidenceLevel) => void
  confirmDecision: () => void
  closeDebrief: () => void
  tickWireDeadline: () => void
  pauseWireDeadline: () => void
  resumeWireDeadline: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  scenario: null,
  session: null,
  currentPhaseIndex: 0,
  visibleDocuments: [],
  selectedDocument: null,
  timeRemaining: 0,
  isPaused: false,

  // KAR-15 initial state
  decisionModalPhase: 'closed',
  selectedOptionId: null,
  selectedConfidence: null,
  wireDeadlineTimer: 90,
  wireTimerActive: false,

  startGame: (scenario, playerId) => {
    const session: GameSession = {
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      playerId,
      startedAt: new Date().toISOString(),
      decisions: [],
      scores: [],
      currentPhaseIndex: 0,
      status: 'in_progress',
    }
    const firstPhase = scenario.phases[0]
    set({
      scenario,
      session,
      currentPhaseIndex: 0,
      visibleDocuments: firstPhase.documents.filter(d => d.isUnlocked),
      selectedDocument: null,
      timeRemaining: firstPhase.timeLimit,
      isPaused: false,
      decisionModalPhase: 'closed',
      selectedOptionId: null,
      selectedConfidence: null,
    })
  },

  selectDocument: (doc) => set({ selectedDocument: doc }),

  recordDecision: (decision) => {
    const { session } = get()
    if (!session) return
    set({
      session: {
        ...session,
        decisions: [...session.decisions, decision],
      },
    })
  },

  advancePhase: () => {
    const { scenario, currentPhaseIndex } = get()
    if (!scenario) return
    const nextIndex = currentPhaseIndex + 1
    if (nextIndex >= scenario.phases.length) {
      set(state => ({
        session: state.session
          ? { ...state.session, status: 'completed', completedAt: new Date().toISOString() }
          : null,
      }))
      return
    }
    const nextPhase = scenario.phases[nextIndex]
    set({
      currentPhaseIndex: nextIndex,
      visibleDocuments: nextPhase.documents.filter(d => d.isUnlocked),
      selectedDocument: null,
      timeRemaining: nextPhase.timeLimit,
      decisionModalPhase: 'closed',
      selectedOptionId: null,
      selectedConfidence: null,
    })
  },

  unlockDocuments: (documentIds) => {
    set(state => ({
      visibleDocuments: state.visibleDocuments.map(doc =>
        documentIds.includes(doc.id) ? { ...doc, isUnlocked: true } : doc
      ),
    }))
  },

  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),

  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  endGame: () => {
    set(state => ({
      session: state.session
        ? { ...state.session, status: 'abandoned', completedAt: new Date().toISOString() }
        : null,
    }))
  },

  resetGame: () => set({
    scenario: null,
    session: null,
    currentPhaseIndex: 0,
    visibleDocuments: [],
    selectedDocument: null,
    timeRemaining: 0,
    isPaused: false,
    decisionModalPhase: 'closed',
    selectedOptionId: null,
    selectedConfidence: null,
    wireDeadlineTimer: 90,
    wireTimerActive: false,
  }),

  // KAR-15: Decision Point modal actions
  openDecisionModal: () => {
    const { scenario, currentPhaseIndex } = get()
    const phase = scenario?.phases[currentPhaseIndex]
    const timeLimit = phase?.decision.timeLimit ?? 90
    set({
      decisionModalPhase: 'choosing',
      selectedOptionId: null,
      selectedConfidence: null,
      wireDeadlineTimer: timeLimit,
      wireTimerActive: true,
    })
  },

  selectOption: (optionId) => {
    set({
      selectedOptionId: optionId,
      decisionModalPhase: 'confidence',
    })
  },

  selectConfidenceLevel: (level) => {
    set({ selectedConfidence: level })
  },

  confirmDecision: () => {
    const {
      scenario, currentPhaseIndex, session,
      selectedOptionId, selectedConfidence, wireDeadlineTimer,
    } = get()
    if (!scenario || !session || !selectedOptionId || !selectedConfidence) return

    const phase = scenario.phases[currentPhaseIndex]
    const decision = phase.decision
    const option = decision.options.find(o => o.id === selectedOptionId)
    if (!option) return

    const timeLimit = decision.timeLimit ?? 90
    const points = calculateScore(option.outcome, selectedConfidence)

    const playerDecision: PlayerDecision = {
      phaseId: phase.id,
      decisionId: decision.id,
      chosenOptionId: selectedOptionId,
      timeSpent: timeLimit - wireDeadlineTimer,
      outcome: option.outcome,
      confidenceLevel: selectedConfidence,
    }

    const score: DecisionScore = {
      phaseId: phase.id,
      optionSelected: selectedOptionId,
      confidenceLevel: selectedConfidence,
      timeRemaining: wireDeadlineTimer,
      outcomeClassification: option.outcome,
      scorePoints: points,
    }

    set({
      session: {
        ...session,
        decisions: [...session.decisions, playerDecision],
        scores: [...session.scores, score],
      },
      decisionModalPhase: 'debrief',
      wireTimerActive: false,
    })
  },

  closeDebrief: () => {
    set({
      decisionModalPhase: 'closed',
      wireTimerActive: false,
    })
  },

  tickWireDeadline: () => {
    const { wireDeadlineTimer, wireTimerActive, decisionModalPhase } = get()
    if (!wireTimerActive || decisionModalPhase === 'debrief' || decisionModalPhase === 'closed') return

    if (wireDeadlineTimer <= 1) {
      // Time expired — auto-select worst outcome with "no recommendation filed"
      const { scenario, currentPhaseIndex, session } = get()
      if (!scenario || !session) return

      const phase = scenario.phases[currentPhaseIndex]
      const decision = phase.decision
      // Find the wrong option, or last option as fallback
      const worstOption = decision.options.find(o => o.outcome === 'wrong') ?? decision.options[decision.options.length - 1]

      const playerDecision: PlayerDecision = {
        phaseId: phase.id,
        decisionId: decision.id,
        chosenOptionId: worstOption.id,
        timeSpent: decision.timeLimit ?? 90,
        outcome: worstOption.outcome,
        confidenceLevel: 'unclear',
      }

      const score: DecisionScore = {
        phaseId: phase.id,
        optionSelected: worstOption.id,
        confidenceLevel: 'unclear',
        timeRemaining: 0,
        outcomeClassification: worstOption.outcome,
        scorePoints: 0, // No recommendation filed = zero points
      }

      set({
        session: {
          ...session,
          decisions: [...session.decisions, playerDecision],
          scores: [...session.scores, score],
        },
        wireDeadlineTimer: 0,
        wireTimerActive: false,
        decisionModalPhase: 'debrief',
        selectedOptionId: worstOption.id,
        selectedConfidence: 'unclear',
      })
      return
    }

    set({ wireDeadlineTimer: wireDeadlineTimer - 1 })
  },

  pauseWireDeadline: () => set({ wireTimerActive: false }),
  resumeWireDeadline: () => {
    const { decisionModalPhase } = get()
    if (decisionModalPhase !== 'closed' && decisionModalPhase !== 'debrief') {
      set({ wireTimerActive: true })
    }
  },
}))
