import { create } from 'zustand'
import type {
  Scenario,
  ScenarioNode,
  HistoricalDocument,
  ConfidenceLevel,
  DecisionOutcome,
} from '../types/scenario'

// ---------------------------------------------------------------------------
// Scoring matrix — confidence × outcome
// ---------------------------------------------------------------------------

const SCORE_MATRIX: Record<DecisionOutcome, Record<ConfidenceLevel, number>> = {
  correct:   { high: 100, medium: 80, low: 60 },
  plausible: { high: 30,  medium: 50, low: 45 },
  wrong:     { high: 0,   medium: 15, low: 25 },
}

export function calculateScore(outcome: DecisionOutcome, confidence: ConfidenceLevel): number {
  return SCORE_MATRIX[outcome][confidence]
}

// ---------------------------------------------------------------------------
// Local session types
// ---------------------------------------------------------------------------

export interface NodePlayerDecision {
  nodeId: string
  chosenOptionId: string
  confidence: ConfidenceLevel
  outcome: DecisionOutcome
  timeSpent: number // seconds
}

export interface NodeDecisionScore {
  nodeId: string
  optionSelected: string
  confidenceLevel: ConfidenceLevel
  timeRemaining: number
  outcomeClassification: DecisionOutcome
  scorePoints: number
}

// ---------------------------------------------------------------------------
// Modal phase
// ---------------------------------------------------------------------------

type DecisionModalPhase = 'closed' | 'choosing' | 'confidence' | 'debrief'

// ---------------------------------------------------------------------------
// State interface
// ---------------------------------------------------------------------------

interface GameState {
  // Scenario + node traversal
  scenario: Scenario | null
  currentNodeId: string | null
  visitedNodeIds: string[]
  currentPressure: number
  unlockedDocumentIds: string[]

  // Documents
  visibleDocuments: HistoricalDocument[]
  selectedDocument: HistoricalDocument | null

  // Session
  sessionId: string | null
  playerId: string | null
  teamName: string | null
  roomCode: string | null
  sessionStatus: 'idle' | 'in_progress' | 'completed' | 'abandoned'
  startedAt: string | null
  completedAt: string | null
  decisions: NodePlayerDecision[]
  scores: NodeDecisionScore[]

  // Timing
  timeRemaining: number
  isPaused: boolean

  // Historical mode
  historicalMode: boolean

  // Modal
  decisionModalPhase: DecisionModalPhase
  selectedOptionId: string | null
  selectedConfidence: ConfidenceLevel | null
  wireDeadlineTimer: number
  wireTimerActive: boolean

  // Actions
  setTeamName: (name: string) => void
  setRoomCode: (code: string | null) => void
  setHistoricalMode: (enabled: boolean) => void
  startGame: (scenario: Scenario, playerId: string, teamName?: string) => void
  navigateToNode: (nodeId: string) => void
  selectDocument: (doc: HistoricalDocument | null) => void
  unlockDocuments: (documentIds: string[]) => void
  setTimeRemaining: (seconds: number) => void
  pauseGame: () => void
  resumeGame: () => void
  endGame: () => void
  resetGame: () => void

