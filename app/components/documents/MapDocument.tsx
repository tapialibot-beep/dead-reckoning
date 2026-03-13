'use client'

export interface MapDocumentProps {
  title: string
  date: string
  region: string
  annotations: string // newline-separated entries, each "LABEL: detail"
  notes?: string
  reliability: 'verified' | 'suspect' | 'rumor'
}

const MARKERS = ['●', '▲', '■', '◆', '✦', '→', '⊕', '☉']

export function MapDocument({
  title,
  date,
  region,
  annotations,
  notes,
  reliability,
}: MapDocumentProps) {
  const entries = annotations
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const reliabilityLabel = {
    verified: '✦ VERIFIED INTELLIGENCE',
    suspect: '⚠ SUSPECT — UNVERIFIED',
    rumor: '? RUMOR — TREAT WITH CAUTION',
  }[reliability]

  return (
    <div className={`map-document map-document--${reliability}`}>
      {/* Header */}
      <div className="map-header">
        <div className="map-classification">STRATEGIC INTELLIGENCE DOCUMENT</div>
        <div className="map-title">{title.toUpperCase()}</div>
        <div className="map-meta">
          <span className="map-meta-item">THEATER: {region.toUpperCase()}</span>
          <span className="map-meta-divider">·</span>
          <span className="map-meta-item">AS OF: {date.toUpperCase()}</span>
        </div>
        <div className="map-rule-thick" />
      </div>

      {/* Map area */}
      <div className="map-area" aria-label="Annotated territory schematic">
        <div className="map-compass">
          <span className="map-compass-n">N</span>
          <span className="map-compass-cross">╋</span>
          <span className="map-compass-s">S</span>
          <div className="map-compass-ew">
            <span>W</span>
            <span>E</span>
          </div>
        </div>

        <div className="map-region-label">{region.toUpperCase()}</div>

        <div className="map-annotations-grid">
          {entries.map((entry, i) => {
            const colonIdx = entry.indexOf(':')
            const label = colonIdx > -1 ? entry.slice(0, colonIdx).trim() : entry
            const detail = colonIdx > -1 ? entry.slice(colonIdx + 1).trim() : ''
            const marker = MARKERS[i % MARKERS.length]
            return (
              <div key={i} className="map-annotation-entry">
                <span className="map-annotation-marker">{marker}</span>
                <span className="map-annotation-label">{label.toUpperCase()}</span>
                {detail && <span className="map-annotation-detail">{detail}</span>}
              </div>
            )
          })}
        </div>

        <div className="map-scale">
          <div className="map-scale-bar" />
          <div className="map-scale-label">APPROXIMATE — NOT TO SCALE</div>
        </div>
      </div>

      {/* Field notes */}
      {notes && (
        <div className="map-notes">
          <div className="map-notes-heading">FIELD NOTES</div>
          <div className="map-notes-body">{notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="map-footer">
        <span className={`map-reliability map-reliability--${reliability}`}>
          {reliabilityLabel}
        </span>
      </div>
    </div>
  )
}
