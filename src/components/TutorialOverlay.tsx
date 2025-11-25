// src/components/TutorialOverlay.tsx
'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTutorial, TOUR_STEPS } from '@/context/TutorialContext'
import { ArrowRight, X, Check } from 'lucide-react'

export default function TutorialOverlay() {
  const { isActive, currentStepIndex, nextStep, skipTutorial } = useTutorial()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [mounted, setMounted] = useState(false)
  
  const step = TOUR_STEPS[currentStepIndex]

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // --- Target Finding Logic ---
  useEffect(() => {
    if (!isActive || !step) return

    const findTarget = () => {
      const element = document.querySelector(`[data-tour="${step.target}"]`)
      if (element) {
        // 1. Smooth scroll to target first
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        
        // 2. Wait a moment for scroll/animations to settle before grabbing coordinates
        setTimeout(() => {
            const rect = element.getBoundingClientRect()
            setTargetRect(rect)
        }, 400)
      } else {
        // Retry if element (like a modal) is still mounting
        setTimeout(() => {
            const elRetry = document.querySelector(`[data-tour="${step.target}"]`)
            if (elRetry) {
                elRetry.scrollIntoView({ behavior: 'smooth', block: 'center' })
                setTargetRect(elRetry.getBoundingClientRect())
            }
        }, 500)
      }
    }

    findTarget()
    window.addEventListener('resize', findTarget)
    // Also listen to scroll to update position in real-time
    window.addEventListener('scroll', findTarget) 
    
    return () => {
        window.removeEventListener('resize', findTarget)
        window.removeEventListener('scroll', findTarget)
    }
  }, [isActive, step, currentStepIndex])

  if (!mounted || !isActive) return null

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1

  // --- Smart Positioning Logic ---
  const getTooltipStyle = () => {
    // Default center if calculating
    if (!targetRect) return { 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '350px'
    }
    
    const margin = 16
    const safeWidth = Math.min(350, window.innerWidth - 32) // 32px padding total
    
    // 1. Determine Vertical Position
    let vertical = step.position || 'bottom'
    
    const spaceBelow = window.innerHeight - targetRect.bottom
    const spaceAbove = targetRect.top
    
    // Auto-flip: If prefer bottom but no room, go top
    if (vertical === 'bottom' && spaceBelow < 220) vertical = 'top'
    // Auto-flip: If prefer top but no room, go bottom
    if (vertical === 'top' && spaceAbove < 220) vertical = 'bottom'

    const style: React.CSSProperties = {
        position: 'absolute',
        width: safeWidth,
        zIndex: 10010, // Must be above the highlight ring
        left: '50%',
        transform: 'translateX(-50%)', // Horizontally centered by default
    }

    if (vertical === 'top') {
        style.bottom = (window.innerHeight - targetRect.top) + margin
        style.top = 'auto'
    } else if (vertical === 'bottom') {
        style.top = targetRect.bottom + margin
        style.bottom = 'auto'
    } else {
        // Center mode fallback
        style.top = '50%'
        style.left = '50%'
        style.transform = 'translate(-50%, -50%)'
    }

    return style
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] touch-none overflow-hidden">
      
      {/* 1. The Spotlight Highlight & Backdrop */}
      {/* We use a massive box-shadow to dim the REST of the screen. The div itself is transparent. */}
      {targetRect ? (
        <div 
            className="absolute transition-all duration-500 ease-out border-2 border-brand rounded-xl"
            style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                // The magic: transparent center, dark everywhere else
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)' 
            }}
        />
      ) : (
         // Fallback full screen dim if target is loading
         <div className="absolute inset-0 bg-black/75" />
      )}

      {/* 2. Tooltip Card */}
      <div 
        className="absolute flex flex-col gap-3 p-5 bg-card text-card-foreground rounded-2xl border border-brand/20 shadow-2xl transition-all duration-500 animate-in fade-in zoom-in-95"
        style={getTooltipStyle()}
      >
        <div className="flex justify-between items-start">
            <h3 className="font-heading font-bold text-lg text-brand">
                {step.title}
            </h3>
            <button 
                onClick={skipTutorial}
                className="text-xs font-bold text-muted-foreground hover:text-foreground p-2 -mr-2 -mt-2"
            >
                SKIP
            </button>
        </div>
        
        <p className="text-sm text-foreground/90 leading-relaxed">
            {step.description}
        </p>

        <div className="flex items-center justify-between pt-2 mt-1">
            <div className="flex gap-1.5">
                {TOUR_STEPS.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-6 bg-brand' : 'w-1.5 bg-muted'}`}
                    />
                ))}
            </div>

            <button 
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-brand/20 hover:bg-brand-dark transition-transform active:scale-95"
            >
                {isLastStep ? 'Finish' : 'Next'}
                {isLastStep ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
            </button>
        </div>
      </div>

    </div>,
    document.body
  )
}