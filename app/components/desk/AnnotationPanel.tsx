export default function AnnotationPanel() {
  return (
    <div className="desk-panel desk-annotations">
      <div className="panel-header">
        <span className="panel-title">WORKSPACE</span>
      </div>
      <div className="panel-body">
        <div className="annotation-section">
          <h4 className="annotation-heading">Notes</h4>
          <div className="annotation-placeholder">
            <p>Your annotations and decision notes will appear here.</p>
          </div>
        </div>
        <div className="annotation-section">
          <h4 className="annotation-heading">Decision</h4>
          <div className="annotation-placeholder">
            <p>No decision pending.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
