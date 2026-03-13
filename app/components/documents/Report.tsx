'use client'

export interface ReportProps {
  title: string
  date: string
  from: string
  to?: string
  classification?: string
  body: string
  reliability: 'verified' | 'suspect' | 'rumor'
}

export function Report({
  title,
  date,
  from,
  to,
  classification,
  body,
  reliability,
}: ReportProps) {
  const reliabilityLabel = {
    verified: '✦ VERIFIED INTELLIGENCE',
    suspect: '⚠ SUSPECT — UNVERIFIED',
    rumor: '? RUMOR — TREAT WITH CAUTION',
  }[reliability]

  // Split body into numbered paragraphs for official report feel
  const paragraphs = body.split('\n\n').filter(Boolean)

  return (
    <div className={`report report--${reliability}`}>
      {/* Classification stamp */}
      {classification && (
        <div className="report-classification">{classification.toUpperCase()}</div>
      )}

      {/* Header */}
      <div className="report-header">
        <div className="report-title">{title.toUpperCase()}</div>
        <div className="report-rule-thick" />
        <div className="report-meta">
          <div className="report-meta-row">
            <span className="report-meta-label">DATE</span>
            <span className="report-meta-value">{date.toUpperCase()}</span>
          </div>
          <div className="report-meta-row">
            <span className="report-meta-label">FROM</span>
            <span className="report-meta-value">{from.toUpperCase()}</span>
          </div>
          {to && (
            <div className="report-meta-row">
              <span className="report-meta-label">TO</span>
              <span className="report-meta-value">{to.toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>

      <div className="report-rule-thin" />

      {/* Body — numbered paragraphs */}
      <div className="report-body">
        {paragraphs.map((para, i) => (
          <div key={i} className="report-paragraph">
            <span className="report-para-number">{i + 1}.</span>
            <span className="report-para-text">{para}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="report-footer">
        <span className={`report-reliability report-reliability--${reliability}`}>
          {reliabilityLabel}
        </span>
      </div>
    </div>
  )
}
