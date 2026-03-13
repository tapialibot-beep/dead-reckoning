import TopBar from './TopBar'
import DocumentFeed from './DocumentFeed'
import DocumentViewer from './DocumentViewer'
import AnnotationPanel from './AnnotationPanel'
import Timeline from './Timeline'

export default function DeskLayout() {
  return (
    <div className="desk-layout">
      <TopBar />
      <div className="desk-main">
        <DocumentFeed />
        <DocumentViewer />
        <AnnotationPanel />
      </div>
      <Timeline />
    </div>
  )
}
