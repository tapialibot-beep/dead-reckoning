'use client'

export interface NewspaperProps {
  headline: string
  subheadline?: string
  dateline: string
  byline?: string
  body: string
  source: string
  reliability: 'verified' | 'suspect' | 'rumor'
}

export function Newspaper({
  headline,
  subheadline,
  dateline,
  byline,
  body,
  source,
  reliability,
}: NewspaperProps) {
  const reliabilityLabel = {
    verified: '\u2746 VERIFIED SOURCE',
    suspect: '\u26a0 SUSPECT \u2014 UNVERIFIED',
    rumor: '? RUMOR \u2014 TREAT WITH CAUTION',
  }[reliability]

  return (
    <div className={`newspaper newspaper--${reliability}`}>
      <div className="newspaper-header">
        <div className="newspaper-nameplate">{source}</div>
        <div className="newspaper-dateline">{dateline.toUpperCase()}</div>
        <div className="newspaper-rule-thick" />
      </div>

      <div className="newspaper-article">
        <h1 className="newspaper-headline">{headline.toUpperCase()}</h1>
        {subheadline && (
          <div className="newspaper-subheadline">{subheadline}</div>
        )}
        {byline && (
          <div className="newspaper-byline">From {byline}</div>
        )}
        <div className="newspaper-rule-thin" />
        <div className="newspaper-body">
          {body.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </div>

      <div className="newspaper-footer">
        <span className={`newspaper-reliability newspaper-reliability--${reliability}`}>
          {reliabilityLabel}
        </span>
      </div>
    </div>
  )
}
