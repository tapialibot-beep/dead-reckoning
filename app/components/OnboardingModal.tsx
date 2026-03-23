'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// Screen content
// ---------------------------------------------------------------------------

interface Screen {
  header: string
  title: string
  stamp: string
  stampColor: 'sepia' | 'red'
  content: React.ReactNode
}

const SCREENS: Screen[] = [
  {
    header: 'CLASSIFIED BRIEFING',
    title: 'The World in 1914',
    stamp: 'EYES ONLY',
    stampColor: 'red',
    content: (
      <div className="space-y-4" style={{ color: 'var(--ink-faded)' }}>
        <p>Europe has spent forty years building a powder keg.</p>
        <p>Two armed camps face each other across the continent:</p>
        <div className="space-y-3 pl-1">
          <div style={{ borderLeft: '2px solid var(--sepia)', paddingLeft: '1rem' }}>
            <p className="font-period font-semibold" style={{ color: 'var(--ink)' }}>THE ENTENTE</p>
            <p className="text-sepia text-xs tracking-widest uppercase mt-0.5">Britain · France · Russia</p>
            <p className="mt-1 text-sm">Bound by treaties and informal understandings. If one is threatened, all are threatened.</p>
          </div>
          <div style={{ borderLeft: '2px solid var(--sepia)', paddingLeft: '1rem' }}>
            <p className="font-period font-semibold" style={{ color: 'var(--ink)' }}>THE CENTRAL POWERS</p>
            <p className="text-sepia text-xs tracking-widest uppercase mt-0.5">Germany · Austria-Hungary</p>
            <p className="mt-1 text-sm">Bound by formal alliance. Germany is the dominant military power in Europe.</p>
          </div>
        </div>
        <p>This is why a gunshot in a Balkan city can ignite a world war. Every nation&apos;s honour, treaty obligation, and military timetable is connected to every other.</p>
      </div>
    ),
  },
  {
    header: 'INTELLIGENCE REPORT',
    title: 'The Crisis',
    stamp: 'URGENT',
    stampColor: 'red',
    content: (
      <div className="space-y-3" style={{ color: 'var(--ink-faded)' }}>
        <p className="text-sepia text-xs tracking-widest uppercase">28 June 1914, Sarajevo.</p>
        <p>Archduke Franz Ferdinand — heir to the Austro-Hungarian throne — is assassinated by a Bosnian Serb nationalist.</p>
        <p>Austria-Hungary blames Serbia and issues an ultimatum so humiliating it was designed to be refused.</p>
        <p>What follows is four weeks of telegrams, ultimatums, and mobilisation orders — each decision narrowing the options of the next. The great powers are caught in machinery of their own making.</p>
        <p className="font-period font-semibold mt-2" style={{ color: 'var(--ink)' }}>
          You are entering that machinery at its most critical point.
        </p>
        <p className="text-sepia text-sm italic">
          Today is 24 July 1914. Austria-Hungary&apos;s ultimatum expires tomorrow.
        </p>
      </div>
    ),
  },
  {
    header: 'SITUATION BRIEF',
    title: "Britain's Position",
    stamp: 'RESTRICTED',
    stampColor: 'sepia',
    content: (
      <div style={{ color: 'var(--ink-faded)' }}>
        <p className="text-sepia text-xs tracking-widest uppercase mb-3">What you need to know before you decide.</p>
        <p>Britain is not formally obligated to fight. But:</p>
        <ul className="mt-3 space-y-3">
          <li className="flex gap-3">
            <span className="text-sepia mt-0.5 shrink-0">—</span>
            <span className="text-sm">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>The Entente Cordiale (1904)</span>{' '}
              created an informal military understanding with France — moral, not legal.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sepia mt-0.5 shrink-0">—</span>
            <span className="text-sm">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>The Treaty of London (1839)</span>{' '}
              guarantees Belgian neutrality. Britain is a signatory. Belgium sits between Germany and the Channel ports —
              British naval doctrine treats control of those ports by any single great power as an existential threat.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-sepia mt-0.5 shrink-0">—</span>
            <span className="text-sm">
              <span className="font-semibold" style={{ color: 'var(--ink)' }}>The Schlieffen Plan</span>{' '}
              is Germany&apos;s war strategy: to knock France out quickly, their armies must march through Belgium.
            </span>
          </li>
        </ul>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(139,115,85,0.3)' }}>
          <p className="text-sm">
            You are{' '}
            <span className="font-semibold font-period" style={{ color: 'var(--ink)' }}>Sir Edward Grey, Britain&apos;s Foreign Secretary.</span>{' '}
            The Cabinet is divided. Parliament is restless. The public does not want war.
          </p>
          <p className="text-sepia text-sm italic mt-2">
            Every decision you make will be judged by what you could reasonably have known at the time — not what we know now.
          </p>
        </div>
      </div>
    ),
  },
  {
    header: 'OPERATIONAL PROTOCOL',
    title: 'How Your Choices Are Scored',
    stamp: 'READ BEFORE PLAY',
    stampColor: 'red',
    content: (
      <div style={{ color: 'var(--ink-faded)' }}>
        <p>
          After each decision, you will be asked:{' '}
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>how confident are you?</span>
        </p>
        <p className="mt-2">This is not a formality. Your confidence changes everything.</p>
        <table className="w-full text-sm mt-4" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(139,115,85,0.3)' }}>
              <th className="text-left py-2 pr-6 text-sepia tracking-widest uppercase text-xs font-normal">Confidence</th>
              <th className="text-center py-2 px-4 text-sepia tracking-widest uppercase text-xs font-normal">Correct answer</th>
              <th className="text-center py-2 pl-4 text-sepia tracking-widest uppercase text-xs font-normal">Wrong answer</th>
            </tr>
          </thead>
          <tbody>
            {[
              { level: 'High', correct: 'Full points', wrong: 'Zero', wrongRed: true },
              { level: 'Medium', correct: 'Partial points', wrong: 'Small penalty', wrongRed: false },
              { level: 'Low', correct: 'Fewer points', wrong: 'Minimal penalty', wrongRed: false },
            ].map((row) => (
              <tr key={row.level} style={{ borderBottom: '1px solid rgba(139,115,85,0.1)' }}>
                <td className="py-2 pr-6 font-semibold" style={{ color: 'var(--ink)' }}>{row.level}</td>
                <td className="text-center py-2 px-4">{row.correct}</td>
                <td
                  className="text-center py-2 pl-4"
                  style={row.wrongRed ? { color: 'var(--red-stamp)', fontWeight: 600 } : {}}
                >
                  {row.wrong}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm">
          A statesman who acts with total certainty on a wrong assumption causes more damage than one who admits uncertainty.
          Calibrate your confidence to your actual knowledge.
        </p>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(139,115,85,0.3)' }}>
          <p className="text-sepia text-sm italic">
            Dead reckoning: navigating without landmarks, using only your last known position, speed, and heading.
            Sometimes that&apos;s all history gives you.
          </p>
        </div>
      </div>
    ),
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface OnboardingModalProps {
  onComplete: () => void
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [screen, setScreen] = useState(0)
  const current = SCREENS[screen]
  const isLast = screen === SCREENS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center landing-bg overflow-y-auto py-8"
    >
      <div className="relative w-full max-w-2xl mx-6">
        {/* Parchment card */}
        <div className="paper aged" style={{ padding: '2.5rem 3rem' }}>

          {/* Skip button */}
          <button
            onClick={onComplete}
            className="absolute top-5 right-5 text-sepia text-xs tracking-widest uppercase transition-opacity hover:opacity-100"
            style={{ opacity: 0.5 }}
          >
            Skip Briefing →
          </button>

          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sepia text-xs tracking-[0.25em] uppercase">{current.header}</p>
            <p
              className="text-xs tracking-widest uppercase font-semibold px-2 py-0.5"
              style={{
                color: current.stampColor === 'red' ? 'var(--red-stamp)' : 'var(--sepia)',
                border: `1px solid ${current.stampColor === 'red' ? 'var(--red-stamp)' : 'var(--sepia)'}`,
              }}
            >
              {current.stamp}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-1 mb-6">
            {SCREENS.map((_, i) => (
              <div
                key={i}
                className="h-px flex-1 transition-all duration-300"
                style={{ background: i <= screen ? 'var(--sepia)' : 'rgba(139,115,85,0.2)' }}
              />
            ))}
          </div>

          {/* Title */}
          <h2 className="font-period font-bold mb-5" style={{ fontSize: '1.75rem', color: 'var(--ink)', lineHeight: 1.2 }}>
            {current.title}
          </h2>

          {/* Body */}
          <div className="leading-relaxed" style={{ fontSize: '15px' }}>
            {current.content}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-5" style={{ borderTop: '1px solid rgba(139,115,85,0.2)' }}>
            <button
              onClick={() => setScreen(s => s - 1)}
              disabled={screen === 0}
              className="text-sepia text-xs tracking-widest uppercase transition-opacity hover:opacity-100 disabled:invisible"
              style={{ opacity: 0.6 }}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-3">
              <span className="text-sepia text-xs" style={{ opacity: 0.5 }}>
                {screen + 1} / {SCREENS.length}
              </span>
              {isLast ? (
                <button
                  onClick={onComplete}
                  className="btn-begin px-8 py-3 text-sm tracking-widest uppercase font-semibold"
                >
                  Begin the Crisis
                </button>
              ) : (
                <button
                  onClick={() => setScreen(s => s + 1)}
                  className="px-6 py-2 text-sm tracking-widest uppercase font-semibold transition-opacity hover:opacity-80"
                  style={{
                    border: '1px solid rgba(139,115,85,0.5)',
                    color: 'var(--ink)',
                  }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
