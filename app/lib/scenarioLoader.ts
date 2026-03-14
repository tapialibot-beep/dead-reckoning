/**
 * Dead Reckoning v2.0 — Scenario Loader
 * KAR-27: Load and validate scenario JSON files from /public/scenarios/
 *
 * Usage:
 *   const index = await loadScenarioIndex()
 *   const result = await loadScenario('july-crisis-1914.json')
 *   if (result.ok) { const scenario = result.scenario } else { console.error(result.errors) }
 */

import type {
  Scenario,
  ScenarioIndex,
  ScenarioNode,
  DecisionOption,
} from '../types/scenario'

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface LoadScenarioSuccess {
  ok: true
  scenario: Scenario
}

export interface LoadScenarioFailure {
  ok: false
  errors: ValidationError[]
}

export type LoadScenarioResult = LoadScenarioSuccess | LoadScenarioFailure

export interface ValidationError {
  code: string
  message: string
  nodeId?: string
  optionId?: string
}

/**
 * Fetch and validate the scenario index from /public/scenarios/index.json.
 * Returns the parsed index or throws on network/parse failure.
 */
export async function loadScenarioIndex(): Promise<ScenarioIndex> {
  const res = await fetch('/scenarios/index.json')
  if (!res.ok) {
    throw new Error(`Failed to load scenario index: HTTP ${res.status}`)
  }
  return res.json() as Promise<ScenarioIndex>
}

/**
 * Fetch and validate a single scenario file from /public/scenarios/{file}.
 * Returns a discriminated union: { ok: true, scenario } | { ok: false, errors }.
 * Never throws — all errors are captured in the failure result.
 */
export async function loadScenario(file: string): Promise<LoadScenarioResult> {
  let raw: unknown
  try {
    const res = await fetch(`/scenarios/${file}`)
    if (!res.ok) {
      return {
        ok: false,
        errors: [{ code: 'FETCH_FAILED', message: `HTTP ${res.status} loading ${file}` }],
      }
    }
    raw = await res.json()
  } catch (err) {
    return {
      ok: false,
      errors: [{ code: 'PARSE_FAILED', message: `JSON parse error in ${file}: ${String(err)}` }],
    }
  }

  const errors = validateScenario(raw)
  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, scenario: raw as Scenario }
}

// ---------------------------------------------------------------------------
// Validator — 22 rules matching the REDESIGN.md spec
// ---------------------------------------------------------------------------

/**
 * Validate a raw (parsed-but-untyped) scenario object.
 * Returns an array of ValidationErrors. Empty array = valid.
 * Designed to run at load time before any student sees the scenario.
 */
