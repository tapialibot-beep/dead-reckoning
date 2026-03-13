'use client'

export interface LetterProps {
  sender: string
  recipient: string
  date: string
  body: string
  source?: string // Letterhead / location
  reliability: 'verified' | 'suspect' | 'rumor'
}

export function Letter({
  sender,
  recipient,
  date,
  body,
  source,
  reliability,
}: LetterProps) {
  const reliabilityLabel = {
    verified: '✦ VERIFIED CORRESPONDENCE',
    suspect: '⚠ SUSPECT — UNVERIFIED',
    rumor: '? RUMOR — TREAT WITH CAUTION',
  }[reliability]

  return (
    <div className={`letter letter--${reliability}`}>
      {/* Letterhead */}
      <div className="letter-header">
        {source && <div className="letter-letterhead">{source}</div>}
        <div className="letter-date">{date}</div>
      </div>

      <div className="letter-rule" />

      {/* Addressee */}
      <div className="letter-addressee">
        <span className="letter-addressee-label">To:</span> {recipient}
      </div>

      {/* Body — split on double newlines into paragraphs */}
      <div className="letter-body">
        {body.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* Closing / Signature */}
      <div className="letter-closing">
        <div className="letter-signature">{sender}</div>
      </div>

      {/* Reliability */}
      <div className="letter-footer">
        <span className={`letter-reliability letter-reliability--${reliability}`}>
          {reliabilityLabel}
        </span>
      </div>
    </div>
  )
}
