# Dead Reckoning — Gameplay Redesign v2.0

**Status:** Pending approval — no code gets written until this is signed off
**Date:** 14 March 2026
**Authors:** Cozmo (design), Schema Agent (data architecture)

---

## The Problem

The current build is a quiz with a costume on. Three fixed decisions, predetermined shape, players pattern-match the structure instead of engaging with the history. Fixed decision count kills replayability. Predictable arc = no tension.

**What we're replacing it with:** A branching scenario tree where your choices change what crisis you face next, runs vary in length from 2–7 decisions, and players never know the shape in advance.

---

## 1. Core Loop

A run is a playthrough of one scenario from opening conditions to resolution. The player never sees the tree. They only ever see what's in front of them right now.

**Beat by beat:**

1. **Opening Brief** — situation report. Date, location, cast of actors. No choices yet.
2. **Crisis Point** — a decision card. 2–4 options, labelled as actions not quality ratings (e.g. "Issue an ultimatum", not "Good option").
3. **Confidence Rating** — player rates Low / Medium / High before confirming. Mandatory.
4. **Consequence Node** — the game resolves the decision with a narrative outcome. This is not flavour — it introduces new information that changes what comes next.
5. **Next Crisis Point or Resolution** — either a new decision appears, or the run ends.
6. **Debrief** — path visualisation, outcome analysis, calibration report, score.

### Concrete example: July Crisis 1914

**Opening Brief — 28 June 1914**
> Archduke Franz Ferdinand has been assassinated in Sarajevo. You are the British Foreign Secretary. Vienna is furious. Germany is watching. You have decisions to make.

**Crisis Point 1 — The Response Question (5 July 1914)**
Options:
- A: Open immediate diplomatic channels with Berlin, Vienna, and St Petersburg *(correct)*
- B: Monitor developments — a localised dispute *(plausible)*
- C: Formally communicate British disinterest *(wrong)*

Choosing C ends the run fast — German hegemony in 3 nodes. Choosing A or B continues to the Ultimatum crisis.

**Crisis Point 2 — The Ultimatum (23 July 1914)**
Options:
- A: Propose a four-power conference *(correct — routes through conference-rejected node)*
- B: Issue a formal warning to Vienna *(plausible — routes through warning-issued node)*
- C: Maintain strict neutrality *(wrong — ends the run catastrophically)*

Choices A and B converge on the same final decision: the Belgian guarantee. **This is intentional** — the game teaches that even the correct diplomatic choice (conference) failed, making the Belgian commitment necessary regardless.

**Crisis Point 3 — The Guns of August (4 August 1914)**
Options:
- A: Honour the 1839 Treaty — war with Germany *(historical)*
- B: Naval operations only *(divergent)*
- C: Remain neutral *(catastrophic)*

Three different endings. Three different debrief narratives. Total run length: 3–4 nodes depending on path.

---

## 2. Branching Tree Structure

### Node Types

| Type | Purpose | Has options? | Ends run? |
|------|---------|--------------|-----------|
| `crisis` | Decision point | Yes (2–5) | No |
| `consequence` | Narrative beat, auto-advance | No | No |
| `resolution` | Terminal — ends the run | No | Yes |

### How branching works

The tree is a **directed acyclic graph (DAG)**, not a binary tree. Two different paths can converge on the same crisis node — the historical situation produces the same pressure point regardless of how you got there.

Example: Whether you reached "Russia mobilises fully" by being too aggressive or too slow with diplomacy, the decision you face is identical. The consequence nodes leading in carry different narrative context, but the crisis node is shared. This is what makes replays feel genuinely different rather than just differently labelled.

### What the player sees

- Current situation + options
- A counter showing "Decision 4 of ?" — confirms they're in an active run, never reveals how many remain
- Nothing about the tree structure

---

## 3. Variable-Length Runs

### The Pressure System

Every scenario has a hidden `pressure` value (starts at 50 on a 0–100 scale). Every consequence node carries a `pressure_delta`. Escalating decisions push pressure up. Diplomatic space pushes it down.

Resolution nodes trigger when pressure crosses a threshold at valid resolution check points in the graph:

| Pressure | Outcome |
|----------|---------|
| ≥ 90 | Catastrophic |
| 70–89 | Worse than historical |
| 30–69 | Historical range |
| ≤ 29 | Better than historical |

### How run length varies

The scenario graph has multiple possible resolution check points at different depths. Aggressive choices → pressure spikes → early catastrophic resolution (2–3 decisions). Careful diplomatic choices → pressure stays low → run extends to 6–7 decisions before a stable resolution is reachable.

Teachers control minimum and maximum run length by where they place resolution check points and the magnitude of pressure deltas. These are scenario-level parameters in the JSON.

---

## 4. Confidence Mechanic — Revised Role

**Stays from v1:** Low / Medium / High selector, feeds into scoring matrix.

**New in v2:**

**Calibration tracking** — the game tracks whether high-confidence choices led to good outcomes across the full run. Debrief shows a calibration score: well-calibrated / overconfident / underconfident. Pedagogically important — overconfidence in historical decision-making is one of the most documented failures in the July Crisis.

