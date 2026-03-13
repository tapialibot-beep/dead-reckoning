export default function DocumentFeed() {
  return (
    <div className="desk-panel desk-feed">
      <div className="panel-header">
        <span className="panel-title">INCOMING DOCUMENTS</span>
      </div>
      <div className="panel-body">
        <div className="feed-empty">
          <p>No documents received.</p>
          <p className="feed-hint">Documents will arrive as the scenario unfolds.</p>
        </div>
      </div>
    </div>
  )
}
