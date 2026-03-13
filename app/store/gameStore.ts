import { create } from 'zustand'
import { GameSession, HistoricalDocument, PlayerDecision, Scenario } from '../types'

interface GameState {
  // Current game state
  scenario: Scenario | null
  session: GameSession | null
  currentPhaseIndex: number
  visibleDocuments: HistoricalDocument[]
  selectedDocument: HistoricalDocument | null
  timeRemaining: number
  isPaused: boolean

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
}

export const useGameStore = create<GameState>((set, get) => ({
  scenario: null,
  session: null,
  currentPhaseIndex: 0,
  visibleDocuments: [],
  selectedDocument: null,
  timeRemaining: 0,
  isPaused: false,

  startGame: (scenario, playerId) => {
    const session: GameSession = {
      id: crypto.randomUUID(),
      scenarioId: scenario.id,
      playerId,
      startedAt: new Date().toISOString(),
      decisions: [],
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
  }),
}))
