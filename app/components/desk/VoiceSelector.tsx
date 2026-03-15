'use client'

import { useEffect, useRef, useState } from 'react'
import {
  getAvailableVoices,
  getSelectedVoiceName,
  setSelectedVoiceName,
} from '@/app/hooks/useMilitaryTTS'

export default function VoiceSelector() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selected, setSelected] = useState<string>('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load voices — they load async in some browsers
  useEffect(() => {
    function load() {
      const v = getAvailableVoices()
      if (v.length > 0) {
        setVoices(v)
        const saved = getSelectedVoiceName()
        setSelected(saved ?? '')
      }
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function choose(name: string) {
    setSelected(name)
    setSelectedVoiceName(name || null)
    setOpen(false)
    // Preview — iOS needs a small delay after cancel() before speak() works
    window.speechSynthesis.cancel()
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices()
      const v = name ? voices.find(v => v.name === name) : undefined
      const u = new SpeechSynthesisUtterance('Intelligence confirmed. Standing by.')
      u.pitch = 0.75
      u.rate = 0.88
      if (v) u.voice = v
      window.speechSynthesis.speak(u)
    }, 100)
  }

  const displayName = selected
    ? voices.find(v => v.name === selected)?.name ?? 'AUTO'
    : 'AUTO'

  return (
    <div className="topbar-voice" ref={ref}>
      <span className="topbar-label">VOICE</span>
      <button className="voice-select-btn" onClick={() => setOpen(o => !o)}>
        {displayName.length > 18 ? displayName.slice(0, 16) + '…' : displayName}
        <span className="voice-caret">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="voice-dropdown">
          <button
            className={`voice-option ${selected === '' ? 'voice-option-active' : ''}`}
            onClick={() => choose('')}
          >
            AUTO (default male)
          </button>
          {voices.map(v => (
            <button
              key={v.name}
              className={`voice-option ${selected === v.name ? 'voice-option-active' : ''}`}
              onClick={() => choose(v.name)}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