  // Modal actions
  openDecisionModal: () => void
  selectOption: (optionId: string) => void
  selectConfidenceLevel: (level: ConfidenceLevel) => void
  confirmDecision: () => void
  closeDebrief: () => void
  tickWireDeadline: () => void
  pauseWireDeadline: () => void
  resumeWireDeadline: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildVisibleDocuments(
  scenario: Scenario,
  nodeId: string,
  unlockedIds: string[]
): HistoricalDocument[] {
  const node = scenario.nodes[nodeId]
  if (!node) return []
  const allIds = new Set([...node.initialDocumentIds, ...unlockedIds])
  return scenario.documentLibrary.filter(doc => allIds.has(doc.id))
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const INITIAL_STATE = {
  scenario: null,
  currentNodeId: null,
  visitedNodeIds: [] as string[],
  currentPressure: 50,
  unlockedDocumentIds: [] as string[],
  visibleDocuments: [] as HistoricalDocument[],
  selectedDocument: null,
  sessionId: null,
  playerId: null,
  teamName: null,
  roomCode: null,
  sessionStatus: 'idle' as const,
  startedAt: null,
  completedAt: null,
  decisions: [] as NodePlayerDecision[],
  scores: [] as NodeDecisionScore[],
  timeRemaining: 0,
  isPaused: false,
  historicalMode: false,
  decisionModalPhase: 'closed' as DecisionModalPhase,
  selectedOptionId: null,
  selectedConfidence: null,
  wireDeadlineTimer: 90,
  wireTimerActive: false,
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState>((set, get) => ({
  ...INITIAL_STATE,

  setTeamName: (name) => set({ teamName: name }),
  setRoomCode: (code) => set({ roomCode: code }),
  setHistoricalMode: (enabled) => set({ historicalMode: enabled }),

  startGame: (scenario, playerId, teamName) => {
    const startNodeId = scenario.startNodeId
    const initialPressure = scenario.initialPressure ?? 50
    set({
      scenario,
      currentNodeId: startNodeId,
      visitedNodeIds: [startNodeId],
      currentPressure: initialPressure,
      unlockedDocumentIds: [],
      visibleDocuments: buildVisibleDocuments(scenario, startNodeId, []),
      selectedDocument: null,
      sessionId: crypto.randomUUID(),
      playerId,
      teamName: teamName ?? null,
      sessionStatus: 'in_progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
      decisions: [],
      scores: [],
      timeRemaining: scenario.nodes[startNodeId]?.timeLimit ?? 0,
      isPaused: false,
      decisionModalPhase: 'closed',
      selectedOptionId: null,
      selectedConfidence: null,
      wireDeadlineTimer: 90,
      wireTimerActive: false,
    })
  },

  navigateToNode: (nodeId) => {
    const { scenario, unlockedDocumentIds, visitedNodeIds, currentPressure } = get()
    if (!scenario) return
    const node = scenario.nodes[nodeId]
    if (!node) return

    const newPressure =
      node.type === 'consequence' && node.pressureDelta !== undefined
        ? Math.max(0, Math.min(100, currentPressure + node.pressureDelta))
        : currentPressure

    const isComplete = node.type === 'resolution'

    set({
      currentNodeId: nodeId,
      visitedNodeIds: [...visitedNodeIds, nodeId],
      currentPressure: newPressure,
      visibleDocuments: buildVisibleDocuments(scenario, nodeId, unlockedDocumentIds),
      selectedDocument: null,
      timeRemaining: node.timeLimit ?? 0,
      ...(isComplete
        ? {
            sessionStatus: 'completed',
            completedAt: new Date().toISOString(),
            // Show the resolution outcome in the debrief panel
            decisionModalPhase: 'debrief',
          }
        : {}),
    })
  },

  selectDocument: (doc) => set({ selectedDocument: doc }),

  unlockDocuments: (documentIds) => {
    const { scenario, currentNodeId, unlockedDocumentIds } = get()
    if (!scenario || !currentNodeId) return
    const merged = [...new Set([...unlockedDocumentIds, ...documentIds])]
    set({
      unlockedDocumentIds: merged,
      visibleDocuments: buildVisibleDocuments(scenario, currentNodeId, merged),
    })
  },

  setTimeRemaining: (seconds) => set({ timeRemaining: seconds }),
  pauseGame: () => set({ isPaused: true }),
  resumeGame: () => set({ isPaused: false }),

  endGame: () =>
    set({ sessionStatus: 'abandoned', completedAt: new Date().toISOString() }),

  resetGame: () => set(INITIAL_STATE),

  // --- Modal ---

  openDecisionModal: () => {
    const {
      scenario, currentNodeId, historicalMode,
      decisions, scores, unlockedDocumentIds, visitedNodeIds, currentPressure,
    } = get()
    const node = scenario?.nodes[currentNodeId ?? '']

    // Historical mode: auto-select the real actor's choice, skip to debrief
    if (historicalMode && node?.type === 'crisis' && node.historicalChoice && node.options) {
      const option = node.options.find(o => o.id === node.historicalChoice)
      if (option && scenario && currentNodeId) {
        const confidence: ConfidenceLevel = 'medium'
        const points = calculateScore(option.outcome, confidence)

        const playerDecision: NodePlayerDecision = {
          nodeId: currentNodeId,
          chosenOptionId: option.id,
          confidence,
          outcome: option.outcome,
          timeSpent: 0,
        }

        const score: NodeDecisionScore = {
          nodeId: currentNodeId,
          optionSelected: option.id,
          confidenceLevel: confidence,
          timeRemaining: node.timeLimit ?? 90,
          outcomeClassification: option.outcome,
          scorePoints: points,
        }

        const newUnlocked = option.unlockDocumentIds
          ? [...new Set([...unlockedDocumentIds, ...option.unlockDocumentIds])]
          : unlockedDocumentIds

        const nextNodeId = option.nextNodeId
        const nextNode = scenario.nodes[nextNodeId]
        const newPressure =
          nextNode?.type === 'consequence' && nextNode.pressureDelta !== undefined
            ? Math.max(0, Math.min(100, currentPressure + nextNode.pressureDelta))
            : currentPressure

        const isComplete = nextNode?.type === 'resolution'

        set({
          decisions: [...decisions, playerDecision],
          scores: [...scores, score],
          unlockedDocumentIds: newUnlocked,
          currentNodeId: nextNodeId,
          visitedNodeIds: [...visitedNodeIds, nextNodeId],
          currentPressure: newPressure,
          visibleDocuments: buildVisibleDocuments(scenario, nextNodeId, newUnlocked),
          decisionModalPhase: 'debrief',
          selectedOptionId: option.id,
          selectedConfidence: confidence,
          wireTimerActive: false,
          ...(isComplete ? { sessionStatus: 'completed', completedAt: new Date().toISOString() } : {}),
        })
        return
      }
    }

    // Normal mode
    const timeLimit = node?.timeLimit ?? 90
    set({
      decisionModalPhase: 'choosing',
      selectedOptionId: null,
      selectedConfidence: null,
      wireDeadlineTimer: timeLimit,
      wireTimerActive: true,
    })
  },

  selectOption: (optionId) =>
    set({ selectedOptionId: optionId, decisionModalPhase: 'confidence' }),

  selectConfidenceLevel: (level) => set({ selectedConfidence: level }),

  confirmDecision: () => {
    const {
      scenario, currentNodeId, selectedOptionId, selectedConfidence,
      wireDeadlineTimer, decisions, scores, unlockedDocumentIds, visitedNodeIds, currentPressure,
    } = get()
    if (!scenario || !currentNodeId || !selectedOptionId || !selectedConfidence) return

    const node = scenario.nodes[currentNodeId]
    if (node?.type !== 'crisis' || !node.options) return

    const option = node.options.find(o => o.id === selectedOptionId)
    if (!option) return

    const timeLimit = node.timeLimit ?? 90
    const points = calculateScore(option.outcome, selectedConfidence)

    const playerDecision: NodePlayerDecision = {
      nodeId: currentNodeId,
      chosenOptionId: selectedOptionId,
      confidence: selectedConfidence,
      outcome: option.outcome,
      timeSpent: timeLimit - wireDeadlineTimer,
    }

    const score: NodeDecisionScore = {
      nodeId: currentNodeId,
      optionSelected: selectedOptionId,
      confidenceLevel: selectedConfidence,
      timeRemaining: wireDeadlineTimer,
      outcomeClassification: option.outcome,
      scorePoints: points,
    }

    const newUnlocked = option.unlockDocumentIds
      ? [...new Set([...unlockedDocumentIds, ...option.unlockDocumentIds])]
      : unlockedDocumentIds

    // Navigate to consequence/resolution node
    const nextNodeId = option.nextNodeId
    const nextNode = scenario.nodes[nextNodeId]
    const newPressure =
      nextNode?.type === 'consequence' && nextNode.pressureDelta !== undefined
        ? Math.max(0, Math.min(100, currentPressure + nextNode.pressureDelta))
        : currentPressure

    const isComplete = nextNode?.type === 'resolution'

    set({
      decisions: [...decisions, playerDecision],
      scores: [...scores, score],
      unlockedDocumentIds: newUnlocked,
      currentNodeId: nextNodeId,
      visitedNodeIds: [...visitedNodeIds, nextNodeId],
      currentPressure: newPressure,
      visibleDocuments: buildVisibleDocuments(scenario, nextNodeId, newUnlocked),
      decisionModalPhase: 'debrief',
      wireTimerActive: false,
      ...(isComplete
        ? { sessionStatus: 'completed', completedAt: new Date().toISOString() }
        : {}),
    })
  },

  closeDebrief: () => {
    const { scenario, currentNodeId } = get()
    set({ decisionModalPhase: 'closed', wireTimerActive: false })

    if (!scenario || !currentNodeId) return
    const currentNode = scenario.nodes[currentNodeId]

    // If we're at a consequence node, navigate forward automatically
    if (currentNode?.type === 'consequence' && currentNode.nextNodeId) {
      get().navigateToNode(currentNode.nextNodeId)
    }
    // Resolution nodes: session already marked complete — nothing more to navigate
  },

  tickWireDeadline: () => {
    const { wireDeadlineTimer, wireTimerActive, decisionModalPhase } = get()
    if (!wireTimerActive || decisionModalPhase === 'debrief' || decisionModalPhase === 'closed') return

    if (wireDeadlineTimer <= 1) {
      const {
        scenario, currentNodeId, decisions, scores,
        unlockedDocumentIds, visitedNodeIds, currentPressure,
      } = get()
      if (!scenario || !currentNodeId) return

      const node = scenario.nodes[currentNodeId]
      if (!node?.options) return

      const worstOption =
        node.options.find(o => o.outcome === 'wrong') ??
        node.options[node.options.length - 1]

      const confidence: ConfidenceLevel = 'low'
      const timeLimit = node.timeLimit ?? 90

      const playerDecision: NodePlayerDecision = {
        nodeId: currentNodeId,
        chosenOptionId: worstOption.id,
        confidence,
        outcome: worstOption.outcome,
        timeSpent: timeLimit,
      }

      const score: NodeDecisionScore = {
        nodeId: currentNodeId,
        optionSelected: worstOption.id,
        confidenceLevel: confidence,
        timeRemaining: 0,
        outcomeClassification: worstOption.outcome,
        scorePoints: 0,
      }

      const newUnlocked = worstOption.unlockDocumentIds
        ? [...new Set([...unlockedDocumentIds, ...worstOption.unlockDocumentIds])]
        : unlockedDocumentIds

      const nextNodeId = worstOption.nextNodeId
      const nextNode = scenario.nodes[nextNodeId]
      const newPressure =
        nextNode?.type === 'consequence' && nextNode.pressureDelta !== undefined
          ? Math.max(0, Math.min(100, currentPressure + nextNode.pressureDelta))
          : currentPressure

      const isComplete = nextNode?.type === 'resolution'

      set({
        decisions: [...decisions, playerDecision],
        scores: [...scores, score],
        unlockedDocumentIds: newUnlocked,
        currentNodeId: nextNodeId,
        visitedNodeIds: [...visitedNodeIds, nextNodeId],
        currentPressure: newPressure,
        visibleDocuments: buildVisibleDocuments(scenario, nextNodeId, newUnlocked),
        wireDeadlineTimer: 0,
        wireTimerActive: false,
        decisionModalPhase: 'debrief',
        selectedOptionId: worstOption.id,
        selectedConfidence: confidence,
        ...(isComplete
          ? { sessionStatus: 'completed', completedAt: new Date().toISOString() }
          : {}),
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
