'use client'

import { useState, useRef, useCallback } from 'react'
import { validateScenario, hardErrors, warnings } from '@/app/lib/scenarioLoader'
import type { ValidationError } from '@/app/lib/scenarioLoader'
import type { Scenario, ScenarioIndexEntry } from '@/app/types/scenario'

// ─── Types ─────────────────────────────────────────────────

type InputMode = 'paste' | 'upload'
type TeacherTab = 'classroom' | 'validator'

interface ValidationResult {
  errors: ValidationError[]
  hard: ValidationError[]
  warn: ValidationError[]
  scenario: Scenario | null
  nodeCount: number
  crisisCount: number
  consequenceCount: number
  resolutionCount: number
  documentCount: number
}

// ─── Helpers ───────────────────────────────────────────────

function scenarioStats(raw: Record<string, unknown>): Pick<ValidationResult,
  'nodeCount' | 'crisisCount' | 'consequenceCount' | 'resolutionCount' | 'documentCount'
> {
  const nodes = (raw.nodes ?? {}) as Record<string, { type?: string }>
  const nodeList = Object.values(nodes)
  return {
    nodeCount: nodeList.length,
    crisisCount: nodeList.filter(n => n.type === 'crisis').length,
    consequenceCount: nodeList.filter(n => n.type === 'consequence').length,
    resolutionCount: nodeList.filter(n => n.type === 'resolution').length,
    documentCount: Array.isArray(raw.documentLibrary) ? (raw.documentLibrary as unknown[]).length : 0,
  }
}

// ─── Error row ─────────────────────────────────────────────

function ErrorRow({ err, type }: { err: ValidationError; type: 'hard' | 'warning' }) {
  return (
    <div className={`tv-error-row tv-error-${type}`}>
      <div className="tv-error-code">{err.code}</div>
      <div className="tv-error-message">{err.message}</div>
      {(err.nodeId || err.optionId) && (
        <div className="tv-error-location">
          {err.nodeId && <span className="tv-location-tag">NODE: {err.nodeId}</span>}
          {err.optionId && <span className="tv-location-tag">OPTION: {err.optionId}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Room Creator ──────────────────────────────────────────

function RoomCreator({ scenarios }: { scenarios: ScenarioIndexEntry[] }) {
  const [selectedScenario, setSelectedScenario] = useState('')
  const [historicalMode, setHistoricalMode] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createdRoom, setCreatedRoom] = useState<{ code: string; scenarioId: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lookupCode, setLookupCode] = useState('')

  async function handleCreateRoom() {
    if (!selectedScenario) return
    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenario, historicalMode }),
      })
      const data = await res.json()
      if (data.ok) {
        setCreatedRoom({ code: data.room.code, scenarioId: data.room.scenarioId })
      } else {
        setError(data.error || 'Failed to create room')
      }
    } catch {
      setError('Network error — could not create room')
    }
    setCreating(false)
  }

  return (
    <div className="tv-classroom-section">
      {/* Create Room */}
      <div className="tv-room-create">
        <div className="tv-section-label">CREATE A CLASSROOM ROOM</div>
        <p className="tv-section-desc">
          Pick a scenario and create a room code. Share the code with your students —
          they enter it on the team setup screen. You can track their progress from the room dashboard.
        </p>

        <div className="tv-room-form">
          <label className="tv-form-label">SCENARIO</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="tv-select"
          >
            <option value="">— Select scenario —</option>
            {scenarios.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.period}) — {s.difficulty}
              </option>
            ))}
          </select>

          <label className="tv-form-checkbox">
            <input
              type="checkbox"
              checked={historicalMode}
              onChange={(e) => setHistoricalMode(e.target.checked)}
            />
            Historical Mode (decisions made automatically)
          </label>

          <button
            className="tv-validate-btn"
            onClick={handleCreateRoom}
            disabled={!selectedScenario || creating}
          >
            {creating ? 'CREATING...' : 'CREATE ROOM'}
          </button>
        </div>

        {error && (
          <div className="tv-parse-error">
            <span className="tv-parse-error-label">ERROR</span>
            <span>{error}</span>
          </div>
        )}

        {createdRoom && (
          <div className="tv-room-created">
            <div className="tv-room-code-display">{createdRoom.code}</div>
            <p className="tv-room-code-hint">
              Share this code with your students. Room expires in 30 days.
            </p>
            <a
              href={`/teacher/room/${createdRoom.code}`}
              className="tv-validate-btn"
              style={{ display: 'inline-block', textAlign: 'center', textDecoration: 'none', marginTop: '0.75rem' }}
            >
              OPEN ROOM DASHBOARD
            </a>
          </div>
        )}
      </div>

      {/* Open existing room */}
      <div className="tv-room-lookup">
        <div className="tv-section-label">OPEN EXISTING ROOM</div>
        <div className="tv-room-lookup-row">
          <input
            type="text"
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value.toUpperCase())}
            placeholder="ENTER ROOM CODE"
            maxLength={6}
            className="tv-lookup-input"
          />
          <a
            href={lookupCode.length === 6 ? `/teacher/room/${lookupCode}` : '#'}
            className={`tv-validate-btn ${lookupCode.length !== 6 ? 'tv-btn-disabled' : ''}`}
            onClick={(e) => { if (lookupCode.length !== 6) e.preventDefault() }}
          >
            OPEN
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────

