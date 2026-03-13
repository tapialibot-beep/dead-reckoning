'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function DocumentFeed() {
  const visibleDocuments = useGameStore((s) => s.visibleDocuments)
  const selectedDocument = useGameStore((s) => s.selectedDocument)
  const selectDocument = useGameStore((s) => s.selectDocument)

  return (
    <div className="desk-panel desk-feed">
      <div className="panel-header">
        <span className="panel-title">INCOMING DOCUMENTS</span>
      </div>
      <div className="panel-body">
        {visibleDocuments.length === 0 ? (
          <div className="feed-empty">
            <p>No documents received.</p>
            <p className="feed-hint">Documents will arrive as the scenario unfolds.</p>
          </div>
        ) : (
          <div className="feed-list">
            {visibleDocuments.map((doc) => (
              <button
                key={doc.id}
                className={`doc-card${selectedDocument?.id === doc.id ? ' selected' : ''}`}
                onClick={() => selectDocument(doc)}
              >
                <div className="doc-card-type">{doc.type}</div>
                <div className="doc-card-title">{doc.title}</div>
                <div className="doc-card-date">{doc.date}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
