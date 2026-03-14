'use client'

import { useCallback, useRef } from 'react'

// Radio-operator voice profile — low pitch, measured pace, authoritative male
const TTS_DEFAULTS = {
  pitch: 0.75,
  rate: 0.88,
  volume: 0.95,
}

// Prioritized male voices across Chrome/Edge/Safari/Firefox — desktop and mobile
const MALE_VOICE_NAMES = [
  'Google UK English Male',   // Chrome desktop
  'Microsoft George',         // Edge/Windows
  'Microsoft David',          // Edge/Windows
  'Microsoft Mark',           // Edge/Windows
  'Daniel',                   // macOS/iOS en-GB male
  'Alex',                     // macOS en-US male (older systems)
  'Tom',                      // macOS en-GB male
  'Fred',                     // macOS novelty but male
  'Google US English',        // Android Chrome (tends male)
]

function getVoice(): { voice: SpeechSynthesisVoice | null; forcedFallback: boolean } {
  if (typeof window === 'undefined') return { voice: null, forcedFallback: false }
  const voices = window.speechSynthesis.getVoices()

  // 1. Try known male voices by exact name
  for (const name of MALE_VOICE_NAMES) {
    const match = voices.find(v => v.name === name)
    if (match) return { voice: match, forcedFallback: false }
  }

  // 2. Try any voice whose name contains 'male' (case-insensitive)
  const maleByLabel = voices.find(v => v.name.toLowerCase().includes('male'))
  if (maleByLabel) return { voice: maleByLabel, forcedFallback: false }

  // 3. Forced fallback — any English voice; caller will drop pitch further
  const anyEn = voices.find(v => v.lang.startsWith('en')) ?? null
  return { voice: anyEn, forcedFallback: true }
}

export function useMilitaryTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Cancel any in-progress speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate   = TTS_DEFAULTS.rate
    utterance.volume = TTS_DEFAULTS.volume

    const { voice, forcedFallback } = getVoice()
    // Drop pitch further when forced to use an unknown/potentially female voice
    utterance.pitch = forcedFallback ? 0.55 : TTS_DEFAULTS.pitch
    if (voice) utterance.voice = voice

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    utteranceRef.current = null
  }, [])

  return { speak, stop }
}
