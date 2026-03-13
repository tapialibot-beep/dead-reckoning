export default function TopBar() {
  return (
    <div className="desk-topbar">
      <div className="topbar-role">
        <span className="topbar-label">ROLE</span>
        <span className="topbar-value">— Awaiting Assignment —</span>
      </div>
      <div className="topbar-objective">
        <span className="topbar-label">OBJECTIVE</span>
        <span className="topbar-value">— No active scenario —</span>
      </div>
      <div className="topbar-status">
        <span className="topbar-label">STATUS</span>
        <span className="topbar-value">STANDBY</span>
      </div>
    </div>
  )
}
