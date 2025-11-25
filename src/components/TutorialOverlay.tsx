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

  // 1. Find the target element in the DOM
  useEffect(() => {
    if (!isActive || !step) return

    const findTarget = () => {
      const element = document.querySelector(`[data-tour="${step.target}"]`)
      if (element) {
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        
        // Smooth scroll to element if it's off screen
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      } else {
        // Retry briefly in case of animations/mounting
        setTimeout(() => {
            const elRetry = document.querySelector(`[data-tour="${step.target}"]`)
            if (elRetry) setTargetRect(elRetry.getBoundingClientRect())
        }, 500)
      }
    }

    // Initial find
    findTarget()

    // Handle Resize
    window.addEventListener('resize', findTarget)
    return () => window.removeEventListener('resize', findTarget)
  }, [isActive, step, currentStepIndex])

  if (!mounted || !isActive) return null

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1

  // Helper: Calculate Tooltip Position to stay on screen
  const getTooltipStyle = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    
    const margin = 20
    const isBottom = step.position === 'bottom' || (targetRect.top < 200) // Force bottom if element is high up
    
    if (isBottom) {
        return {
            top: targetRect.bottom + margin,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '350px'
        }
    } else {
        return {
            bottom: (window.innerHeight - targetRect.top) + margin,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '350px'
        }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] touch-none">
      
      {/* 1. Dimmed Backdrop with "Hole" simulation */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-500 animate-in fade-in" />

      {/* 2. The Spotlight Highlight */}
      {/* We use a massive box-shadow to create the 'cutout' effect while keeping the center transparent */}
      {targetRect && (
        <div 
            className="absolute transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] border-2 border-brand rounded-xl"
            style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                // This shadow covers the rest of the screen, creating the 'hole'
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(139, 92, 246, 0.5)' 
            }}
        />
      )}

      {/* 3. Tooltip Card */}
      <div 
        className="absolute flex flex-col gap-3 p-5 bg-card text-card-foreground rounded-2xl border-2 border-brand/20 shadow-2xl transition-all duration-500 animate-in slide-in-from-bottom-4 zoom-in-95"
        style={getTooltipStyle()}
      >
        <div className="flex justify-between items-start">
            <h3 className="font-heading font-bold text-lg text-brand">
                {step.title}
            </h3>
            <button 
                onClick={skipTutorial}
                className="text-xs font-medium text-muted-foreground hover:text-foreground p-1"
            >
                <X className="h-4 w-4" />
                <span className="sr-only">Skip</span>
            </button>
        </div>
        
        <p className="text-sm text-foreground/80 leading-relaxed">
            {step.description}
        </p>

        <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-6 bg-brand' : 'w-1.5 bg-muted'}`}
                    />
                ))}
            </div>

            <button 
                onClick={nextStep}
                className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-brand-dark transition-transform active:scale-95"
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