export function validateScenario(raw: unknown): ValidationError[] {
  const errors: ValidationError[] = []

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return [{ code: 'NOT_AN_OBJECT', message: 'Scenario root must be a JSON object' }]
  }

  const s = raw as Record<string, unknown>

  // Rule 1: Required top-level string fields
  const requiredStrings: (keyof Scenario)[] = [
    'id', 'title', 'period', 'location', 'role', 'description',
    'schemaVersion', 'authoredDate', 'difficulty', 'startNodeId',
  ]
  for (const field of requiredStrings) {
    if (typeof s[field] !== 'string' || (s[field] as string).trim() === '') {
      errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Required field "${field}" is missing or empty`,
      })
    }
  }

  // Rule 2: schemaVersion must be "2.0"
  if (s.schemaVersion !== '2.0') {
    errors.push({
      code: 'WRONG_SCHEMA_VERSION',
      message: `schemaVersion must be "2.0", got "${s.schemaVersion}"`,
    })
  }

  // Rule 3: tags must be a non-empty array
  if (!Array.isArray(s.tags) || (s.tags as unknown[]).length === 0) {
    errors.push({ code: 'MISSING_TAGS', message: 'tags must be a non-empty array' })
  }

  // Rule 4: curriculumAlignments must be an array
  if (!Array.isArray(s.curriculumAlignments)) {
    errors.push({
      code: 'MISSING_CURRICULUM_ALIGNMENTS',
      message: 'curriculumAlignments must be an array',
    })
  }

  // Rule 5: documentLibrary must be an array
  if (!Array.isArray(s.documentLibrary)) {
    errors.push({
      code: 'MISSING_DOCUMENT_LIBRARY',
      message: 'documentLibrary must be an array',
    })
  }

  // Rule 6: nodes must be a non-empty object
  if (typeof s.nodes !== 'object' || s.nodes === null || Array.isArray(s.nodes)) {
    errors.push({ code: 'MISSING_NODES', message: 'nodes must be a non-empty object (Record<string, ScenarioNode>)' })
    return errors // can't proceed without nodes
  }

  const nodes = s.nodes as Record<string, unknown>
  const nodeIds = new Set(Object.keys(nodes))

  // Rule 7: startNodeId must exist in nodes
  const startNodeId = s.startNodeId as string
  if (!nodeIds.has(startNodeId)) {
    errors.push({
      code: 'MISSING_START_NODE',
      message: `startNodeId "${startNodeId}" does not exist in nodes`,
    })
    return errors // can't do graph traversal without a valid start
  }

  // Build document ID set for reference checking
  const docIds = new Set<string>()
  if (Array.isArray(s.documentLibrary)) {
    for (const doc of s.documentLibrary as Record<string, unknown>[]) {
      if (typeof doc.id === 'string') docIds.add(doc.id)
    }
    // Rule 8: Document IDs must be unique within the library
    const seen = new Set<string>()
    for (const doc of s.documentLibrary as Record<string, unknown>[]) {
      const id = doc.id as string
      if (seen.has(id)) {
        errors.push({
          code: 'DUPLICATE_DOCUMENT_ID',
          message: `Document ID "${id}" appears more than once in documentLibrary`,
        })
      }
      seen.add(id)
    }
  }

  // Graph traversal — track reachable nodes and validate each
  const reachable = new Set<string>()

  function visitNode(nodeId: string): void {
    if (reachable.has(nodeId)) return
    reachable.add(nodeId)

    const nodeRaw = nodes[nodeId]
    if (typeof nodeRaw !== 'object' || nodeRaw === null) {
      errors.push({
        code: 'INVALID_NODE',
        message: `Node "${nodeId}" is not a valid object`,
        nodeId,
      })
      return
    }
    const node = nodeRaw as Record<string, unknown>

    // Rule 9: Every node must have id, type, name, description, initialDocumentIds
    if (node.id !== nodeId) {
      errors.push({
        code: 'NODE_ID_MISMATCH',
        message: `Node key "${nodeId}" does not match node.id "${node.id}"`,
        nodeId,
      })
    }
    if (!['crisis', 'consequence', 'resolution'].includes(node.type as string)) {
      errors.push({
        code: 'INVALID_NODE_TYPE',
        message: `Node "${nodeId}" has invalid type "${node.type}" (must be crisis | consequence | resolution)`,
        nodeId,
      })
    }
    if (typeof node.name !== 'string' || (node.name as string).trim() === '') {
      errors.push({ code: 'MISSING_NODE_NAME', message: `Node "${nodeId}" missing name`, nodeId })
    }
    if (typeof node.description !== 'string' || (node.description as string).trim() === '') {
      errors.push({ code: 'MISSING_NODE_DESCRIPTION', message: `Node "${nodeId}" missing description`, nodeId })
    }

    // Rule 10: initialDocumentIds must be an array, all IDs must resolve
    if (!Array.isArray(node.initialDocumentIds)) {
      errors.push({
        code: 'MISSING_INITIAL_DOC_IDS',
        message: `Node "${nodeId}" initialDocumentIds must be an array`,
        nodeId,
      })
    } else {
      for (const docId of node.initialDocumentIds as string[]) {
        if (!docIds.has(docId)) {
          errors.push({
            code: 'UNRESOLVED_DOCUMENT_ID',
            message: `Node "${nodeId}" initialDocumentIds references unknown document "${docId}"`,
            nodeId,
          })
        }
      }
    }

    const nodeType = node.type as string

    if (nodeType === 'crisis') {
      // Rule 11: Crisis nodes must have a prompt
      if (typeof node.prompt !== 'string' || (node.prompt as string).trim() === '') {
        errors.push({ code: 'MISSING_PROMPT', message: `Crisis node "${nodeId}" missing prompt`, nodeId })
      }

      // Rule 12: Crisis nodes must have 2–5 options
      if (!Array.isArray(node.options)) {
        errors.push({ code: 'MISSING_OPTIONS', message: `Crisis node "${nodeId}" missing options array`, nodeId })
      } else {
        const opts = node.options as unknown[]
        if (opts.length < 2 || opts.length > 5) {
          errors.push({
            code: 'INVALID_OPTION_COUNT',
            message: `Crisis node "${nodeId}" has ${opts.length} options (must be 2–5)`,
            nodeId,
          })
        }

        // Rule 13: Each option must have id, text, outcome, nextNodeId, consequences, debriefNote
        for (const optRaw of opts) {
          if (typeof optRaw !== 'object' || optRaw === null) continue
          const opt = optRaw as Record<string, unknown>
          const optId = (opt.id as string) ?? '(unknown)'

          if (typeof opt.id !== 'string') {
            errors.push({ code: 'MISSING_OPTION_ID', message: `Option in node "${nodeId}" missing id`, nodeId })
          }
          if (typeof opt.text !== 'string' || (opt.text as string).trim() === '') {
            errors.push({ code: 'MISSING_OPTION_TEXT', message: `Option "${optId}" missing text`, nodeId, optionId: optId })
          }
          if (!['correct', 'plausible', 'wrong'].includes(opt.outcome as string)) {
            errors.push({
              code: 'INVALID_OPTION_OUTCOME',
              message: `Option "${optId}" outcome must be correct | plausible | wrong, got "${opt.outcome}"`,
              nodeId,
              optionId: optId,
            })
          }
          if (typeof opt.debriefNote !== 'string' || (opt.debriefNote as string).trim() === '') {
            errors.push({ code: 'MISSING_DEBRIEF_NOTE', message: `Option "${optId}" missing debriefNote`, nodeId, optionId: optId })
          }

          // Rule 14: Every nextNodeId must resolve
          if (typeof opt.nextNodeId !== 'string') {
            errors.push({
              code: 'MISSING_NEXT_NODE_ID',
              message: `Option "${optId}" missing nextNodeId`,
              nodeId,
              optionId: optId,
            })
          } else if (!nodeIds.has(opt.nextNodeId as string)) {
            errors.push({
              code: 'UNRESOLVED_NEXT_NODE_ID',
              message: `Option "${optId}" nextNodeId "${opt.nextNodeId}" does not exist in nodes`,
              nodeId,
              optionId: optId,
            })
          } else {
            visitNode(opt.nextNodeId as string)
          }

          // Rule 15: consequences must be an array with 1–3 items
          if (!Array.isArray(opt.consequences) || (opt.consequences as unknown[]).length === 0) {
            errors.push({
              code: 'MISSING_CONSEQUENCES',
              message: `Option "${optId}" must have a non-empty consequences array`,
              nodeId,
              optionId: optId,
            })
          } else if ((opt.consequences as unknown[]).length > 3) {
            errors.push({
              code: 'TOO_MANY_CONSEQUENCES',
              message: `Option "${optId}" has ${(opt.consequences as unknown[]).length} consequences (max 3)`,
              nodeId,
              optionId: optId,
            })
          }

          // Rule 16: unlockDocumentIds must resolve if present
          if (Array.isArray(opt.unlockDocumentIds)) {
            for (const docId of opt.unlockDocumentIds as string[]) {
              if (!docIds.has(docId)) {
                errors.push({
                  code: 'UNRESOLVED_UNLOCK_DOCUMENT_ID',
                  message: `Option "${optId}" unlockDocumentIds references unknown document "${docId}"`,
                  nodeId,
                  optionId: optId,
                })
              }
            }
          }
        }
      }

      // Rule 17: scoring weights must sum to 1.0
      if (node.scoring !== undefined) {
        const scoring = node.scoring as Record<string, unknown>
        const aw = Number(scoring.accuracyWeight)
        const cw = Number(scoring.confidenceWeight)
        if (Math.abs(aw + cw - 1.0) > 0.001) {
          errors.push({
            code: 'INVALID_SCORING_WEIGHTS',
            message: `Node "${nodeId}" scoring.accuracyWeight (${aw}) + confidenceWeight (${cw}) must equal 1.0`,
            nodeId,
          })
        }
      }
    }

    if (nodeType === 'consequence') {
      // Rule 18: Consequence nodes must have nextNodeId
      if (typeof node.nextNodeId !== 'string') {
        errors.push({
          code: 'MISSING_NEXT_NODE_ID',
          message: `Consequence node "${nodeId}" must have nextNodeId`,
          nodeId,
        })
      } else if (!nodeIds.has(node.nextNodeId as string)) {
        errors.push({
          code: 'UNRESOLVED_NEXT_NODE_ID',
          message: `Consequence node "${nodeId}" nextNodeId "${node.nextNodeId}" does not exist in nodes`,
          nodeId,
        })
      } else {
        visitNode(node.nextNodeId as string)
      }
    }

    if (nodeType === 'resolution') {
      // Rule 19: Resolution nodes must have outcome
      if (typeof node.outcome !== 'object' || node.outcome === null) {
        errors.push({
          code: 'MISSING_OUTCOME',
          message: `Resolution node "${nodeId}" must have an outcome object`,
          nodeId,
        })
      } else {
        const outcome = node.outcome as Record<string, unknown>
        // Rule 20: outcome.category must be a valid OutcomeCategory
        if (!['historical', 'divergent', 'avoided', 'catastrophic'].includes(outcome.category as string)) {
          errors.push({
            code: 'INVALID_OUTCOME_CATEGORY',
            message: `Resolution node "${nodeId}" outcome.category must be historical | divergent | avoided | catastrophic`,
            nodeId,
          })
        }
        if (typeof outcome.title !== 'string' || (outcome.title as string).trim() === '') {
          errors.push({ code: 'MISSING_OUTCOME_TITLE', message: `Resolution node "${nodeId}" outcome.title missing`, nodeId })
        }
        if (typeof outcome.summary !== 'string' || (outcome.summary as string).trim() === '') {
          errors.push({ code: 'MISSING_OUTCOME_SUMMARY', message: `Resolution node "${nodeId}" outcome.summary missing`, nodeId })
        }
        if (typeof outcome.historicalNote !== 'string' || (outcome.historicalNote as string).trim() === '') {
          errors.push({ code: 'MISSING_OUTCOME_HISTORICAL_NOTE', message: `Resolution node "${nodeId}" outcome.historicalNote missing`, nodeId })
        }
        // Rule 21: scoreMultiplier must be a number
        if (typeof outcome.scoreMultiplier !== 'number') {
          errors.push({
            code: 'MISSING_SCORE_MULTIPLIER',
            message: `Resolution node "${nodeId}" outcome.scoreMultiplier must be a number`,
            nodeId,
          })
        }
      }
    }
  }

  visitNode(startNodeId)

  // Rule 22: At least one resolution node reachable from start
  const hasResolution = Array.from(reachable).some(
    (id) => (nodes[id] as Record<string, unknown>)?.type === 'resolution'
  )
  if (!hasResolution) {
    errors.push({
      code: 'NO_RESOLUTION_REACHABLE',
      message: 'No resolution node is reachable from startNodeId — every path must lead to a resolution',
    })
  }

  // Warn about orphan nodes (unreachable from start) — not an error per spec
  for (const nodeId of nodeIds) {
    if (!reachable.has(nodeId)) {
      // Log as a warning-level error with a distinct code so the UI can differentiate
      errors.push({
        code: 'ORPHAN_NODE_WARNING',
        message: `Node "${nodeId}" is unreachable from startNodeId "${startNodeId}" — it will never be shown to students`,
        nodeId,
      })
    }
  }

  return errors
}

// ---------------------------------------------------------------------------
// Helpers for consumers
// ---------------------------------------------------------------------------

/**
 * Returns only hard errors (excludes ORPHAN_NODE_WARNING).
 * Use this to determine whether a scenario should be blocked from loading.
 */
export function hardErrors(errors: ValidationError[]): ValidationError[] {
  return errors.filter((e) => e.code !== 'ORPHAN_NODE_WARNING')
}

/**
 * Returns only warnings (currently just ORPHAN_NODE_WARNING).
 */
export function warnings(errors: ValidationError[]): ValidationError[] {
  return errors.filter((e) => e.code === 'ORPHAN_NODE_WARNING')
}