**Confidence does NOT gate branches** — confidence does not change which options are available or which consequence node a choice routes to. This is intentional:
- If it did, teachers would need to author multiple tree versions per confidence level — unmanageable
- The historical actors didn't get different options because they felt confident

**Confidence scoring weights:**
- High confidence + correct outcome = full score
- High confidence + poor outcome = penalty (you were sure and you were wrong)
- Low confidence + correct outcome = partial score (lucky?)
- Low confidence + poor outcome = minimal penalty (at least you knew you weren't sure)

---

## 5. Debrief Engine — Branching Version

### Structure

1. **Path Visualisation** — horizontal timeline of nodes visited. Faded branches show paths not taken, labelled with their opening situation (not their outcomes). Creates replay curiosity without spoilers.

2. **Outcome Analysis** — places player's result on the spectrum: catastrophic / worse-than-historical / historical / better-than-historical. One paragraph explaining why.

3. **Historical Comparison** — what actually happened. Always shown. Not a "correct answer" reveal — it's the real actors' choices and consequences.

4. **Calibration Report** — three rows: decisions where confidence matched outcome / overconfident / underconfident. No score attached — it's a learning tool.

5. **Score** — final score incorporating path length, pressure management, and calibration.

6. **Replay Prompt** — surfaces faded branches, unlockable starting conditions (e.g. "Play as Serbia"), outcome tier gaps the player can chase.

---

## 6. Teacher Extensibility

### The authoring mental model

A teacher is not a developer. They drop a JSON file in `/public/scenarios/`, add an entry to `index.json`, and it loads. No code. No build step. No redeploy required beyond a content update.

### What a teacher needs to write

See Section 8 for the full JSON schema. Minimum viable scenario:
- One crisis node (the start)
- At least two consequence nodes (one per option on the start)
- At least two resolution nodes (one better, one worse than history)
- Historical comparison text for the debrief

### Validation (runs at load time, before any student sees the scenario)

1. `startNodeId` must exist in `nodes`
2. Every `nextNodeId` referenced in any option or consequence must resolve to a real node
3. Every path from start must reach a resolution node (no dead ends)
4. At least one resolution node reachable from start
5. No unresolvable cycles (cycles are OK if an exit leads to resolution)
6. Every crisis node must have 2–5 options
7. `accuracyWeight + confidenceWeight = 1.0` in every `ScoringWeights` object
8. All `initialDocumentIds` and `unlockDocumentIds` must resolve to the document library
9. Document IDs unique within the library
10. Orphan nodes (unreachable from start) → warning, not error

A validation page in the app lets teachers test their scenario file and see specific errors with node IDs before assigning to students.

---

## 7. Replayability

**Run 1:** Player has no map. Genuine uncertainty. Almost certainly won't reach the best outcome.

**Run 2:** Player knows one path. Tests a hypothesis. "What if I'd gone to conference instead?" Analyst mode, not decision-maker mode.

**Run 3+:** Player reconstructs the whole tree from experience. Running counterfactuals. This is what historians do.

**Structural features that drive replay:**
- Faded branches in debrief show paths not taken (labelled with opening situation, not outcomes)
- Unlockable starting conditions — completing July Crisis as Britain unlocks it as Serbia, then Russia, then Germany. Same tree, different decisions and pressure dynamics per actor
- Outcome tiers are visible in debrief — "historical" and "better" remain visible as targets
- Historical mode (post-first-run unlock) — follow the actual decisions as a narrative, no choices. Teacher demo tool, classroom discussion aid

---

## 8. Data Schema

### New TypeScript types (`app/types/scenario.ts`)

```ts
export type DocumentType = 'telegram' | 'newspaper' | 'letter' | 'map' | 'report'
export type DocumentReliability = 'verified' | 'suspect' | 'rumor'
export type DecisionOutcome = 'correct' | 'plausible' | 'wrong'
export type NodeType = 'crisis' | 'consequence' | 'resolution'
export type OutcomeCategory = 'historical' | 'divergent' | 'avoided' | 'catastrophic'
export type DifficultyLevel = 'introductory' | 'standard' | 'advanced' | 'ap'

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
  prompt?: string               // crisis nodes only
  timeLimit?: number            // crisis nodes only, seconds
  options?: DecisionOption[]    // crisis nodes only, 2–5
  scoring?: ScoringWeights      // crisis nodes only
  nextNodeId?: string           // consequence nodes only
  autoAdvanceAfter?: number     // consequence nodes only, seconds
  outcome?: Outcome             // resolution nodes only
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
  curriculumAlignments: Array<{
    framework: string
    standardCode?: string
    description: string
  }>
  startNodeId: string
  documentLibrary: HistoricalDocument[]
  nodes: Record<string, ScenarioNode>   // flat map, O(1) lookup by ID
  confidenceMechanicEnabled: boolean
  defaultConfidencePrompt?: string
  maxScore?: number             // computed at load, not authored
}
```

### Why `nodes` is a `Record<string, ScenarioNode>` not an array

O(1) lookup by ID. The game engine navigates by `nextNodeId` pointers — it never traverses the array sequentially. A flat map is the right structure.

### Scenario loader architecture

**Use `/public/scenarios/` with dynamic fetch — not static TypeScript imports.**

Static TS imports require a developer to add the import and rebuild on every new scenario. That's a code change masquerading as a content change — it defeats teacher extensibility entirely.

`/public/scenarios/` files are served as static assets. A teacher drops `french-revolution-1789.json` in the folder, adds an entry to `index.json`, and it loads. No code, no build, no deploy (or a trivial asset-only redeploy on Vercel).

**Files:**
- `/public/scenarios/index.json` — list of available scenarios with metadata
- `/public/scenarios/{id}.json` — individual scenario files
- `app/lib/scenarioLoader.ts` — `loadScenarioIndex()`, `loadScenario(file)`, `validateScenario(raw)`

---

## 9. What Stays from the Current Build

| Component | Status | What changes |
|-----------|--------|--------------|
| Decision Modal | Survives unchanged visually | Accepts `ScenarioNode` prop instead of fixed decision object — prop refactor + type update. **Effort: Low.** |
| Confidence Mechanic | Survives, expanded | UI unchanged. Calibration tracking added as a new utility function. **Effort: Low (UI), Medium (calibration logic).** |
| Debrief Engine | Survives, substantially extended | New path visualiser sub-component. Restructured data contract. Existing outcome analysis and scoring display largely reusable. **Effort: Medium.** |
| Scoring Matrix | Survives, input changes | Now receives path length, pressure at resolution, calibration data. Additive changes to inputs. **Effort: Low.** |
| Document components | Survives unchanged | `isUnlocked` flag removed from the document object itself — unlocking is now expressed in `DecisionOption.unlockDocumentIds` and `ScenarioNode.initialDocumentIds`. **Effort: Low.** |

### What does not survive

- **Hardcoded scenario data structure** — flat `phases[]` array replaced by JSON node graph. Migration path detailed in Section 10.
- **`advancePhase()` action** — replaced by `navigateToNode(nodeId: string)`.
- **`currentPhaseIndex: number`** — replaced by `currentNodeId: string` + `visitedNodeIds: string[]`.
- **Any hardcoded `3`** — audit the codebase for components or utilities that assume exactly 3 decisions.

---

## 10. Migration Path (for Tapia)

Four phases, independently revertable at each step. No user-facing breakage until Phase 4 cutover.

| Phase | What changes | Risk | Rollback |
|-------|-------------|------|---------|
| 1 | Add `app/types/scenario.ts` — new types only, nothing uses them yet | Zero | Delete the file |
| 2 | Add `public/scenarios/july-crisis-1914.json` + `index.json` + `app/lib/scenarioLoader.ts` — game still loads old TS file | Zero | Delete the new files |
| 3 | Rewrite `gameStore.ts` for node-based traversal. Update `TopBar`, `Timeline`, `AnnotationPanel` | Medium — TS type conflicts to manage | Revert store commit |
| 4 | Wire `app/game/page.tsx` to the fetch loader. Delete `app/scenarios/july-crisis-1914.ts`. Clean up old types | Low — all the hard work is Phase 3 | Revert import change |

**PR strategy:** Phase 1+2 on one PR. Phase 3 on its own PR (most changes, needs review). Phase 4 as the cutover PR.

**Key collision to manage in Phase 3:** Old `Scenario` type in `types/index.ts` vs new `Scenario` in `types/scenario.ts`. Rename old to `LegacyScenario` temporarily. Remove after Phase 4 cutover.

---

## 11. Open Questions for Mom (before code starts)

1. **File format:** JSON or YAML for teacher scenario files? YAML is more readable for non-developers. JSON needs no dependency. Recommendation: YAML with JSON schema validation and YAML-to-JSON conversion at build time — but this adds a build step. JSON is simpler for MVP.

2. **Actor unlocks:** Should "play as Serbia" be in MVP or post-MVP? Significantly increases authoring scope per scenario.

3. **Historical mode** (follow real decisions, no choices): MVP or post-MVP?

4. **Classroom view:** Should a teacher be able to see which paths students took across a class? If yes, this affects the data model significantly and needs to be scoped now.

5. **Save state:** Can a student pause mid-run and resume? Or is each run a single session? Affects whether run state needs server-side persistence.

---

## 12. Implementation Order (for Tapia, once approved)

1. Approve the JSON schema. Write the July Crisis JSON file against it. Get Mom's sign-off on the data shape.
2. Write the scenario loader and graph validator — reads JSON, returns `Scenario` or validation errors. No UI yet.
3. Refactor Decision Modal to accept a `ScenarioNode` prop.
4. Build the run state manager — tracks `currentNodeId`, `visitedNodeIds`, pressure value, confidence ratings.
5. Wire run state manager to Decision Modal. Play a complete July Crisis run in the browser.
6. Extend Debrief Engine. Build path visualiser. Wire calibration tracking into scoring matrix.
7. Build scenario validation page for teachers.
8. Write one-page authoring guide with annotated example scenario file.
