// src/components/InstallPwaPrompt.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Share, PlusSquare, Download } from 'lucide-react'

export default function InstallPwaPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) return

    // QUICK WIN: Check for a recent dismissal (14 days)
    const dismissedAt = localStorage.getItem('installDismissedAt')
    if (dismissedAt) {
        const daysSince = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
        if (daysSince < 14) return
    }

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (isIosDevice) {
        // Small delay to not annoy immediately on load
        setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleDismiss = () => {
    setShowPrompt(false)
    // QUICK WIN: Save timestamp to localStorage instead of session
    localStorage.setItem('installDismissedAt', Date.now().toString())
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        setShowPrompt(false)
      }
    }
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-foreground text-background rounded-2xl p-4 shadow-2xl border border-white/10 relative overflow-hidden">
        
        <button 
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
            <X className="h-4 w-4" />
        </button>

        <div className="flex gap-4 items-start pr-6">
            <div className="bg-brand rounded-xl p-2.5 flex-shrink-0">
                <Download className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
                <h3 className="font-heading font-bold text-lg text-white mb-1">
                    Install ChoreChum
                </h3>
                <p className="text-sm text-gray-300 leading-relaxed mb-3">
                    Add to your home screen for full screen view, push notifications, and a better experience.
                </p>

                {isIOS ? (
                    <div className="text-xs text-gray-400 bg-white/5 p-3 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <span>1. Tap the</span>
                            <Share className="h-4 w-4 inline" />
                            <span><strong>Share</strong> button</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>2. Select</span>
                            <PlusSquare className="h-4 w-4 inline" />
                            <span><strong>Add to Home Screen</strong></span>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="w-full bg-brand text-white font-bold py-2.5 rounded-xl hover:bg-brand-dark transition-colors"
                    >
                        Install App
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}