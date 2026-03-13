export default function DocumentViewer() {
  return (
    <div className="desk-panel desk-viewer">
      <div className="panel-header">
        <span className="panel-title">DOCUMENT VIEWER</span>
      </div>
      <div className="panel-body viewer-body">
        <div className="viewer-empty">
          <div className="viewer-desk-surface">
            <p>Select a document from the feed to examine it.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
