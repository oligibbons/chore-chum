'use client'

import { useCallback } from 'react'

// A short, satisfying "pop" sound (Base64 encoded MP3) to avoid network requests/latency
const POP_SOUND = 'data:audio/mpeg;base64,//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//NExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
// (Note: For a real high-quality pop, replace the string above with a real file path like '/sounds/pop.mp3')

export function useGameFeel() {
  const playSound = useCallback((type: 'success' | 'click' = 'click') => {
    try {
      // Use the existing notification sound for success, or a short pop for clicks
      const src = type === 'success' ? '/notification-ping-372479.mp3' : '' // You can add a pop.mp3 to public later
      
      if (src) {
        const audio = new Audio(src)
        audio.volume = 0.5
        audio.play().catch(() => {
            // Auto-play policies sometimes block this, ignore errors
        })
      }
    } catch (e) {
      // Ignore audio errors
    }
  }, [])

  const triggerHaptic = useCallback((type: 'success' | 'light' | 'medium' | 'heavy' = 'light') => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return

    try {
      switch (type) {
        case 'success':
          // Two pulses
          navigator.vibrate([50, 50, 50])
          break
        case 'heavy':
          navigator.vibrate(50)
          break
        case 'medium':
          navigator.vibrate(30)
          break
        case 'light':
        default:
          navigator.vibrate(10) // Very subtle click feeling
          break
      }
    } catch (e) {
      // Ignore haptic errors
    }
  }, [])

  const interact = useCallback((type: 'success' | 'neutral' = 'neutral') => {
    if (type === 'success') {
        triggerHaptic('success')
        playSound('success')
    } else {
        triggerHaptic('light')
        // playSound('click') // Uncomment if you add a click sound
    }
  }, [triggerHaptic, playSound])

  return { interact, triggerHaptic, playSound }
}