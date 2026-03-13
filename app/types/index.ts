// Core game types for Dead Reckoning

export type DocumentType = 'telegram' | 'newspaper' | 'letter' | 'map' | 'report'

export type DecisionOutcome = 'correct' | 'plausible' | 'wrong'

export type DocumentReliability = 'verified' | 'suspect' | 'rumor'

export interface HistoricalDocument {
  id: string
  type: DocumentType
  title: string
  date: string // Period-accurate date string
  content: string
  sender?: string
  recipient?: string
  source?: string // e.g. "The Times, 4 August 1914"
  reliability?: DocumentReliability
  isUnlocked: boolean
}

export interface DecisionOption {
  id: string
  text: string
  outcome: DecisionOutcome
  consequences: string[]
  debriefNote: string
}

export interface DecisionNode {
  id: string
  prompt: string
  timeLimit?: number // seconds, optional
  options: DecisionOption[]
  unlockDocumentIds?: string[] // Documents unlocked after this decision
}

export interface ScenarioPhase {
  id: string
  name: string
  description: string
  documents: HistoricalDocument[]
  decision: DecisionNode
  timeLimit: number // seconds for the phase
}

export interface Scenario {
  id: string
  title: string
  period: string // e.g. "July 1914"
  location: string
  role: string // Player's role e.g. "British Foreign Secretary"
  description: string
  phases: ScenarioPhase[]
  curriculumTags: string[] // AP History, Common Core standards
}

export interface PlayerDecision {
  phaseId: string
  decisionId: string
  chosenOptionId: string
  timeSpent: number // seconds
  outcome: DecisionOutcome
}

export interface GameSession {
  id: string
  scenarioId: string
  playerId: string
  startedAt: string
  completedAt?: string
  decisions: PlayerDecision[]
  currentPhaseIndex: number
  status: 'in_progress' | 'completed' | 'abandoned'
}

export interface DebriefEntry {
  phaseId: string
  playerChoice: string
  historicalChoice: string
  consequence: string
  reasoning: string
}