export default function ValidatorClient({
  kvConfigured,
  scenarios,
}: {
  kvConfigured: boolean
  scenarios: ScenarioIndexEntry[]
}) {
  const [activeTab, setActiveTab] = useState<TeacherTab>('classroom')
  const [inputMode, setInputMode] = useState<InputMode>('paste')
  const [jsonText, setJsonText] = useState('')
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const runValidation = useCallback((text: string) => {
    setParseError(null)
    setResult(null)

    let raw: unknown
    try {
      raw = JSON.parse(text)
    } catch (e) {
      setParseError(`JSON parse error: ${String(e)}`)
      return
    }

    const errors = validateScenario(raw)
    const hard = hardErrors(errors)
    const warn = warnings(errors)

    const stats = (typeof raw === 'object' && raw !== null && !Array.isArray(raw))
      ? scenarioStats(raw as Record<string, unknown>)
      : { nodeCount: 0, crisisCount: 0, consequenceCount: 0, resolutionCount: 0, documentCount: 0 }

    setResult({
      errors,
      hard,
      warn,
      scenario: hard.length === 0 ? raw as Scenario : null,
      ...stats,
    })
  }, [])

  function handlePasteValidate() {
    if (!jsonText.trim()) return
    runValidation(jsonText)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const text = evt.target?.result as string
      setJsonText(text)
      runValidation(text)
    }
    reader.readAsText(file)
  }

  const isValid = result !== null && result.hard.length === 0

  return (
    <div className="tv-container">

      {/* KV config warning */}
      {!kvConfigured && (
        <div className="tv-kv-warning">
          <span className="tv-kv-warning-stamp">SESSION PERSISTENCE INACTIVE</span>
          <span className="tv-kv-warning-text">
            Set <code>KV_REST_API_URL</code> and <code>KV_REST_API_TOKEN</code> in your Vercel dashboard
            (Storage → Create KV → copy env vars) to enable session recording for the classroom view.
          </span>
        </div>
      )}

      {/* Page header */}
      <div className="tv-header">
        <div className="tv-classification-stamp">TEACHER ACCESS — COMMAND CENTER</div>
        <h1 className="tv-title">Teacher Dashboard</h1>
        <p className="tv-subtitle">
          Create classroom rooms for your students, or validate scenario files.
        </p>
      </div>

      {/* Main tabs: Classroom | Validator */}
      <div className="tv-tab-strip">
        <button
          className={`tv-tab ${activeTab === 'classroom' ? 'tv-tab-active' : ''}`}
          onClick={() => setActiveTab('classroom')}
        >
          CLASSROOM
        </button>
        <button
          className={`tv-tab ${activeTab === 'validator' ? 'tv-tab-active' : ''}`}
          onClick={() => setActiveTab('validator')}
        >
          SCENARIO VALIDATOR
        </button>
      </div>

      {/* ─── Classroom Tab ─── */}
      {activeTab === 'classroom' && (
        <RoomCreator scenarios={scenarios} />
      )}

      {/* ─── Validator Tab ─── */}
      {activeTab === 'validator' && (
        <>
          {/* Input mode tabs */}
          <div className="tv-tab-strip tv-tab-strip-sub">
            <button
              className={`tv-tab ${inputMode === 'paste' ? 'tv-tab-active' : ''}`}
              onClick={() => setInputMode('paste')}
            >
              PASTE JSON
            </button>
            <button
              className={`tv-tab ${inputMode === 'upload' ? 'tv-tab-active' : ''}`}
              onClick={() => setInputMode('upload')}
            >
              UPLOAD FILE
            </button>
          </div>

          {/* Paste input */}
          {inputMode === 'paste' && (
            <div className="tv-input-area">
              <textarea
                className="tv-textarea"
                value={jsonText}
                onChange={e => setJsonText(e.target.value)}
                placeholder={'{\n  "id": "my-scenario",\n  "schemaVersion": "2.0",\n  ...\n}'}
                spellCheck={false}
                rows={16}
              />
              <button
                className="tv-validate-btn"
                onClick={handlePasteValidate}
                disabled={!jsonText.trim()}
              >
                VALIDATE SCENARIO
              </button>
            </div>
          )}

          {/* File upload */}
          {inputMode === 'upload' && (
            <div className="tv-input-area tv-upload-area">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="tv-file-input"
                id="scenario-file"
              />
              <label htmlFor="scenario-file" className="tv-upload-label">
                <span className="tv-upload-icon">⊞</span>
                <span className="tv-upload-text">Click to select a .json file</span>
                <span className="tv-upload-hint">or drag and drop</span>
              </label>
              {jsonText && (
                <div className="tv-upload-loaded">
                  File loaded — {jsonText.length.toLocaleString()} characters
                </div>
              )}
            </div>
          )}

          {/* Parse error */}
          {parseError && (
            <div className="tv-parse-error">
              <span className="tv-parse-error-label">PARSE ERROR</span>
              <span>{parseError}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="tv-results">

              {/* Valid stamp */}
              {isValid ? (
                <div className="tv-valid-stamp">
                  ✓ SCENARIO VALID
                </div>
              ) : (
                <div className="tv-invalid-stamp">
                  ✗ SCENARIO INVALID — {result.hard.length} error{result.hard.length !== 1 ? 's' : ''}
                </div>
              )}

              {/* Stats */}
              <div className="tv-stats">
                <div className="tv-stat">
                  <span className="tv-stat-value">{result.nodeCount}</span>
                  <span className="tv-stat-label">TOTAL NODES</span>
                </div>
                <div className="tv-stat">
                  <span className="tv-stat-value">{result.crisisCount}</span>
                  <span className="tv-stat-label">CRISIS</span>
                </div>
                <div className="tv-stat">
                  <span className="tv-stat-value">{result.consequenceCount}</span>
                  <span className="tv-stat-label">CONSEQUENCE</span>
                </div>
                <div className="tv-stat">
                  <span className="tv-stat-value">{result.resolutionCount}</span>
                  <span className="tv-stat-label">RESOLUTION</span>
                </div>
                <div className="tv-stat">
                  <span className="tv-stat-value">{result.documentCount}</span>
                  <span className="tv-stat-label">DOCUMENTS</span>
                </div>
              </div>

              {/* Hard errors */}
              {result.hard.length > 0 && (
                <div className="tv-error-section">
                  <div className="tv-error-section-label tv-label-hard">
                    BLOCKING ERRORS ({result.hard.length})
                  </div>
                  {result.hard.map((err, i) => (
                    <ErrorRow key={i} err={err} type="hard" />
                  ))}
                </div>
              )}

              {/* Warnings */}
              {result.warn.length > 0 && (
                <div className="tv-error-section">
                  <div className="tv-error-section-label tv-label-warning">
                    WARNINGS ({result.warn.length})
                  </div>
                  {result.warn.map((err, i) => (
                    <ErrorRow key={i} err={err} type="warning" />
                  ))}
                </div>
              )}

              {/* All clear */}
              {isValid && result.warn.length === 0 && (
                <div className="tv-all-clear">
                  No warnings. Scenario is ready to deploy.
                </div>
              )}
            </div>
          )}

          {/* Schema reference */}
          <details className="tv-schema-ref">
            <summary className="tv-schema-summary">SCHEMA REFERENCE — DecisionOption.codeLabel</summary>
            <div className="tv-schema-body">
              <p>
                Each option on a crisis node can include an optional <code>codeLabel</code> field.
                This overrides the default positional label (EXECUTE / DEFER / HOLD / ADVISE / ABORT).
              </p>
              <pre className="tv-schema-pre">{`{
  "id": "opt-negotiate",
  "codeLabel": "NEGOTIATE",
  "text": "Open back-channel talks with...",
  ...
}`}</pre>
              <p>
                If omitted, the UI assigns positional labels in order.
                Use <code>codeLabel</code> when positional defaults won&apos;t fit your scenario&apos;s framing.
              </p>
            </div>
          </details>
        </>
      )}
    </div>
  )
}
