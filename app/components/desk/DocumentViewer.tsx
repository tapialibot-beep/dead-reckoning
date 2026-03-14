'use client'

import { useGameStore } from '@/app/store/gameStore'
import { Telegram, Newspaper, MapDocument, Letter, Report } from '@/app/components/documents'
import { useMilitaryTTS } from '@/app/hooks/useMilitaryTTS'

export default function DocumentViewer() {
  const selectedDocument = useGameStore((s) => s.selectedDocument)
  const { speak, stop } = useMilitaryTTS()

  const renderDocument = () => {
    if (!selectedDocument) return null

    if (selectedDocument.type === 'telegram') {
      return (
        <Telegram
          to={selectedDocument.recipient ?? 'RECIPIENT UNKNOWN'}
          from={selectedDocument.sender ?? 'SENDER UNKNOWN'}
          date={selectedDocument.date}
          body={selectedDocument.content}
          reliability={selectedDocument.reliability ?? 'verified'}
        />
      )
    }

    if (selectedDocument.type === 'newspaper') {
      return (
        <Newspaper
          headline={selectedDocument.title}
          dateline={selectedDocument.date}
          byline={selectedDocument.sender}
          body={selectedDocument.content}
          source={selectedDocument.source ?? 'UNKNOWN PUBLICATION'}
          reliability={selectedDocument.reliability ?? 'verified'}
        />
      )
    }

    if (selectedDocument.type === 'map') {
      return (
        <MapDocument
          title={selectedDocument.title}
          date={selectedDocument.date}
          region={selectedDocument.source ?? 'THEATER UNKNOWN'}
          annotations={selectedDocument.content}
          notes={selectedDocument.sender}
          reliability={selectedDocument.reliability ?? 'verified'}
        />
      )
    }

    if (selectedDocument.type === 'letter') {
      return (
        <Letter
          sender={selectedDocument.sender ?? 'AUTHOR UNKNOWN'}
          recipient={selectedDocument.recipient ?? 'RECIPIENT UNKNOWN'}
          date={selectedDocument.date}
          body={selectedDocument.content}
          source={selectedDocument.source}
          reliability={selectedDocument.reliability ?? 'verified'}
        />
      )
    }

    if (selectedDocument.type === 'report') {
      return (
        <Report
          title={selectedDocument.title}
          date={selectedDocument.date}
          from={selectedDocument.sender ?? 'UNKNOWN OFFICE'}
          to={selectedDocument.recipient}
          classification={selectedDocument.source}
          body={selectedDocument.content}
          reliability={selectedDocument.reliability ?? 'verified'}
        />
      )
    }

    // Generic fallback for any future types
    return (
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
    )
  }

  const readDocument = () => {
    if (!selectedDocument) return
    const parts = [
      selectedDocument.title,
      selectedDocument.sender && `From: ${selectedDocument.sender}`,
      selectedDocument.recipient && `To: ${selectedDocument.recipient}`,
      selectedDocument.content,
    ].filter(Boolean)
    speak(parts.join('. '))
  }

  return (
    <div className="desk-panel desk-viewer">
      <div className="panel-header">
        <span className="panel-title">DOCUMENT VIEWER</span>
        {selectedDocument && (
          <button className="dp-read-btn viewer-read-btn" onClick={readDocument} onMouseLeave={stop} aria-label="Read document aloud">
            ▶ READ DISPATCH
          </button>
        )}
      </div>
      <div className="panel-body viewer-body">
        {!selectedDocument ? (
          <div className="viewer-empty">
            <div className="viewer-desk-surface">
              <p>Select a document from the feed to examine it.</p>
            </div>
          </div>
        ) : (
          renderDocument()
        )}
      </div>
    </div>
  )
}
