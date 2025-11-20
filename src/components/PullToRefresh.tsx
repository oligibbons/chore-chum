// src/components/PullToRefresh.tsx
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

  const PULL_THRESHOLD = 120 
  const MAX_PULL = 160 

  useEffect(() => {
    // Prevent native iOS bounce while this component is mounted
    document.body.style.overscrollBehaviorY = 'none'
    return () => {
      document.body.style.overscrollBehaviorY = 'auto'
    }
  }, [])

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      // Only track if we are at the top of the page
      if (window.scrollY <= 5) {
        setStartY(e.touches[0].clientY)
      } else {
        setStartY(0)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY === 0) return

      const y = e.touches[0].clientY
      const diff = y - startY

      if (diff > 0 && !refreshing) {
        // Add resistance
        const damped = Math.min(diff * 0.5, MAX_PULL)
        setCurrentY(damped)
        
        // Prevent browser navigation/bounce actions
        if (e.cancelable) e.preventDefault() 
      }
    }

    const handleTouchEnd = async () => {
      if (startY === 0) return

      if (currentY > 80) { // Trigger threshold
        setRefreshing(true)
        setCurrentY(60) // Snap to loading spinner position
        
        router.refresh()
        
        // Reset after delay
        setTimeout(() => {
          setRefreshing(false)
          setCurrentY(0)
        }, 1500)
      } else {
        setCurrentY(0)
      }
      setStartY(0)
    }

    const el = contentRef.current
    if (!el) return

    // Use non-passive listener to allow preventDefault
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
    <div ref={contentRef} className="min-h-screen transition-transform duration-300 ease-out will-change-transform" style={{ transform: `translateY(${currentY}px)` }}>
      
      {/* Loading Spinner */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center -mt-12 pointer-events-none"
        aria-hidden="true"
      >
        <div className={`
            flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-md border border-border 
            transition-all duration-300
            ${refreshing ? 'opacity-100 rotate-180 scale-110' : 'opacity-0 scale-75'}
        `}>
           <Loader2 className={`h-5 w-5 text-brand ${refreshing ? 'animate-spin' : ''}`} />
        </div>
      </div>

      {children}
    </div>
  )
}