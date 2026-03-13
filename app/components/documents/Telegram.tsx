'use client'

export interface TelegramProps {
  to: string
  from: string
  date: string
  body: string
  reliability: 'verified' | 'suspect' | 'rumor'
}

export function Telegram({ to, from, date, body, reliability }: TelegramProps) {
  const formatBody = (text: string) =>
    text.replace(/(?<!\d)\.(?=\s|$)/g, ' STOP').toUpperCase()

  const reliabilityLabel = {
    verified: '\u2746 VERIFIED INTELLIGENCE',
    suspect: '\u26a0 SUSPECT \u2014 UNVERIFIED',
    rumor: '? RUMOR \u2014 TREAT WITH CAUTION',
  }[reliability]

  return (
    <div className={`telegram telegram--${reliability}`}>
      {/* Faint ruled lines — period-accurate form paper */}
      <div className="telegram-form-lines" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} className="telegram-line" />
        ))}
      </div>

      <div className="telegram-content">
        <div className="telegram-header">
          <div className="telegram-agency">WESTERN UNION TELEGRAPH CO.</div>
          <div className="telegram-subheader">RECEIVED AT FOREIGN OFFICE &mdash; LONDON</div>
        </div>

        <div className="telegram-fields">
          <div className="telegram-field">
            <span className="telegram-label">TO</span>
            <span className="telegram-value">{to.toUpperCase()}</span>
          </div>
          <div className="telegram-field">
            <span className="telegram-label">FROM</span>
            <span className="telegram-value">{from.toUpperCase()}</span>
          </div>
          <div className="telegram-field">
            <span className="telegram-label">DATE</span>
            <span className="telegram-value">{date.toUpperCase()}</span>
          </div>
        </div>

        <div className="telegram-rule" />

        <div className="telegram-body">{formatBody(body)}</div>

        <div className="telegram-footer">
          <span className={`telegram-reliability telegram-reliability--${reliability}`}>
            {reliabilityLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
