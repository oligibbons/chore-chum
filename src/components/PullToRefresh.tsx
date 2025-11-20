'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [startY, setStartY] = useState(0)
  const [currentY, setCurrentY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const PULL_THRESHOLD = 120 // Pixels to pull down to trigger
  const MAX_PULL = 160 // Max visual pull distance

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY
      const diff = y - startY

      // Only pull if we are at the top and pulling down
      if (window.scrollY === 0 && diff > 0 && !refreshing) {
        // Add resistance to the pull (logarithmic)
        const damped = Math.min(diff * 0.5, MAX_PULL)
        setCurrentY(damped)
        
        // Prevent default scrolling behavior while pulling
        if (e.cancelable) e.preventDefault() 
      }
    }

    const handleTouchEnd = async () => {
      if (currentY > 80) { // Threshold to trigger refresh
        setRefreshing(true)
        setCurrentY(60) // Snap to loading position
        
        // Trigger the Next.js refresh
        router.refresh()
        
        // Wait a moment for visual feedback, then reset
        // (In a real app, you might want to wait for the new data to arrive, 
        // but router.refresh is async without a promise return in older Next versions.
        // A simple timeout feels responsive enough here.)
        setTimeout(() => {
          setRefreshing(false)
          setCurrentY(0)
        }, 1000)
      } else {
        // Snap back if not pulled enough
        setCurrentY(0)
      }
      setStartY(0)
    }

    const el = contentRef.current
    if (!el) return

    // Passive: false is needed to allow preventDefault in touchmove
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd)

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startY, currentY, refreshing, router])

  return (
    <div ref={contentRef} className="min-h-screen transition-transform duration-200 ease-out" style={{ transform: `translateY(${currentY}px)` }}>
      
      {/* Loading Indicator (Hidden above the fold) */}
      <div className="absolute top-0 left-0 right-0 flex justify-center -mt-10">
        <div className={`flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-md border border-gray-100 transition-all ${refreshing ? 'opacity-100 rotate-180' : 'opacity-0'}`}>
           <Loader2 className={`h-5 w-5 text-brand ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {children}
    </div>
  )
}