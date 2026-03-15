// Dead Reckoning v2.0 — Canonical scenario types (Phase 4 cutover)

// --- Base types ---

export type DocumentType = 'telegram' | 'newspaper' | 'letter' | 'map' | 'report'
export type DocumentReliability = 'verified' | 'suspect' | 'rumor'
export type DecisionOutcome = 'correct' | 'plausible' | 'wrong'

// --- New union types ---

export type NodeType = 'crisis' | 'consequence' | 'resolution'
export type OutcomeCategory = 'historical' | 'divergent' | 'avoided' | 'catastrophic'
export type DifficultyLevel = 'introductory' | 'standard' | 'advanced' | 'ap'
export type ConfidenceLevel = 'low' | 'medium' | 'high'

// --- Domain interfaces ---

/** Historical document — v2 drops `isUnlocked` flag.
 *  Unlocking is now expressed via DecisionOption.unlockDocumentIds
 *  and ScenarioNode.initialDocumentIds. */
export interface HistoricalDocument {
  id: string
  type: DocumentType
  title: string
  date: string
  content: string
  sender?: string
  recipient?: string
  source?: string
  reliability?: DocumentReliability
}

export interface ScoringWeights {
  nodeWeight: number
  accuracyWeight: number        // 0.0–1.0
  confidenceWeight: number      // 0.0–1.0; accuracyWeight + confidenceWeight = 1.0
  outcomePoints: {
    correct: number
    plausible: number
    wrong: number
  }
}

export interface DecisionOption {
  id: string
  text: string
  outcome: DecisionOutcome
  nextNodeId: string            // routes to a ScenarioNode.id
  consequences: string[]        // display strings, 1–3
  debriefNote: string
  unlockDocumentIds?: string[]
  confidencePrompt?: string
  codeLabel?: string            // e.g. "EXECUTE" — overrides position-based default in UI
}

export interface Outcome {
  category: OutcomeCategory
  title: string
  summary: string
  historicalNote: string
  scoreMultiplier: number       // 1.0 = no change; >1 = bonus; <1 = penalty
  curriculumHighlights?: string[]
}

export interface ScenarioNode {
  id: string
  type: NodeType
  name: string
  description: string
  initialDocumentIds: string[]
  imageUrl?: string             // scene image for this node

  // Crisis nodes only
  prompt?: string
  timeLimit?: number            // seconds
  options?: DecisionOption[]    // 2–5
  scoring?: ScoringWeights
  historicalChoice?: string     // option ID of what the real actor chose (used in historical mode)

  // Consequence nodes only
  nextNodeId?: string
  autoAdvanceAfter?: number     // seconds
  pressureDelta?: number        // added to running pressure value

  // Resolution nodes only
  outcome?: Outcome
}

export interface CurriculumAlignment {
  framework: string
  standardCode?: string
  description: string
}

export interface Scenario {
  id: string
  title: string
  period: string
  location: string
  role: string
  description: string
  schemaVersion: string         // current: "2.0"
  authoredDate: string
  author?: string
  difficulty: DifficultyLevel
  tags: string[]
  curriculumAlignments: CurriculumAlignment[]
  startNodeId: string
  documentLibrary: HistoricalDocument[]
  nodes: Record<string, ScenarioNode>   // flat map, O(1) lookup by ID
  confidenceMechanicEnabled: boolean
  defaultConfidencePrompt?: string
  initialPressure?: number      // default 50
  maxScore?: number             // computed at load, not authored
}

// --- Scenario index (for /public/scenarios/index.json) ---

export interface ScenarioIndexEntry {
  id: string
  title: string
  period: string
  difficulty: DifficultyLevel
  file: string                  // e.g. "july-crisis-1914.json"
  tags: string[]
}

export type ScenarioIndex = ScenarioIndexEntry[]

// --- Room types (KAR-43 — class management) ---

export interface Room {
  code: string                        // 6-char uppercase alphanumeric
  scenarioId: string
  historicalMode: boolean
  createdAt: string                   // ISO 8601
  expiresAt: string                   // ISO 8601 (createdAt + 30 days)
}

// --- Game session types (Vercel KV — classroom view persistence) ---

export interface PlayerNodeDecision {
  nodeId: string
  chosenOptionId: string
  confidence: ConfidenceLevel
  outcome: DecisionOutcome
  timeSpent: number             // seconds
}

export interface GameSessionRecord {
  id: string
  scenarioId: string
  playerId: string
  teamName?: string             // team name entered at session start
  roomCode?: string             // room code for class management (KAR-43)
  actorRole: string             // e.g. "Britain", "Serbia" (for actor unlocks)
  startedAt: string             // ISO 8601
  completedAt: string           // ISO 8601
  visitedNodeIds: string[]
  decisions: PlayerNodeDecision[]
  finalPressure: number
  outcomeCategory: OutcomeCategory
  outcomeTitle: string
  score: number
  calibration: {
    total: number
    correct: number             // high confidence + good outcome
    overconfident: number       // high confidence + poor outcome
    underconfident: number      // low confidence + good outcome
  }
}
