'use client'

import { useGameStore } from '@/app/store/gameStore'

export default function DocumentViewer() {
  const selectedDocument = useGameStore((s) => s.selectedDocument)

  return (
    <div className="desk-panel desk-viewer">
      <div className="panel-header">
        <span className="panel-title">DOCUMENT VIEWER</span>
      </div>
      <div className="panel-body viewer-body">
        {!selectedDocument ? (
          <div className="viewer-empty">
            <div className="viewer-desk-surface">
              <p>Select a document from the feed to examine it.</p>
            </div>
          </div>
        ) : (
          <div className="document-display aged">
            <div className="doc-type-badge">{selectedDocument.type}</div>
            <div className="doc-title">{selectedDocument.title}</div>
            <div className="doc-meta">
              {selectedDocument.date}
              {selectedDocument.sender && ` \u2014 From: ${selectedDocument.sender}`}
              {selectedDocument.recipient && ` \u2014 To: ${selectedDocument.recipient}`}
            </div>
            <div className="doc-content">{selectedDocument.content}</div>
            {selectedDocument.source && (
              <div className="doc-source">{selectedDocument.source}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
