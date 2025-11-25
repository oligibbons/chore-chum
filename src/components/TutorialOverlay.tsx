// src/components/TutorialOverlay.tsx
'use client'

import { useEffect, useState, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTutorial, TOUR_STEPS } from '@/context/TutorialContext'
import { ArrowRight, X, Check } from 'lucide-react'

export default function TutorialOverlay() {
  const { isActive, currentStepIndex, nextStep, skipTutorial } = useTutorial()
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<React.CSSProperties>({})
  const [mounted, setMounted] = useState(false)
  
  const step = TOUR_STEPS[currentStepIndex]
  const requestRef = useRef<number>()

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // --- 1. Intelligent Tracking Engine ---
  // Instead of checking once, we check every frame to handle scrolling/resizing/layout shifts smoothly
  const updatePosition = () => {
    if (!isActive || !step) return

    const element = document.querySelector(`[data-tour="${step.target}"]`)
    if (!element) {
        // Keep looking if element is missing (e.g. mounting)
        requestRef.current = requestAnimationFrame(updatePosition)
        return
    }

    const rect = element.getBoundingClientRect()
    
    // Only update state if dimensions actually changed (performance optimization)
    setTargetRect(prev => {
        if (!prev || prev.top !== rect.top || prev.left !== rect.left || prev.width !== rect.width) {
            return rect
        }
        return prev
    })

    requestRef.current = requestAnimationFrame(updatePosition)
  }

  useEffect(() => {
    if (isActive) {
        // Scroll into view just once per step
        const el = document.querySelector(`[data-tour="${step.target}"]`)
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
        
        requestRef.current = requestAnimationFrame(updatePosition)
    }
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isActive, step, currentStepIndex])

  // --- 2. Smart Positioning Logic (The Fix) ---
  useLayoutEffect(() => {
    if (!targetRect) return

    const margin = 16
    const tooltipWidth = 320 // Max width of card
    const screenW = window.innerWidth
    const screenH = window.innerHeight

    let style: React.CSSProperties = {
        position: 'absolute',
        width: '90%',
        maxWidth: `${tooltipWidth}px`,
        zIndex: 10010,
    }

    // Horizontal Clamping: Ensure we never fly off the sides
    // Calculate ideal center
    let leftPos = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2)
    
    // Clamp to left edge
    if (leftPos < margin) leftPos = margin
    // Clamp to right edge
    else if (leftPos + tooltipWidth > screenW - margin) leftPos = screenW - tooltipWidth - margin

    // Vertical Decision: Top or Bottom?
    const spaceBelow = screenH - targetRect.bottom
    const spaceAbove = targetRect.top
    const cardHeightApprox = 200 // Estimate

    let vertical = step.position || 'bottom'

    // Auto-flip if not enough space
    if (vertical === 'bottom' && spaceBelow < cardHeightApprox) vertical = 'top'
    if (vertical === 'top' && spaceAbove < cardHeightApprox) vertical = 'bottom'

    // Apply Vertical Styles
    if (vertical === 'top') {
        style.bottom = (screenH - targetRect.top) + margin
        style.left = leftPos
    } else {
        style.top = targetRect.bottom + margin
        style.left = leftPos
    }

    setTooltipPosition(style)

  }, [targetRect, step])

  if (!mounted || !isActive) return null

  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1

  return createPortal(
    <div className="fixed inset-0 z-[10000] touch-none overflow-hidden">
      
      {/* 1. Spotlight Highlight */}
      {targetRect ? (
        <div 
            className="absolute transition-all duration-300 ease-out border-2 border-brand/80 rounded-xl"
            style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                // The massive shadow dimming technique
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75), 0 0 15px rgba(0,0,0,0.5)' 
            }}
        />
      ) : (
         <div className="absolute inset-0 bg-black/75 transition-opacity duration-500" />
      )}

      {/* 2. Tooltip Card */}
      {targetRect && (
          <div 
            className="absolute flex flex-col gap-3 p-5 bg-card text-card-foreground rounded-2xl border border-brand/20 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95"
            style={tooltipPosition}
          >
            <div className="flex justify-between items-start">
                <h3 className="font-heading font-bold text-lg text-brand">
                    {step.title}
                </h3>
                <button 
                    onClick={skipTutorial}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground p-2 -mr-2 -mt-2 uppercase tracking-wider"
                >
                    Skip
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
      )}
    </div>,
    document.body
  )
}