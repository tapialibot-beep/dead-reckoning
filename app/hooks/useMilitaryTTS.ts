'use client'

import { useCallback, useRef } from 'react'

// Radio-operator voice profile — low pitch, measured pace, British english
const TTS_DEFAULTS = {
  pitch: 0.85,
  rate: 0.88,
  volume: 0.9,
  // Preferred voice: Google UK English Male. Falls back gracefully.
  preferredVoiceName: 'Google UK English Male',
}

function getVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined') return null
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find(v => v.name === TTS_DEFAULTS.preferredVoiceName) ??
    voices.find(v => v.lang === 'en-GB') ??
    voices.find(v => v.lang.startsWith('en')) ??
    null
  )
}

export function useMilitaryTTS() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Cancel any in-progress speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.pitch  = TTS_DEFAULTS.pitch
    utterance.rate   = TTS_DEFAULTS.rate
    utterance.volume = TTS_DEFAULTS.volume

    const voice = getVoice()
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
